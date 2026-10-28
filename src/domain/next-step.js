/**
 * 掌控 · 领域层「今天这一步」引擎（纯函数，无 IO、无 ctx、无第三方依赖）
 *
 * 契约：docs/v2-design.md §6（今天这一步生成规则）、§2（状态机）、§4（掌控六问）。
 *
 * 设计取舍：
 * - 输出永远只有一个动作，且永不为空：任何状态（含暂缺字段的卡、未知状态、归档卡）都返回
 *   { type, text, estimateMin, ctaKey, fallbackText }。
 * - 优先级严格按设计 §6 表：draft → testing 到期回填 → testing 等待 → modeled 设计检验 →
 *   reviewing 对比 → revised 下一次 → paused 重启/归档；再加一行「任意状态且只有 5 分钟」的
 *   降级动作（tier='quick' 或 minutes≤5 时覆盖前 7 行，只给最小动作）。
 * - 时长三档：quick（5 分钟）/ standard（默认，按 §6 表的 2—30 分钟）/ deep（不设上限；
 *   当前规则表最大动作 30 分钟，所以与 standard 输出相同，保留它是为了 UI 可以不展示倒计时、
 *   也为了将来内容包给出更深动作时不改调用方）。
 * - 不写中文长文案：text 固定返回空字符串（由 UI 用 ctaKey 翻译或模型措辞），
 *   只给一段确定性的 fallbackText，保证模型不可用时仍能显示规则文案。
 * - 纯规则：不调用模型、不读网络、不读环境；只依赖传入的 card / now / observations。
 */

import { LOOP_STATUSES, NEXT_ACTION_TYPES } from './loop-schema.js'

/** 三档时长：quick=5 分钟，standard=默认（设计 §6 表的 2—30 分钟），deep=不设上限。 */
export const NEXT_ACTION_TIERS = Object.freeze({
  quick: Object.freeze({ id: 'quick', labelKey: 'loop.today.tier.quick', maxMinutes: 5 }),
  standard: Object.freeze({ id: 'standard', labelKey: 'loop.today.tier.standard', maxMinutes: 30 }),
  deep: Object.freeze({ id: 'deep', labelKey: 'loop.today.tier.deep', maxMinutes: null }),
})

/**
 * 主按钮文案 key（T04 内容包 / locale 负责 zh/en 值；domain 只返回 key）。
 * 同一状态不同分支用不同 key，方便 UI 给「回填观察 / 提前看一次」不同的按钮措辞。
 */
export const NEXT_ACTION_CTA_KEYS = Object.freeze({
  answer: 'loop.today.cta.answer',
  backfill: 'loop.today.cta.backfill',
  checkEarly: 'loop.today.cta.checkEarly',
  designCheck: 'loop.today.cta.designCheck',
  startCheck: 'loop.today.cta.startCheck',
  compare: 'loop.today.cta.compare',
  designNext: 'loop.today.cta.designNext',
  restart: 'loop.today.cta.restart',
  archived: 'loop.today.cta.archived',
  quick: 'loop.today.cta.quick',
})

/** 6 问顺序（Q1—Q6）；标签只用于 fallbackText 里的定位，正式文案由内容包提供。 */
export const QUESTION_LABELS = Object.freeze(['目标', '测量', '动作', '扰动', '延迟', '解释'])

/**
 * 掌控卡状态机（设计 §2 图 + §6 行 7「一句话重启，或归档」）。
 * 只包含合法迁移：draft → modeled → testing → reviewing → revised → testing（见设计 §2）；
 * 暂停只从 testing 进入（图中「暂停/放弃」）；归档只从 paused 进入（§6 行 7）。
 */
export const LOOP_TRANSITIONS = Object.freeze({
  draft: Object.freeze(['modeled']),
  modeled: Object.freeze(['draft', 'testing']),
  testing: Object.freeze(['reviewing', 'paused']),
  reviewing: Object.freeze(['revised']),
  revised: Object.freeze(['testing']),
  paused: Object.freeze(['modeled', 'archived']),
  archived: Object.freeze([]),
})

export const TRANSITION_REFUSAL = Object.freeze({
  unknownStatus: 'unknown-status',
  illegalTransition: 'illegal-transition',
})

// ─────────────────────────── 小工具（与 schema.js 同语义，局部实现避免循环依赖） ───────────────────────────

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const asObject = (value) => (isPlainObject(value) ? value : {})
const asArray = (value) => (Array.isArray(value) ? value : [])
const toText = (value) => (typeof value === 'string' ? value.trim() : '')
const isBlank = (value) => toText(value).length === 0
const parseTime = (value) => (typeof value === 'string' ? Date.parse(value) : Number.NaN)

/** text 固定为空串：domain 不写中文长文案，由 UI 按 ctaKey 翻译（模型可用时模型措辞）。 */
const UI_TRANSLATED_TEXT = ''

