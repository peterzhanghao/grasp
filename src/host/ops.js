/**
 * 业务操作：UI 与 agent 工具共用同一份实现（契约第 4 节 ops 表）。
 * 所有写操作都经 storage.commit 的候选状态 + 校验 + 原子写；
 * 所有 read 操作返回快照副本，调用方不得依赖内部引用。
 */
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { AppError, fromLlmFailure } from './errors.js'
import { subjectKey } from './dialog.js'
import { SCHEMA_VERSION, EVIDENCE_REF_KINDS } from '../domain/schema.js'
import {
  LOOP_DEFAULTS,
  INTERVENTION_DEFAULTS,
  OBSERVATION_DEFAULTS,
  SYSTEM_TYPES,
  GAP_TYPES,
  GAP_SEVERITIES,
  MEASUREMENT_SOURCES,
  METRIC_KINDS,
  NEXT_ACTION_TYPES,
  OBSERVATION_SOURCES,
  OBSERVATION_VERDICTS,
} from '../domain/loop-schema.js'
import { runDelay, runProxy, runGreen, EXPERIMENT_MODELS } from '../domain/experiments.js'
import { nextAction as computeNextAction, allowedTransitions } from '../domain/next-step.js'
import { PACK_KIND, validatePack, applyPack } from '../domain/pack.js'
import { buildSystemText, SYSTEM_PROMPT } from './prompt.js'

const nowIso = () => new Date().toISOString()
const token = (prefix) => prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)

const NOTE_KINDS = new Set(['理解', '疑问', '证据', '反驳', '实践'])
const NOTE_SOURCES = new Set(['user', 'ai-draft', 'import'])
const VIEW_SCALES = new Set(['domain', 'subject', 'evidence'])
const VIEW_PROJECTIONS = new Set(['theory', 'history', 'practice'])

function assertString(value, name, { min = 0, max = 20000 } = {}) {
  if (typeof value !== 'string') throw new AppError('VALIDATION', `${name} 必须是字符串`)
  const text = value.trim()
  if (text.length < min) throw new AppError('VALIDATION', `${name} 不能为空`)
  if (text.length > max) throw new AppError('VALIDATION', `${name} 太长（上限 ${max} 字）`)
  return text
}

function normalizeSubject(state, core, subject, { allowInvestigation = true } = {}) {
  if (!subject || typeof subject !== 'object') throw new AppError('VALIDATION', '缺少 subject {kind,id}')
  const key = subjectKey(subject)
  if (!key) throw new AppError('VALIDATION', 'subject 不合法：kind 只能是 node/relation/investigation，且需要 id')
  if (subject.kind === 'node') {
    if (!(core.nodes || []).some((node) => node.id === subject.id)) throw new AppError('NOT_FOUND', '没有这个节点：' + subject.id)
  } else if (subject.kind === 'relation') {
    if (!(core.relations || []).some((relation) => relation.id === subject.id)) throw new AppError('NOT_FOUND', '没有这条关系：' + subject.id)
  } else if (subject.kind === 'investigation') {
    if (!allowInvestigation) throw new AppError('VALIDATION', '这个操作不接受 investigation 作为 subject')
    if (!state.investigations?.[subject.id]) throw new AppError('NOT_FOUND', '没有这个研究问题：' + subject.id)
  }
  return { kind: subject.kind, id: subject.id }
}

function ensureNoteState(state) {
  for (const table of ['notes', 'revisions', 'relations', 'investigations', 'predictions', 'experiments', 'tasks', 'dialogs']) {
    if (!state[table] || typeof state[table] !== 'object') state[table] = {}
  }
  if (!Array.isArray(state.importLog)) state.importLog = []
}

function experimentModel(id) {
  const model = EXPERIMENT_MODELS[id]
  if (!model) throw new AppError('NOT_FOUND', '没有这个实验：' + id)
  return model
}

function runExperiment(experimentId, params) {
  if (experimentId === 'delay') return runDelay({ K: params?.K, D: params?.D })
  if (experimentId === 'proxy') return runProxy({ e: params?.e })
  if (experimentId === 'green') return runGreen({ enabled: params?.enabled })
  throw new AppError('NOT_FOUND', '没有这个实验：' + experimentId)
}

function summarizeRun(experimentId, result) {
  if (experimentId === 'delay') {
    return { verdict: result.verdict, metrics: result.metrics, params: result.params, modelId: result.modelId, modelVersion: result.modelVersion }
  }
  if (experimentId === 'proxy') {
    return { verdict: result.verdict, visible: result.visible, hidden: result.hidden, params: result.params, modelId: result.modelId, modelVersion: result.modelVersion }
  }
  return {
    verdict: result.allGreen ? 'pass' : 'fail',
    allGreen: !!result.allGreen,
    cases: result.cases,
    caveat: result.caveat,
    params: result.params,
    modelId: result.modelId,
    modelVersion: result.modelVersion,
  }
}

/* ───────────── 掌控卡 v3：输入规范化与状态机（纯函数，供 ops 复用） ───────────── */

/** 掌控卡详情可切换的页面（与 schema.v3 的 view.screen 枚举一致）。 */
const LOOP_SCREENS = new Set(['home', 'wizard', 'loop', 'library', 'resources'])

/** loop.update 允许直接改的白名单字段；status/version/versions 只能通过专用 op 变更。 */
const LOOP_UPDATE_FIELDS = new Set([
  'title',
  'summary',
  'goal',
  'measurement',
  'action',
  'disturbances',
  'delays',
  'boundary',
  'hypothesis',
  'gaps',
  'principleRefs',
  'nextAction',
  'nextCheck',
  'application',
])

/**
 * 掌控卡状态机（docs/v2-design.md §2）：直接复用 T02 引擎的 allowedTransitions，
 * 合法迁移只有 draft→modeled→testing→reviewing→revised→testing；暂停仅 testing→paused，
 * 归档仅 paused→archived。状态迁移只出现在专用 op 里：intervention.create（→testing）、
 * observation.create（→reviewing）、loop.pause、loop.archive、loop.revise（→revised）。
 * loop.update 不接受 status，避免绕过校验。
 */
const INTERVENTION_ACTIVE_STATUSES = new Set(['planned', 'running'])
const INTERVENTION_FINISH_STATUSES = ['done', 'abandoned']

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function assertPlainObject(value, name) {
  if (!isPlainObject(value)) throw new AppError('VALIDATION', `${name} 必须是对象`)
  return value
}

function assertIsoTimestamp(value, name) {
  const text = assertString(value, name, { min: 20, max: 40 })
  if (!Number.isFinite(Date.parse(text))) throw new AppError('VALIDATION', `${name} 必须是 ISO 8601 时间戳`)
  return text
}

function assertStringArray(value, name, { maxItems = 20, maxLength = 2000 } = {}) {
  if (!Array.isArray(value)) throw new AppError('VALIDATION', `${name} 必须是数组`)
  if (value.length > maxItems) throw new AppError('VALIDATION', `${name} 最多 ${maxItems} 项`)
  return value.map((item, index) => assertString(item, `${name}[${index}]`, { min: 1, max: maxLength }))
}

function ensureLoopState(state) {
  for (const table of ['loops', 'interventions', 'observations']) {
    if (!isPlainObject(state[table])) state[table] = {}
  }
  if (!isPlainObject(state.view)) state.view = {}
}

function requireLoop(state, loopId) {
  const loop = state.loops?.[loopId]
  if (!loop) throw new AppError('NOT_FOUND', '没有这张掌控卡：' + loopId)
  return loop
}

function requireLoopTransition(loop, target, label) {
  const allowed = allowedTransitions(loop)
  if (!allowed.includes(target)) {
    throw new AppError(
      'CONFLICT',
      `掌控卡当前状态是 ${String(loop.status)}，不能${label}；合法目标：${allowed.length ? allowed.join('/') : '无（已归档）'}`,
      { from: loop.status, to: target, allowed },
    )
  }
}

/** 只属于这张卡的观察（「今天这一步」要用它们判断检验是否已回填）。 */
function observationsForLoop(state, loopId) {
  return Object.values(state.observations || {}).filter((observation) => observation && observation.loopId === loopId)
}

/**
 * 把 T02 规则的 nextAction 落进卡里：text 固定空串，host 侧没有翻译服务时用 fallbackText 填充，
 * 绝不把空 text 写进卡（loop-schema.validateNextAction 要求非空）。
 * dueAt 只在检验窗口相关状态下给 windowEnd（存档/暂停等状态不制造到期压力）。
 */
function buildLoopNextAction(card, observations) {
  const action = computeNextAction(card, { observations })
  const declaredText = typeof action.text === 'string' ? action.text.trim() : ''
  const fallbackText = typeof action.fallbackText === 'string' ? action.fallbackText.trim() : ''
  const text = declaredText || fallbackText
  if (!text) throw new AppError('INTERNAL', '规则引擎没有给出“今天这一步”的文案')
  return { type: action.type, text, estimateMin: action.estimateMin, dueAt: null }
}

