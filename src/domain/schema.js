/**
 * 掌控 · 领域层 schema（纯函数，无 IO、无 ctx、无第三方依赖）
 *
 * 契约：docs/v2-design.md 第 2/11 节（用户数据 schema v3：v2 表 + 掌控卡/干预/观察）。
 * 这里只做结构、枚举、时间戳与引用闭合校验；不做 IO，不写盘，不产生副作用。
 * 所有校验返回 { ok, errors:[{path,code,message}], warnings:[...] }，不抛异常。
 */

import { LOOP_TABLES as V3_TABLES, emptyLoopTables, validateLoopTables } from './loop-schema.js'

export const SCHEMA_VERSION = 3

/** v3 新增表；与 v2 表并存（旧表保留用于追溯，新 UI 只写新表）。 */
export const LOOP_TABLES = V3_TABLES

/** 用户数据包中被导入/导出的 8 张表；view/meta/importLog 由 Host 单独处理。 */
export const STATE_TABLES = Object.freeze([
  'notes',
  'revisions',
  'relations',
  'investigations',
  'predictions',
  'experiments',
  'tasks',
  'dialogs',
])

/** 表名 → 记录种类。 */
export const TABLE_KINDS = Object.freeze({
  notes: 'note',
  revisions: 'revision',
  relations: 'relationAnnotation',
  investigations: 'investigation',
  predictions: 'prediction',
  experiments: 'experimentRun',
  tasks: 'task',
  dialogs: 'dialog',
})

export const SUBJECT_KINDS = Object.freeze(['node', 'relation', 'investigation', 'loop'])
export const NOTE_KINDS = Object.freeze(['理解', '疑问', '证据', '反驳', '实践'])
export const NOTE_STATUSES = Object.freeze(['active', 'archived'])
export const AUTHOR_SOURCES = Object.freeze(['user', 'ai-draft', 'import'])
export const SAVED_BY = Object.freeze(['ui', 'agent'])
export const INVESTIGATION_STATUSES = Object.freeze(['open', 'testing', 'supported', 'revised', 'inconclusive'])
export const PREDICTION_STATUSES = Object.freeze(['open', 'supported', 'refuted', 'inconclusive'])
export const EXPERIMENT_VERDICTS = Object.freeze([
  'converged',
  'overshoot-settled',
  'oscillating',
  'oscillating-below',
  'drift',
  'diverging',
  'pass',
  'fail',
  'mixed',
])
export const TASK_STATUSES = Object.freeze(['draft', 'saved', 'archived'])
export const DIALOG_ROLES = Object.freeze(['user', 'assistant'])
export const DIALOG_STATUSES = Object.freeze(['completed', 'failed', 'cancelled', 'streaming'])
export const RELATION_ANNOTATION_STATUSES = Object.freeze(['open', 'supported', 'challenged'])
export const VIEW_SCALES = Object.freeze(['domain', 'subject', 'evidence'])
export const VIEW_PROJECTIONS = Object.freeze(['theory', 'history', 'practice'])
export const EVIDENCE_REF_KINDS = Object.freeze(['note', 'experiment', 'prediction'])
export const NOTICE_LEVELS = Object.freeze(['info', 'warn'])
export const IMPORT_MODES = Object.freeze(['merge', 'skip', 'replace'])

export const DEFAULT_VIEW = Object.freeze({
  // v3：首页只有一个主入口；activeLoopId 指向当前掌控卡。
  screen: 'home',
  activeLoopId: null,
  // v2 字段保留（旧数据与旧测试兼容；v3 UI 不再以 scale/projection 为导航）。
  scale: 'domain',
  projection: 'theory',
  selectedNodeId: null,
  selectedRelationId: null,
  activeInvestigationId: null,
  directoryOpen: true,
  rightOpen: true,
})

// ─────────────────────────── 小工具 ───────────────────────────

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isString = (v) => typeof v === 'string'
const isInteger = (v) => typeof v === 'number' && Number.isInteger(v)
const isNonEmptyString = (v) => isString(v) && v.trim().length > 0
const hasPrefix = (v, prefix) => isString(v) && v.startsWith(prefix)
const isIsoTimestamp = (v) => {
  if (!isString(v) || v.length < 20) return false
  const parsed = Date.parse(v)
  return Number.isFinite(parsed) && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)
}

export { isIsoTimestamp }

const pushError = (errors, path, code, message) => errors.push({ path, code, message })
const pushWarning = (warnings, path, code, message) => warnings.push({ path, code, message })

/** 规范 JSON：对象键排序，供幂等比较使用。 */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value === undefined ? null : value)
}

/** 两个记录在规范化意义上是否相同（不受对象键顺序影响）。 */
export function recordsEqual(a, b) {
  return canonicalJson(a) === canonicalJson(b)
}

export function subjectKey(subject) {
  if (!subject || typeof subject !== 'object') return null
  if (!isString(subject.kind) || !isString(subject.id)) return null
  return `${subject.kind}:${subject.id}`
}

export function parseSubjectKey(key) {
  if (!isString(key)) return null
  const index = key.indexOf(':')
  if (index <= 0) return null
  const kind = key.slice(0, index)
  const id = key.slice(index + 1)
  if (!SUBJECT_KINDS.includes(kind) || !id) return null
  return { kind, id }
}

function checkEnum(value, allowed, path, errors) {
  if (!allowed.includes(value)) {
    pushError(errors, path, 'ENUM', `取值必须是 ${allowed.join('|')} 之一，实际为 ${JSON.stringify(value)}`)
    return false
  }
  return true
}

function checkString(value, path, errors, { nullable = false, nonEmpty = false } = {}) {
  if (value === null) {
    if (nullable) return true
    pushError(errors, path, 'TYPE', '不能为 null')
    return false
  }
  if (!isString(value)) {
    pushError(errors, path, 'TYPE', `必须是字符串，实际为 ${typeof value}`)
    return false
  }
  if (nonEmpty && value.trim().length === 0) {
    pushError(errors, path, 'EMPTY', '不能为空字符串')
    return false
  }
  return true
}

