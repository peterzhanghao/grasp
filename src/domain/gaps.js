/**
 * 掌控 · 领域层缺口诊断（纯函数，无 IO、无 ctx、无第三方依赖）
 *
 * 契约：docs/v2-design.md §5（缺口诊断与原理卡映射）、§4 Q1—Q6（跳过即缺口）、§2（掌控卡字段）。
 *
 * 设计取舍：
 * - 只做确定性规则判定：每条规则只引用掌控卡字段或调用方传入的观察值，evidenceText 保留
 *   字段路径与真实值（不臆造观察，不猜用户意图）。
 * - 模型不可用不影响：本模块不调用模型、不读时钟、不读环境；同一输入永远返回同一结果。
 * - 观察类缺口（saturated / oscillating / drift / adaptation-failure）只在调用方传入 observations
 *   时可判定；没传时只做结构类缺口（目标/测量/延迟/动作/反证条件/代理指标）。
 * - 显示规则（设计 §5）：同一张卡最多返回 3 条，按 block → warn → info，同级按 §5 表顺序排序；
 *   每条最多给 2 张原理卡（nodeId 与内容包现有节点一致）。
 * - 「忽略后不再重复推荐」是 UI/持久层状态（观察变化才重新出现），不在本纯函数里表达。
 */

import { GAP_TYPES, METRIC_KINDS, OBSERVATION_VERDICTS } from './loop-schema.js'

/** 设计 §5 显示规则：每次最多 3 个缺口。 */
export const MAX_DIAGNOSED_GAPS = 3

/** 每条缺口最多引用 2 张原理卡（设计 §5「1—2 张」；oscillating 表里列了 3 张，取前 2）。 */
export const MAX_SUGGESTED_PRINCIPLE_REFS = 2

/**
 * 设计 §5 的「缺口 → 优先原理卡」映射（nodeId 均来自 data/core.json 的 29 个现有节点）。
 * 内容教练包（T04）的 gapPlaybook 必须与此保持一致；若内容包调整，以内容包为准并同步这里。
 */
export const GAP_PRINCIPLE_REFS = Object.freeze({
  'unclear-goal': Object.freeze(['goal', 'boundary']),
  unmeasured: Object.freeze(['measurement', 'blackbox']),
  'late-measurement': Object.freeze(['delay', 'sampling']),
  'authority-gap': Object.freeze(['actuator', 'variety']),
  saturated: Object.freeze(['actuator', 'pi']),
  proxy: Object.freeze(['indicator', 'positive']),
  'missing-counter-signal': Object.freeze(['positive', 'secondorder']),
  oscillating: Object.freeze(['stability', 'delay']),
  drift: Object.freeze(['pi', 'measurement']),
  'adaptation-failure': Object.freeze(['adaptation', 'model']),
})

const SEVERITY_RANK = Object.freeze({ block: 0, warn: 1, info: 2 })
const GAP_ORDER = new Map(GAP_TYPES.map((type, index) => [type, index]))
const NUMERIC_METRIC_KINDS = Object.freeze(METRIC_KINDS.filter((kind) => kind !== 'text'))
const EPSILON = 1e-9

// ─────────────────────────── 小工具（与 schema.js 同语义，局部实现避免循环依赖） ───────────────────────────

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const asObject = (value) => (isPlainObject(value) ? value : {})
const asArray = (value) => (Array.isArray(value) ? value : [])
const toText = (value) => (typeof value === 'string' ? value.trim() : '')
const isBlank = (value) => toText(value).length === 0
const parseTime = (value) => (typeof value === 'string' ? Date.parse(value) : Number.NaN)

/** 用户在字段里直接写了「不知道/靠感觉/待定」等，比空值更明确：说明这一环还没想清楚。 */
const UNCERTAIN_MARKERS = Object.freeze([
  '不知道',
  '不清楚',
  '说不清',
  '不确定',
  '没想过',
  '还没想',
  '待定',
  '再看看',
  '凭感觉',
  '靠感觉',
  '没测',
  '没有测',
  '目测',
  '拍脑袋',
  'tbd',
  'unknown',
  'n/a',
])

