/**
 * 掌控 · 领域层 v3 数据：掌控卡 / 干预 / 观察 / 归档（纯函数，无 IO、无 ctx）。
 *
 * 契约：docs/v2-design.md §2（掌控卡字段）、§7（观察与修订）、§11（数据模型 v3）。
 * 本模块只定义结构与校验，不负责读写与迁移编排（迁移见 migrate-v3.js）。
 *
 * 设计取舍：
 * - 所有校验返回 { ok, errors, warnings }，不抛异常；错误路径用 `loops.<id>.<field>` 形式。
 * - 引用闭合只在调用方提供集合时检查（与 v2 schema 的 buildRefContext 一致）。
 * - 刻意宽松：缺失可选字段只在语义必需时才是错误，避免把「先建卡再补」堵死。
 */

export const LOOP_STATUSES = Object.freeze(['draft', 'modeled', 'testing', 'reviewing', 'revised', 'paused', 'archived'])
export const SYSTEM_TYPES = Object.freeze(['coding-agent', 'product', 'team', 'personal', 'custom'])
export const GAP_TYPES = Object.freeze([
  'unclear-goal',
  'unmeasured',
  'late-measurement',
  'authority-gap',
  'saturated',
  'proxy',
  'missing-counter-signal',
  'oscillating',
  'drift',
  'adaptation-failure',
])
export const GAP_SEVERITIES = Object.freeze(['info', 'warn', 'block'])
export const NEXT_ACTION_TYPES = Object.freeze(['answer', 'observe', 'intervene', 'revise', 'measure', 'pause'])
export const MEASUREMENT_SOURCES = Object.freeze(['manual', 'session', 'experiment', 'unknown'])
export const INTERVENTION_STATUSES = Object.freeze(['planned', 'running', 'done', 'abandoned'])
export const OBSERVATION_SOURCES = Object.freeze(['manual', 'experiment', 'session-evidence'])
export const METRIC_KINDS = Object.freeze(['count', 'ratio', 'duration', 'text'])
export const OBSERVATION_VERDICTS = Object.freeze(['supported', 'refuted', 'inconclusive'])

export const LOOP_TABLES = Object.freeze(['loops', 'interventions', 'observations'])
export const LOOP_TABLE_KINDS = Object.freeze({
  loops: 'loop',
  interventions: 'intervention',
  observations: 'observation',
})

const LOOP_ID_PREFIX = 'lp_'
const INTERVENTION_ID_PREFIX = 'iv_'
const OBSERVATION_ID_PREFIX = 'ob_'

// ─────────────────────────── 小工具（与 schema.js 同语义，局部实现避免循环依赖） ───────────────────────────

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isString = (v) => typeof v === 'string'
const isInteger = (v) => typeof v === 'number' && Number.isInteger(v)
const isNonEmptyString = (v) => isString(v) && v.trim().length > 0
const isIsoTimestamp = (v) => {
  if (!isString(v) || v.length < 20) return false
  return Number.isFinite(Date.parse(v)) && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)
}

const err = (errors, path, code, message) => errors.push({ path, code, message })
const warn = (warnings, path, code, message) => warnings.push({ path, code, message })

function checkEnum(value, allowed, path, errors) {
  if (!allowed.includes(value)) {
    err(errors, path, 'ENUM', `取值必须是 ${allowed.join('|')} 之一，实际为 ${JSON.stringify(value)}`)
    return false
  }
  return true
}

function checkString(value, path, errors, { nullable = false, nonEmpty = false } = {}) {
  if (value === null) {
    if (nullable) return true
    err(errors, path, 'TYPE', '不能为 null')
    return false
  }
  if (!isString(value)) {
    err(errors, path, 'TYPE', `必须是字符串，实际为 ${typeof value}`)
    return false
  }
  if (nonEmpty && value.trim().length === 0) {
    err(errors, path, 'EMPTY', '不能为空字符串')
    return false
  }
  return true
}

function checkArray(value, path, errors) {
  if (!Array.isArray(value)) {
    err(errors, path, 'TYPE', '必须是数组')
    return false
  }
  return true
}

function checkStringArray(value, path, errors, itemPath = (i) => `${path}[${i}]`) {
  if (!checkArray(value, path, errors)) return false
  let ok = true
  value.forEach((item, i) => {
    if (!isNonEmptyString(item)) {
      err(errors, itemPath(i), 'TYPE', '必须是非空字符串')
      ok = false
    }
  })
  return ok
}