function checkArray(value, path, errors, { nullable = false } = {}) {
  if (value === null) {
    if (nullable) return true
    pushError(errors, path, 'TYPE', '不能为 null')
    return false
  }
  if (!Array.isArray(value)) {
    pushError(errors, path, 'TYPE', `必须是数组，实际为 ${typeof value}`)
    return false
  }
  return true
}

function checkSubjectShape(subject, path, errors) {
  if (!isPlainObject(subject)) {
    pushError(errors, path, 'TYPE', 'subject 必须是 {kind,id} 对象')
    return false
  }
  let ok = true
  if (!SUBJECT_KINDS.includes(subject.kind)) {
    pushError(errors, `${path}.kind`, 'ENUM', `subject.kind 必须是 ${SUBJECT_KINDS.join('|')} 之一`)
    ok = false
  }
  if (!isNonEmptyString(subject.id)) {
    pushError(errors, `${path}.id`, 'TYPE', 'subject.id 必须是非空字符串')
    ok = false
  }
  for (const key of Object.keys(subject)) {
    if (key !== 'kind' && key !== 'id') pushWarning(warningsSink, `${path}.${key}`, 'UNKNOWN_FIELD', '未知字段被忽略')
  }
  return ok
}

// checkSubjectShape 需要一个 warnings 接收器；用内部变量避免参数膨胀。
let warningsSink = []

// ─────────────────── 引用上下文（core + store 索引） ───────────────────

/**
 * 构建引用上下文：把 core（内容包）与 store（用户数据）里的 id 收成集合，
 * 供 subject / evidenceRefs / predictionIds 等引用校验使用。
 * 传什么就校验什么；未传的集合为 null，表示「本层不校验该引用」。
 */
export function buildRefContext({ core, store } = {}) {
  const ctx = {
    nodeIds: null,
    relationIds: null,
    groupIds: null,
    investigationIds: null,
    noteIds: null,
    runIds: null,
    predictionIds: null,
    taskIds: null,
    loopIds: null,
    interventionIds: null,
    observationIds: null,
  }
  if (core && typeof core === 'object') {
    ctx.nodeIds = new Set((Array.isArray(core.nodes) ? core.nodes : []).map((n) => n && n.id).filter(isString))
    ctx.relationIds = new Set((Array.isArray(core.relations) ? core.relations : []).map((r) => r && r.id).filter(isString))
    // 兼容 v1 内容包的 edges（没有稳定 id）
    if (!ctx.relationIds.size && Array.isArray(core.edges) && core.edges.length) {
      ctx.relationIds = new Set()
    }
    ctx.groupIds = new Set((Array.isArray(core.groups) ? core.groups : []).map((g) => g && g.id).filter(isString))
  }
  if (store && typeof store === 'object') {
    ctx.investigationIds = new Set(Object.keys(store.investigations || {}))
    ctx.noteIds = new Set(Object.keys(store.notes || {}))
    ctx.runIds = new Set(Object.keys(store.experiments || {}))
    ctx.predictionIds = new Set(Object.keys(store.predictions || {}))
    ctx.taskIds = new Set(Object.keys(store.tasks || {}))
    ctx.loopIds = new Set(Object.keys(store.loops || {}))
    ctx.interventionIds = new Set(Object.keys(store.interventions || {}))
    ctx.observationIds = new Set(Object.keys(store.observations || {}))
  }
  return ctx
}

function checkRef(refId, set, path, errors, label) {
  if (!set) return true
  if (!isString(refId) || !refId) {
    pushError(errors, path, 'TYPE', `${label} 必须是非空字符串`)
    return false
  }
  if (!set.has(refId)) {
    pushError(errors, path, 'DANGLING_REF', `${label} 引用了不存在的 id：${refId}`)
    return false
  }
  return true
}

function validateSubjectRef(subject, ctx, path, errors) {
  if (!checkSubjectShape(subject, path, errors)) return false
  let ok = true
  if (subject.kind === 'node') ok = checkRef(subject.id, ctx.nodeIds, `${path}.id`, errors, '节点引用') && ok
  if (subject.kind === 'relation') ok = checkRef(subject.id, ctx.relationIds, `${path}.id`, errors, '关系引用') && ok
  if (subject.kind === 'investigation') ok = checkRef(subject.id, ctx.investigationIds, `${path}.id`, errors, '研究问题引用') && ok
  if (subject.kind === 'loop') ok = checkRef(subject.id, ctx.loopIds, `${path}.id`, errors, '掌控卡引用') && ok
  return ok
}

// ────────────────────────── 记录规范化 ──────────────────────────

const NOTE_DEFAULTS = {
  id: '',
  subject: null,
  kind: '理解',
  text: '',
  status: 'active',
  authorSource: 'user',
  savedBy: 'ui',
  adopted: null,
  legacyOriginUncertain: false,
  encodingSuspected: false,
  parentRevision: null,
  createdAt: '',
  updatedAt: '',
  revision: 1,
  // v1 迁移时保留旧 origin 原值（契约之外的可选字段，用于「追问来源」时不凭空编造）。
  legacyOrigin: null,
}

const INVESTIGATION_DEFAULTS = {
  id: '',
  subject: null,
  title: '',
  claim: '',
  counter: '',
  nextTest: '',
  status: 'open',
  predictionIds: [],
  experimentRunIds: [],
  dialogSubjectKey: '',
  createdAt: '',
  updatedAt: '',
}

const PREDICTION_DEFAULTS = {
  id: '',
  investigationId: null,
  subject: null,
  text: '',
  resolveBy: '',
  status: 'open',
  resolvedAt: null,
  resolvedByRunId: null,
  resolutionNote: null,
  legacy: false,
  at: '',
}

const EXPERIMENT_RUN_DEFAULTS = {
  id: '',
  experimentId: '',
  modelId: '',
  modelVersion: 1,
  params: {},
  initial: {},
  prediction: '',
  observation: {},
  criterion: '',
  verdict: 'mixed',
  subject: null,
  investigationId: null,
  legacy: false,
  at: '',
}