function hasUncertainMarker(value) {
  const text = toText(value).toLowerCase()
  if (!text) return false
  return UNCERTAIN_MARKERS.some((marker) => text.includes(marker))
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value)
  return String(Math.round(value * 1000) / 1000)
}

const CADENCE_UNIT_SECONDS = Object.freeze({
  秒: 1,
  分钟: 60,
  小时: 3600,
  天: 86400,
  日: 86400,
  周: 604800,
  星期: 604800,
  个月: 2592000,
  月: 2592000,
})
const CADENCE_AMOUNT = /每\s*(\d+)\s*(秒|分钟|小时|天|日|周|星期|个月|月)/
const CADENCE_PERIOD = /(\d+)\s*(秒|分钟|小时|天|日|周|星期|个月|月)\s*(?:一次|看一次|检查一次|回看一次)/
const CADENCE_EVERY_ONE = /每(秒|分钟|小时|天|日|周|星期|个月|月)/
const CADENCE_WORD = /(每天|每日|每小时|每周|每星期|每月)/

/**
 * 把 measurement.cadence 这类自由文本里的「检查周期」解析成秒数；解析不出返回 null。
 * 只支持明确频率（每小时 / 每 2 天 / 每周…），「每次改动」这类事件频率不猜数字。
 */
function parseCadenceSeconds(cadence) {
  const text = toText(cadence)
  if (!text) return null
  let match = text.match(CADENCE_AMOUNT)
  if (match) {
    const unitSeconds = CADENCE_UNIT_SECONDS[match[2]]
    return unitSeconds ? Number(match[1]) * unitSeconds : null
  }
  match = text.match(CADENCE_PERIOD)
  if (match) {
    const unitSeconds = CADENCE_UNIT_SECONDS[match[2]]
    return unitSeconds ? Number(match[1]) * unitSeconds : null
  }
  match = text.match(CADENCE_EVERY_ONE)
  if (match) return CADENCE_UNIT_SECONDS[match[1]] ?? null
  match = text.match(CADENCE_WORD)
  if (match) return CADENCE_UNIT_SECONDS[match[1].replace(/^每/, '')] ?? null
  return null
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return String(seconds)
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds} 秒（${seconds / 3600} 小时）`
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds} 秒（${seconds / 60} 分钟）`
  return `${seconds} 秒`
}

// ─────────────────────────── 观察序列整理 ───────────────────────────

/**
 * 只保留属于这张卡的观察，并按 at 升序排列（时间不可解析的排最后，保持原相对顺序）。
 * 调用方传整库观察也安全：loopId 不同的记录不会参与缺口判定。
 */
function orderObservations(card, rawObservations) {
  const loopId = toText(card.id)
  const indexed = []
  asArray(rawObservations).forEach((item, index) => {
    if (!isPlainObject(item)) return
    const ownLoopId = toText(item.loopId)
    if (loopId && ownLoopId && ownLoopId !== loopId) return
    indexed.push({ item, index })
  })
  indexed.sort((left, right) => {
    const leftAt = parseTime(left.item.at)
    const rightAt = parseTime(right.item.at)
    const leftTime = Number.isFinite(leftAt) ? leftAt : Number.POSITIVE_INFINITY
    const rightTime = Number.isFinite(rightAt) ? rightAt : Number.POSITIVE_INFINITY
    if (leftTime !== rightTime) return leftTime - rightTime
    return left.index - right.index
  })
  // 缺口只看最近一段历史（避免长观察史影响判定成本与稳定性）。
  return indexed.slice(-12).map((entry) => entry.item)
}

function verdictOf(observation) {
  const verdict = toText(asObject(observation.compare).verdict)
  return OBSERVATION_VERDICTS.includes(verdict) ? verdict : 'inconclusive'
}

/**
 * 取「同单位」的数值观察序列（count/ratio/duration，value 必须是有限数）。
 * 一张卡可能同时有多个指标，取观察条数最多的那一组；条数相同取先出现的一组（确定性）。
 */