function checkRef(refId, set, path, errors, label) {
  if (!set) return true
  if (!isNonEmptyString(refId)) {
    err(errors, path, 'TYPE', `${label} 必须是非空字符串`)
    return false
  }
  if (!set.has(refId)) {
    err(errors, path, 'DANGLING_REF', `${label} 引用了不存在的 id：${refId}`)
    return false
  }
  return true
}

// ─────────────────────────── 默认值 / 空表 ───────────────────────────

export const LOOP_DEFAULTS = Object.freeze({
  id: '',
  title: '',
  systemType: 'custom',
  summary: '',
  goal: { quantity: '', criterion: '', current: '' },
  measurement: { how: '', cadence: '', source: 'unknown', confidence: null },
  action: { levers: [], cannot: [] },
  disturbances: [],
  delays: [],
  boundary: { nonGoals: [], notes: '' },
  hypothesis: { claim: '', counter: '', falsifier: '' },
  gaps: [],
  principleRefs: [],
  status: 'draft',
  nextAction: null,
  nextCheck: null,
  application: { acceptance: [], stopConditions: [], checkpoints: [], taskIds: [] },
  version: 1,
  versions: [],
  legacy: false,
  createdAt: '',
  updatedAt: '',
  lastOpenedAt: null,
})

export const INTERVENTION_DEFAULTS = Object.freeze({
  id: '',
  loopId: '',
  action: '',
  predicted: '',
  windowStart: null,
  windowEnd: null,
  status: 'planned',
  at: '',
})

export const OBSERVATION_DEFAULTS = Object.freeze({
  id: '',
  loopId: '',
  interventionId: null,
  at: '',
  source: 'manual',
  metric: { kind: 'text', value: '', unit: '' },
  compare: { prediction: '', verdict: 'inconclusive', reason: '' },
  evidenceRefs: [],
  noteIds: [],
})

export function emptyLoopTables() {
  return { loops: {}, interventions: {}, observations: {} }
}

// ─────────────────────────── 记录校验 ───────────────────────────

function validateGoal(goal, path, errors) {
  if (!isPlainObject(goal)) return err(errors, path, 'TYPE', 'goal 必须是对象')
  checkString(goal.quantity, `${path}.quantity`, errors)
  checkString(goal.criterion, `${path}.criterion`, errors)
  checkString(goal.current, `${path}.current`, errors)
}

function validateMeasurement(measurement, path, errors) {
  if (!isPlainObject(measurement)) return err(errors, path, 'TYPE', 'measurement 必须是对象')
  checkString(measurement.how, `${path}.how`, errors)
  checkString(measurement.cadence, `${path}.cadence`, errors)
  checkEnum(measurement.source, MEASUREMENT_SOURCES, `${path}.source`, errors)
  if (measurement.confidence !== null && measurement.confidence !== undefined) {
    if (typeof measurement.confidence !== 'number' || measurement.confidence < 0 || measurement.confidence > 1) {
      err(errors, `${path}.confidence`, 'RANGE', 'confidence 只能是 0—1 的数字或 null')
    }
  }
}

function validateAction(action, path, errors) {
  if (!isPlainObject(action)) return err(errors, path, 'TYPE', 'action 必须是对象')
  checkStringArray(action.levers, `${path}.levers`, errors)
  checkStringArray(action.cannot, `${path}.cannot`, errors)
}

function validateBoundary(boundary, path, errors) {
  if (!isPlainObject(boundary)) return err(errors, path, 'TYPE', 'boundary 必须是对象')
  checkStringArray(boundary.nonGoals, `${path}.nonGoals`, errors)
  checkString(boundary.notes, `${path}.notes`, errors)
}

function validateHypothesis(hypothesis, path, errors) {
  if (!isPlainObject(hypothesis)) return err(errors, path, 'TYPE', 'hypothesis 必须是对象')
  checkString(hypothesis.claim, `${path}.claim`, errors)
  checkString(hypothesis.counter, `${path}.counter`, errors)
  checkString(hypothesis.falsifier, `${path}.falsifier`, errors)
}

function validateGaps(gaps, path, errors) {
  if (!checkArray(gaps, path, errors)) return
  gaps.forEach((gap, i) => {
    const at = `${path}[${i}]`
    if (!isPlainObject(gap)) return err(errors, at, 'TYPE', '缺口必须是对象')
    checkEnum(gap.type, GAP_TYPES, `${at}.type`, errors)
    if (gap.severity !== undefined) checkEnum(gap.severity, GAP_SEVERITIES, `${at}.severity`, errors)
    if (gap.evidenceText !== undefined) checkString(gap.evidenceText, `${at}.evidenceText`, errors)
    if (gap.suggestedPrincipleRefs !== undefined) checkStringArray(gap.suggestedPrincipleRefs, `${at}.suggestedPrincipleRefs`, errors)
  })
}