const TASK_DEFAULTS = {
  id: '',
  title: '',
  request: '',
  goal: '',
  acceptance: [],
  boundary: [],
  unknowns: [],
  conceptIds: [],
  evidenceRefs: [],
  status: 'draft',
  revision: 1,
  revisions: [],
  model: { provider: '', model: '', reasoningEffort: null },
  createdAt: '',
  updatedAt: '',
  legacy: false,
}

const DIALOG_MESSAGE_DEFAULTS = {
  id: '',
  role: 'assistant',
  text: '',
  at: '',
  requestId: '',
  contextVersion: '',
  model: { provider: '', model: '', reasoningEffort: null },
  status: 'completed',
  error: null,
  partial: false,
}

const DIALOG_DEFAULTS = {
  subject: null,
  messages: [],
  lastRequestId: null,
  updatedAt: '',
}

const RELATION_ANNOTATION_DEFAULTS = {
  edgeId: '',
  annotation: '',
  status: 'open',
  evidenceNoteIds: [],
  version: 1,
  updatedAt: '',
}

const VIEW_DEFAULTS = { ...DEFAULT_VIEW }

const META_DEFAULTS = {
  fromSchema: SCHEMA_VERSION,
  migratedAt: null,
  backupPath: null,
  contentVersion: null,
  notices: [],
}

const KIND_DEFAULTS = {
  note: NOTE_DEFAULTS,
  investigation: INVESTIGATION_DEFAULTS,
  prediction: PREDICTION_DEFAULTS,
  experimentRun: EXPERIMENT_RUN_DEFAULTS,
  task: TASK_DEFAULTS,
  dialog: DIALOG_DEFAULTS,
  relationAnnotation: RELATION_ANNOTATION_DEFAULTS,
  view: VIEW_DEFAULTS,
  meta: META_DEFAULTS,
}

const KIND_FIELDS = {}
for (const [kind, defaults] of Object.entries(KIND_DEFAULTS)) {
  KIND_FIELDS[kind] = Object.freeze(Object.keys(defaults))
}

export const RECORD_FIELDS = Object.freeze(KIND_FIELDS)

function cloneJson(value) {
  if (value === null || typeof value !== 'object') return value
  return JSON.parse(JSON.stringify(value))
}

/**
 * 规范化记录：只保留契约字段、补齐默认值、未知字段丢弃并记 warning。
 * 返回 { ok, record, errors, warnings }；结构错误不在这里判断，交给 validateRecord。
 */
export function normalizeRecord(kind, raw, path = kind) {
  const errors = []
  const warnings = []
  const defaults = KIND_DEFAULTS[kind]
  if (!defaults) {
    pushError(errors, path, 'UNKNOWN_KIND', `未知记录种类：${kind}`)
    return { ok: false, record: null, errors, warnings }
  }
  if (!isPlainObject(raw)) {
    pushError(errors, path, 'TYPE', `${kind} 记录必须是对象`)
    return { ok: false, record: null, errors, warnings }
  }
  const allowed = KIND_FIELDS[kind]
  const record = {}
  for (const field of allowed) {
    const rawValue = Object.prototype.hasOwnProperty.call(raw, field) ? raw[field] : undefined
    record[field] = rawValue === undefined ? cloneJson(defaults[field]) : cloneJson(rawValue)
  }
  for (const key of Object.keys(raw)) {
    if (!allowed.includes(key)) {
      pushWarning(warnings, `${path}.${key}`, 'UNKNOWN_FIELD', `未知字段 ${key} 已忽略`)
    }
  }
  return { ok: true, record, errors, warnings }
}

/** revisions 表的值是「修订条目数组」，单独规范化。 */
export function normalizeRevisions(raw, path = 'revisions') {
  const errors = []
  const warnings = []
  if (!Array.isArray(raw)) {
    pushError(errors, path, 'TYPE', 'revisions 必须是数组')
    return { ok: false, record: null, errors, warnings }
  }
  const list = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!isPlainObject(item)) {
      pushError(errors, `${path}[${i}]`, 'TYPE', '修订条目必须是对象')
      continue
    }
    const record = {
      revision: isInteger(item.revision) ? item.revision : item.revision,
      text: isString(item.text) ? item.text : item.text,
      at: isString(item.at) ? item.at : item.at,
      savedBy: item.savedBy === undefined ? 'ui' : item.savedBy,
    }
    for (const key of Object.keys(item)) {
      if (!['revision', 'text', 'at', 'savedBy'].includes(key)) {
        pushWarning(warnings, `${path}[${i}].${key}`, 'UNKNOWN_FIELD', `未知字段 ${key} 已忽略`)
      }
    }
    list.push(record)
  }
  return { ok: true, record: list, errors, warnings }
}

// ────────────────────────── 记录校验 ──────────────────────────

function validateNote(record, ctx, path, errors, warnings) {
  checkString(record.id, `${path}.id`, errors, { nonEmpty: true })
  if (!hasPrefix(record.id, 'n_')) pushWarning(warnings, `${path}.id`, 'ID_SHAPE', '笔记 id 建议以 n_ 开头')
  validateSubjectRef(record.subject, ctx, `${path}.subject`, errors)
  checkEnum(record.kind, NOTE_KINDS, `${path}.kind`, errors)
  checkString(record.text, `${path}.text`, errors, { nonEmpty: true })
  checkEnum(record.status, NOTE_STATUSES, `${path}.status`, errors)
  checkEnum(record.authorSource, AUTHOR_SOURCES, `${path}.authorSource`, errors)
  checkEnum(record.savedBy, SAVED_BY, `${path}.savedBy`, errors)
  if (record.adopted !== null && typeof record.adopted !== 'boolean') {
    pushError(errors, `${path}.adopted`, 'TYPE', 'adopted 只能是 true/false/null')
  }
  for (const flag of ['legacyOriginUncertain', 'encodingSuspected']) {
    if (typeof record[flag] !== 'boolean') pushError(errors, `${path}.${flag}`, 'TYPE', `${flag} 必须是布尔值`)
  }
  if (record.parentRevision !== null && !isInteger(record.parentRevision)) {
    pushError(errors, `${path}.parentRevision`, 'TYPE', 'parentRevision 只能是整数或 null')
  }
  if (record.legacyOrigin !== null && record.legacyOrigin !== undefined && !isString(record.legacyOrigin)) {
    pushError(errors, `${path}.legacyOrigin`, 'TYPE', 'legacyOrigin 只能是字符串或 null')
  }
  if (!isIsoTimestamp(record.createdAt)) pushError(errors, `${path}.createdAt`, 'ISO', 'createdAt 必须是 ISO 8601 时间戳')
  if (!isIsoTimestamp(record.updatedAt)) pushError(errors, `${path}.updatedAt`, 'ISO', 'updatedAt 必须是 ISO 8601 时间戳')
  if (!isInteger(record.revision) || record.revision < 1) pushError(errors, `${path}.revision`, 'RANGE', 'revision 必须是 ≥1 的整数')
}