function refreshLoopNextAction(state, loop) {
  const action = buildLoopNextAction(loop, observationsForLoop(state, loop.id))
  if ((loop.status === 'testing' || loop.status === 'modeled') && loop.nextCheck?.windowEnd) {
    action.dueAt = loop.nextCheck.windowEnd
  }
  loop.nextAction = action
  return action
}

/** 版本快照：结构化克隆当前卡，但不嵌套 versions，避免版本历史自我递归。 */
function loopSnapshot(loop) {
  const snapshot = structuredClone(loop)
  delete snapshot.versions
  return snapshot
}

function recordLoopVersion(loop, changeSummary, at) {
  const entry = { version: loop.version, at, changeSummary, snapshot: loopSnapshot(loop) }
  loop.versions = [...(loop.versions || []), entry]
  return entry
}

function normalizeGoalInput(value) {
  const base = structuredClone(LOOP_DEFAULTS.goal)
  if (value === undefined || value === null) return base
  if (typeof value === 'string') {
    base.criterion = assertString(value, 'goal', { min: 1, max: 4000 })
    return base
  }
  const raw = assertPlainObject(value, 'goal')
  if (raw.quantity !== undefined) base.quantity = assertString(raw.quantity, 'goal.quantity', { min: 0, max: 4000 })
  if (raw.criterion !== undefined) base.criterion = assertString(raw.criterion, 'goal.criterion', { min: 0, max: 4000 })
  if (raw.current !== undefined) base.current = assertString(raw.current, 'goal.current', { min: 0, max: 4000 })
  return base
}

function normalizeMeasurementInput(value) {
  const base = structuredClone(LOOP_DEFAULTS.measurement)
  if (value === undefined || value === null) return base
  if (typeof value === 'string') {
    base.how = assertString(value, 'measurement', { min: 1, max: 4000 })
    return base
  }
  const raw = assertPlainObject(value, 'measurement')
  if (raw.how !== undefined) base.how = assertString(raw.how, 'measurement.how', { min: 0, max: 4000 })
  if (raw.cadence !== undefined) base.cadence = assertString(raw.cadence, 'measurement.cadence', { min: 0, max: 2000 })
  if (raw.source !== undefined) {
    if (!MEASUREMENT_SOURCES.includes(raw.source)) throw new AppError('VALIDATION', 'measurement.source 必须是 ' + MEASUREMENT_SOURCES.join('|'))
    base.source = raw.source
  }
  if (raw.confidence !== undefined) {
    if (raw.confidence === null) base.confidence = null
    else if (typeof raw.confidence !== 'number' || raw.confidence < 0 || raw.confidence > 1) {
      throw new AppError('VALIDATION', 'measurement.confidence 只能是 0—1 的数字或 null')
    } else base.confidence = raw.confidence
  }
  return base
}

function normalizeActionInput(value) {
  const base = structuredClone(LOOP_DEFAULTS.action)
  if (value === undefined || value === null) return base
  if (typeof value === 'string') {
    base.levers = [assertString(value, 'action', { min: 1, max: 2000 })]
    return base
  }
  if (Array.isArray(value)) {
    base.levers = assertStringArray(value, 'action.levers')
    return base
  }
  const raw = assertPlainObject(value, 'action')
  if (raw.levers !== undefined) base.levers = assertStringArray(raw.levers, 'action.levers')
  if (raw.cannot !== undefined) base.cannot = assertStringArray(raw.cannot, 'action.cannot')
  return base
}

function normalizeDisturbancesInput(value) {
  if (value === undefined || value === null) return []
  const list = Array.isArray(value) ? value : [value]
  if (list.length > 20) throw new AppError('VALIDATION', 'disturbances 最多 20 项')
  return list.map((item, index) => {
    if (typeof item === 'string') return { text: assertString(item, `disturbances[${index}]`, { min: 1, max: 2000 }) }
    const raw = assertPlainObject(item, `disturbances[${index}]`)
    return { text: assertString(raw.text, `disturbances[${index}].text`, { min: 1, max: 2000 }) }
  })
}

function normalizeDelaysInput(value) {
  if (value === undefined || value === null) return []
  const list = Array.isArray(value) ? value : [value]
  if (list.length > 20) throw new AppError('VALIDATION', 'delays 最多 20 项')
  return list.map((item, index) => {
    if (typeof item === 'number') {
      if (!Number.isFinite(item) || item < 0) throw new AppError('VALIDATION', `delays[${index}] 必须是非负秒数`)
      return { from: '我的动作', to: '可观察结果', estimateSeconds: item, unknown: false }
    }
    if (typeof item === 'string') {
      // 六问里“大概多久”是自然语言时，按“延迟未知”记录，不假装成精确秒数。
      assertString(item, `delays[${index}]`, { min: 1, max: 2000 })
      return { from: '我的动作', to: '可观察结果', estimateSeconds: null, unknown: true }
    }
    const raw = assertPlainObject(item, `delays[${index}]`)
    const from = raw.from === undefined ? '我的动作' : assertString(raw.from, `delays[${index}].from`, { min: 0, max: 500 })
    const to = raw.to === undefined ? '可观察结果' : assertString(raw.to, `delays[${index}].to`, { min: 0, max: 500 })
    const estimateSeconds = raw.estimateSeconds === undefined || raw.estimateSeconds === null ? null : raw.estimateSeconds
    if (estimateSeconds !== null && (typeof estimateSeconds !== 'number' || !Number.isFinite(estimateSeconds) || estimateSeconds < 0)) {
      throw new AppError('VALIDATION', `delays[${index}].estimateSeconds 必须是非负秒数或 null`)
    }
    const unknown = raw.unknown === undefined ? estimateSeconds === null : raw.unknown
    if (typeof unknown !== 'boolean') throw new AppError('VALIDATION', `delays[${index}].unknown 必须是布尔值`)
    if (!unknown && estimateSeconds === null) throw new AppError('VALIDATION', `delays[${index}] 未知延迟必须写 unknown:true`)
    return { from, to, estimateSeconds, unknown }
  })
}

function normalizeBoundaryInput(value) {
  const base = structuredClone(LOOP_DEFAULTS.boundary)
  if (value === undefined || value === null) return base
  if (typeof value === 'string') {
    base.nonGoals = [assertString(value, 'boundary', { min: 1, max: 2000 })]
    return base
  }
  if (Array.isArray(value)) {
    base.nonGoals = assertStringArray(value, 'boundary.nonGoals')
    return base
  }
  const raw = assertPlainObject(value, 'boundary')
  if (raw.nonGoals !== undefined) base.nonGoals = assertStringArray(raw.nonGoals, 'boundary.nonGoals')
  if (raw.notes !== undefined) base.notes = assertString(raw.notes, 'boundary.notes', { min: 0, max: 4000 })
  return base
}

function normalizeHypothesisInput(value) {
  const base = structuredClone(LOOP_DEFAULTS.hypothesis)
  if (value === undefined || value === null) return base
  if (typeof value === 'string') {
    base.claim = assertString(value, 'hypothesis', { min: 1, max: 4000 })
    return base
  }
  const raw = assertPlainObject(value, 'hypothesis')
  if (raw.claim !== undefined) base.claim = assertString(raw.claim, 'hypothesis.claim', { min: 0, max: 4000 })
  if (raw.counter !== undefined) base.counter = assertString(raw.counter, 'hypothesis.counter', { min: 0, max: 4000 })
  if (raw.falsifier !== undefined) base.falsifier = assertString(raw.falsifier, 'hypothesis.falsifier', { min: 0, max: 4000 })
  return base
}

function normalizeGapsInput(value) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new AppError('VALIDATION', 'gaps 必须是数组')
  if (value.length > 20) throw new AppError('VALIDATION', 'gaps 最多 20 项')
  return value.map((item, index) => {
    const raw = assertPlainObject(item, `gaps[${index}]`)
    if (!GAP_TYPES.includes(raw.type)) throw new AppError('VALIDATION', `gaps[${index}].type 必须是 ${GAP_TYPES.join('|')} 之一`)
    const severity = raw.severity === undefined ? 'info' : raw.severity
    if (!GAP_SEVERITIES.includes(severity)) throw new AppError('VALIDATION', `gaps[${index}].severity 必须是 ${GAP_SEVERITIES.join('|')} 之一`)
    const record = { type: raw.type, severity }
    if (raw.evidenceText !== undefined) record.evidenceText = assertString(raw.evidenceText, `gaps[${index}].evidenceText`, { min: 0, max: 2000 })
    if (raw.suggestedPrincipleRefs !== undefined) {
      record.suggestedPrincipleRefs = assertStringArray(raw.suggestedPrincipleRefs, `gaps[${index}].suggestedPrincipleRefs`, { maxItems: 3, maxLength: 200 })
    }
    return record
  })
}