function validatePrincipleRefs(refs, path, errors, ctx) {
  if (!checkArray(refs, path, errors)) return
  refs.forEach((ref, i) => {
    const at = `${path}[${i}]`
    if (!isPlainObject(ref)) return err(errors, at, 'TYPE', '原理卡引用必须是对象')
    checkString(ref.nodeId, `${at}.nodeId`, errors, { nonEmpty: true })
    checkString(ref.userTranslation, `${at}.userTranslation`, errors)
    checkString(ref.whyHere, `${at}.whyHere`, errors)
    if (ref.nodeId) checkRef(ref.nodeId, ctx?.nodeIds, `${at}.nodeId`, errors, '原理卡节点引用')
  })
}

function validateNextAction(nextAction, path, errors) {
  if (!isPlainObject(nextAction)) return err(errors, path, 'TYPE', 'nextAction 必须是对象')
  checkEnum(nextAction.type, NEXT_ACTION_TYPES, `${path}.type`, errors)
  checkString(nextAction.text, `${path}.text`, errors, { nonEmpty: true })
  if (!isInteger(nextAction.estimateMin) || nextAction.estimateMin < 1) {
    err(errors, `${path}.estimateMin`, 'RANGE', 'estimateMin 必须是 ≥1 的整数')
  }
  if (nextAction.dueAt !== null && nextAction.dueAt !== undefined && !isIsoTimestamp(nextAction.dueAt)) {
    err(errors, `${path}.dueAt`, 'ISO', 'dueAt 必须是 ISO 时间戳或 null')
  }
}

function validateNextCheck(nextCheck, path, errors, ctx) {
  if (nextCheck === null) return
  if (!isPlainObject(nextCheck)) return err(errors, path, 'TYPE', 'nextCheck 必须是对象或 null')
  checkString(nextCheck.criterion, `${path}.criterion`, errors, { nonEmpty: true })
  checkString(nextCheck.predicted, `${path}.predicted`, errors, { nonEmpty: true })
  if (!isIsoTimestamp(nextCheck.windowStart)) err(errors, `${path}.windowStart`, 'ISO', 'windowStart 必须是 ISO 时间戳')
  if (!isIsoTimestamp(nextCheck.windowEnd)) err(errors, `${path}.windowEnd`, 'ISO', 'windowEnd 必须是 ISO 时间戳')
  if (nextCheck.windowStart && nextCheck.windowEnd && Date.parse(nextCheck.windowEnd) < Date.parse(nextCheck.windowStart)) {
    err(errors, `${path}.windowEnd`, 'RANGE', 'windowEnd 不能早于 windowStart')
  }
  if (nextCheck.interventionId !== null && nextCheck.interventionId !== undefined) {
    checkRef(nextCheck.interventionId, ctx?.interventionIds, `${path}.interventionId`, errors, '干预引用')
  }
}

function validateApplication(application, path, errors, ctx) {
  if (!isPlainObject(application)) return err(errors, path, 'TYPE', 'application 必须是对象')
  checkStringArray(application.acceptance, `${path}.acceptance`, errors)
  checkStringArray(application.stopConditions, `${path}.stopConditions`, errors)
  checkStringArray(application.checkpoints, `${path}.checkpoints`, errors)
  if (application.taskIds !== undefined && checkArray(application.taskIds, `${path}.taskIds`, errors)) {
    application.taskIds.forEach((id, i) => checkRef(id, ctx?.taskIds, `${path}.taskIds[${i}]`, errors, '任务引用'))
  }
}

function validateVersions(versions, path, errors) {
  if (!checkArray(versions, path, errors)) return
  let previous = 0
  versions.forEach((item, i) => {
    const at = `${path}[${i}]`
    if (!isPlainObject(item)) return err(errors, at, 'TYPE', '版本条目必须是对象')
    if (!isInteger(item.version) || item.version < 1) err(errors, `${at}.version`, 'RANGE', 'version 必须是 ≥1 的整数')
    else {
      if (item.version <= previous) err(errors, `${at}.version`, 'ORDER', '版本号必须严格递增')
      previous = item.version
    }
    if (!isIsoTimestamp(item.at)) err(errors, `${at}.at`, 'ISO', 'at 必须是 ISO 时间戳')
    checkString(item.changeSummary, `${at}.changeSummary`, errors)
    if (!isPlainObject(item.snapshot)) err(errors, `${at}.snapshot`, 'TYPE', 'snapshot 必须是对象')
  })
}