function validateRevisionList(list, ctx, path, errors, warnings) {
  checkArray(list, path, errors)
  if (!Array.isArray(list)) return
  let previous = 0
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    const at = `${path}[${i}]`
    if (!isPlainObject(item)) {
      pushError(errors, at, 'TYPE', '修订条目必须是对象')
      continue
    }
    if (!isInteger(item.revision) || item.revision < 1) pushError(errors, `${at}.revision`, 'RANGE', 'revision 必须是 ≥1 的整数')
    else {
      if (item.revision <= previous) pushWarning(warnings, `${at}.revision`, 'ORDER', '修订号不是严格递增（乱序或重复）')
      previous = item.revision
    }
    checkString(item.text, `${at}.text`, errors, { nonEmpty: true })
    if (!isIsoTimestamp(item.at)) pushError(errors, `${at}.at`, 'ISO', '修订时间必须是 ISO 8601 时间戳')
    checkEnum(item.savedBy, SAVED_BY, `${at}.savedBy`, errors)
    for (const key of Object.keys(item)) {
      if (!['revision', 'text', 'at', 'savedBy'].includes(key)) pushWarning(warnings, `${at}.${key}`, 'UNKNOWN_FIELD', '未知字段已忽略')
    }
  }
}

function validateInvestigation(record, ctx, path, errors, warnings) {
  checkString(record.id, `${path}.id`, errors, { nonEmpty: true })
  if (!hasPrefix(record.id, 'inv_')) pushWarning(warnings, `${path}.id`, 'ID_SHAPE', '研究问题 id 建议以 inv_ 开头')
  validateSubjectRef(record.subject, ctx, `${path}.subject`, errors)
  checkString(record.title, `${path}.title`, errors)
  checkString(record.claim, `${path}.claim`, errors)
  checkString(record.counter, `${path}.counter`, errors)
  checkString(record.nextTest, `${path}.nextTest`, errors)
  checkEnum(record.status, INVESTIGATION_STATUSES, `${path}.status`, errors)
  checkArray(record.predictionIds, `${path}.predictionIds`, errors)
  if (Array.isArray(record.predictionIds)) {
    record.predictionIds.forEach((id, i) => checkRef(id, ctx.predictionIds, `${path}.predictionIds[${i}]`, errors, '预测引用'))
  }
  checkArray(record.experimentRunIds, `${path}.experimentRunIds`, errors)
  if (Array.isArray(record.experimentRunIds)) {
    record.experimentRunIds.forEach((id, i) => checkRef(id, ctx.runIds, `${path}.experimentRunIds[${i}]`, errors, '实验记录引用'))
  }
  checkString(record.dialogSubjectKey, `${path}.dialogSubjectKey`, errors)
  if (!isIsoTimestamp(record.createdAt)) pushError(errors, `${path}.createdAt`, 'ISO', 'createdAt 必须是 ISO 8601 时间戳')
  if (!isIsoTimestamp(record.updatedAt)) pushError(errors, `${path}.updatedAt`, 'ISO', 'updatedAt 必须是 ISO 8601 时间戳')
}

function validatePrediction(record, ctx, path, errors, warnings) {
  checkString(record.id, `${path}.id`, errors, { nonEmpty: true })
  if (!hasPrefix(record.id, 'p_')) pushWarning(warnings, `${path}.id`, 'ID_SHAPE', '预测 id 建议以 p_ 开头')
  if (record.investigationId !== null) checkRef(record.investigationId, ctx.investigationIds, `${path}.investigationId`, errors, '研究问题引用')
  validateSubjectRef(record.subject, ctx, `${path}.subject`, errors)
  checkString(record.text, `${path}.text`, errors, { nonEmpty: true })
  checkString(record.resolveBy, `${path}.resolveBy`, errors)
  checkEnum(record.status, PREDICTION_STATUSES, `${path}.status`, errors)
  if (record.resolvedAt !== null && !isIsoTimestamp(record.resolvedAt)) {
    pushError(errors, `${path}.resolvedAt`, 'ISO', 'resolvedAt 必须是 ISO 时间戳或 null')
  }
  if (record.resolvedByRunId !== null) checkRef(record.resolvedByRunId, ctx.runIds, `${path}.resolvedByRunId`, errors, '实验记录引用')
  if (record.resolutionNote !== null) checkString(record.resolutionNote, `${path}.resolutionNote`, errors)
  if (typeof record.legacy !== 'boolean') pushError(errors, `${path}.legacy`, 'TYPE', 'legacy 必须是布尔值')
  if (!isIsoTimestamp(record.at)) pushError(errors, `${path}.at`, 'ISO', 'at 必须是 ISO 8601 时间戳')
}