function normalizePrincipleRefsInput(value, core) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new AppError('VALIDATION', 'principleRefs 必须是数组')
  if (value.length > 3) throw new AppError('VALIDATION', 'principleRefs 最多 3 张原理卡')
  return value.map((item, index) => {
    const raw = assertPlainObject(item, `principleRefs[${index}]`)
    const nodeId = assertString(raw.nodeId, `principleRefs[${index}].nodeId`, { min: 1, max: 200 })
    if (!(core?.nodes || []).some((node) => node.id === nodeId)) {
      throw new AppError('NOT_FOUND', '原理卡引用了不存在的节点：' + nodeId)
    }
    return {
      nodeId,
      userTranslation: raw.userTranslation === undefined ? '' : assertString(raw.userTranslation, `principleRefs[${index}].userTranslation`, { min: 0, max: 2000 }),
      whyHere: raw.whyHere === undefined ? '' : assertString(raw.whyHere, `principleRefs[${index}].whyHere`, { min: 0, max: 2000 }),
    }
  })
}

function normalizeNextActionInput(value) {
  if (value === null) return null
  const raw = assertPlainObject(value, 'nextAction')
  if (!NEXT_ACTION_TYPES.includes(raw.type)) throw new AppError('VALIDATION', 'nextAction.type 必须是 ' + NEXT_ACTION_TYPES.join('|') + ' 之一')
  const declaredText = typeof raw.text === 'string' ? raw.text.trim() : ''
  const fallbackText = typeof raw.fallbackText === 'string' ? raw.fallbackText.trim() : ''
  // T02 规则的 text 固定是空串；调用方可以只给 fallbackText，由 host 填充成合法非空 text。
  if (!declaredText && !fallbackText) throw new AppError('VALIDATION', 'nextAction.text 不能为空（可传 fallbackText 兜底；ctaKey 文案在 UI 侧翻译）')
  const text = assertString(declaredText || fallbackText, 'nextAction.text', { min: 1, max: 2000 })
  const estimateMin = raw.estimateMin === undefined ? 5 : raw.estimateMin
  if (!Number.isInteger(estimateMin) || estimateMin < 1) throw new AppError('VALIDATION', 'nextAction.estimateMin 必须是 ≥1 的整数')
  const dueAt = raw.dueAt === undefined || raw.dueAt === null ? null : assertIsoTimestamp(raw.dueAt, 'nextAction.dueAt')
  return { type: raw.type, text, estimateMin, dueAt }
}

function normalizeNextCheckInput(value, state) {
  if (value === null) return null
  const raw = assertPlainObject(value, 'nextCheck')
  const criterion = assertString(raw.criterion, 'nextCheck.criterion', { min: 1, max: 2000 })
  const predicted = assertString(raw.predicted, 'nextCheck.predicted', { min: 1, max: 2000 })
  const windowStart = assertIsoTimestamp(raw.windowStart, 'nextCheck.windowStart')
  const windowEnd = assertIsoTimestamp(raw.windowEnd, 'nextCheck.windowEnd')
  if (Date.parse(windowEnd) < Date.parse(windowStart)) throw new AppError('VALIDATION', 'nextCheck.windowEnd 不能早于 windowStart')
  let interventionId = raw.interventionId === undefined ? null : raw.interventionId
  if (interventionId !== null) {
    if (typeof interventionId !== 'string' || !state.interventions?.[interventionId]) {
      throw new AppError('NOT_FOUND', '没有这次干预：' + String(interventionId))
    }
  }
  return { criterion, predicted, windowStart, windowEnd, interventionId }
}

function normalizeApplicationInput(value, state) {
  const base = structuredClone(LOOP_DEFAULTS.application)
  if (value === undefined || value === null) return base
  const raw = assertPlainObject(value, 'application')
  if (raw.acceptance !== undefined) base.acceptance = assertStringArray(raw.acceptance, 'application.acceptance', { maxItems: 20 })
  if (raw.stopConditions !== undefined) base.stopConditions = assertStringArray(raw.stopConditions, 'application.stopConditions', { maxItems: 20 })
  if (raw.checkpoints !== undefined) base.checkpoints = assertStringArray(raw.checkpoints, 'application.checkpoints', { maxItems: 20 })
  if (raw.taskIds !== undefined) {
    base.taskIds = assertStringArray(raw.taskIds, 'application.taskIds', { maxItems: 20, maxLength: 200 })
    for (const taskId of base.taskIds) {
      if (!state.tasks?.[taskId]) throw new AppError('NOT_FOUND', '关联任务不存在：' + taskId)
    }
  }
  return base
}

function normalizeMetricInput(value) {
  const base = structuredClone(OBSERVATION_DEFAULTS.metric)
  if (value === undefined || value === null) return base
  const raw = assertPlainObject(value, 'metric')
  const kind = raw.kind === undefined ? 'text' : raw.kind
  if (!METRIC_KINDS.includes(kind)) throw new AppError('VALIDATION', 'metric.kind 必须是 ' + METRIC_KINDS.join('|') + ' 之一')
  let metricValue
  let unit
  if (kind === 'text') {
    metricValue = raw.value === undefined ? '' : assertString(raw.value, 'metric.value', { min: 0, max: 4000 })
    unit = raw.unit === undefined ? '' : assertString(raw.unit, 'metric.unit', { min: 0, max: 100 })
  } else {
    metricValue = raw.value
    if (typeof metricValue !== 'number' || !Number.isFinite(metricValue)) {
      throw new AppError('VALIDATION', `metric.kind=${kind} 时 metric.value 必须是数字`)
    }
    unit = raw.unit === undefined ? '' : assertString(raw.unit, 'metric.unit', { min: 0, max: 100 })
  }
  return { kind, value: metricValue, unit }
}

function normalizeEvidenceRefsInput(value, state) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new AppError('VALIDATION', 'evidenceRefs 必须是数组')
  if (value.length > 20) throw new AppError('VALIDATION', 'evidenceRefs 最多 20 项')
  return value.map((item, index) => {
    const raw = assertPlainObject(item, `evidenceRefs[${index}]`)
    if (!EVIDENCE_REF_KINDS.includes(raw.kind)) throw new AppError('VALIDATION', `evidenceRefs[${index}].kind 必须是 ${EVIDENCE_REF_KINDS.join('|')} 之一`)
    const id = assertString(raw.id, `evidenceRefs[${index}].id`, { min: 1, max: 200 })
    const exists =
      raw.kind === 'note' ? state.notes?.[id] : raw.kind === 'experiment' ? state.experiments?.[id] : state.predictions?.[id]
    if (!exists) throw new AppError('NOT_FOUND', `证据引用不存在：${raw.kind}/${id}`)
    return { kind: raw.kind, id }
  })
}

function normalizeNoteIdsInput(value, state) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new AppError('VALIDATION', 'noteIds 必须是数组')
  if (value.length > 20) throw new AppError('VALIDATION', 'noteIds 最多 20 项')
  return value.map((item, index) => {
    const noteId = assertString(item, `noteIds[${index}]`, { min: 1, max: 200 })
    if (!state.notes?.[noteId]) throw new AppError('NOT_FOUND', '关联笔记不存在：' + noteId)
    return noteId
  })
}

/** 把 loop.update / loop.revise 的入参整理成白名单字段表；出现未知字段直接拒绝。 */
function loopPatchFromPayload(payload, { extraFields = [] } = {}) {
  const extra = new Set(extraFields)
  const fields = {}
  const accept = (key, value) => {
    if (!LOOP_UPDATE_FIELDS.has(key) && !extra.has(key)) {
      throw new AppError('VALIDATION', `loop.update 不接受字段：${key}（状态迁移请用 loop.pause / loop.archive / loop.revise）`)
    }
    fields[key] = value
  }
  if (payload.patch !== undefined) {
    const patch = assertPlainObject(payload.patch, 'patch')
    for (const [key, value] of Object.entries(patch)) accept(key, value)
  }
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'id' || key === 'patch') continue
    accept(key, value)
  }
  return fields
}

function applyLoopField(state, core, loop, field, value) {
  switch (field) {
    case 'title':
      loop.title = assertString(value, 'title', { min: 1, max: 200 })
      break
    case 'summary':
      loop.summary = assertString(value, 'summary', { min: 0, max: 4000 })
      break
    case 'goal':
      loop.goal = normalizeGoalInput(value)
      break
    case 'measurement':
      loop.measurement = normalizeMeasurementInput(value)
      break
    case 'action':
      loop.action = normalizeActionInput(value)
      break
    case 'disturbances':
      loop.disturbances = normalizeDisturbancesInput(value)
      break
    case 'delays':
      loop.delays = normalizeDelaysInput(value)
      break
    case 'boundary':
      loop.boundary = normalizeBoundaryInput(value)
      break
    case 'hypothesis':
      loop.hypothesis = normalizeHypothesisInput(value)
      break
    case 'gaps':
      loop.gaps = normalizeGapsInput(value)
      break
    case 'principleRefs':
      loop.principleRefs = normalizePrincipleRefsInput(value, core)
      break
    case 'nextAction':
      loop.nextAction = normalizeNextActionInput(value)
      break
    case 'nextCheck':
      loop.nextCheck = normalizeNextCheckInput(value, state)
      break
    case 'application':
      loop.application = normalizeApplicationInput(value, state)
      break
    default:
      throw new AppError('VALIDATION', '不支持更新的字段：' + field)
  }
}