function numericSeries(observations) {
  const groups = new Map()
  for (const observation of observations) {
    const metric = asObject(observation.metric)
    if (!NUMERIC_METRIC_KINDS.includes(metric.kind)) continue
    if (typeof metric.value !== 'number' || !Number.isFinite(metric.value)) continue
    const unit = toText(metric.unit)
    if (!groups.has(unit)) groups.set(unit, [])
    groups.get(unit).push({ value: metric.value, verdict: verdictOf(observation) })
  }
  let points = []
  let unit = ''
  for (const [groupUnit, groupPoints] of groups) {
    if (groupPoints.length > points.length) {
      points = groupPoints
      unit = groupUnit
    }
  }
  return { unit, points }
}

function countDirectionChanges(values) {
  let changes = 0
  let previousDirection = 0
  for (let index = 1; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1]
    if (Math.abs(delta) < EPSILON) continue
    const direction = delta > 0 ? 1 : -1
    if (previousDirection !== 0 && direction !== previousDirection) changes += 1
    previousDirection = direction
  }
  return changes
}

const unitLabel = (unit) => (unit ? `「${unit}」` : '（未填单位）')

// ─────────────────────────── 缺口构造 ───────────────────────────

function buildGap(type, severity, evidenceText) {
  const refs = GAP_PRINCIPLE_REFS[type] || []
  return {
    type,
    severity,
    evidenceText,
    suggestedPrincipleRefs: refs.slice(0, MAX_SUGGESTED_PRINCIPLE_REFS),
  }
}

// ─────────────────────────── 结构类缺口（来自六问/卡字段） ───────────────────────────

function unclearGoalGap(card) {
  const goal = asObject(card.goal)
  const quantity = toText(goal.quantity)
  const criterion = toText(goal.criterion)
  if (!criterion) {
    const suffix = quantity ? `（goal.quantity 只有「${quantity}」）` : ''
    return buildGap(
      'unclear-goal',
      'block',
      `goal.criterion 为空${suffix}：还没有一句能判定「怎样算达成」的判据。`,
    )
  }
  if (hasUncertainMarker(criterion) || hasUncertainMarker(quantity)) {
    return buildGap(
      'unclear-goal',
      'warn',
      `goal 里出现不确定表述：goal.quantity「${quantity}」、goal.criterion「${criterion}」——还不能判定怎样算达成。`,
    )
  }
  return null
}

function unmeasuredGap(card) {
  const measurement = asObject(card.measurement)
  const how = toText(measurement.how)
  const source = measurement.source
  const cadence = toText(measurement.cadence)
  const sourceBlank = isBlank(source) || source === 'unknown'
  if (!how && sourceBlank) {
    return buildGap(
      'unmeasured',
      'block',
      'measurement.how 与 measurement.source 都是空的：现在没有任何能回看的测量信号。',
    )
  }
  if (!how) {
    return buildGap(
      'unmeasured',
      'warn',
      `measurement.how 为空（measurement.source 为 ${isBlank(source) ? '空' : JSON.stringify(source)}）：还没写清靠什么知道好坏。`,
    )
  }
  if (hasUncertainMarker(how)) {
    return buildGap('unmeasured', 'warn', `measurement.how「${how}」不是可回看的信号：靠感觉不算测量。`)
  }
  if (sourceBlank) {
    return buildGap('unmeasured', 'warn', `measurement.source 仍是 unknown（measurement.how「${how}」）：测量来源未定。`)
  }
  if (!cadence) {
    return buildGap(
      'unmeasured',
      'info',
      `measurement.cadence 为空：还没写多久看一次（measurement.how「${how}」）。`,
    )
  }
  return null
}

/**
 * 延迟未知（delays[].unknown=true 或 estimateSeconds 不是已知秒数），
 * 或已知延迟 > measurement.cadence 解析出的检查周期 → 报「测得晚」。
 * delays 为空视为「还没记录」，不猜数字（Q4/Q5 允许先空着，之后可补）。
 */