function makeAction(type, estimateMin, ctaKey, fallbackText) {
  return {
    type,
    text: UI_TRANSLATED_TEXT,
    estimateMin,
    ctaKey,
    fallbackText,
  }
}

function formatTimestamp(value) {
  const timestamp = parseTime(value)
  if (!Number.isFinite(timestamp)) return String(value ?? '')
  // 固定 UTC 展示：domain 不做本地化，UI 会按 ctaKey 给本地时间。
  return `${new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

function statusOf(card) {
  const status = asObject(card).status
  return LOOP_STATUSES.includes(status) ? status : 'draft'
}

/** 只保留属于这张卡的观察；loopId 不同的不参与判定。 */
function observationsForCard(card, rawObservations) {
  const loopId = toText(asObject(card).id)
  return asArray(rawObservations)
    .filter(isPlainObject)
    .filter((observation) => {
      const ownLoopId = toText(observation.loopId)
      return !loopId || !ownLoopId || ownLoopId === loopId
    })
}

/** 六问里第一个还没写内容的问号（1—6）；六问都有内容返回 0。 */
function firstEmptyQuestion(card) {
  const safeCard = asObject(card)
  const goal = asObject(safeCard.goal)
  const measurement = asObject(safeCard.measurement)
  const hypothesis = asObject(safeCard.hypothesis)
  if (isBlank(goal.quantity) && isBlank(goal.criterion)) return 1
  if (isBlank(measurement.how)) return 2
  const levers = asArray(asObject(safeCard.action).levers).map(toText).filter(Boolean)
  if (levers.length === 0) return 3
  const disturbances = asArray(safeCard.disturbances).filter((item) => isPlainObject(item) && !isBlank(item.text))
  if (disturbances.length === 0) return 4
  if (asArray(safeCard.delays).length === 0) return 5
  if (isBlank(hypothesis.claim) || isBlank(hypothesis.falsifier)) return 6
  return 0
}

/**
 * 读取可用的检验窗口；缺 nextCheck 或窗口时间不可解析时返回 null（走「设计检验」兜底）。
 * 返回 { nextCheck, startMs, endMs }。
 */
function readNextCheck(card) {
  if (!isPlainObject(asObject(card).nextCheck)) return null
  const nextCheck = asObject(card).nextCheck
  const startMs = parseTime(nextCheck.windowStart)
  const endMs = parseTime(nextCheck.windowEnd)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null
  return { nextCheck, startMs, endMs }
}

/** 这次检验是否已有观察：优先按 interventionId 关联；否则看窗口开始之后是否有观察。 */
function hasObservationForCheck(observations, nextCheck) {
  const interventionId = toText(nextCheck.interventionId)
  if (interventionId) {
    return observations.some((observation) => toText(observation.interventionId) === interventionId)
  }
  const startMs = parseTime(nextCheck.windowStart)
  if (!Number.isFinite(startMs)) return false
  return observations.some((observation) => {
    const at = parseTime(observation.at)
    return Number.isFinite(at) && at >= startMs
  })
}

function resolveTier(options) {
  const safeOptions = asObject(options)
  const tier = toText(safeOptions.tier)
  if (tier === NEXT_ACTION_TIERS.quick.id || tier === NEXT_ACTION_TIERS.standard.id || tier === NEXT_ACTION_TIERS.deep.id) {
    return tier
  }
  // 不认识 tier 时按 minutes 预算兜底；minutes 缺省/非法 → 默认 standard。
  const minutes = typeof safeOptions.minutes === 'number' && Number.isFinite(safeOptions.minutes) ? safeOptions.minutes : null
  if (minutes !== null && minutes > 0 && minutes <= NEXT_ACTION_TIERS.quick.maxMinutes) return NEXT_ACTION_TIERS.quick.id
  return NEXT_ACTION_TIERS.standard.id
}

function resolveNowMs(rawNow) {
  if (rawNow === undefined) {
    const parsedDefault = parseTime(new Date().toISOString())
    return Number.isFinite(parsedDefault) ? parsedDefault : Number.NaN
  }
  const parsed = parseTime(rawNow)
  // now 不可解析时不猜时间：窗口一律按「未到期」处理（NaN 比较恒为 false），避免误报到期。
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

// ─────────────────────────── 各状态动作 ───────────────────────────

function draftAction(card) {
  const question = firstEmptyQuestion(card)
  if (question === 0) {
    return makeAction(
      'answer',
      5,
      NEXT_ACTION_CTA_KEYS.answer,
      '六问都已有内容：检查一遍，把目标改写成可判定的一句话，然后进入建模。',
    )
  }
  const label = QUESTION_LABELS[question - 1]
  return makeAction(
    'answer',
    5,
    NEXT_ACTION_CTA_KEYS.answer,
    `从六问第 ${question} 问（${label}）继续：写一句你现在能确定的，之后还可以改。`,
  )
}

function testingAction(card, observations, nowMs) {
  const check = readNextCheck(card)
  if (!check) {
    return makeAction(
      'intervene',
      30,
      NEXT_ACTION_CTA_KEYS.designCheck,
      '这张卡在 testing，但 nextCheck 的窗口缺失或时间不可解析：先补上「改什么 + 预测 + 判据 + 窗口」，再做这次检验。',
    )
  }
  const { nextCheck, startMs, endMs } = check
  if (hasObservationForCheck(observations, nextCheck)) {
    return makeAction(
      'revise',
      15,
      NEXT_ACTION_CTA_KEYS.compare,
      `这次检验已有观察（窗口 ${formatTimestamp(nextCheck.windowStart)}—${formatTimestamp(nextCheck.windowEnd)}）：先对比「预测 → 实际」，选一个结论并决定是否修订。`,
    )
  }
  if (nowMs >= endMs) {
    return makeAction(
      'observe',
      5,
      NEXT_ACTION_CTA_KEYS.backfill,
      `检验窗口已在 ${formatTimestamp(check.nextCheck.windowEnd)} 到期：回填这次观察（一个数、一条日志或一句文本）。`,
    )
  }
  const startNote = startMs > nowMs ? `窗口从 ${formatTimestamp(nextCheck.windowStart)} 才开始，` : ''
  return makeAction(
    'observe',
    2,
    NEXT_ACTION_CTA_KEYS.checkEarly,
    `${startNote}窗口到 ${formatTimestamp(nextCheck.windowEnd)} 才到期：先等；也可以提前看一次，或延长窗口。`,
  )
}

function modeledAction(card) {
  const check = readNextCheck(card)
  if (!check) {
    return makeAction(
      'intervene',
      30,
      NEXT_ACTION_CTA_KEYS.designCheck,
      '设计一次最小检验：一个小干预 + 一句预测 + 一个判据 + 一个窗口。',
    )
  }
  return makeAction(
    'intervene',
    5,
    NEXT_ACTION_CTA_KEYS.startCheck,
    `检验已经设计好（窗口 ${formatTimestamp(check.nextCheck.windowStart)}—${formatTimestamp(check.nextCheck.windowEnd)}）：按计划做这次小干预，并记下你当时的预测。`,
  )
}

function reviewingAction() {
  return makeAction(
    'revise',
    15,
    NEXT_ACTION_CTA_KEYS.compare,
    '对比「你当时的预测 → 实际观察」，选一个结论（支持/反驳/不足），再决定是否修订出下一版。',
  )
}

function revisedAction() {
  return makeAction(
    'intervene',
    10,
    NEXT_ACTION_CTA_KEYS.designNext,
    '基于这一版修订，设计下一次检验：改哪里、预期看到什么、判据与窗口。',
  )
}

function pausedAction() {
  return makeAction(
    'answer',
    3,
    NEXT_ACTION_CTA_KEYS.restart,
    '用一句话写下什么条件下重启；如果不再继续，就归档这张卡。',
  )
}

function archivedAction() {
  return makeAction(
    'pause',
    1,
    NEXT_ACTION_CTA_KEYS.archived,
    '这张卡已归档，不再出现在今天；需要时从资料页恢复。',
  )
}

/** 设计 §6 第 8 行：任意状态且用户只有 5 分钟时，只给最小动作。 */
function quickAction(card, status) {
  const ctaKey = NEXT_ACTION_CTA_KEYS.quick
  switch (status) {
    case 'draft': {
      const question = firstEmptyQuestion(card)
      if (question === 0) {
        return makeAction('answer', 5, ctaKey, '只把最没把握的一句话改清楚，写完先停。')
      }
      return makeAction(
        'answer',
        5,
        ctaKey,
        `只回答第 ${question} 问（${QUESTION_LABELS[question - 1]}）里的一小句，写完先停。`,
      )
    }
    case 'modeled': {
      const falsifier = toText(asObject(asObject(card).hypothesis).falsifier)
      return isBlank(falsifier)
        ? makeAction('measure', 5, ctaKey, '只写一条：什么观察会让你改口（填 hypothesis.falsifier）。')
        : makeAction('measure', 5, ctaKey, '只写一句这次改动的预测：改完你会看到什么。')
    }
    case 'testing':
      return makeAction('observe', 5, ctaKey, '只记一条观察：一个数、一条日志，或一句「没有变化」。')
    case 'reviewing':
      return makeAction('revise', 5, ctaKey, '只写一句对比结论：支持、反驳还是不足。')
    case 'revised':
      return makeAction('measure', 5, ctaKey, '只写一句下一次检验的判据。')
    case 'paused':
      return makeAction('answer', 3, ctaKey, '只写一句：什么条件下重启，或归档。')
    case 'archived':
      return makeAction('pause', 1, ctaKey, '这张卡已归档：今天不需要动作，需要时从资料页恢复。')
    default:
      return makeAction('measure', 5, ctaKey, '只做一步最小的：记录一条观察，或改一句判据。')
  }
}

function standardAction(card, status, observations, nowMs) {
  switch (status) {
    case 'testing':
      return testingAction(card, observations, nowMs)
    case 'modeled':
      return modeledAction(card)
    case 'reviewing':
      return reviewingAction()
    case 'revised':
      return revisedAction()
    case 'paused':
      return pausedAction()
    case 'archived':
      return archivedAction()
    case 'draft':
    default:
      return draftAction(card)
  }
}

// ─────────────────────────── 对外入口 ───────────────────────────

/**
 * 生成「今天这一步」：永远返回且只返回一个动作。
 * @param {object} card 掌控卡（缺字段按空处理；null/非对象按 draft 处理，不抛异常）
 * @param {{now?: string, observations?: Array<object>, tier?: 'quick'|'standard'|'deep', minutes?: number}} [options]
 *   - now：ISO 时间戳，默认当前时间；只用于判断检验窗口是否到期（窗口判断之外不影响结果）
 *   - observations：关联这张卡的观察；loopId 不同的会被忽略
 *   - tier：时长档位；quick 会覆盖状态优先级，只给 5 分钟最小动作
 *   - minutes：只有分钟预算时的简写；≤5 视为 quick，其余按 standard
 * @returns {{type: string, text: string, estimateMin: number, ctaKey: string, fallbackText: string}}
 *   type ∈ NEXT_ACTION_TYPES；text 固定空串（UI 按 ctaKey 翻译，模型可用时由模型措辞）；
 *   fallbackText 是模型不可用时的确定性规则文案，永不为空。
 */
export function nextAction(card, options = {}) {
  const safeCard = asObject(card)
  const opts = asObject(options)
  const status = statusOf(safeCard)
  const observations = observationsForCard(safeCard, opts.observations)
  const tier = resolveTier(opts)
  if (tier === NEXT_ACTION_TIERS.quick.id) return quickAction(safeCard, status)
  const nowMs = resolveNowMs(opts.now)
  return standardAction(safeCard, status, observations, nowMs)
}

/**
 * 从当前状态出发允许进入的状态（设计 §2 状态机）。
 * 只返回合法目标状态，返回副本（调用方修改不污染常量）；未知状态返回空数组。
 * @param {object|string} card 掌控卡（也接受状态字符串）
 * @returns {string[]}
 */
export function allowedTransitions(card) {
  const status = isPlainObject(card) ? card.status : typeof card === 'string' ? card : undefined
  if (!LOOP_STATUSES.includes(status)) return []
  const targets = LOOP_TRANSITIONS[status] || []
  return [...targets]
}

/** Issue #7 接口里的别名：transitions(card) → 允许进入的状态数组。 */
export const transitions = allowedTransitions

/**
 * 校验一次状态迁移：合法返回 { ok: true }，非法返回 { ok: false, reason }，绝不抛异常。
 * @param {string|object} from 起始状态（或带 status 的卡）
 * @param {string|object} to 目标状态（或带 status 的卡）
 * @returns {{ok: boolean, from: string|null, to: string|null, reason: string|null}}
 */
export function assertTransition(from, to) {
  const fromStatus = isPlainObject(from) ? from.status : from
  const toStatus = isPlainObject(to) ? to.status : to
  const safeFrom = typeof fromStatus === 'string' ? fromStatus : null
  const safeTo = typeof toStatus === 'string' ? toStatus : null
  if (!LOOP_STATUSES.includes(safeFrom) || !LOOP_STATUSES.includes(safeTo)) {
    return { ok: false, from: safeFrom, to: safeTo, reason: TRANSITION_REFUSAL.unknownStatus }
  }
  const targets = LOOP_TRANSITIONS[safeFrom] || []
  if (!targets.includes(safeTo)) {
    return { ok: false, from: safeFrom, to: safeTo, reason: TRANSITION_REFUSAL.illegalTransition }
  }
  return { ok: true, from: safeFrom, to: safeTo, reason: null }
}

/** 动作类型自检：返回是否属于 loop-schema 的 NEXT_ACTION_TYPES（供 host/测试断言）。 */
export function isNextActionType(type) {
  return NEXT_ACTION_TYPES.includes(type)
}

/** 预算档位常量（导出给 UI：5 分钟档只给最小动作）。 */
export const QUICK_TIER_MINUTES = NEXT_ACTION_TIERS.quick.maxMinutes