function validateExperimentRun(record, ctx, path, errors, warnings) {
  checkString(record.id, `${path}.id`, errors, { nonEmpty: true })
  if (!hasPrefix(record.id, 'e_')) pushWarning(warnings, `${path}.id`, 'ID_SHAPE', '实验记录 id 建议以 e_ 开头')
  checkString(record.experimentId, `${path}.experimentId`, errors, { nonEmpty: true })
  checkString(record.modelId, `${path}.modelId`, errors, { nonEmpty: true })
  if (!isInteger(record.modelVersion) || record.modelVersion < 1) {
    pushError(errors, `${path}.modelVersion`, 'RANGE', 'modelVersion 必须是 ≥1 的整数')
  }
  for (const field of ['params', 'initial', 'observation']) {
    if (!isPlainObject(record[field])) pushError(errors, `${path}.${field}`, 'TYPE', `${field} 必须是对象`)
  }
  checkString(record.prediction, `${path}.prediction`, errors)
  checkString(record.criterion, `${path}.criterion`, errors)
  checkEnum(record.verdict, EXPERIMENT_VERDICTS, `${path}.verdict`, errors)
  if (record.subject !== null) validateSubjectRef(record.subject, ctx, `${path}.subject`, errors)
  if (record.investigationId !== null) checkRef(record.investigationId, ctx.investigationIds, `${path}.investigationId`, errors, '研究问题引用')
  if (typeof record.legacy !== 'boolean') pushError(errors, `${path}.legacy`, 'TYPE', 'legacy 必须是布尔值')
  if (!isIsoTimestamp(record.at)) pushError(errors, `${path}.at`, 'ISO', 'at 必须是 ISO 8601 时间戳')
}

function validateModelObject(model, path, errors) {
  if (!isPlainObject(model)) {
    pushError(errors, path, 'TYPE', 'model 必须是对象')
    return
  }
  checkString(model.provider, `${path}.provider`, errors)
  checkString(model.model, `${path}.model`, errors)
  if (model.reasoningEffort !== null && !isString(model.reasoningEffort)) {
    pushError(errors, `${path}.reasoningEffort`, 'TYPE', 'reasoningEffort 只能是字符串或 null')
  }
  for (const key of Object.keys(model)) {
    if (!['provider', 'model', 'reasoningEffort'].includes(key)) pushWarning(warnings, `${path}.${key}`, 'UNKNOWN_FIELD', '未知字段已忽略')
  }
}

function validateTask(record, ctx, path, errors, warnings) {
  checkString(record.id, `${path}.id`, errors, { nonEmpty: true })
  if (!hasPrefix(record.id, 't_')) pushWarning(warnings, `${path}.id`, 'ID_SHAPE', '任务草案 id 建议以 t_ 开头')
  checkString(record.title, `${path}.title`, errors)
  checkString(record.request, `${path}.request`, errors, { nonEmpty: true })
  checkString(record.goal, `${path}.goal`, errors)
  checkArray(record.acceptance, `${path}.acceptance`, errors)
  if (Array.isArray(record.acceptance)) {
    record.acceptance.forEach((item, i) => {
      const at = `${path}.acceptance[${i}]`
      if (!isPlainObject(item)) return pushError(errors, at, 'TYPE', '验收项必须是 {text,evidence} 对象')
      checkString(item.text, `${at}.text`, errors, { nonEmpty: true })
      checkString(item.evidence, `${at}.evidence`, errors)
      for (const key of Object.keys(item)) {
        if (!['text', 'evidence'].includes(key)) pushWarning(warnings, `${at}.${key}`, 'UNKNOWN_FIELD', '未知字段已忽略')
      }
    })
  }
  checkArray(record.boundary, `${path}.boundary`, errors)
  if (Array.isArray(record.boundary)) {
    record.boundary.forEach((item, i) => checkString(item, `${path}.boundary[${i}]`, errors, { nullable: true }))
  }
  checkArray(record.unknowns, `${path}.unknowns`, errors)
  if (Array.isArray(record.unknowns)) {
    record.unknowns.forEach((item, i) => {
      const at = `${path}.unknowns[${i}]`
      if (!isPlainObject(item)) return pushError(errors, at, 'TYPE', '未知项必须是 {question,answer} 对象')
      checkString(item.question, `${at}.question`, errors, { nonEmpty: true })
      if (item.answer !== null) checkString(item.answer, `${at}.answer`, errors)
      for (const key of Object.keys(item)) {
        if (!['question', 'answer'].includes(key)) pushWarning(warnings, `${at}.${key}`, 'UNKNOWN_FIELD', '未知字段已忽略')
      }
    })
  }
  checkArray(record.conceptIds, `${path}.conceptIds`, errors)
  if (Array.isArray(record.conceptIds)) {
    record.conceptIds.forEach((id, i) => checkRef(id, ctx.nodeIds, `${path}.conceptIds[${i}]`, errors, '概念节点引用'))
  }
  checkArray(record.evidenceRefs, `${path}.evidenceRefs`, errors)
  if (Array.isArray(record.evidenceRefs)) {
    const refSet = { note: ctx.noteIds, experiment: ctx.runIds, prediction: ctx.predictionIds }
    record.evidenceRefs.forEach((ref, i) => {
      const at = `${path}.evidenceRefs[${i}]`
      if (!isPlainObject(ref)) return pushError(errors, at, 'TYPE', '证据引用必须是 {kind,id} 对象')
      if (!EVIDENCE_REF_KINDS.includes(ref.kind)) {
        return pushError(errors, `${at}.kind`, 'ENUM', `证据引用 kind 必须是 ${EVIDENCE_REF_KINDS.join('|')} 之一`)
      }
      checkRef(ref.id, refSet[ref.kind], `${at}.id`, errors, `${ref.kind} 引用`)
    })
  }
  checkEnum(record.status, TASK_STATUSES, `${path}.status`, errors)
  if (!isInteger(record.revision) || record.revision < 1) pushError(errors, `${path}.revision`, 'RANGE', 'revision 必须是 ≥1 的整数')
  checkArray(record.revisions, `${path}.revisions`, errors)
  if (Array.isArray(record.revisions)) {
    record.revisions.forEach((item, i) => {
      const at = `${path}.revisions[${i}]`
      if (!isPlainObject(item)) return pushError(errors, at, 'TYPE', '历史版本必须是对象')
      if (!isInteger(item.revision) || item.revision < 1) pushError(errors, `${at}.revision`, 'RANGE', 'revision 必须是 ≥1 的整数')
      if (!isPlainObject(item.snapshot)) pushError(errors, `${at}.snapshot`, 'TYPE', 'snapshot 必须是对象')
      if (!isIsoTimestamp(item.at)) pushError(errors, `${at}.at`, 'ISO', 'at 必须是 ISO 8601 时间戳')
      validateModelObject(item.model, `${at}.model`, errors)
    })
  }
  validateModelObject(record.model, `${path}.model`, errors)
  if (!isIsoTimestamp(record.createdAt)) pushError(errors, `${path}.createdAt`, 'ISO', 'createdAt 必须是 ISO 8601 时间戳')
  if (!isIsoTimestamp(record.updatedAt)) pushError(errors, `${path}.updatedAt`, 'ISO', 'updatedAt 必须是 ISO 8601 时间戳')
  if (typeof record.legacy !== 'boolean') pushError(errors, `${path}.legacy`, 'TYPE', 'legacy 必须是布尔值')
}