export function validateLoopRecord(record, ctx = {}, path = 'loop') {
  const errors = []
  const warnings = []
  if (!isPlainObject(record)) {
    err(errors, path, 'TYPE', '掌控卡必须是对象')
    return { ok: false, errors, warnings }
  }
  checkString(record.id, `${path}.id`, errors, { nonEmpty: true })
  if (record.id && !record.id.startsWith(LOOP_ID_PREFIX)) warn(warnings, `${path}.id`, 'ID_SHAPE', `掌控卡 id 建议以 ${LOOP_ID_PREFIX} 开头`)
  checkString(record.title, `${path}.title`, errors, { nonEmpty: true })
  checkEnum(record.systemType, SYSTEM_TYPES, `${path}.systemType`, errors)
  checkString(record.summary, `${path}.summary`, errors)
  validateGoal(record.goal, `${path}.goal`, errors)
  validateMeasurement(record.measurement, `${path}.measurement`, errors)
  validateAction(record.action, `${path}.action`, errors)
  if (checkArray(record.disturbances, `${path}.disturbances`, errors)) {
    record.disturbances.forEach((item, i) => {
      if (!isPlainObject(item)) return err(errors, `${path}.disturbances[${i}]`, 'TYPE', '扰动必须是对象')
      checkString(item.text, `${path}.disturbances[${i}].text`, errors, { nonEmpty: true })
    })
  }
  if (checkArray(record.delays, `${path}.delays`, errors)) {
    record.delays.forEach((item, i) => {
      const at = `${path}.delays[${i}]`
      if (!isPlainObject(item)) return err(errors, at, 'TYPE', '延迟必须是对象')
      checkString(item.from, `${at}.from`, errors)
      checkString(item.to, `${at}.to`, errors)
      if (item.unknown !== true && (typeof item.estimateSeconds !== 'number' || item.estimateSeconds < 0)) {
        err(errors, `${at}.estimateSeconds`, 'RANGE', 'estimateSeconds 必须是非负数；未知时写 unknown:true')
      }
    })
  }
  validateBoundary(record.boundary, `${path}.boundary`, errors)
  validateHypothesis(record.hypothesis, `${path}.hypothesis`, errors)
  validateGaps(record.gaps, `${path}.gaps`, errors)
  validatePrincipleRefs(record.principleRefs, `${path}.principleRefs`, errors, ctx)
  checkEnum(record.status, LOOP_STATUSES, `${path}.status`, errors)
  if (record.nextAction !== null) validateNextAction(record.nextAction, `${path}.nextAction`, errors)
  validateNextCheck(record.nextCheck ?? null, `${path}.nextCheck`, errors, ctx)
  validateApplication(record.application, `${path}.application`, errors, ctx)
  if (!isInteger(record.version) || record.version < 1) err(errors, `${path}.version`, 'RANGE', 'version 必须是 ≥1 的整数')
  validateVersions(record.versions, `${path}.versions`, errors)
  if (typeof record.legacy !== 'boolean') err(errors, `${path}.legacy`, 'TYPE', 'legacy 必须是布尔值')
  if (!isIsoTimestamp(record.createdAt)) err(errors, `${path}.createdAt`, 'ISO', 'createdAt 必须是 ISO 时间戳')
  if (!isIsoTimestamp(record.updatedAt)) err(errors, `${path}.updatedAt`, 'ISO', 'updatedAt 必须是 ISO 时间戳')
  if (record.lastOpenedAt !== null && record.lastOpenedAt !== undefined && !isIsoTimestamp(record.lastOpenedAt)) {
    err(errors, `${path}.lastOpenedAt`, 'ISO', 'lastOpenedAt 必须是 ISO 时间戳或 null')
  }
  return { ok: errors.length === 0, errors, warnings }
}