function lateMeasurementGap(card) {
  const delays = asArray(card.delays).filter(isPlainObject)
  if (delays.length === 0) return null

  const unknownDelays = delays.filter((delay) => {
    if (delay.unknown === true) return true
    return typeof delay.estimateSeconds !== 'number' || !Number.isFinite(delay.estimateSeconds) || delay.estimateSeconds < 0
  })
  if (unknownDelays.length > 0) {
    const first = unknownDelays[0]
    const label = [toText(first.from), toText(first.to)].filter(Boolean).join(' → ') || '一条延迟'
    return buildGap(
      'late-measurement',
      'warn',
      `延迟未知：${label} 的 estimateSeconds 不是已知秒数（unknown=${first.unknown === true}），不知道动手后多久能看见结果。`,
    )
  }

  const cadence = toText(asObject(card.measurement).cadence)
  const cadenceSeconds = parseCadenceSeconds(cadence)
  const maxDelaySeconds = Math.max(...delays.map((delay) => delay.estimateSeconds))
  if (cadenceSeconds !== null && maxDelaySeconds > cadenceSeconds) {
    return buildGap(
      'late-measurement',
      'warn',
      `最慢的一次延迟约 ${formatDuration(maxDelaySeconds)}，但 measurement.cadence「${cadence}」约每 ${formatDuration(cadenceSeconds)} 才看一次：反馈比检查周期还慢。`,
    )
  }
  return null
}

function authorityGap(card) {
  const levers = asArray(asObject(card.action).levers)
    .map(toText)
    .filter(Boolean)
  if (levers.length === 0) {
    return buildGap('authority-gap', 'block', 'action.levers 为空：没有写下任何一个你能改变的点，回路缺少执行器。')
  }
  const actionable = levers.filter((lever) => !hasUncertainMarker(lever))
  if (actionable.length === 0) {
    return buildGap(
      'authority-gap',
      'warn',
      `action.levers 里只有不确定表述（${levers.map((lever) => `「${lever}」`).join('、')}）：还没找到能真正改的点。`,
    )
  }
  return null
}

/**
 * 结构近似：目标只有单一量（goal.quantity）、已写测量方式，但既没有独立验收条件
 * （application.acceptance 为空）也没有相反解释（hypothesis.counter 为空）→ 可能把单一指标当目的。
 * 本规则不做语义判断，只提示补一个独立指标或一条会冲突的判断；有任一独立证据就不报。
 */
function proxyGap(card) {
  const goal = asObject(card.goal)
  const quantity = toText(goal.quantity)
  const hypothesis = asObject(card.hypothesis)
  const counter = toText(hypothesis.counter)
  const acceptance = asArray(asObject(card.application).acceptance)
    .map(toText)
    .filter(Boolean)
  const how = toText(asObject(card.measurement).how)

  if (!quantity) return null
  if (!how) return null
  if (acceptance.length > 0) return null
  if (counter) return null
  return buildGap(
    'proxy',
    'warn',
    `目标只有单一指标「${quantity}」：application.acceptance 为空、hypothesis.counter 也为空——还没有独立证据判断它是不是把代理当成了目的。`,
  )
}

function missingCounterSignalGap(card) {
  const hypothesis = asObject(card.hypothesis)
  const claim = toText(hypothesis.claim)
  const falsifier = toText(hypothesis.falsifier)
  if (!falsifier) {
    const suffix = claim ? `（hypothesis.claim「${claim}」还在）` : ''
    return buildGap(
      'missing-counter-signal',
      'warn',
      `hypothesis.falsifier 为空${suffix}：还没有一条会让你改口的具体观察。`,
    )
  }
  if (hasUncertainMarker(falsifier)) {
    return buildGap(
      'missing-counter-signal',
      'warn',
      `hypothesis.falsifier「${falsifier}」不是可观察的条件，无法用来推翻当前解释。`,
    )
  }
  return null
}

// ─────────────────────────── 观察类缺口 ───────────────────────────

/** 动作顶到上限：最近连续多条数值观察完全不动，且预测没有被支持。 */
function saturatedGap(series) {
  const { unit, points } = series
  if (points.length < 2) return null
  let trailingEqual = 1
  for (let index = points.length - 1; index > 0; index -= 1) {
    if (Math.abs(points[index].value - points[index - 1].value) > EPSILON) break
    trailingEqual += 1
  }
  if (trailingEqual < 2) return null
  const last = points[points.length - 1]
  if (last.verdict === 'supported') return null
  const value = formatNumber(last.value)
  return buildGap(
    'saturated',
    'warn',
    `最近 ${trailingEqual} 条数值观察的${unitLabel(unit)}都停在 ${value}（完全没有变化），预测也未被支持：动作可能已经顶到上限。`,
  )
}