function validateDialogMessage(message, path, errors, warnings) {
  if (!isPlainObject(message)) {
    pushError(errors, path, 'TYPE', '对话消息必须是对象')
    return
  }
  checkString(message.id, `${path}.id`, errors, { nonEmpty: true })
  checkEnum(message.role, DIALOG_ROLES, `${path}.role`, errors)
  checkString(message.text, `${path}.text`, errors)
  if (!isIsoTimestamp(message.at)) pushError(errors, `${path}.at`, 'ISO', 'at 必须是 ISO 8601 时间戳')
  checkString(message.requestId, `${path}.requestId`, errors)
  checkString(message.contextVersion, `${path}.contextVersion`, errors)
  validateModelObject(message.model, `${path}.model`, errors)
  checkEnum(message.status, DIALOG_STATUSES, `${path}.status`, errors)
  if (message.error !== null) {
    if (!isPlainObject(message.error)) pushError(errors, `${path}.error`, 'TYPE', 'error 必须是 {code,message} 对象或 null')
    else {
      checkString(message.error.code, `${path}.error.code`, errors, { nonEmpty: true })
      checkString(message.error.message, `${path}.error.message`, errors)
    }
  }
  if (typeof message.partial !== 'boolean') pushError(errors, `${path}.partial`, 'TYPE', 'partial 必须是布尔值')
  for (const key of Object.keys(message)) {
    if (!['id', 'role', 'text', 'at', 'requestId', 'contextVersion', 'model', 'status', 'error', 'partial'].includes(key)) {
      pushWarning(warnings, `${path}.${key}`, 'UNKNOWN_FIELD', '未知字段已忽略')
    }
  }
}

function validateDialog(record, ctx, path, errors, warnings) {
  validateSubjectRef(record.subject, ctx, `${path}.subject`, errors)
  checkArray(record.messages, `${path}.messages`, errors)
  if (Array.isArray(record.messages)) {
    record.messages.forEach((message, i) => validateDialogMessage(message, `${path}.messages[${i}]`, errors, warnings))
  }
  if (record.lastRequestId !== null) checkString(record.lastRequestId, `${path}.lastRequestId`, errors)
  if (!isIsoTimestamp(record.updatedAt)) pushError(errors, `${path}.updatedAt`, 'ISO', 'updatedAt 必须是 ISO 8601 时间戳')
}

function validateRelationAnnotation(record, ctx, path, errors, warnings) {
  checkString(record.edgeId, `${path}.edgeId`, errors, { nonEmpty: true })
  if (ctx.key !== undefined && record.edgeId !== ctx.key) {
    pushError(errors, `${path}.edgeId`, 'KEY_MISMATCH', `relations 表键 ${ctx.key} 与记录 edgeId ${record.edgeId} 不一致`)
  }
  checkRef(record.edgeId, ctx.relationIds, `${path}.edgeId`, errors, '关系引用')
  checkString(record.annotation, `${path}.annotation`, errors)
  checkEnum(record.status, RELATION_ANNOTATION_STATUSES, `${path}.status`, errors)
  checkArray(record.evidenceNoteIds, `${path}.evidenceNoteIds`, errors)
  if (Array.isArray(record.evidenceNoteIds)) {
    record.evidenceNoteIds.forEach((id, i) => checkRef(id, ctx.noteIds, `${path}.evidenceNoteIds[${i}]`, errors, '笔记引用'))
  }
  if (!isInteger(record.version) || record.version < 1) pushError(errors, `${path}.version`, 'RANGE', 'version 必须是 ≥1 的整数')
  if (!isIsoTimestamp(record.updatedAt)) pushError(errors, `${path}.updatedAt`, 'ISO', 'updatedAt 必须是 ISO 8601 时间戳')
}

function validateView(record, ctx, path, errors, warnings) {
  checkEnum(record.scale, VIEW_SCALES, `${path}.scale`, errors)
  checkEnum(record.projection, VIEW_PROJECTIONS, `${path}.projection`, errors)
  if (record.screen !== undefined && !['home', 'wizard', 'loop', 'library', 'resources'].includes(record.screen)) {
    pushError(errors, `${path}.screen`, 'ENUM', 'screen 必须是 home|wizard|loop|library|resources 之一')
  }
  if (record.activeLoopId !== undefined && record.activeLoopId !== null) {
    checkRef(record.activeLoopId, ctx.loopIds, `${path}.activeLoopId`, errors, '当前掌控卡引用')
  }
  for (const [field, refSet, label] of [
    ['selectedNodeId', ctx.nodeIds, '节点引用'],
    ['selectedRelationId', ctx.relationIds, '关系引用'],
    ['activeInvestigationId', ctx.investigationIds, '研究问题引用'],
  ]) {
    if (record[field] !== null) checkRef(record[field], refSet, `${path}.${field}`, errors, label)
  }
  for (const flag of ['directoryOpen', 'rightOpen']) {
    if (typeof record[flag] !== 'boolean') pushError(errors, `${path}.${flag}`, 'TYPE', `${flag} 必须是布尔值`)
  }
  for (const key of Object.keys(record)) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_VIEW, key)) pushWarning(warnings, `${path}.${key}`, 'UNKNOWN_FIELD', '未知字段已忽略')
  }
}