export function validateInterventionRecord(record, ctx = {}, path = 'intervention') {
  const errors = []
  const warnings = []
  if (!isPlainObject(record)) {
    err(errors, path, 'TYPE', '干预必须是对象')
    return { ok: false, errors, warnings }
  }
  checkString(record.id, `${path}.id`, errors, { nonEmpty: true })
  if (record.id && !record.id.startsWith(INTERVENTION_ID_PREFIX)) warn(warnings, `${path}.id`, 'ID_SHAPE', `干预 id 建议以 ${INTERVENTION_ID_PREFIX} 开头`)
  checkRef(record.loopId, ctx?.loopIds, `${path}.loopId`, errors, '掌控卡引用')
  checkString(record.action, `${path}.action`, errors, { nonEmpty: true })
  checkString(record.predicted, `${path}.predicted`, errors, { nonEmpty: true })
  if (record.windowStart !== null && !isIsoTimestamp(record.windowStart)) err(errors, `${path}.windowStart`, 'ISO', 'windowStart 必须是 ISO 时间戳或 null')
  if (record.windowEnd !== null && !isIsoTimestamp(record.windowEnd)) err(errors, `${path}.windowEnd`, 'ISO', 'windowEnd 必须是 ISO 时间戳或 null')
  checkEnum(record.status, INTERVENTION_STATUSES, `${path}.status`, errors)
  if (!isIsoTimestamp(record.at)) err(errors, `${path}.at`, 'ISO', 'at 必须是 ISO 时间戳')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateObservationRecord(record, ctx = {}, path = 'observation') {
  const errors = []
  const warnings = []
  if (!isPlainObject(record)) {
    err(errors, path, 'TYPE', '观察必须是对象')
    return { ok: false, errors, warnings }
  }
  checkString(record.id, `${path}.id`, errors, { nonEmpty: true })
  if (record.id && !record.id.startsWith(OBSERVATION_ID_PREFIX)) warn(warnings, `${path}.id`, 'ID_SHAPE', `观察 id 建议以 ${OBSERVATION_ID_PREFIX} 开头`)
  checkRef(record.loopId, ctx?.loopIds, `${path}.loopId`, errors, '掌控卡引用')
  if (record.interventionId !== null) checkRef(record.interventionId, ctx?.interventionIds, `${path}.interventionId`, errors, '干预引用')
  if (!isIsoTimestamp(record.at)) err(errors, `${path}.at`, 'ISO', 'at 必须是 ISO 时间戳')
  checkEnum(record.source, OBSERVATION_SOURCES, `${path}.source`, errors)
  if (!isPlainObject(record.metric)) err(errors, `${path}.metric`, 'TYPE', 'metric 必须是对象')
  else {
    checkEnum(record.metric.kind, METRIC_KINDS, `${path}.metric.kind`, errors)
    if (record.metric.kind !== 'text') {
      if (typeof record.metric.value !== 'number' || Number.isNaN(record.metric.value)) {
        err(errors, `${path}.metric.value`, 'TYPE', '计数/比例/时长的 value 必须是数字')
      }
    } else {
      checkString(record.metric.value, `${path}.metric.value`, errors)
    }
    checkString(record.metric.unit, `${path}.metric.unit`, errors)
  }
  if (!isPlainObject(record.compare)) err(errors, `${path}.compare`, 'TYPE', 'compare 必须是对象')
  else {
    checkString(record.compare.prediction, `${path}.compare.prediction`, errors)
    checkEnum(record.compare.verdict, OBSERVATION_VERDICTS, `${path}.compare.verdict`, errors)
    checkString(record.compare.reason, `${path}.compare.reason`, errors)
  }
  if (record.evidenceRefs !== undefined && checkArray(record.evidenceRefs, `${path}.evidenceRefs`, errors)) {
    record.evidenceRefs.forEach((ref, i) => {
      if (!isPlainObject(ref)) return err(errors, `${path}.evidenceRefs[${i}]`, 'TYPE', '证据引用必须是对象')
      if (!['note', 'experiment', 'prediction'].includes(ref.kind)) err(errors, `${path}.evidenceRefs[${i}].kind`, 'ENUM', '证据引用 kind 只能是 note|experiment|prediction')
    })
  }
  if (record.noteIds !== undefined) {
    if (!checkArray(record.noteIds, `${path}.noteIds`, errors)) return { ok: false, errors, warnings }
    record.noteIds.forEach((id, i) => checkRef(id, ctx?.noteIds, `${path}.noteIds[${i}]`, errors, '笔记引用'))
  }
  return { ok: errors.length === 0, errors, warnings }
}

// ─────────────────────────── 全量 v3 表校验 ───────────────────────────

/**
 * 校验 v3 新增表及其与已有表的引用。
 * @param {object} state v3 state
 * @param {{core?: object, nodeIds?: Set<string>, ...}} ctx 可选引用集合；缺省时不校验对应引用
 * @returns {{ok:boolean, errors:Array, warnings:Array}}
 */
export function validateLoopTables(state, ctx = {}) {
  const errors = []
  const warnings = []
  if (!isPlainObject(state)) return { ok: false, errors: [{ path: '', code: 'TYPE', message: 'state 必须是对象' }], warnings }

  const loopIds = new Set(Object.keys(state.loops || {}))
  const interventionIds = new Set(Object.keys(state.interventions || {}))
  const localCtx = {
    ...ctx,
    loopIds: ctx.loopIds || loopIds,
    interventionIds: ctx.interventionIds || interventionIds,
    noteIds: ctx.noteIds || new Set(Object.keys(state.notes || {})),
    taskIds: ctx.taskIds || new Set(Object.keys(state.tasks || {})),
  }

  for (const table of LOOP_TABLES) {
    const value = state[table]
    if (!isPlainObject(value)) {
      err(errors, table, 'TYPE', `${table} 必须是对象（表）`)
      continue
    }
    const kind = LOOP_TABLE_KINDS[table]
    for (const [key, record] of Object.entries(value)) {
      const itemCtx = { ...localCtx, key, path: `${table}.${key}` }
      const result =
        kind === 'loop'
          ? validateLoopRecord(record, itemCtx, `${table}.${key}`)
          : kind === 'intervention'
            ? validateInterventionRecord(record, itemCtx, `${table}.${key}`)
            : validateObservationRecord(record, itemCtx, `${table}.${key}`)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
      if (isPlainObject(record) && record.id !== undefined && record.id !== key) {
        err(errors, `${table}.${key}.id`, 'KEY_MISMATCH', `表键 ${key} 与记录 id ${JSON.stringify(record.id)} 不一致`)
      }
    }
  }

  // 卡内引用：principleRefs 的 node 必须存在于内容包
  if (ctx.core) {
    const nodeIds = new Set((Array.isArray(ctx.core.nodes) ? ctx.core.nodes : []).map((n) => n && n.id).filter(isString))
    for (const [loopId, loop] of Object.entries(isPlainObject(state.loops) ? state.loops : {})) {
      if (!isPlainObject(loop)) continue
      for (const [i, ref] of (Array.isArray(loop.principleRefs) ? loop.principleRefs : []).entries()) {
        if (isPlainObject(ref) && isString(ref.nodeId) && !nodeIds.has(ref.nodeId)) {
          err(errors, `loops.${loopId}.principleRefs[${i}].nodeId`, 'DANGLING_REF', `原理卡引用了不存在的节点：${ref.nodeId}`)
        }
      }
    }
  }

  // 观察与干预归属：loopId 必须指向同一张卡；intervention.loopId 与 observation.loopId 一致
  for (const [obsId, obs] of Object.entries(isPlainObject(state.observations) ? state.observations : {})) {
    if (!isPlainObject(obs) || obs.interventionId === null) continue
    const intervention = isPlainObject(state.interventions) ? state.interventions[obs.interventionId] : undefined
    if (!intervention) continue
    if (isPlainObject(intervention) && intervention.loopId !== obs.loopId) {
      err(errors, `observations.${obsId}.interventionId`, 'CROSS_LOOP', '观察的干预属于另一张掌控卡')
    }
  }

  // 笔记/对话/v3 视图对 loop 的引用
  const noteIds = isPlainObject(state.notes) ? state.notes : {}
  for (const [noteId, note] of Object.entries(noteIds)) {
    if (isPlainObject(note) && isPlainObject(note.subject) && note.subject.kind === 'loop' && !loopIds.has(note.subject.id)) {
      err(errors, `notes.${noteId}.subject.id`, 'DANGLING_REF', `笔记引用了不存在的掌控卡：${note.subject.id}`)
    }
  }
  for (const [key, dialog] of Object.entries(isPlainObject(state.dialogs) ? state.dialogs : {})) {
    if (isPlainObject(dialog) && isPlainObject(dialog.subject) && dialog.subject.kind === 'loop' && !loopIds.has(dialog.subject.id)) {
      err(errors, `dialogs.${key}.subject.id`, 'DANGLING_REF', `对话引用了不存在的掌控卡：${dialog.subject.id}`)
    }
  }
  if (isPlainObject(state.view) && state.view.activeLoopId !== null && state.view.activeLoopId !== undefined) {
    checkRef(state.view.activeLoopId, loopIds, 'view.activeLoopId', errors, '当前掌控卡引用')
  }

  return { ok: errors.length === 0, errors, warnings }
}
