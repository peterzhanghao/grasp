/**
 * 掌控 · 领域层 v1 → v2 用户数据迁移（纯函数，无 IO、无第三方依赖）
 *
 * 契约：docs/refactor-spec.md 第 2 节；审查决策第 10 节（迁移流程）与
 * 「不要直接给旧 origin:user 的全部记录追认为用户亲写」。
 *
 * 原则：
 * - 只做内存转换，不读盘、不写盘；备份由 host 在调用前完成（report.requiresBackup）。
 * - 旧数据语义保留：正文逐字保留（包括 '?' 乱码，不猜原文，只标 encodingSuspected）。
 * - v1 的 origin:'user' 无法区分 UI 与 agent 写入 → legacyOriginUncertain:true，保留 legacyOrigin 原值。
 * - 幂等：对 v2 输入原样返回并 report.already=true。
 */

import { SCHEMA_VERSION, emptyState, NOTE_KINDS, SUBJECT_KINDS, isIsoTimestamp } from './schema.js'
import { EXPERIMENT_MODELS } from './experiments.js'

/** v1 实验 id → v2 实验 id（v2 的 modelId/modelVersion 从 experiments.js 取）。 */
export const LEGACY_EXPERIMENT_ID_MAP = Object.freeze({
  delayloop: 'delay',
  greenbutwrong: 'green',
  proxy: 'proxy',
})

const MOJIBAKE_HINTS = ['Ã', 'Â', 'â€', 'ã€', '锛', '銆', '鎺', '杩', '鐨', '涓', '鏄', '绋']
// 单个即判可疑：UTF-8 被按 GBK 解码后常见、且极少出现在正常简体中文里的字符。
const STRONG_MOJIBAKE = ['鎺', '锛', '銆', '鈥', '闂', '绋', '鐨', '鏄', '妯', '鍒', '鍙']

/**
 * 检测疑似编码损坏：U+FFFD 替换字符、'?' 被当成替换符的成片乱码、或典型 UTF-8↔GBK 花码。
 * 只返回「疑似」，不尝试修复（修复会伪造原文）。
 */
export function detectEncodingSuspicion(text) {
  if (typeof text !== 'string' || text.length === 0) return false
  if (text.includes('\uFFFD')) return true
  const questionMarks = (text.match(/\?/g) || []).length
  if (questionMarks >= 2 && questionMarks / text.length >= 0.3) return true
  if (questionMarks >= 4) return true
  if (STRONG_MOJIBAKE.some((hint) => text.includes(hint))) return true
  if (MOJIBAKE_HINTS.some((hint) => text.includes(hint))) {
    // 「涓」「鏄」等汉字单看正常，只有和花码组合出现才可疑；这里要求至少两个不同线索。
    const hits = MOJIBAKE_HINTS.filter((hint) => text.includes(hint))
    return hits.length >= 2
  }
  return false
}

const asArray = (v) => (Array.isArray(v) ? v : [])
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const nowFallback = (value, now) => (isIsoTimestamp(value) ? value : now)

function countTables(state) {
  return {
    notes: Object.keys(state.notes || {}).length,
    revisions: Object.keys(state.revisions || {}).length,
    experiments: Object.keys(state.experiments || {}).length,
    tasks: Object.keys(state.tasks || {}).length,
    predictions: Object.keys(state.predictions || {}).length,
  }
}

function makeIdFactory(prefix, now) {
  let seq = 0
  return () => {
    seq += 1
    return `${prefix}${String(seq).padStart(4, '0')}_migrated`
  }
}

const LEGACY_CONTRACTS_RE = /【([^】]+)】([^\n【]*)/g

/** 从旧契约文本里拆出【期望行为】【验收】等分栏；只做显式标记的拆分，不猜测。 */
export function parseLegacyContractText(text) {
  const result = { sections: {}, goal: '', acceptance: [] }
  if (typeof text !== 'string') return result
  for (const match of text.matchAll(LEGACY_CONTRACTS_RE)) {
    const label = match[1].trim()
    const body = match[2].trim()
    if (!label || !body) continue
    result.sections[label] = body
  }
  if (result.sections['期望行为']) result.goal = result.sections['期望行为']
  if (result.sections['验收']) {
    result.acceptance = result.sections['验收']
      .split(/[\n；;]+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ text: line, evidence: '' }))
  }
  return result
}

/**
 * 迁移 v1 → v2。
 * @param {object} rawV1 解析后的旧 state.json 对象（不会被修改）
 * @param {{now?: string, backupPath?: string|null, contentVersion?: string|null}} [options]
 * @returns {{state: object|null, report: object}}
 */