function validateMeta(record, ctx, path, errors, warnings) {
  if (!isPlainObject(record)) {
    pushError(errors, path, 'TYPE', 'meta 必须是对象')
    return
  }
  if (!isInteger(record.fromSchema)) pushError(errors, `${path}.fromSchema`, 'TYPE', 'fromSchema 必须是整数')
  if (record.migratedAt !== null && !isIsoTimestamp(record.migratedAt)) pushError(errors, `${path}.migratedAt`, 'ISO', 'migratedAt 必须是 ISO 时间戳或 null')
  if (record.backupPath !== null) checkString(record.backupPath, `${path}.backupPath`, errors)
  if (record.contentVersion !== null) checkString(record.contentVersion, `${path}.contentVersion`, errors)
  checkArray(record.notices, `${path}.notices`, errors)
  if (Array.isArray(record.notices)) {
    record.notices.forEach((notice, i) => {
      const at = `${path}.notices[${i}]`
      if (!isPlainObject(notice)) return pushError(errors, at, 'TYPE', '通知必须是对象')
      checkString(notice.id, `${at}.id`, errors, { nonEmpty: true })
      checkEnum(notice.level, NOTICE_LEVELS, `${at}.level`, errors)
      checkString(notice.text, `${at}.text`, errors)
    })
  }
}

const KIND_VALIDATORS = {
  note: validateNote,
  investigation: validateInvestigation,
  prediction: validatePrediction,
  experimentRun: validateExperimentRun,
  task: validateTask,
  dialog: validateDialog,
  relationAnnotation: validateRelationAnnotation,
  view: validateView,
  meta: validateMeta,
  revision: null, // revision 由 validateRevisionList 处理
}

/**
 * 校验单条记录（结构、枚举、时间戳、可选引用闭合）。
 * ctx 可包含 buildRefContext 的集合，以及 { key }（表键）与 { allowUnknown }。
 */
export function validateRecord(kind, record, ctx = {}) {
  const errors = []
  const warnings = []
  warningsSink = warnings
  const path = ctx.path || kind
  if (kind === 'revision') {
    validateRevisionList(record, ctx, path, errors, warnings)
    return { ok: errors.length === 0, errors, warnings }
  }
  const validator = KIND_VALIDATORS[kind]
  if (!validator) {
    pushError(errors, path, 'UNKNOWN_KIND', `未知记录种类：${kind}`)
    return { ok: false, errors, warnings }
  }
  if (!isPlainObject(record)) {
    pushError(errors, path, 'TYPE', `${kind} 记录必须是对象`)
    return { ok: false, errors, warnings }
  }
  validator(record, ctx, path, errors, warnings)
  return { ok: errors.length === 0, errors, warnings }
}

/** 规范化 + 校验一步完成。 */
export function normalizeAndValidate(kind, raw, ctx = {}) {
  const normalized = normalizeRecord(kind, raw, ctx.path || kind)
  const validated = normalized.ok ? validateRecord(kind, normalized.record, ctx) : { ok: false, errors: [], warnings: [] }
  return {
    ok: normalized.ok && validated.ok,
    record: normalized.ok ? normalized.record : null,
    errors: [...normalized.errors, ...validated.errors],
    warnings: [...normalized.warnings, ...validated.warnings],
  }
}

// ────────────────────────── 空状态 ──────────────────────────

export function emptyState(overrides = {}) {
  const state = {
    schemaVersion: SCHEMA_VERSION,
    meta: {
      fromSchema: SCHEMA_VERSION,
      migratedAt: null,
      backupPath: null,
      contentVersion: null,
      notices: [],
    },
    notes: {},
    revisions: {},
    relations: {},
    investigations: {},
    predictions: {},
    experiments: {},
    tasks: {},
    dialogs: {},
    ...emptyLoopTables(),
    archive: {},
    view: { ...DEFAULT_VIEW },
    importLog: [],
  }
  if (overrides && typeof overrides === 'object') {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) continue
      state[key] = cloneJson(value)
    }
  }
  return state
}

// ────────────────────────── 全量状态校验 ──────────────────────────

const TOP_LEVEL_FIELDS = Object.freeze([
  'schemaVersion',
  'meta',
  'notes',
  'revisions',
  'relations',
  'investigations',
  'predictions',
  'experiments',
  'tasks',
  'dialogs',
  'loops',
  'interventions',
  'observations',
  'archive',
  'view',
  'importLog',
])

function validateImportLog(entries, path, errors) {
  if (!Array.isArray(entries)) {
    pushError(errors, path, 'TYPE', 'importLog 必须是数组')
    return
  }
  entries.forEach((entry, i) => {
    const at = `${path}[${i}]`
    if (!isPlainObject(entry)) return pushError(errors, at, 'TYPE', '导入记录必须是对象')
    checkString(entry.id, `${at}.id`, errors, { nonEmpty: true })
    if (!isIsoTimestamp(entry.at)) pushError(errors, `${at}.at`, 'ISO', 'at 必须是 ISO 8601 时间戳')
    checkEnum(entry.mode, IMPORT_MODES, `${at}.mode`, errors)
    if (!isPlainObject(entry.counts)) pushError(errors, `${at}.counts`, 'TYPE', 'counts 必须是对象')
    if (!isInteger(entry.conflicts) || entry.conflicts < 0) pushError(errors, `${at}.conflicts`, 'RANGE', 'conflicts 必须是 ≥0 的整数')
    checkString(entry.sourceHash, `${at}.sourceHash`, errors)
  })
}

/**
 * 全量状态校验：表结构、枚举、iso 时间戳、record.id 与表键一致、跨表引用闭合。
 * @param {object} state
 * @param {{core?: object}} [options]
 */
