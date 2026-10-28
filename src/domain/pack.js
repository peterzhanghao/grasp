/**
 * 掌控 · 领域层用户数据包（导入/导出）校验与合并（纯函数，无 IO、无第三方依赖）
 *
 * 契约：docs/refactor-spec.md 第 4 节「导入校验」与第 2 节用户数据 schema v2。
 *
 * 硬要求：
 * - 候选状态上逐表逐记录结构校验 + 引用闭合（subject/edgeId/noteId/investigationId/runId）。
 * - 冲突显式返回，绝不静默覆盖；merge 有冲突时整体不写。
 * - mode 白名单 merge|skip|replace；replace 需要 confirm:true（host 负责先 backup.create）。
 * - applyPack 原地修改传入的 candidateStore 并返回回执，保持提交队列里的候选对象引用不变。
 */

import { createHash } from 'node:crypto'

import {
  SCHEMA_VERSION,
  STATE_TABLES,
  LOOP_TABLES,
  TABLE_KINDS,
  IMPORT_MODES,
  buildRefContext,
  canonicalJson,
  normalizeRecord,
  normalizeRevisions,
  recordsEqual,
  subjectKey,
  validateRecord,
} from './schema.js'
import {
  LOOP_DEFAULTS,
  INTERVENTION_DEFAULTS,
  OBSERVATION_DEFAULTS,
  validateLoopRecord,
  validateInterventionRecord,
  validateObservationRecord,
} from './loop-schema.js'
import { migrateToV3 } from './migrate.js'

export const PACK_KIND = 'loop-atlas-user-package'

/** 用户数据包里可以导入/导出的表：v2 旧表 + v3 掌控卡/干预/观察。 */
export const PACK_TABLES = Object.freeze([...STATE_TABLES, ...LOOP_TABLES])

const LOOP_TABLE_KIND = Object.freeze({ loops: 'loop', interventions: 'intervention', observations: 'observation' })
const LOOP_VALIDATORS = Object.freeze({ loop: validateLoopRecord, intervention: validateInterventionRecord, observation: validateObservationRecord })
const LOOP_DEFAULT_FIELDS = Object.freeze({ loop: LOOP_DEFAULTS, intervention: INTERVENTION_DEFAULTS, observation: OBSERVATION_DEFAULTS })

const cloneValue = (value) => (value === null || typeof value !== 'object' ? value : JSON.parse(JSON.stringify(value)))

/** 只保留契约字段并补默认值（与 schema.normalizeRecord 同语义，v3 新表用）。 */
function normalizeLoopValue(table, raw) {
  if (!isObj(raw)) return null
  const kind = LOOP_TABLE_KIND[table]
  const defaults = LOOP_DEFAULT_FIELDS[kind]
  const record = {}
  for (const [field, fallback] of Object.entries(defaults)) {
    record[field] = Object.prototype.hasOwnProperty.call(raw, field) && raw[field] !== undefined ? cloneValue(raw[field]) : cloneValue(fallback)
  }
  return record
}

/** 包大小上限 8 MiB（HTTP 请求体上限 12 MiB，由 host 的 webServer 层限制）。 */
export const MAX_PACK_BYTES = 8 * 1024 * 1024

export { IMPORT_MODES }

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function emptyTables() {
  const tables = {}
  for (const table of PACK_TABLES) tables[table] = {}
  return tables
}

/** 包的外壳字段白名单（host 导出包使用 tables 嵌套；旧包/手写包可能平铺）。 */
const PACK_SHELL_FIELDS = Object.freeze([
  'kind',
  'schemaVersion',
  'version',
  'coreVersion',
  'contentVersion',
  'pluginVersion',
  'exportedAt',
  'tables',
  ...STATE_TABLES,
  ...LOOP_TABLES,
])

function packVersionOf(pack) {
  if (typeof pack.version === 'string') return pack.version
  if (typeof pack.coreVersion === 'string') return pack.coreVersion
  if (typeof pack.contentVersion === 'string') return pack.contentVersion
  return null
}