function defaultLoopTitle(loop) {
  const candidate = loop.goal?.criterion || loop.goal?.quantity || loop.hypothesis?.claim || ''
  const text = String(candidate).trim()
  return text ? text.slice(0, 60) : '未命名掌控卡'
}

export function createOps({ storage, dialog, resolveModel, getLlm, logger }) {
  const logWarn = (message, error) => {
    try {
      logger?.warn?.(message + (error ? '：' + String((error && error.message) || error) : ''))
    } catch {
      /* ignore */
    }
  }

  async function snapshotForRead() {
    const snap = await storage.ensure()
    if (snap.fatal) throw new AppError('READ_ONLY', snap.fatal.message, snap.fatal)
    return snap
  }

  async function commit(op, build) {
    const { snapshot, wroteAt } = await storage.commit(build, { op })
    return { snapshot, wroteAt }
  }

  /* ───────────── 笔记 ───────────── */

  async function noteSave(payload, context) {
    let saved = null
    const { snapshot } = await commit('note.save', (state, meta) => {
      ensureNoteState(state)
      const subject = normalizeSubject(state, meta.core, payload.subject, { allowInvestigation: true })
      const kind = NOTE_KINDS.has(payload.kind) ? payload.kind : '理解'
      const text = assertString(payload.text, '笔记正文', { min: 1, max: 20000 })
      const authorSource = NOTE_SOURCES.has(payload.authorSource) ? payload.authorSource : context.caller === 'agent' ? 'ai-draft' : 'user'
      const savedBy = payload.savedBy === 'agent' || payload.savedBy === 'ui' ? payload.savedBy : context.caller === 'agent' ? 'agent' : 'ui'
      const existing = payload.noteId ? state.notes[payload.noteId] : null
      if (payload.noteId && !existing) throw new AppError('NOT_FOUND', '没有这条笔记：' + payload.noteId)
      const revision = existing ? (existing.revision || 1) + 1 : 1
      const id = existing ? existing.id : payload.noteId || token('n')
      const record = {
        id,
        subject,
        kind,
        text,
        status: 'active',
        authorSource,
        savedBy,
        adopted: typeof payload.adopted === 'boolean' ? payload.adopted : authorSource === 'user' ? null : existing?.adopted ?? null,
        legacyOriginUncertain: existing?.legacyOriginUncertain ?? false,
        encodingSuspected: existing?.encodingSuspected ?? false,
        parentRevision: existing ? existing.revision || 1 : (payload.parentRevision ?? null),
        createdAt: existing ? existing.createdAt : nowIso(),
        updatedAt: nowIso(),
        revision,
      }
      state.notes[id] = record
      const revisions = state.revisions[id] || []
      revisions.push({ revision, text, at: record.updatedAt, savedBy })
      state.revisions[id] = revisions
      saved = structuredClone(record)
    })
    return { ok: true, note: saved, wroteAt: snapshot.lastWrite?.at || null }
  }

  async function noteArchive(payload) {
    const noteId = assertString(payload.noteId, 'noteId', { min: 1, max: 200 })
    const { snapshot } = await commit('note.archive', (state) => {
      ensureNoteState(state)
      const note = state.notes[noteId]
      if (!note) throw new AppError('NOT_FOUND', '没有这条笔记：' + noteId)
      note.status = note.status === 'active' ? 'archived' : 'active'
      note.updatedAt = nowIso()
    })
    return { ok: true, note: snapshot.store.notes[noteId] }
  }

  async function noteDelete(payload) {
    const noteId = assertString(payload.noteId, 'noteId', { min: 1, max: 200 })
    const { snapshot } = await commit('note.delete', (state) => {
      ensureNoteState(state)
      if (!state.notes[noteId]) throw new AppError('NOT_FOUND', '没有这条笔记：' + noteId)
      delete state.notes[noteId]
      delete state.revisions[noteId]
      for (const relation of Object.values(state.relations)) {
        if (!relation) continue
        relation.evidenceNoteIds = (relation.evidenceNoteIds || []).filter((id) => id !== noteId)
      }
    })
    return { ok: true, notes: snapshot.store.notes }
  }

  /* ───────────── 关系批注 ───────────── */

  async function relationAnnotate(payload) {
    const edgeId = assertString(payload.edgeId, 'edgeId', { min: 1, max: 200 })
    const { snapshot, wroteAt } = await commit('relation.annotate', (state, meta) => {
      ensureNoteState(state)
      const relation = (meta.core.relations || []).find((item) => item.id === edgeId)
      if (!relation) throw new AppError('NOT_FOUND', '没有这条关系：' + edgeId)
      const current = state.relations[edgeId] || {
        edgeId,
        annotation: '',
        status: 'open',
        evidenceNoteIds: [],
        version: 1,
        updatedAt: nowIso(),
      }
      if (payload.annotation !== undefined) current.annotation = assertString(payload.annotation, '个人批注', { min: 0, max: 20000 })
      if (payload.status !== undefined) {
        if (!['open', 'supported', 'challenged'].includes(payload.status)) throw new AppError('VALIDATION', '关系状态不合法')
        current.status = payload.status
      }
      if (payload.evidenceNoteIds !== undefined) {
        if (!Array.isArray(payload.evidenceNoteIds)) throw new AppError('VALIDATION', 'evidenceNoteIds 必须是数组')
        for (const id of payload.evidenceNoteIds) {
          if (!state.notes[id]) throw new AppError('NOT_FOUND', '证据笔记不存在：' + id)
        }
        current.evidenceNoteIds = payload.evidenceNoteIds.map(String)
      }
      current.version = (current.version || 1) + 1
      current.updatedAt = nowIso()
      state.relations[edgeId] = current
    })
    return { ok: true, relation: snapshot.store.relations[edgeId], wroteAt }
  }

  /* ───────────── 研究问题 / 预测 ───────────── */

  async function investigationSave(payload) {
    let savedId = null
    const { snapshot } = await commit('investigation.save', (state, meta) => {
      ensureNoteState(state)
      const subject = normalizeSubject(state, meta.core, payload.subject, { allowInvestigation: false })
      const id = payload.id || token('inv')
      const existing = state.investigations[id]
      if (payload.id && !existing) throw new AppError('NOT_FOUND', '没有这个研究问题：' + payload.id)
      const record = {
        id,
        subject,
        title: payload.title !== undefined ? assertString(payload.title, '标题', { min: 0, max: 200 }) : existing?.title || '',
        claim: payload.claim !== undefined ? assertString(payload.claim, '当前主张', { min: 0, max: 4000 }) : existing?.claim || '',
        counter: payload.counter !== undefined ? assertString(payload.counter, '相反解释', { min: 0, max: 4000 }) : existing?.counter || '',
        nextTest: payload.nextTest !== undefined ? assertString(payload.nextTest, '下一项检验', { min: 0, max: 1000 }) : existing?.nextTest || '',
        status: existing?.status || 'open',
        predictionIds: existing?.predictionIds || [],
        experimentRunIds: existing?.experimentRunIds || [],
        dialogSubjectKey: `${subject.kind}:${subject.id}`,
        createdAt: existing?.createdAt || nowIso(),
        updatedAt: nowIso(),
      }
      state.investigations[id] = record
      savedId = id
    })
    return { ok: true, investigation: snapshot.store.investigations[savedId] }
  }

  async function investigationResolve(payload) {
    const id = assertString(payload.id, 'id', { min: 1, max: 200 })
    if (!['open', 'testing', 'supported', 'revised', 'inconclusive'].includes(payload.status)) {
      throw new AppError('VALIDATION', '研究问题状态不合法')
    }
    const { snapshot } = await commit('investigation.resolve', (state) => {
      ensureNoteState(state)
      const investigation = state.investigations[id]
      if (!investigation) throw new AppError('NOT_FOUND', '没有这个研究问题：' + id)
      investigation.status = payload.status
      investigation.updatedAt = nowIso()
    })
    return { ok: true, investigation: snapshot.store.investigations[id] }
  }

  async function predictionSave(payload) {
    let savedId = null
    const { snapshot } = await commit('prediction.save', (state, meta) => {
      ensureNoteState(state)
      const subject = normalizeSubject(state, meta.core, payload.subject, { allowInvestigation: true })
      const text = assertString(payload.text, '预测', { min: 1, max: 2000 })
      const resolveBy = payload.resolveBy !== undefined ? assertString(payload.resolveBy, '判定条件', { min: 0, max: 1000 }) : ''
      const id = token('p')
      const record = {
        id,
        investigationId: payload.investigationId || null,
        subject,
        text,
        resolveBy,
        status: 'open',
        resolvedAt: null,
        resolvedByRunId: null,
        resolutionNote: null,
        legacy: false,
        at: nowIso(),
      }
      if (record.investigationId && !state.investigations[record.investigationId]) {
        throw new AppError('NOT_FOUND', '没有这个研究问题：' + record.investigationId)
      }
      state.predictions[id] = record
      if (record.investigationId) {
        const investigation = state.investigations[record.investigationId]
        investigation.predictionIds = [...(investigation.predictionIds || []), id]
        investigation.updatedAt = nowIso()
      }
      savedId = id
    })
    return { ok: true, prediction: snapshot.store.predictions[savedId] }
  }

  async function predictionResolve(payload) {
    const id = assertString(payload.id, 'id', { min: 1, max: 200 })
    if (!['open', 'supported', 'refuted', 'inconclusive'].includes(payload.status)) {
      throw new AppError('VALIDATION', '预测状态只能是 open/supported/refuted/inconclusive')
    }
    const { snapshot } = await commit('prediction.resolve', (state) => {
      ensureNoteState(state)
      const prediction = state.predictions[id]
      if (!prediction) throw new AppError('NOT_FOUND', '没有这个预测：' + id)
      if (payload.runId && !state.experiments[payload.runId]) throw new AppError('NOT_FOUND', '没有这条实验记录：' + payload.runId)
      prediction.status = payload.status
      prediction.resolvedAt = nowIso()
      prediction.resolvedByRunId = payload.runId || null
      prediction.resolutionNote = payload.note !== undefined ? assertString(payload.note, '说明', { min: 0, max: 2000 }) : null
    })
    return { ok: true, prediction: snapshot.store.predictions[id] }
  }

  /* ───────────── 实验 ───────────── */

  async function experimentRun(payload) {
    const experimentId = payload.experimentId
    const model = experimentModel(experimentId)
    const result = runExperiment(experimentId, payload.params || {})
    let subject = null
    let runId = null
    const { snapshot } = await commit('experiment.run', (state, meta) => {
      ensureNoteState(state)
      if (payload.subject) subject = normalizeSubject(state, meta.core, payload.subject, { allowInvestigation: true })
      if (payload.predictionId && !state.predictions[payload.predictionId]) throw new AppError('NOT_FOUND', '没有这个预测')
      if (payload.investigationId && !state.investigations[payload.investigationId]) {
        throw new AppError('NOT_FOUND', '没有这个研究问题：' + payload.investigationId)
      }
      const id = token('e')
      const summary = summarizeRun(experimentId, result)
      const run = {
        id,
        experimentId,
        modelId: model.id,
        modelVersion: model.version,
        params: result.params,
        initial: experimentId === 'delay' ? { y: result.initial } : {},
        prediction: typeof payload.prediction === 'string' ? payload.prediction.slice(0, 2000) : '',
        observation: summary,
        criterion: String(result.criterion || result.caveat || '按返回的判据比较预测与观察；一次仿真不构成稳定性证明'),
        verdict: summary.verdict,
        subject,
        investigationId: payload.investigationId || null,
        legacy: false,
        at: nowIso(),
      }
      state.experiments[id] = run
      if (payload.investigationId) {
        const investigation = state.investigations[payload.investigationId]
        investigation.experimentRunIds = [...(investigation.experimentRunIds || []), id]
        investigation.updatedAt = nowIso()
      }
      runId = id
    })
    return { ok: true, run: snapshot.store.experiments[runId], result }
  }

  async function experimentList(payload) {
    const snap = await snapshotForRead()
    let runs = Object.values(snap.store.experiments || {})
    if (payload?.subject) {
      const subject = normalizeSubject(snap.store, snap.core, payload.subject, { allowInvestigation: true })
      runs = runs.filter((run) => run.subject && run.subject.kind === subject.kind && run.subject.id === subject.id)
    }
    runs.sort((a, b) => String(b.at).localeCompare(String(a.at)))
    return { ok: true, runs }
  }

  /* ───────────── 任务草案 ───────────── */

  async function completeOnce({ systemText, messages, timeoutMs = 120000 }) {
    const info = await resolveModel()
    const llm = getLlm()
    if (!llm) throw new AppError('LLM_UNAVAILABLE', '宿主没有加载 llm 服务')
    if (!info.available || !info.provider || !info.model) {
      throw new AppError('LLM_UNAVAILABLE', info.reason || '宿主没有配置可用的默认模型')
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    let text = ''
    let finishChunk = null
    try {
      for await (const chunk of llm.stream({
        provider: info.provider,
        model: info.model,
        reasoningEffort: info.reasoningEffort ?? undefined,
        messages: [{ role: 'system', content: [{ type: 'text', text: systemText }] }, ...messages],
        signal: controller.signal,
      })) {
        if (!chunk) continue
        if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
        else if (chunk.type === 'finish') {
          finishChunk = chunk
          break
        }
      }
    } finally {
      clearTimeout(timeout)
    }
    if (finishChunk && finishChunk.reason === 'error') {
      throw fromLlmFailure(finishChunk.failure)
    }
    if (controller.signal.aborted && !finishChunk) throw new AppError('LLM_UNAVAILABLE', '模型调用超时或被取消')
    return { text, model: { provider: info.provider, model: info.model, reasoningEffort: info.reasoningEffort ?? null }, usage: finishChunk?.usage || null, finishReason: finishChunk?.reason || null }
  }

  function parseDraftJson(text) {
    const raw = String(text || '').trim()
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try {
      return JSON.parse(raw.slice(start, end + 1))
    } catch {
      return null
    }
  }

  async function taskDraft(payload, context) {
    const requestText = assertString(payload.requestText, '真实期望行为', { min: 4, max: 4000 })
    const snap = await snapshotForRead()
    const subject = payload.subject ? normalizeSubject(snap.store, snap.core, payload.subject, { allowInvestigation: true }) : null
    const systemText = [
      SYSTEM_PROMPT,
      '',
      '本次任务：把用户"要改变的行为"整理成一份可编辑的编程任务草案。',
      '只输出严格 JSON（不要 Markdown 代码块、不要解释），结构如下：',
      '{',
      '  "title": "一句话标题",',
      '  "goal": "可判定的期望行为（能被观测、能失败）",',
      '  "acceptance": [{"text": "验收条件", "evidence": "什么证据算够"}],',
      '  "boundary": ["非目标或不允许发生的行为"],',
      '  "unknowns": [{"question": "需要用户回答的问题"}],',
      '  "conceptIds": ["与任务相关的节点或关系 id"]',
      '}',
      '要求：acceptance 至少 1 条且每条都有可观测证据；boundary 至少 2 条；unknowns 至少 2 条，用问题而不是空白字段；',
      'conceptIds 只能取下面上下文里出现过的 id，不确定就留空。不要把历史类比当成机制保证。',
      subject ? '\n' + buildSystemText({ core: snap.core, state: snap.store, subject, investigationId: payload.investigationId || null }) : '',
    ].join('\n')
    const evidence = Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs.slice(0, 8) : []
    const userBlocks = ['我要改变的行为：' + requestText]
    if (evidence.length) userBlocks.push('可引用的证据：' + JSON.stringify(evidence))
    const result = await completeOnce({
      systemText,
      messages: [{ role: 'user', content: [{ type: 'text', text: userBlocks.join('\n') }] }],
    })
    const parsed = parseDraftJson(result.text)
    if (!parsed || typeof parsed !== 'object') {
      throw new AppError('LLM_OUTPUT', '模型没有返回可解析的 JSON 草案，可以重试，或直接用下面的原文手工编辑', { raw: String(result.text || '').slice(0, 4000) })
    }
    const nodeIds = new Set((snap.core.nodes || []).map((node) => node.id))
    const conceptIds = (Array.isArray(parsed.conceptIds) ? parsed.conceptIds : [])
      .filter((id) => typeof id === 'string' && nodeIds.has(id))
      .slice(0, 8)
    const draft = {
      title: typeof parsed.title === 'string' ? parsed.title.slice(0, 200) : requestText.slice(0, 40),
      request: requestText,
      goal: typeof parsed.goal === 'string' ? parsed.goal.slice(0, 2000) : '',
      acceptance: (Array.isArray(parsed.acceptance) ? parsed.acceptance : [])
        .map((item) => (typeof item === 'string' ? { text: item, evidence: '' } : { text: String(item?.text || ''), evidence: String(item?.evidence || '') }))
        .filter((item) => item.text)
        .slice(0, 8),
      boundary: (Array.isArray(parsed.boundary) ? parsed.boundary : []).map((item) => String(item)).filter(Boolean).slice(0, 8),
      unknowns: (Array.isArray(parsed.unknowns) ? parsed.unknowns : [])
        .map((item) => ({ question: typeof item === 'string' ? item : String(item?.question || ''), answer: null }))
        .filter((item) => item.question)
        .slice(0, 8),
      conceptIds,
      evidenceRefs: evidence,
    }
    if (!draft.acceptance.length || draft.boundary.length < 1) {
      throw new AppError('LLM_OUTPUT', '模型草案缺少数码可编辑的目标/验收/边界字段', { raw: String(result.text || '').slice(0, 4000), draft })
    }
    return { ok: true, draft, model: result.model, usage: result.usage }
  }

  async function taskSave(payload) {
    let savedId = null
    const request = assertString(payload.request, '真实期望行为', { min: 4, max: 4000 })
    const title = payload.title !== undefined ? assertString(payload.title, '标题', { min: 0, max: 200 }) : request.slice(0, 40)
    const goal = payload.goal !== undefined ? assertString(payload.goal, '目标', { min: 0, max: 4000 }) : ''
    const acceptance = Array.isArray(payload.acceptance) ? payload.acceptance.map((item) => ({ text: assertString(item?.text, '验收条件', { min: 1, max: 2000 }), evidence: String(item?.evidence || '') })) : []
    const boundary = Array.isArray(payload.boundary) ? payload.boundary.map((item) => assertString(item, '边界', { min: 1, max: 2000 })) : []
    const unknowns = Array.isArray(payload.unknowns)
      ? payload.unknowns.map((item) => ({ question: assertString(item?.question, '未知项问题', { min: 1, max: 1000 }), answer: item?.answer == null ? null : String(item.answer) }))
      : []
    const conceptIds = Array.isArray(payload.conceptIds) ? payload.conceptIds.map(String) : []
    const evidenceRefs = Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs.slice(0, 20) : []
    const normalizedModel = {
      provider: String(payload.model?.provider || ''),
      model: String(payload.model?.model || ''),
      reasoningEffort: typeof payload.model?.reasoningEffort === 'string' ? payload.model.reasoningEffort : null,
    }
    const { snapshot } = await commit('task.save', (state, meta) => {
      ensureNoteState(state)
      for (const id of conceptIds) {
        const isNode = (meta.core.nodes || []).some((node) => node.id === id)
        if (!isNode) throw new AppError('NOT_FOUND', '概念引用不存在（只接受节点 id）：' + id)
      }
      for (const ref of evidenceRefs) {
        const okKind = ref && (ref.kind === 'note' || ref.kind === 'experiment' || ref.kind === 'prediction')
        if (!okKind) throw new AppError('VALIDATION', '证据引用必须是 {kind:"note"|"experiment"|"prediction", id}')
        const exists =
          (ref.kind === 'note' && state.notes[ref.id]) ||
          (ref.kind === 'experiment' && state.experiments[ref.id]) ||
          (ref.kind === 'prediction' && state.predictions[ref.id])
        if (!exists) throw new AppError('NOT_FOUND', '证据引用不存在：' + ref.kind + '/' + ref.id)
      }
      const existing = payload.id ? state.tasks[payload.id] : null
      if (payload.id && !existing) throw new AppError('NOT_FOUND', '没有这个任务草案：' + payload.id)
      const revision = existing ? (existing.revision || 1) + 1 : 1
      const id = existing ? existing.id : token('t')
      const record = {
        id,
        title,
        request,
        goal,
        acceptance,
        boundary,
        unknowns,
        conceptIds,
        evidenceRefs,
        status: payload.status && ['draft', 'saved', 'archived'].includes(payload.status) ? payload.status : existing?.status || 'saved',
        revision,
        revisions: existing?.revisions ? [...existing.revisions] : [],
        model: existing?.model || normalizedModel,
        createdAt: existing?.createdAt || nowIso(),
        updatedAt: nowIso(),
        legacy: existing?.legacy || false,
      }
      record.revisions.push({
        revision,
        at: record.updatedAt,
        snapshot: { title, goal, acceptance, boundary, unknowns, conceptIds, evidenceRefs },
        model: record.model,
      })
      state.tasks[id] = record
      savedId = id
    })
    return { ok: true, task: snapshot.store.tasks[savedId] }
  }

  async function taskArchive(payload) {
    const id = assertString(payload.id, 'id', { min: 1, max: 200 })
    if (!['draft', 'saved', 'archived'].includes(payload.status)) throw new AppError('VALIDATION', '任务状态不合法')
    const { snapshot } = await commit('task.archive', (state) => {
      ensureNoteState(state)
      const task = state.tasks[id]
      if (!task) throw new AppError('NOT_FOUND', '没有这个任务草案：' + id)
      task.status = payload.status
      task.updatedAt = nowIso()
    })
    return { ok: true, task: snapshot.store.tasks[id] }
  }

  /* ───────────── 视图状态 ───────────── */

  async function viewSave(payload) {
    const { snapshot } = await commit('view.save', (state, meta) => {
      ensureNoteState(state)
      if (!state.view) state.view = {}
      const view = state.view
      if (payload.scale !== undefined) {
        if (!VIEW_SCALES.has(payload.scale)) throw new AppError('VALIDATION', 'scale 不合法')
        view.scale = payload.scale
      }
      if (payload.projection !== undefined) {
        if (!VIEW_PROJECTIONS.has(payload.projection)) throw new AppError('VALIDATION', 'projection 不合法')
        view.projection = payload.projection
      }
      if (payload.selectedNodeId !== undefined) {
        if (payload.selectedNodeId !== null && !(meta.core.nodes || []).some((node) => node.id === payload.selectedNodeId)) {
          throw new AppError('NOT_FOUND', '没有这个节点：' + payload.selectedNodeId)
        }
        view.selectedNodeId = payload.selectedNodeId
        if (payload.selectedNodeId) view.selectedRelationId = null
      }
      if (payload.selectedRelationId !== undefined) {
        if (payload.selectedRelationId !== null && !(meta.core.relations || []).some((relation) => relation.id === payload.selectedRelationId)) {
          throw new AppError('NOT_FOUND', '没有这条关系：' + payload.selectedRelationId)
        }
        view.selectedRelationId = payload.selectedRelationId
      }
      if (payload.activeInvestigationId !== undefined) {
        if (payload.activeInvestigationId !== null && !state.investigations[payload.activeInvestigationId]) {
          throw new AppError('NOT_FOUND', '没有这个研究问题：' + payload.activeInvestigationId)
        }
        view.activeInvestigationId = payload.activeInvestigationId
      }
      if (payload.directoryOpen !== undefined) view.directoryOpen = !!payload.directoryOpen
      if (payload.rightOpen !== undefined) view.rightOpen = !!payload.rightOpen
    })
    return { ok: true, view: snapshot.store.view }
  }

  /* ───────────── 掌控卡 / 干预 / 观察（v3） ───────────── */

  /**
   * 六问建卡：answers 是确定性字段映射，不依赖 LLM；模型不可用时同样能建卡。
   * 生成 status='modeled'、version=1 的 lp_ 卡，并写入第一条版本快照。
   */
  async function loopCreateFromAnswers(payload) {
    const answers = assertPlainObject(payload?.answers, 'answers')
    const answerKeys = ['goal', 'measurement', 'action', 'disturbance', 'delay', 'hypothesis'].filter((key) => {
      const value = answers[key]
      if (value === undefined || value === null) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return isPlainObject(value) && Object.keys(value).length > 0
    })
    if (!answerKeys.length) throw new AppError('VALIDATION', 'answers 至少需要一题回答（goal/measurement/action/disturbance/delay/hypothesis）')
    const systemType = payload.systemType === undefined ? 'custom' : payload.systemType
    if (!SYSTEM_TYPES.includes(systemType)) throw new AppError('VALIDATION', 'systemType 必须是 ' + SYSTEM_TYPES.join('|') + ' 之一')
    const gaps = normalizeGapsInput(payload.gaps)
    let saved = null
    const { wroteAt } = await commit('loop.createFromAnswers', (state, meta) => {
      ensureLoopState(state)
      const at = nowIso()
      const loop = structuredClone(LOOP_DEFAULTS)
      loop.id = token('lp')
      loop.systemType = systemType
      loop.goal = normalizeGoalInput(answers.goal)
      loop.measurement = normalizeMeasurementInput(answers.measurement)
      loop.action = normalizeActionInput(answers.action)
      loop.disturbances = normalizeDisturbancesInput(answers.disturbance)
      loop.delays = normalizeDelaysInput(answers.delay)
      loop.hypothesis = normalizeHypothesisInput(answers.hypothesis)
      loop.gaps = gaps
      loop.principleRefs = normalizePrincipleRefsInput(payload.principleRefs, meta.core)
      loop.application = normalizeApplicationInput(payload.application, state)
      loop.title = payload.title === undefined ? defaultLoopTitle(loop) : assertString(payload.title, 'title', { min: 1, max: 200 })
      loop.summary = payload.summary === undefined ? '' : assertString(payload.summary, 'summary', { min: 0, max: 4000 })
      loop.status = 'modeled'
      loop.nextCheck = null
      loop.version = 1
      loop.versions = []
      loop.legacy = false
      loop.lastOpenedAt = null
      loop.createdAt = at
      loop.updatedAt = at
      // T02 规则给出 ctaKey + fallbackText；host 没有翻译服务，用 fallbackText 填成合法非空 text。
      refreshLoopNextAction(state, loop)
      recordLoopVersion(loop, '从掌控六问生成初版卡片', at)
      state.loops[loop.id] = loop
      saved = structuredClone(loop)
    })
    return { ok: true, loop: saved, wroteAt }
  }

  /**
   * 只允许改白名单字段；status/version/versions 不在白名单里，非法状态迁移在专用 op 中拒绝。
   */
  async function loopUpdate(payload) {
    const id = assertString(payload?.id, 'id', { min: 1, max: 200 })
    const patch = loopPatchFromPayload(payload)
    if (!Object.keys(patch).length) throw new AppError('VALIDATION', '没有要更新的字段')
    let saved = null
    const { wroteAt } = await commit('loop.update', (state, meta) => {
      ensureLoopState(state)
      const loop = requireLoop(state, id)
      for (const [field, value] of Object.entries(patch)) applyLoopField(state, meta.core, loop, field, value)
      // 没显式指定 nextAction 时，用 T02 规则刷新「今天这一步」；显式指定则尊重调用方。
      if (!Object.prototype.hasOwnProperty.call(patch, 'nextAction')) refreshLoopNextAction(state, loop)
      loop.updatedAt = nowIso()
      saved = structuredClone(loop)
    })
    return { ok: true, loop: saved, wroteAt }
  }

  async function loopPause(payload) {
    const id = assertString(payload?.id, 'id', { min: 1, max: 200 })
    let saved = null
    const { wroteAt } = await commit('loop.pause', (state) => {
      ensureLoopState(state)
      const loop = requireLoop(state, id)
      requireLoopTransition(loop, 'paused', '暂停')
      loop.status = 'paused'
      refreshLoopNextAction(state, loop)
      loop.updatedAt = nowIso()
      saved = structuredClone(loop)
    })
    return { ok: true, loop: saved, wroteAt }
  }

  async function loopArchive(payload) {
    const id = assertString(payload?.id, 'id', { min: 1, max: 200 })
    let saved = null
    const { wroteAt } = await commit('loop.archive', (state) => {
      ensureLoopState(state)
      const loop = requireLoop(state, id)
      requireLoopTransition(loop, 'archived', '归档')
      loop.status = 'archived'
      refreshLoopNextAction(state, loop)
      loop.updatedAt = nowIso()
      saved = structuredClone(loop)
    })
    return { ok: true, loop: saved, wroteAt }
  }

  /**
   * 修订出新版本：version+1，versions 追加 {version, at, changeSummary, snapshot}。
   * snapshot 是结构化克隆后的卡（不含 versions），之后改卡不会污染旧版本。
   */
  async function loopRevise(payload) {
    const id = assertString(payload?.id, 'id', { min: 1, max: 200 })
    const patch = loopPatchFromPayload(payload, { extraFields: ['changeSummary'] })
    const changeSummaryInput = patch.changeSummary
    delete patch.changeSummary
    let saved = null
    let version = null
    const { wroteAt } = await commit('loop.revise', (state, meta) => {
      ensureLoopState(state)
      const loop = requireLoop(state, id)
      requireLoopTransition(loop, 'revised', '修订出新版本')
      const changed = []
      for (const [field, value] of Object.entries(patch)) {
        applyLoopField(state, meta.core, loop, field, value)
        changed.push(field)
      }
      const at = nowIso()
      loop.version = (loop.version || 1) + 1
      loop.status = 'revised'
      loop.nextCheck = null
      if (!Object.prototype.hasOwnProperty.call(patch, 'nextAction')) refreshLoopNextAction(state, loop)
      loop.updatedAt = at
      const changeSummary =
        changeSummaryInput === undefined
          ? `修订：${changed.length ? changed.join('、') : '确认观察结论'}`
          : assertString(changeSummaryInput, 'changeSummary', { min: 1, max: 500 })
      recordLoopVersion(loop, changeSummary, at)
      version = loop.version
      saved = structuredClone(loop)
    })
    return { ok: true, loop: saved, version, wroteAt }
  }

  /**
   * 设计一次最小检验：创建 planned 干预，把卡从 modeled/revised 推进到 testing，
   * 并把“预测 + 判据 + 窗口”写进 nextCheck。
   */
  async function interventionCreate(payload) {
    const loopId = assertString(payload?.loopId, 'loopId', { min: 1, max: 200 })
    const action = assertString(payload?.action, 'action', { min: 1, max: 4000 })
    const predicted = assertString(payload?.predicted, 'predicted', { min: 1, max: 4000 })
    let savedIntervention = null
    let savedLoop = null
    const { wroteAt } = await commit('intervention.create', (state) => {
      ensureLoopState(state)
      const loop = requireLoop(state, loopId)
      requireLoopTransition(loop, 'testing', '设计检验')
      const at = nowIso()
      const windowStart = payload.windowStart === undefined ? at : assertIsoTimestamp(payload.windowStart, 'windowStart')
      const windowEnd =
        payload.windowEnd === undefined
          ? new Date(Date.parse(windowStart) + 24 * 60 * 60 * 1000).toISOString()
          : assertIsoTimestamp(payload.windowEnd, 'windowEnd')
      if (Date.parse(windowEnd) < Date.parse(windowStart)) throw new AppError('VALIDATION', 'windowEnd 不能早于 windowStart')
      const criterion =
        payload.criterion === undefined
          ? `观察「${action.slice(0, 60)}」之后，预测「${predicted.slice(0, 60)}」是否出现`
          : assertString(payload.criterion, 'criterion', { min: 1, max: 2000 })
      const status = payload.status === undefined ? 'planned' : payload.status
      if (!INTERVENTION_ACTIVE_STATUSES.has(status)) throw new AppError('VALIDATION', '新建干预状态只能是 planned/running')
      const intervention = structuredClone(INTERVENTION_DEFAULTS)
      intervention.id = token('iv')
      intervention.loopId = loopId
      intervention.action = action
      intervention.predicted = predicted
      intervention.windowStart = windowStart
      intervention.windowEnd = windowEnd
      intervention.status = status
      intervention.at = at
      state.interventions[intervention.id] = intervention
      loop.status = 'testing'
      loop.nextCheck = { criterion, predicted, windowStart, windowEnd, interventionId: intervention.id }
      refreshLoopNextAction(state, loop)
      loop.updatedAt = at
      savedIntervention = structuredClone(intervention)
      savedLoop = structuredClone(loop)
    })
    return { ok: true, intervention: savedIntervention, loop: savedLoop, wroteAt }
  }

  async function interventionFinish(payload) {
    const id = assertString(payload?.id, 'id', { min: 1, max: 200 })
    const status = payload?.status
    if (!INTERVENTION_FINISH_STATUSES.includes(status)) throw new AppError('VALIDATION', 'intervention.finish 只能把干预标记为 done 或 abandoned')
    let saved = null
    const { wroteAt } = await commit('intervention.finish', (state) => {
      ensureLoopState(state)
      const intervention = state.interventions[id]
      if (!intervention) throw new AppError('NOT_FOUND', '没有这次干预：' + id)
      if (!INTERVENTION_ACTIVE_STATUSES.has(intervention.status)) {
        throw new AppError('CONFLICT', `这次干预已经是 ${String(intervention.status)}，不能重复结束`, { from: intervention.status, to: status })
      }
      intervention.status = status
      saved = structuredClone(intervention)
    })
    return { ok: true, intervention: saved, wroteAt }
  }

  /**
   * 回填观察：compare.verdict 必填且白名单；没有判定不允许保存（避免“看起来像证据”）。
   * 写入 observations 后把卡推进到 reviewing，下一步是“对比并决定是否修订”。
   */
  async function observationCreate(payload) {
    const loopId = assertString(payload?.loopId, 'loopId', { min: 1, max: 200 })
    const compare = assertPlainObject(payload?.compare, 'compare（观察必须包含与预测的比较）')
    if (!OBSERVATION_VERDICTS.includes(compare.verdict)) {
      throw new AppError('VALIDATION', 'compare.verdict 必填，且只能是 supported|refuted|inconclusive（不判定不允许保存）')
    }
    let savedObservation = null
    let savedLoop = null
    const { wroteAt } = await commit('observation.create', (state) => {
      ensureLoopState(state)
      const loop = requireLoop(state, loopId)
      requireLoopTransition(loop, 'reviewing', '回填观察')
      const at = payload.at === undefined ? nowIso() : assertIsoTimestamp(payload.at, 'at')
      const source = payload.source === undefined ? 'manual' : payload.source
      if (!OBSERVATION_SOURCES.includes(source)) throw new AppError('VALIDATION', 'source 必须是 ' + OBSERVATION_SOURCES.join('|') + ' 之一')
      const predictionText =
        compare.prediction === undefined
          ? loop.nextCheck?.predicted || loop.hypothesis?.claim || ''
          : assertString(compare.prediction, 'compare.prediction', { min: 0, max: 4000 })
      const reason = compare.reason === undefined ? '' : assertString(compare.reason, 'compare.reason', { min: 0, max: 4000 })
      const metric = normalizeMetricInput(payload.metric)
      const interventionId = payload.interventionId === undefined ? loop.nextCheck?.interventionId || null : payload.interventionId
      if (interventionId !== null) {
        if (typeof interventionId !== 'string') throw new AppError('VALIDATION', 'interventionId 只能是字符串或 null')
        const intervention = state.interventions[interventionId]
        if (!intervention) throw new AppError('NOT_FOUND', '没有这次干预：' + interventionId)
        if (intervention.loopId !== loopId) throw new AppError('VALIDATION', '这次干预属于另一张掌控卡，不能挂在这张卡的观察上')
      }
      const observation = structuredClone(OBSERVATION_DEFAULTS)
      observation.id = token('ob')
      observation.loopId = loopId
      observation.interventionId = interventionId
      observation.at = at
      observation.source = source
      observation.metric = metric
      observation.compare = { prediction: predictionText, verdict: compare.verdict, reason }
      observation.evidenceRefs = normalizeEvidenceRefsInput(payload.evidenceRefs, state)
      observation.noteIds = normalizeNoteIdsInput(payload.noteIds, state)
      state.observations[observation.id] = observation
      loop.status = 'reviewing'
      refreshLoopNextAction(state, loop)
      loop.updatedAt = at
      savedObservation = structuredClone(observation)
      savedLoop = structuredClone(loop)
    })
    return { ok: true, observation: savedObservation, loop: savedLoop, wroteAt }
  }

  /** v3 首页导航：记住当前页面与打开的掌控卡（null 表示回到首页）。 */
  async function viewSetActive(payload) {
    if (payload?.screen === undefined) throw new AppError('VALIDATION', '缺少 screen（home|wizard|loop|library|resources）')
    if (!LOOP_SCREENS.has(payload.screen)) throw new AppError('VALIDATION', 'screen 必须是 home|wizard|loop|library|resources 之一')
    const screen = payload.screen
    const hasActiveLoopId = Object.prototype.hasOwnProperty.call(payload, 'activeLoopId')
    let saved = null
    const { wroteAt } = await commit('view.setActive', (state) => {
      ensureLoopState(state)
      state.view.screen = screen
      if (hasActiveLoopId) {
        if (payload.activeLoopId === null) {
          state.view.activeLoopId = null
        } else {
          if (typeof payload.activeLoopId !== 'string') throw new AppError('VALIDATION', 'activeLoopId 只能是掌控卡 id 或 null')
          const loop = requireLoop(state, payload.activeLoopId)
          state.view.activeLoopId = loop.id
          loop.lastOpenedAt = nowIso()
        }
      }
      saved = structuredClone(state.view)
    })
    return { ok: true, view: saved, wroteAt }
  }

  /* ───────────── 内容包 ───────────── */

  function buildExportPack(snap) {
    const store = snap.store
    return {
      kind: PACK_KIND,
      schemaVersion: SCHEMA_VERSION,
      contentVersion: snap.core.version,
      pluginVersion: '1.0.0',
      exportedAt: nowIso(),
      tables: {
        notes: store.notes || {},
        revisions: store.revisions || {},
        relations: store.relations || {},
        investigations: store.investigations || {},
        predictions: store.predictions || {},
        experiments: store.experiments || {},
        tasks: store.tasks || {},
        dialogs: store.dialogs || {},
        loops: store.loops || {},
        interventions: store.interventions || {},
        observations: store.observations || {},
      },
    }
  }

  async function packageExport() {
    const snap = await snapshotForRead()
    return { ok: true, pack: buildExportPack(snap) }
  }

  async function packagePreview(payload) {
    const snap = await snapshotForRead()
    const preview = validatePack(payload?.pack, {
      core: snap.core,
      state: snap.store,
      schemaVersion: SCHEMA_VERSION,
    })
    return { ok: preview.ok, preview }
  }

  async function packageImport(payload) {
    const snap = await snapshotForRead()
    const mode = payload?.mode === 'skip' || payload?.mode === 'replace' ? payload.mode : 'merge'
    if (mode === 'replace' && payload?.confirm !== true) {
      throw new AppError('VALIDATION', '覆盖导入需要 confirm:true')
    }
    const preview = validatePack(payload?.pack, { core: snap.core, state: snap.store, schemaVersion: SCHEMA_VERSION })
    if (!preview.ok) {
      const tooLarge = (preview.errors || []).some((error) => error && error.code === 'PACKAGE_TOO_LARGE')
      if (tooLarge) {
        throw new AppError('PACKAGE_TOO_LARGE', '内容包超过 8 MiB 上限，未写入任何数据', { errors: (preview.errors || []).slice(0, 5) })
      }
      throw new AppError('IMPORT_INVALID', '内容包校验失败：' + preview.errors.slice(0, 3).map((error) => error.message).join('；'), {
        errors: preview.errors.slice(0, 40),
      })
    }
    if (preview.conflicts.length && mode === 'merge') {
      throw new AppError('CONFLICT', `导入与现有数据有 ${preview.conflicts.length} 处冲突，未写入任何数据`, { conflicts: preview.conflicts })
    }
    if (mode === 'replace') await storage.manualBackup()
    const { snapshot } = await commit('package.import', (state, meta) => {
      ensureNoteState(state)
      applyPack(state, preview.normalized, { mode, confirm: true, core: meta.core })
      state.importLog.push({
        id: token('imp'),
        at: nowIso(),
        mode,
        counts: preview.counts,
        conflicts: 0,
        sourceHash: typeof preview.sourceHash === 'string' ? preview.sourceHash : '',
      })
    })
    return { ok: true, applied: preview.counts, conflicts: [], snapshot: { view: snapshot.store.view } }
  }

  /* ───────────── 备份 / 迁移 ───────────── */

  async function backupCreate() {
    const path = await storage.manualBackup()
    return { ok: true, path }
  }

  async function migrationReport() {
    const snap = await snapshotForRead()
    let backups = []
    try {
      const names = (await readdir(storage.backupDir)).filter((name) => /^state\..*\.json$/.test(name))
      for (const name of names) {
        const info = await stat(join(storage.backupDir, name))
        backups.push({ name, size: info.size, at: new Date(info.mtimeMs).toISOString() })
      }
      backups.sort((a, b) => b.at.localeCompare(a.at))
    } catch {
      backups = []
    }
    return { ok: true, report: snap.migrationReport, backups: backups.slice(0, 20), dataPath: snap.dataPath }
  }

  /* ───────────── 分发 ───────────── */

  const handlers = {
    'note.save': noteSave,
    'note.archive': noteArchive,
    'note.delete': noteDelete,
    'relation.annotate': relationAnnotate,
    'investigation.save': investigationSave,
    'investigation.resolve': investigationResolve,
    'prediction.save': predictionSave,
    'prediction.resolve': predictionResolve,
    'experiment.run': experimentRun,
    'experiment.list': experimentList,
    'task.draft': taskDraft,
    'task.save': taskSave,
    'task.archive': taskArchive,
    'view.save': viewSave,
    'loop.createFromAnswers': loopCreateFromAnswers,
    'loop.update': loopUpdate,
    'loop.pause': loopPause,
    'loop.archive': loopArchive,
    'loop.revise': loopRevise,
    'intervention.create': interventionCreate,
    'intervention.finish': interventionFinish,
    'observation.create': observationCreate,
    'view.setActive': viewSetActive,
    'dialog.get': async (payload) => {
      const result = await dialog.get({ subject: payload?.subject })
      return { ok: true, ...result }
    },
    'dialog.cancel': async (payload) => {
      const requestId = assertString(payload?.requestId, 'requestId', { min: 4, max: 200 })
      const result = dialog.cancel(requestId)
      if (!result.ok) throw new AppError('NOT_FOUND', result.message)
      return { ok: true }
    },
    'package.export': packageExport,
    'package.preview': packagePreview,
    'package.import': packageImport,
    'backup.create': backupCreate,
    'migration.report': migrationReport,
  }

  async function run(op, payload, context = { caller: 'ui' }) {
    const handler = handlers[op]
    if (!handler) throw new AppError('NOT_FOUND', '未知操作：' + String(op))
    const normalizedContext = { caller: context.caller === 'agent' ? 'agent' : 'ui' }
    return handler(payload || {}, normalizedContext)
  }

  return { run, buildExportPack }
}