export function validateState(state, options = {}) {
  const errors = []
  const warnings = []
  if (!isPlainObject(state)) {
    return { ok: false, errors: [{ path: '', code: 'TYPE', message: 'state 必须是对象' }], warnings }
  }
  if (state.schemaVersion !== SCHEMA_VERSION) {
    pushError(errors, 'schemaVersion', 'SCHEMA_VERSION', `schemaVersion 必须是 ${SCHEMA_VERSION}，实际为 ${JSON.stringify(state.schemaVersion)}`)
  }
  for (const key of Object.keys(state)) {
    if (!TOP_LEVEL_FIELDS.includes(key)) pushWarning(warnings, key, 'UNKNOWN_FIELD', '未知顶层字段已忽略')
  }
  const ctx = buildRefContext({ core: options.core, store: state })
  ctx.key = undefined

  // 先做结构校验，再补跨表引用（集合已由 state 本身构建，能发现悬空引用）
  for (const table of STATE_TABLES) {
    const value = state[table]
    if (!isPlainObject(value)) {
      pushError(errors, table, 'TYPE', `${table} 必须是对象（表）`)
      continue
    }
    const kind = TABLE_KINDS[table]
    for (const [key, record] of Object.entries(value)) {
      if (kind === 'revision') {
        validateRevisionList(record, ctx, `${table}.${key}`, errors, warnings)
        continue
      }
      const itemCtx = { ...ctx, key, path: `${table}.${key}` }
      const result = validateRecord(kind, record, itemCtx)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }
  }

  // v3 新表：掌控卡 / 干预 / 观察（v2 表保留，供追溯与兼容）
  const loopResult = validateLoopTables(state, { nodeIds: ctx.nodeIds })
  errors.push(...loopResult.errors)
  warnings.push(...loopResult.warnings)

  // 表键与记录 id 一致性
  for (const table of ['notes', 'investigations', 'predictions', 'experiments', 'tasks']) {
    const value = isPlainObject(state[table]) ? state[table] : {}
    for (const [key, record] of Object.entries(value)) {
      if (isPlainObject(record) && record.id !== undefined && record.id !== key) {
        pushError(errors, `${table}.${key}.id`, 'KEY_MISMATCH', `表键 ${key} 与记录 id ${JSON.stringify(record.id)} 不一致`)
      }
    }
  }

  // 笔记与修订链
  const notes = isPlainObject(state.notes) ? state.notes : {}
  const revisions = isPlainObject(state.revisions) ? state.revisions : {}
  for (const [noteId, list] of Object.entries(revisions)) {
    if (!notes[noteId]) pushWarning(warnings, `revisions.${noteId}`, 'ORPHAN_REVISION', '修订记录对应的笔记不存在')
    if (notes[noteId] && Array.isArray(list) && list.length) {
      const last = list[list.length - 1]
      const note = notes[noteId]
      if (isPlainObject(last) && isInteger(note.revision) && last.revision !== note.revision) {
        pushWarning(warnings, `revisions.${noteId}`, 'REVISION_DRIFT', `笔记 revision=${note.revision} 与最后一条修订 revision=${last.revision} 不一致`)
      }
      if (isPlainObject(last) && isPlainObject(note) && isString(last.text) && isString(note.text) && last.text !== note.text) {
        pushWarning(warnings, `revisions.${noteId}`, 'REVISION_DRIFT', '最后一条修订正文与笔记当前正文不一致')
      }
    }
  }
  for (const noteId of Object.keys(notes)) {
    if (!revisions[noteId]) pushWarning(warnings, `revisions.${noteId}`, 'MISSING_REVISION', '笔记缺少修订记录（建议补一条当前正文）')
  }

  // 对话归属：键必须等于 subjectKey(subject)
  const dialogs = isPlainObject(state.dialogs) ? state.dialogs : {}
  for (const [key, dialog] of Object.entries(dialogs)) {
    if (!isPlainObject(dialog)) continue
    const expected = subjectKey(dialog.subject)
    if (expected && expected !== key) {
      pushError(errors, `dialogs.${key}.subject`, 'KEY_MISMATCH', `对话表键 ${key} 与 subjectKey ${expected} 不一致（归属只看发送时的 subject）`)
    }
  }

  // 研究问题与预测/实验互指（单向检查即可）
  const investigations = isPlainObject(state.investigations) ? state.investigations : {}
  const predictions = isPlainObject(state.predictions) ? state.predictions : {}
  const runs = isPlainObject(state.experiments) ? state.experiments : {}
  for (const [invId, inv] of Object.entries(investigations)) {
    if (!isPlainObject(inv)) continue
    for (const pid of Array.isArray(inv.predictionIds) ? inv.predictionIds : []) {
      if (!predictions[pid]) pushError(errors, `investigations.${invId}.predictionIds`, 'DANGLING_REF', `研究问题引用了不存在的预测：${pid}`)
    }
    for (const rid of Array.isArray(inv.experimentRunIds) ? inv.experimentRunIds : []) {
      if (!runs[rid]) pushError(errors, `investigations.${invId}.experimentRunIds`, 'DANGLING_REF', `研究问题引用了不存在的实验记录：${rid}`)
    }
  }

  // meta / view / importLog / archive
  if (!isPlainObject(state.archive)) pushError(errors, 'archive', 'TYPE', 'archive 必须是对象（表）')
  if (!isPlainObject(state.meta)) pushError(errors, 'meta', 'TYPE', 'meta 必须是对象')
  else validateMeta(state.meta, {}, 'meta', errors, warnings)
  if (!isPlainObject(state.view)) pushError(errors, 'view', 'TYPE', 'view 必须是对象')
  else {
    const result = validateRecord('view', state.view, { ...ctx, path: 'view' })
    errors.push(...result.errors)
    warnings.push(...result.warnings)
  }
  validateImportLog(state.importLog, 'importLog', errors)

  return { ok: errors.length === 0, errors, warnings }
}