/** 包体积（UTF-8 编码后的 JSON 字节数），用于 8 MiB 上限检查。 */
export function packageSizeBytes(pack) {
  try {
    return new TextEncoder().encode(JSON.stringify(pack)).length
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

function errorEntry(path, code, message) {
  return { path, code, message }
}

function countSummary(perTable, extra = {}) {
  const byTable = {}
  let total = 0
  for (const table of PACK_TABLES) {
    byTable[table] = perTable[table] || { records: 0, valid: 0, invalid: 0, existing: 0, new: 0, same: 0, different: 0 }
    total += byTable[table].records
  }
  return { total, byTable, ...extra }
}

function unionSets(base, extra) {
  if (base === null || base === undefined) return new Set(extra)
  const result = new Set(base)
  for (const id of extra) result.add(id)
  return result
}

function packTablesFrom(source) {
  const tables = emptyTables()
  for (const table of PACK_TABLES) {
    if (source[table] === undefined) continue
    if (!isObj(source[table])) return { ok: false, errors: [errorEntry(table, 'TYPE', `${table} 必须是对象（表）`)] }
    tables[table] = source[table]
  }
  return { ok: true, tables }
}

/** 包的来源哈希：对规范化后的 8 张表做稳定序列化（键排序）再 sha256，供 importLog 识别同内容重复导入。 */
export function packSourceHash(normalizedTables) {
  const canonical = canonicalJson({ kind: PACK_KIND, schemaVersion: SCHEMA_VERSION, tables: normalizedTables })
  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}

function expectedKeysOf(table, value) {
  return Object.keys(value || {})
}

function normalizeStoreValue(table, raw) {
  if (LOOP_TABLE_KIND[table]) return normalizeLoopValue(table, raw)
  if (table === 'revisions') {
    const normalized = normalizeRevisions(raw)
    return normalized.ok ? normalized.record : null
  }
  const kind = TABLE_KINDS[table]
  const normalized = normalizeRecord(kind, raw)
  return normalized.ok ? normalized.record : null
}

/**
 * 校验一个用户数据包（v1 包会先经 migrateV1 归一）。
 * @param {object} pack
 * @param {{core?: object, store?: object, now?: string}} [options]
 * @returns {{ok:boolean, errors:Array, conflicts:Array, counts:object, version:any,
 *            schemaVersion:{from:any,to:number}, warnings:Array, normalized:object|null}}
 */
export function validatePack(pack, options = {}) {
  const ctx = isObj(options) ? options : {}
  const errors = []
  const warnings = []
  const conflicts = []
  const perTable = {}

  if (!isObj(pack)) {
    errors.push(errorEntry('', 'PACK_TYPE', '数据包必须是对象'))
    return {
      ok: false,
      errors,
      conflicts,
      counts: countSummary(perTable),
      version: null,
      coreVersion: null,
      schema: SCHEMA_VERSION,
      schemaVersion: { from: null, to: SCHEMA_VERSION },
      sourceHash: null,
      warnings,
      normalized: null,
    }
  }
  // host 的导出包把 8 张表放在 pack.tables 下；旧版/手写包可能是平铺的。两种都接受。
  const nestedTables = isObj(pack.tables) ? pack.tables : null
  const tableSource = nestedTables || pack
  // 提交队列传入的既有状态：host 用 state 键，域内测试用 store 键，都支持。
  const store = isObj(ctx.store) ? ctx.store : isObj(ctx.state) ? ctx.state : null
  if (pack.kind !== PACK_KIND) {
    errors.push(errorEntry('kind', 'PACK_KIND', `包类型必须是 ${PACK_KIND}，实际为 ${JSON.stringify(pack.kind)}`))
  }
  const size = packageSizeBytes(pack)
  if (size > MAX_PACK_BYTES) {
    errors.push(errorEntry('', 'PACKAGE_TOO_LARGE', `数据包 ${size} 字节，超过上限 ${MAX_PACK_BYTES} 字节（8 MiB）`))
  }

  const rawVersion = pack.schemaVersion === undefined ? 1 : pack.schemaVersion
  let tables = emptyTables()
  let migrated = false
  if (rawVersion === SCHEMA_VERSION) {
    const picked = packTablesFrom(tableSource)
    if (!picked.ok) errors.push(...picked.errors)
    else tables = picked.tables
    for (const key of Object.keys(pack)) {
      if (!PACK_SHELL_FIELDS.includes(key)) {
        warnings.push(errorEntry(key, 'UNKNOWN_FIELD', `未知包字段 ${key} 已忽略`))
      }
    }
  } else if (rawVersion === 2 || rawVersion === 1) {
    migrated = true
    // v1/v2 包按用户数据同一迁移链归一为 v3（旧表保留，v3 新表由迁移生成）
    const legacyState =
      rawVersion === 1
        ? {
            schemaVersion: 1,
            notes: tableSource.notes,
            revisions: tableSource.revisions,
            experiments: tableSource.experiments,
            contracts: tableSource.contracts,
            predictions: tableSource.predictions,
            view: tableSource.view,
          }
        : {
            schemaVersion: 2,
            notes: tableSource.notes,
            revisions: tableSource.revisions,
            relations: tableSource.relations,
            investigations: tableSource.investigations,
            predictions: tableSource.predictions,
            experiments: tableSource.experiments,
            tasks: tableSource.tasks,
            dialogs: tableSource.dialogs,
            view: tableSource.view,
            importLog: [],
          }
    const migration = migrateToV3(legacyState, { now: ctx.now })
    if (!migration.report.ok || !migration.state) {
      errors.push(errorEntry('schemaVersion', 'PACK_MIGRATION', migration.report.error || '旧版数据包迁移失败'))
    } else {
      for (const table of PACK_TABLES) tables[table] = migration.state[table] || {}
      warnings.push(errorEntry('schemaVersion', 'MIGRATED', `v${rawVersion} 数据包已按用户数据迁移链归一为 v${SCHEMA_VERSION}`))
    }
  } else {
    errors.push(errorEntry('schemaVersion', 'PACK_SCHEMA', `不支持的数据包 schemaVersion：${JSON.stringify(pack.schemaVersion)}（支持 2/3，旧 1 会先迁移）`))
  }

  for (const table of PACK_TABLES) {
    if (tableSource[table] === undefined) warnings.push(errorEntry(table, 'MISSING_TABLE', `包中没有 ${table} 表，按空表处理`))
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
      conflicts,
      counts: countSummary(perTable),
      version: packVersionOf(pack),
      coreVersion: typeof pack.coreVersion === 'string' ? pack.coreVersion : null,
      schema: SCHEMA_VERSION,
      schemaVersion: { from: rawVersion, to: SCHEMA_VERSION },
      sourceHash: null,
      warnings,
      normalized: null,
    }
  }

  // ── 两阶段引用上下文：先收集包内 id，再逐条校验 ─────────────
  const base = buildRefContext({ core: ctx.core, store })
  const packIds = {
    noteIds: new Set(expectedKeysOf('notes', tables.notes)),
    investigationIds: new Set(expectedKeysOf('investigations', tables.investigations)),
    runIds: new Set(expectedKeysOf('experiments', tables.experiments)),
    predictionIds: new Set(expectedKeysOf('predictions', tables.predictions)),
    loopIds: new Set(expectedKeysOf('loops', tables.loops)),
    interventionIds: new Set(expectedKeysOf('interventions', tables.interventions)),
    observationIds: new Set(expectedKeysOf('observations', tables.observations)),
  }
  const refCtx = {
    ...base,
    noteIds: unionSets(base.noteIds, packIds.noteIds),
    investigationIds: unionSets(base.investigationIds, packIds.investigationIds),
    runIds: unionSets(base.runIds, packIds.runIds),
    predictionIds: unionSets(base.predictionIds, packIds.predictionIds),
    loopIds: unionSets(base.loopIds, packIds.loopIds),
    interventionIds: unionSets(base.interventionIds, packIds.interventionIds),
    observationIds: unionSets(base.observationIds, packIds.observationIds),
  }
  if (!base.nodeIds) warnings.push(errorEntry('', 'NO_CORE', '未提供内容包索引，跳过节点/关系引用校验（host 必须传入 core）'))

  const normalizedTables = emptyTables()
  for (const table of PACK_TABLES) {
    const kind = TABLE_KINDS[table]
    const source = tables[table]
    const stats = { records: 0, valid: 0, invalid: 0, existing: 0, new: 0, same: 0, different: 0 }
    perTable[table] = stats
    for (const [key, raw] of Object.entries(source)) {
      stats.records += 1
      const path = `${table}.${key}`
      let record = null
      if (table === 'revisions') {
        const normalized = normalizeRevisions(raw, path)
        warnings.push(...normalized.warnings)
        if (!normalized.ok) {
          stats.invalid += 1
          errors.push(...normalized.errors)
          continue
        }
        const validated = validateRecord('revision', normalized.record, { ...refCtx, path })
        if (!validated.ok) {
          stats.invalid += 1
          errors.push(...validated.errors)
        } else {
          stats.valid += 1
          record = normalized.record
        }
        // 引用闭合：修订必须挂在包内或已有笔记上
        if (!refCtx.noteIds.has(key)) {
          errors.push(errorEntry(path, 'DANGLING_REF', `修订记录指向不存在的笔记：${key}`))
        }
      } else if (LOOP_TABLE_KIND[table]) {
        const kind = LOOP_TABLE_KIND[table]
        const record0 = normalizeLoopValue(table, raw)
        if (!record0) {
          stats.invalid += 1
          errors.push(errorEntry(path, 'TYPE', `${table} 记录必须是对象`))
          continue
        }
        record = record0
        if (Object.prototype.hasOwnProperty.call(record, 'id') && record.id !== key) {
          errors.push(errorEntry(`${path}.id`, 'KEY_MISMATCH', `表键 ${key} 与记录 id ${JSON.stringify(record.id)} 不一致`))
        }
        const validated = LOOP_VALIDATORS[kind](record, refCtx, path)
        warnings.push(...(validated.warnings || []))
        if (!validated.ok) {
          stats.invalid += 1
          errors.push(...validated.errors)
          record = null
        } else {
          stats.valid += 1
        }
      } else {
        const normalized = normalizeRecord(kind, raw, path)
        warnings.push(...normalized.warnings)
        if (!normalized.ok) {
          stats.invalid += 1
          errors.push(...normalized.errors)
          continue
        }
        record = normalized.record
        if (Object.prototype.hasOwnProperty.call(record, 'id') && record.id !== key) {
          errors.push(errorEntry(`${path}.id`, 'KEY_MISMATCH', `表键 ${key} 与记录 id ${JSON.stringify(record.id)} 不一致`))
        }
        if (table === 'dialogs') {
          const expected = subjectKey(record.subject)
          if (expected && expected !== key) {
            errors.push(errorEntry(path, 'KEY_MISMATCH', `对话表键 ${key} 与 subjectKey ${expected} 不一致`))
          }
        }
        if (table === 'relations' && record.edgeId !== key) {
          errors.push(errorEntry(`${path}.edgeId`, 'KEY_MISMATCH', `relations 表键 ${key} 与记录 edgeId ${JSON.stringify(record.edgeId)} 不一致`))
        }
        const validated = validateRecord(kind, record, { ...refCtx, key, path })
        if (!validated.ok) {
          stats.invalid += 1
          errors.push(...validated.errors)
          record = null
        } else {
          stats.valid += 1
        }
      }

      // 与既有 store 对比：同 id 同内容 = 幂等；不同 = 冲突（不静默覆盖）
      const existingTable = store && isObj(store[table]) ? store[table] : null
      const existingRaw = existingTable ? existingTable[key] : undefined
      if (existingRaw !== undefined) {
        stats.existing += 1
        const existingNorm = normalizeStoreValue(table, existingRaw)
        if (existingNorm && record && recordsEqual(existingNorm, record)) stats.same += 1
        else {
          stats.different += 1
          conflicts.push({
            table,
            id: key,
            reason: existingNorm ? '同 id 但内容不同' : '已有记录结构无法识别，不能静默覆盖',
          })
        }
      } else if (record) {
        stats.new += 1
      }
      if (record && !Object.prototype.hasOwnProperty.call(normalizedTables[table], key)) {
        normalizedTables[table][key] = record
      }
    }
  }

  const normalized = errors.length
    ? null
    : {
        kind: PACK_KIND,
        schemaVersion: SCHEMA_VERSION,
        version: packVersionOf(pack),
        coreVersion: typeof pack.coreVersion === 'string' ? pack.coreVersion : null,
        exportedAt: typeof pack.exportedAt === 'string' ? pack.exportedAt : null,
        migratedFrom: migrated ? rawVersion : null,
        tables: normalizedTables,
      }
  // 内容指纹：只对规范化后的表内容做稳定序列化，键顺序不同不会产生不同 hash。
  const sourceHash = normalized ? packSourceHash(normalizedTables) : null

  const conflictsCount = conflicts.length
  return {
    ok: errors.length === 0,
    errors,
    conflicts,
    counts: countSummary(perTable, { conflicts: conflictsCount }),
    version: normalized ? normalized.version : packVersionOf(pack),
    coreVersion: normalized ? normalized.coreVersion : typeof pack.coreVersion === 'string' ? pack.coreVersion : null,
    schema: SCHEMA_VERSION,
    schemaVersion: { from: rawVersion, to: SCHEMA_VERSION },
    sourceHash,
    warnings,
    normalized,
  }
}

const TABLE_WRITE_ORDER = Object.freeze([
  'notes',
  'revisions',
  'relations',
  'investigations',
  'predictions',
  'experiments',
  'tasks',
  'dialogs',
  ...LOOP_TABLES,
])

function ensureTable(store, table) {
  if (!isObj(store[table])) store[table] = {}
  return store[table]
}

/**
 * 在候选状态上应用已校验的数据包。原地修改 candidateStore（保持队列里的对象引用），
 * 失败时返回冲突/错误，调用方丢弃候选即可。
 * @param {object} candidateStore 候选状态（会被原地修改）
 * @param {object} normalized validatePack 的 normalized 结果
 * @param {{mode?: 'merge'|'skip'|'replace', confirm?: boolean}} [options]
 * @returns {{ok:boolean, applied:number, counts:object, conflicts:Array, code?:string, error?:string}}
 */
export function applyPack(candidateStore, normalized, options = {}) {
  const opts = isObj(options) ? options : {}
  const mode = opts.mode === undefined ? 'merge' : opts.mode
  const confirm = opts.confirm === true
  const conflicts = []
  const emptyCounts = { new: 0, skipped: 0, replaced: 0, conflicts: 0, total: 0 }

  if (!isObj(candidateStore)) {
    return { ok: false, applied: 0, counts: emptyCounts, conflicts, code: 'VALIDATION', error: '候选状态必须是对象' }
  }
  if (!IMPORT_MODES.includes(mode)) {
    return {
      ok: false,
      applied: 0,
      counts: emptyCounts,
      conflicts,
      code: 'VALIDATION',
      error: `mode 必须是 ${IMPORT_MODES.join('|')} 之一，实际为 ${JSON.stringify(mode)}`,
    }
  }
  if (!isObj(normalized) || !isObj(normalized.tables)) {
    return { ok: false, applied: 0, counts: emptyCounts, conflicts, code: 'VALIDATION', error: 'normalized 无效（必须先通过 validatePack）' }
  }
  if (mode === 'replace' && !confirm) {
    return {
      ok: false,
      applied: 0,
      counts: emptyCounts,
      conflicts,
      code: 'CONFIRM_REQUIRED',
      error: 'replace 模式会清空现有用户数据表，必须显式传 confirm:true（host 需先创建备份）',
    }
  }

  const incoming = {}
  for (const table of TABLE_WRITE_ORDER) {
    const value = normalized.tables[table]
    incoming[table] = isObj(value) ? value : {}
  }

  // 第一遍：冲突检测（merge/skip 只在写之前检查；replace 允许覆盖）
  const existingCounts = {}
  let totalIncoming = 0
  for (const table of TABLE_WRITE_ORDER) {
    const storeTable = isObj(candidateStore[table]) ? candidateStore[table] : {}
    existingCounts[table] = Object.keys(storeTable).length
    for (const [key, record] of Object.entries(incoming[table])) {
      totalIncoming += 1
      if (!Object.prototype.hasOwnProperty.call(storeTable, key)) continue
      if (mode === 'replace') continue
      const existingNorm = normalizeStoreValue(table, storeTable[key])
      if (!existingNorm || !recordsEqual(existingNorm, record)) {
        conflicts.push({
          table,
          id: key,
          reason: existingNorm ? '同 id 但内容不同' : '已有记录结构无法识别，不能静默覆盖',
        })
      }
    }
  }

  if (mode === 'merge' && conflicts.length) {
    return {
      ok: false,
      applied: 0,
      counts: { new: 0, skipped: 0, replaced: 0, conflicts: conflicts.length, total: totalIncoming },
      conflicts,
      code: 'CONFLICT',
      error: `存在 ${conflicts.length} 个冲突，未写入任何数据（可用 skip 跳过已有 id，或 replace + confirm 覆盖）`,
    }
  }

  // 第二遍：写入（只在内存候选上改，host 校验通过后才落盘发布）
  let written = 0
  let skipped = 0
  let replaced = 0
  for (const table of TABLE_WRITE_ORDER) {
    if (mode === 'replace') {
      candidateStore[table] = {}
    }
    const storeTable = ensureTable(candidateStore, table)
    for (const [key, record] of Object.entries(incoming[table])) {
      const exists = Object.prototype.hasOwnProperty.call(storeTable, key)
      if (mode === 'replace') {
        storeTable[key] = record
        written += 1
        replaced += 1
      } else if (exists) {
        // 第一遍已保证 merge 下同 id 内容相同；skip 直接跳过。
        skipped += 1
      } else {
        storeTable[key] = record
        written += 1
      }
    }
  }

  const counts = {
    new: mode === 'replace' ? 0 : written,
    skipped,
    replaced,
    conflicts: 0,
    total: totalIncoming,
    replacedTables: mode === 'replace' ? existingCounts : undefined,
  }
  if (mode === 'replace') counts.new = 0
  return { ok: true, applied: written, counts, conflicts: [] }
}