/** 稳定但不在目标：数值稳定（相对波动 ≤5%），但最近 3 条里至少 2 条判定「反驳」。 */
function driftGap(series) {
  const { unit, points } = series
  if (points.length < 3) return null
  const recent = points.slice(-3)
  const values = recent.map((point) => point.value)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const span = maximum - minimum
  if (span <= EPSILON) return null // 完全不动归 saturated，不重复报 drift
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const relativeSpan = mean === 0 ? Number.POSITIVE_INFINITY : span / Math.abs(mean)
  if (relativeSpan > 0.05) return null
  const refutedCount = recent.filter((point) => point.verdict === 'refuted').length
  if (refutedCount < 2) return null
  return buildGap(
    'drift',
    'warn',
    `最近 3 条数值观察的${unitLabel(unit)}稳定在 ${formatNumber(minimum)}—${formatNumber(maximum)}（相对波动 ${(relativeSpan * 100).toFixed(1)}%），其中 ${refutedCount} 条判定「反驳」：数值稳住了，但预测没有应验，可能停在目标之外。`,
  )
}

/** 来回摆动：最近至少 4 条数值观察里方向反转 ≥2 次（上升—下降—上升这类完整来回）。 */
function oscillatingGap(series) {
  const { unit, points } = series
  if (points.length < 4) return null
  const values = points.slice(-6).map((point) => point.value)
  const changes = countDirectionChanges(values)
  if (changes < 2) return null
  return buildGap(
    'oscillating',
    'warn',
    `最近 ${values.length} 条数值观察的${unitLabel(unit)}依次为 ${values.map(formatNumber).join(' → ')}，方向反转 ${changes} 次：在目标上下摆动。`,
  )
}

/** 同一动作反复失败：最近 3 条观察（按时间）的判定都是「反驳」。 */
function adaptationFailureGap(observations) {
  if (observations.length < 3) return null
  const recent = observations.slice(-3)
  if (!recent.every((observation) => verdictOf(observation) === 'refuted')) return null
  const lastReason = toText(asObject(recent[recent.length - 1].compare).reason)
  const reasonSuffix = lastReason ? `（最近一条原因：${lastReason}）` : ''
  return buildGap(
    'adaptation-failure',
    'warn',
    `最近 3 条观察都判定「反驳」${reasonSuffix}：同一做法可能已经不灵，该换规则而不是继续加力。`,
  )
}

// ─────────────────────────── 对外入口 ───────────────────────────

function compareGaps(left, right) {
  const severityDelta = (SEVERITY_RANK[left.severity] ?? 99) - (SEVERITY_RANK[right.severity] ?? 99)
  if (severityDelta !== 0) return severityDelta
  return (GAP_ORDER.get(left.type) ?? 99) - (GAP_ORDER.get(right.type) ?? 99)
}

/**
 * 诊断一张掌控卡的缺口。
 * @param {object} card 掌控卡（缺失字段按空处理，不抛异常；null/非对象按空卡处理）
 * @param {{observations?: Array<object>}} [options] 关联这张卡的观察（可按整库传入，loopId 不同会被忽略）
 * @returns {Array<{type: string, severity: 'info'|'warn'|'block', evidenceText: string, suggestedPrincipleRefs: string[]}>}
 *   最多 3 条，按 block → warn → info、同级按设计 §5 表顺序排序；同一输入结果确定。
 */
export function diagnoseGaps(card, options = {}) {
  const safeCard = asObject(card)
  const safeOptions = asObject(options)
  const observations = orderObservations(safeCard, safeOptions.observations)

  const candidates = [
    unclearGoalGap(safeCard),
    unmeasuredGap(safeCard),
    lateMeasurementGap(safeCard),
    authorityGap(safeCard),
    proxyGap(safeCard),
    missingCounterSignalGap(safeCard),
  ].filter(Boolean)

  const series = numericSeries(observations)
  for (const detector of [saturatedGap, oscillatingGap, driftGap]) {
    const detected = detector(series)
    if (detected) candidates.push(detected)
  }
  const adaptationFailure = adaptationFailureGap(observations)
  if (adaptationFailure) candidates.push(adaptationFailure)

  candidates.sort(compareGaps)
  return candidates.slice(0, MAX_DIAGNOSED_GAPS)
}