export function migrateV1(rawV1, options = {}) {
  const opts = isObj(options) ? options : {}
  const now = isIsoTimestamp(opts.now) ? opts.now : new Date().toISOString()
  const backupPath = typeof opts.backupPath === 'string' ? opts.backupPath : null
  const contentVersion = typeof opts.contentVersion === 'string' ? opts.contentVersion : null

  let raw
  try {
    raw = JSON.parse(JSON.stringify(rawV1))
  } catch {
    raw = null
  }

  if (!isObj(raw)) {
    return {
      state: null,
      report: {
        ok: false,
        already: false,
        fromSchema: null,
        toSchema: SCHEMA_VERSION,
        error: '旧数据不是可迁移的对象',
        requiresBackup: true,
        backupPath,
        counts: {},
        warnings: [],
        notices: [],
      },
    }
  }

  if (raw.schemaVersion === SCHEMA_VERSION) {
    return {
      state: raw,
      report: {
        ok: true,
        already: true,
        fromSchema: SCHEMA_VERSION,
        toSchema: SCHEMA_VERSION,
        migratedAt: null,
        requiresBackup: false,
        backupPath,
        counts: countTables(raw),
        warnings: [],
        notices: [],
        encodingSuspected: [],
        legacyOriginUncertain: [],
        unknownExperimentIds: [],
      },
    }
  }

  const version = raw.schemaVersion === undefined ? 1 : raw.schemaVersion
  if (version !== 1) {
    return {
      state: null,
      report: {
        ok: false,
        already: false,
        fromSchema: version,
        toSchema: SCHEMA_VERSION,
        error: `不支持的 schemaVersion：${JSON.stringify(raw.schemaVersion)}（只支持 1 → 2）`,
        requiresBackup: true,
        backupPath,
        counts: {},
        warnings: [],
        notices: [],
      },
    }
  }

  const warnings = []
  const warn = (code, message, ids) => warnings.push({ code, message, ids })
  const state = emptyState()
  state.meta = { fromSchema: 1, migratedAt: now, backupPath, contentVersion, notices: [] }
  state.importLog = []

  const encodingSuspected = []
  const legacyOriginUncertain = []
  const unknownExperimentIds = []

  // ── 笔记 ────────────────────────────────────────────────
  const rawNotes = isObj(raw.notes) ? raw.notes : {}
  const rawRevisions = isObj(raw.revisions) ? raw.revisions : {}
  for (const [noteId, source] of Object.entries(rawNotes)) {
    if (!isObj(source)) {
      warn('NOTE_INVALID', `笔记 ${noteId} 不是对象，已跳过`)
      continue
    }
    const rawKind = typeof source.kind === 'string' ? source.kind : ''
    const kind = NOTE_KINDS.includes(rawKind) ? rawKind : '理解'
    if (!NOTE_KINDS.includes(rawKind)) warn('NOTE_KIND_UNKNOWN', `笔记 ${noteId} 的类型 ${JSON.stringify(source.kind)} 不在契约枚举内，已回退为「理解」`, [noteId])
    const subjectKind = SUBJECT_KINDS.includes(source.subjectType) ? source.subjectType : 'node'
    if (!SUBJECT_KINDS.includes(source.subjectType)) warn('NOTE_SUBJECT_KIND', `笔记 ${noteId} 的 subjectType 非法，按 node 处理`, [noteId])
    const text = typeof source.text === 'string' ? source.text : ''
    if (typeof source.text !== 'string') warn('NOTE_TEXT_INVALID', `笔记 ${noteId} 的正文不是字符串，已置空`, [noteId])
    const suspected = detectEncodingSuspicion(text) || detectEncodingSuspicion(rawKind)
    if (suspected) encodingSuspected.push(noteId)
    const origin = typeof source.origin === 'string' ? source.origin : 'user'
    // v1 的 origin:'user' 同时被 UI 与 agent 工具写入，无法无损区分，一律标记来源不确定。
    legacyOriginUncertain.push(noteId)
    const authorSource = origin === 'ai-draft' || origin === 'ai' ? 'ai-draft' : origin === 'import' ? 'import' : 'user'
    const savedBy = origin === 'agent' ? 'agent' : 'ui'
    const revision = Number.isInteger(source.revision) && source.revision >= 1 ? source.revision : 1
    const record = {
      id: noteId,
      subject: { kind: subjectKind, id: typeof source.subjectId === 'string' ? source.subjectId : '' },
      kind,
      text,
      status: source.status === 'archived' ? 'archived' : 'active',
      authorSource,
      savedBy,
      adopted: null,
      legacyOriginUncertain: true,
      encodingSuspected: suspected,
      parentRevision: null,
      createdAt: nowFallback(source.createdAt, now),
      updatedAt: nowFallback(source.updatedAt, now),
      revision,
    }
    if (!isStringLike(source.subjectId)) warn('NOTE_SUBJECT_MISSING', `笔记 ${noteId} 缺少 subjectId`, [noteId])
    if (typeof origin === 'string') record.legacyOrigin = origin // 保留旧字段，避免「追问来源」时凭空编造
    if (!isStringLike(source.subjectId)) warn('NOTE_SUBJECT_MISSING', `笔记 ${noteId} 缺少 subjectId`, [noteId])
    state.notes[noteId] = record
  }

  // ── 修订链 ──────────────────────────────────────────────
  for (const [noteId, list] of Object.entries(rawRevisions)) {
    const note = state.notes[noteId]
    if (!note) {
      warn('ORPHAN_REVISIONS', `修订记录 ${noteId} 没有对应笔记，已保留但不参与展示`, [noteId])
    }
    const revisions = []
    for (const item of asArray(list)) {
      if (!isObj(item)) continue
      revisions.push({
        revision: Number.isInteger(item.revision) && item.revision >= 1 ? item.revision : revisions.length + 1,
        text: typeof item.text === 'string' ? item.text : '',
        at: nowFallback(item.at, now),
        savedBy: 'ui',
      })
    }
    revisions.sort((a, b) => a.revision - b.revision)
    if (note) {
      if (!revisions.length) {
        revisions.push({ revision: note.revision, text: note.text, at: note.updatedAt, savedBy: 'ui' })
        warn('REVISIONS_SYNTHESIZED', `笔记 ${noteId} 没有修订记录，已用当前正文补一条`, [noteId])
      } else {
        const last = revisions[revisions.length - 1]
        if (last.text !== note.text) {
          revisions.push({ revision: Math.max(note.revision, last.revision + 1), text: note.text, at: note.updatedAt, savedBy: 'ui' })
          warn('REVISIONS_REPAIRED', `笔记 ${noteId} 的当前正文与最后修订不一致，已补一条当前正文修订`, [noteId])
        }
      }
    }
    state.revisions[noteId] = revisions
  }
  for (const [noteId, note] of Object.entries(state.notes)) {
    if (!state.revisions[noteId]) {
      state.revisions[noteId] = [{ revision: note.revision, text: note.text, at: note.updatedAt, savedBy: 'ui' }]
      warn('REVISIONS_SYNTHESIZED', `笔记 ${noteId} 没有修订记录，已用当前正文补一条`, [noteId])
    }
  }

  // ── 实验记录 ────────────────────────────────────────────
  const rawExperiments = isObj(raw.experiments) ? raw.experiments : {}
  for (const [runId, source] of Object.entries(rawExperiments)) {
    if (!isObj(source)) {
      warn('EXPERIMENT_INVALID', `实验记录 ${runId} 不是对象，已跳过`)
      continue
    }
    const legacyId = typeof source.experimentId === 'string' ? source.experimentId : ''
    const experimentId = LEGACY_EXPERIMENT_ID_MAP[legacyId] || legacyId || 'unknown'
    const model = EXPERIMENT_MODELS[experimentId]
    if (!model) {
      unknownExperimentIds.push(legacyId)
      warn('EXPERIMENT_UNKNOWN', `实验记录 ${runId} 的 experimentId ${JSON.stringify(legacyId)} 不在 v2 模型中，保留为 legacy 记录`, [runId])
    }
    state.experiments[runId] = {
      id: runId,
      experimentId,
      modelId: model ? model.id : `legacy-unknown-${experimentId}`,
      modelVersion: model ? model.version : 1,
      params: isObj(source.params) ? source.params : {},
      initial: {},
      prediction: typeof source.prediction === 'string' ? source.prediction : '',
      observation: { legacyResult: source.result === undefined ? null : source.result, note: 'v1 记录未保存判据与模型初值' },
      criterion: '（v1 旧记录）只保存了参数与观察值，没有保存判据；未用新模型重新判定，避免把旧结论冒充新结论。',
      verdict: 'mixed',
      subject: isStringLike(source.subjectId) ? { kind: 'node', id: source.subjectId } : null,
      investigationId: null,
      legacy: true,
      at: nowFallback(source.at, now),
    }
  }

  // ── 任务契约 ────────────────────────────────────────────
  const rawContracts = isObj(raw.contracts) ? raw.contracts : {}
  for (const [contractId, source] of Object.entries(rawContracts)) {
    if (!isObj(source)) {
      warn('CONTRACT_INVALID', `任务契约 ${contractId} 不是对象，已跳过`)
      continue
    }
    const text = typeof source.text === 'string' ? source.text : ''
    const parsed = parseLegacyContractText(text)
    const conceptIds = asArray(source.nodeIds).filter((id) => typeof id === 'string')
    const updatedAt = nowFallback(source.updatedAt, nowFallback(source.createdAt, now))
    const createdAt = nowFallback(source.createdAt, updatedAt)
    const snapshot = {
      title: typeof source.title === 'string' ? source.title : '',
      request: text,
      goal: parsed.goal,
      acceptance: parsed.acceptance,
      boundary: [],
      unknowns: [],
      conceptIds,
    }
    state.tasks[contractId] = {
      id: contractId,
      title: typeof source.title === 'string' ? source.title : '旧版任务契约',
      request: text || '（旧版契约没有正文）',
      goal: parsed.goal,
      acceptance: parsed.acceptance,
      boundary: [],
      unknowns: [],
      conceptIds,
      evidenceRefs: [],
      status: 'saved',
      revision: Number.isInteger(source.revision) && source.revision >= 1 ? source.revision : 1,
      revisions: [{ revision: Number.isInteger(source.revision) && source.revision >= 1 ? source.revision : 1, snapshot, at: updatedAt, model: { provider: '', model: '', reasoningEffort: null } }],
      model: { provider: '', model: '', reasoningEffort: null },
      createdAt,
      updatedAt,
      legacy: true,
    }
  }

  // ── 预测 ────────────────────────────────────────────────
  const rawPredictions = isObj(raw.predictions) ? raw.predictions : {}
  for (const [predictionId, source] of Object.entries(rawPredictions)) {
    if (!isObj(source)) {
      warn('PREDICTION_INVALID', `预测 ${predictionId} 不是对象，已跳过`)
      continue
    }
    const resolved = source.resolved === true
    state.predictions[predictionId] = {
      id: predictionId,
      investigationId: null,
      subject: { kind: 'node', id: isStringLike(source.subjectId) ? source.subjectId : '' },
      text: typeof source.text === 'string' ? source.text : '',
      resolveBy: typeof source.resolveBy === 'string' ? source.resolveBy : '',
      status: resolved ? 'inconclusive' : 'open',
      resolvedAt: null,
      resolvedByRunId: null,
      resolutionNote: resolved ? '旧版只记录「已解决」，没有记录支持/反驳，迁移为「不足以判断」' : null,
      legacy: true,
      at: nowFallback(source.at, now),
    }
  }

  // ── 视角 ────────────────────────────────────────────────
  const rawView = isObj(raw.view) ? raw.view : {}
  const selected = isStringLike(rawView.selected) ? rawView.selected : null
  const projection = rawView.projection === 'history' || rawView.projection === 'practice' ? rawView.projection : 'theory'
  state.view = {
    scale: selected ? 'subject' : 'domain',
    projection,
    selectedNodeId: selected,
    selectedRelationId: null,
    activeInvestigationId: null,
    directoryOpen: true,
    rightOpen: true,
  }

  // ── meta.notices（用户可见的迁移说明） ─────────────────
  const notices = state.meta.notices
  const pushNotice = (id, level, text) => notices.push({ id, level, text })
  pushNotice('migration-v1-v2', 'info', `已从 v1 迁移到 v2（${now}）。旧数据已保留，正文未经改写。`)
  if (legacyOriginUncertain.length) {
    pushNotice('legacy-origin-uncertain', 'warn', `${legacyOriginUncertain.length} 条旧记录的来源无法无损区分（旧版 UI 与 agent 共用 origin:user），已标记「旧记录来源不确定」，请逐条确认。`)
  }
  if (encodingSuspected.length) {
    pushNotice('encoding-suspected', 'warn', `${encodingSuspected.length} 条旧记录疑似编码损坏（含 '?' 替换字符），原文按原样保留，未尝试猜测修复。`)
  }
  if (unknownExperimentIds.length) {
    pushNotice('legacy-experiments', 'info', `${unknownExperimentIds.length} 条旧实验记录无法对应 v2 模型，保留为 legacy 记录且未重新判定。`)
  }
  if (Object.keys(state.tasks).length) {
    pushNotice('legacy-contracts', 'info', `${Object.keys(state.tasks).length} 条旧任务契约已迁移为任务草案（保留原文与概念关联）。`)
  }

  const report = {
    ok: true,
    already: false,
    fromSchema: 1,
    toSchema: SCHEMA_VERSION,
    migratedAt: now,
    requiresBackup: true,
    backupPath,
    contentVersion,
    counts: {
      ...countTables(state),
      encodingSuspected: encodingSuspected.length,
      legacyOriginUncertain: legacyOriginUncertain.length,
      unknownExperimentIds: unknownExperimentIds.length,
    },
    warnings,
    notices,
    encodingSuspected,
    legacyOriginUncertain,
    unknownExperimentIds,
  }

  return { state, report }
}

function isStringLike(value) {
  return typeof value === 'string' && value.trim().length > 0
}
