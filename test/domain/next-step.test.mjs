import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { LOOP_STATUSES, NEXT_ACTION_TYPES, validateLoopRecord } from '../../src/domain/loop-schema.js'
import {
  NEXT_ACTION_CTA_KEYS,
  NEXT_ACTION_TIERS,
  LOOP_TRANSITIONS,
  QUICK_TIER_MINUTES,
  TRANSITION_REFUSAL,
  allowedTransitions,
  assertTransition,
  isNextActionType,
  nextAction,
  transitions,
} from '../../src/domain/next-step.js'

const NOW = '2026-10-28T12:00:00.000Z'
const PAST_START = '2026-10-28T10:00:00.000Z'
const PAST_END = '2026-10-28T11:00:00.000Z'
const FUTURE_START = '2026-10-28T13:00:00.000Z'
const FUTURE_END = '2026-10-28T18:00:00.000Z'
const CARD_ID = 'lp_t02'

const ACTION_FIELDS = ['ctaKey', 'estimateMin', 'fallbackText', 'text', 'type']

/** 一张字段齐全、状态可覆盖的卡（形状与 loop-schema 的 Loop 一致）。 */
function baseCard(overrides = {}) {
  return {
    id: CARD_ID,
    title: '让 agent 改完代码后稳定通过测试',
    systemType: 'coding-agent',
    summary: '改代码 → 跑测试 → 提交前评审',
    status: 'modeled',
    goal: { quantity: '提交前测试通过率', criterion: '连续 5 次改动全部通过且无回滚', current: '3/5' },
    measurement: { how: 'CI 结果 + 本地测试', cadence: '每次改动', source: 'manual', confidence: 0.6 },
    action: { levers: ['缩小每次改动粒度'], cannot: ['修改外部服务'] },
    disturbances: [{ text: 'flaky 测试' }],
    delays: [{ from: '提交', to: '看到 CI 结果', estimateSeconds: 600, unknown: false }],
    boundary: { nonGoals: [], notes: '' },
    hypothesis: { claim: '失败主要来自改动粒度过大', counter: '可能是测试本身不稳定', falsifier: '把改动拆小后失败率没有下降' },
    gaps: [],
    principleRefs: [],
    nextAction: null,
    nextCheck: null,
    application: { acceptance: ['连续 5 次全绿'], stopConditions: [], checkpoints: [], taskIds: [] },
    version: 1,
    versions: [],
    legacy: false,
    createdAt: NOW,
    updatedAt: NOW,
    lastOpenedAt: null,
    ...overrides,
  }
}

function makeNextCheck({ windowStart = PAST_START, windowEnd = PAST_END, interventionId = 'iv_1' } = {}) {
  return {
    criterion: '连续 3 次单文件改动全部通过',
    predicted: '失败率下降到 1/5',
    windowStart,
    windowEnd,
    interventionId,
  }
}

function testingCard({ windowStart = PAST_START, windowEnd = PAST_END, interventionId = 'iv_1', status = 'testing' } = {}) {
  return baseCard({ status, nextCheck: makeNextCheck({ windowStart, windowEnd, interventionId }) })
}

function makeObservation({ at = NOW, loopId = CARD_ID, interventionId = null, verdict = 'inconclusive' } = {}) {
  return {
    id: `ob_${at}`,
    loopId,
    interventionId,
    at,
    source: 'manual',
    metric: { kind: 'count', value: 3, unit: '次' },
    compare: { prediction: '失败率下降', verdict, reason: '' },
    evidenceRefs: [],
    noteIds: [],
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const item of Object.values(value)) deepFreeze(item)
  }
  return value
}

function assertActionShape(action) {
  assert.deepEqual(Object.keys(action).sort(), ACTION_FIELDS)
  assert.ok(NEXT_ACTION_TYPES.includes(action.type), `非法动作类型：${action.type}`)
  assert.ok(Number.isInteger(action.estimateMin) && action.estimateMin >= 1, `estimateMin 非法：${action.estimateMin}`)
  assert.equal(typeof action.ctaKey, 'string')
  assert.match(action.ctaKey, /^loop\.today\./)
  assert.equal(typeof action.fallbackText, 'string')
  assert.ok(action.fallbackText.length > 0, 'fallbackText 不能为空（模型不可用时的规则文案）')
  assert.equal(action.text, '', 'text 固定空串，由 UI 按 ctaKey 翻译')
}

// ─────────────────────────── 设计 §6 优先级表 ───────────────────────────

test('优先级 1：draft → 继续六问（从第一个空问题开始），预计 5 分钟', () => {
  const partial = nextAction(
    baseCard({ status: 'draft', measurement: { how: '', cadence: '', source: 'unknown', confidence: null } }),
    { now: NOW },
  )
  assert.equal(partial.type, 'answer')
  assert.equal(partial.estimateMin, 5)
  assert.equal(partial.ctaKey, NEXT_ACTION_CTA_KEYS.answer)
  assert.match(partial.fallbackText, /第 2 问/)
  assert.match(partial.fallbackText, /测量/)

  const empty = nextAction(
    baseCard({
      status: 'draft',
      goal: { quantity: '', criterion: '', current: '' },
      measurement: { how: '', cadence: '', source: 'unknown', confidence: null },
      action: { levers: [], cannot: [] },
      disturbances: [],
      delays: [],
      hypothesis: { claim: '', counter: '', falsifier: '' },
    }),
    { now: NOW },
  )
  assert.equal(empty.type, 'answer')
  assert.match(empty.fallbackText, /第 1 问/)

  const complete = nextAction(baseCard({ status: 'draft' }), { now: NOW })
  assert.equal(complete.type, 'answer')
  assert.match(complete.fallbackText, /六问都已有内容/)
})

test('优先级 2：testing 且窗口到期且无观察 → 回填观察（5 分钟）', () => {
  const action = nextAction(testingCard({ windowStart: PAST_START, windowEnd: PAST_END }), { now: NOW })
  assert.equal(action.type, 'observe')
  assert.equal(action.estimateMin, 5)
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.backfill)
  assert.match(action.fallbackText, /到期/)
  assert.match(action.fallbackText, /2026-10-28 11:00/)
})

test('优先级 3：testing 且未到期 → 等待（给提前看一次/延长窗口，2 分钟）', () => {
  const action = nextAction(testingCard({ windowStart: FUTURE_START, windowEnd: FUTURE_END }), { now: NOW })
  assert.equal(action.type, 'observe')
  assert.equal(action.estimateMin, 2)
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.checkEarly)
  assert.match(action.fallbackText, /提前看一次/)
  assert.match(action.fallbackText, /延长窗口/)
  assert.match(action.fallbackText, /2026-10-28 18:00/)
})

test('优先级 4：modeled 且无 nextCheck → 设计一次最小检验（30 分钟）', () => {
  const action = nextAction(baseCard({ status: 'modeled', nextCheck: null }), { now: NOW })
  assert.equal(action.type, 'intervene')
  assert.equal(action.estimateMin, 30)
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.designCheck)
  assert.match(action.fallbackText, /最小检验/)
})

test('优先级 5：reviewing → 对比观察与预测，决定是否修订（15 分钟）', () => {
  const action = nextAction(baseCard({ status: 'reviewing' }), { now: NOW })
  assert.equal(action.type, 'revise')
  assert.equal(action.estimateMin, 15)
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.compare)
  assert.match(action.fallbackText, /对比/)
})

test('优先级 6：revised → 设计下一次检验（10 分钟）', () => {
  const action = nextAction(baseCard({ status: 'revised' }), { now: NOW })
  assert.equal(action.type, 'intervene')
  assert.equal(action.estimateMin, 10)
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.designNext)
  assert.match(action.fallbackText, /下一次检验/)
})

test('优先级 7：paused → 一句话重启或归档（3 分钟）', () => {
  const action = nextAction(baseCard({ status: 'paused' }), { now: NOW })
  assert.equal(action.type, 'answer')
  assert.equal(action.estimateMin, 3)
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.restart)
  assert.match(action.fallbackText, /重启/)
  assert.match(action.fallbackText, /归档/)
})

test('priority 顺序之外：draft 高于一切（即使已带 nextCheck 也先回答六问）', () => {
  const action = nextAction(baseCard({ status: 'draft', nextCheck: makeNextCheck() }), { now: NOW })
  assert.equal(action.type, 'answer')
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.answer)
})

// ─────────────────────────── 防御性分支（卡不完整也不空） ───────────────────────────

test('testing 已有观察 → 先对比（异常状态也不给空动作）', () => {
  const byIntervention = nextAction(testingCard({ windowStart: PAST_START, windowEnd: PAST_END }), {
    now: NOW,
    observations: [makeObservation({ interventionId: 'iv_1', at: '2026-10-28T10:30:00.000Z' })],
  })
  assert.equal(byIntervention.type, 'revise')
  assert.equal(byIntervention.ctaKey, NEXT_ACTION_CTA_KEYS.compare)
  assert.equal(byIntervention.estimateMin, 15)

  const byWindowStart = nextAction(testingCard({ windowStart: PAST_START, windowEnd: FUTURE_END, interventionId: null }), {
    now: NOW,
    observations: [makeObservation({ at: '2026-10-28T12:30:00.000Z' })],
  })
  assert.equal(byWindowStart.type, 'revise')
  assert.equal(byWindowStart.ctaKey, NEXT_ACTION_CTA_KEYS.compare)
})

test('testing 缺 nextCheck / 窗口不可解析 → 回退到「设计检验」而不是空动作', () => {
  for (const nextCheck of [null, makeNextCheck({ windowEnd: 'not-a-date' }), makeNextCheck({ windowStart: FUTURE_END, windowEnd: PAST_END })]) {
    const action = nextAction(baseCard({ status: 'testing', nextCheck }), { now: NOW })
    assert.equal(action.type, 'intervene')
    assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.designCheck)
    assert.equal(action.estimateMin, 30)
    assert.match(action.fallbackText, /nextCheck/)
  }
})

test('modeled 已带 nextCheck → 开始这次检验（5 分钟）', () => {
  const action = nextAction(baseCard({ status: 'modeled', nextCheck: makeNextCheck({ windowStart: FUTURE_START, windowEnd: FUTURE_END }) }), {
    now: NOW,
  })
  assert.equal(action.type, 'intervene')
  assert.equal(action.estimateMin, 5)
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.startCheck)
  assert.match(action.fallbackText, /检验已经设计好/)
})

test('archived：不再出现在今天，但仍返回一个明确动作；未知状态按 draft 兜底', () => {
  const archived = nextAction(baseCard({ status: 'archived' }), { now: NOW })
  assert.equal(archived.type, 'pause')
  assert.equal(archived.estimateMin, 1)
  assert.equal(archived.ctaKey, NEXT_ACTION_CTA_KEYS.archived)
  assert.match(archived.fallbackText, /已归档/)

  for (const status of ['doing', 'DRAFT', '', null, 42]) {
    const action = nextAction(baseCard({ status }), { now: NOW })
    assert.equal(action.type, 'answer')
    assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.answer)
  }
})

// ─────────────────────────── 状态机穷举 ───────────────────────────

test('任意合法状态都返回且只返回一个 action（穷举 7 个状态，形状/确定性可断言）', () => {
  const cards = {
    draft: baseCard({ status: 'draft' }),
    modeled: baseCard({ status: 'modeled' }),
    testing: testingCard(),
    reviewing: baseCard({ status: 'reviewing' }),
    revised: baseCard({ status: 'revised' }),
    paused: baseCard({ status: 'paused' }),
    archived: baseCard({ status: 'archived' }),
  }
  assert.deepEqual(Object.keys(cards).sort(), [...LOOP_STATUSES].sort())

  const seenTypes = new Set()
  for (const status of LOOP_STATUSES) {
    const action = nextAction(cards[status], { now: NOW })
    assert.ok(!Array.isArray(action), `${status} 返回了多个动作`)
    assertActionShape(action)
    seenTypes.add(action.type)
    seenTypes.add(nextAction(cards[status], { now: NOW, tier: 'quick' }).type)
    assert.deepEqual(nextAction(cards[status], { now: NOW }), action, `${status} 动作不确定`)
  }
  // 状态表 + 5 分钟档覆盖了 6 种动作类型中的全部（说明没有把状态压扁成同一种动作）
  assert.deepEqual([...seenTypes].sort(), [...NEXT_ACTION_TYPES].sort())
})

test('5 分钟档：任意状态只给最小动作（tier=quick 覆盖状态优先级）', () => {
  const cards = {
    draft: baseCard({ status: 'draft', measurement: { how: '', cadence: '', source: 'unknown', confidence: null } }),
    modeled: baseCard({ status: 'modeled' }),
    testing: testingCard(),
    reviewing: baseCard({ status: 'reviewing' }),
    revised: baseCard({ status: 'revised' }),
    paused: baseCard({ status: 'paused' }),
    archived: baseCard({ status: 'archived' }),
  }
  for (const status of LOOP_STATUSES) {
    const quick = nextAction(cards[status], { now: NOW, tier: 'quick' })
    assertActionShape(quick)
    assert.ok(quick.estimateMin <= QUICK_TIER_MINUTES, `${status} quick 档超过 5 分钟：${quick.estimateMin}`)
    assert.equal(quick.ctaKey, NEXT_ACTION_CTA_KEYS.quick)
    assert.notEqual(quick.ctaKey, nextAction(cards[status], { now: NOW }).ctaKey, `${status} quick 与默认档没有区别`)
  }
})

test('时长三档：quick/standard/deep 常量齐全；deep 与 standard 输出相同；minutes≤5 走 quick', () => {
  assert.deepEqual(Object.keys(NEXT_ACTION_TIERS), ['quick', 'standard', 'deep'])
  assert.equal(NEXT_ACTION_TIERS.quick.maxMinutes, 5)
  assert.equal(NEXT_ACTION_TIERS.standard.maxMinutes, 30)
  assert.equal(NEXT_ACTION_TIERS.deep.maxMinutes, null)
  for (const tier of Object.values(NEXT_ACTION_TIERS)) {
    assert.equal(typeof tier.id, 'string')
    assert.match(tier.labelKey, /^loop\.today\.tier\./)
  }

  const modeled = baseCard({ status: 'modeled' })
  const standard = nextAction(modeled, { now: NOW })
  assert.deepEqual(nextAction(modeled, { now: NOW, tier: 'standard' }), standard)
  assert.deepEqual(nextAction(modeled, { now: NOW, tier: 'deep' }), standard, 'deep 档不改变规则表动作（表内最大 30 分钟）')

  const quick = nextAction(modeled, { now: NOW, tier: 'quick' })
  assert.deepEqual(nextAction(modeled, { now: NOW, minutes: 5 }), quick)
  assert.deepEqual(nextAction(modeled, { now: NOW, minutes: 4 }), quick)
  assert.deepEqual(nextAction(modeled, { now: NOW, minutes: 30 }), standard)
  assert.deepEqual(nextAction(modeled, { now: NOW, tier: 'turbo' }), standard, '未知档位回落 standard')
  assert.deepEqual(nextAction(modeled, { now: NOW, minutes: '5' }), standard, 'minutes 必须是数字')
})

// ─────────────────────────── 观察过滤 / 纯函数 ───────────────────────────

test('观察只认本卡：别的 loop 的观察不算这次检验已有观察', () => {
  const action = nextAction(testingCard({ windowStart: PAST_START, windowEnd: PAST_END }), {
    now: NOW,
    observations: [makeObservation({ interventionId: 'iv_1', loopId: 'lp_other' })],
  })
  assert.equal(action.ctaKey, NEXT_ACTION_CTA_KEYS.backfill)
  assert.equal(action.type, 'observe')
})

test('纯函数：同一输入同一结果，不改写入参；now 缺省也不抛异常', () => {
  const card = deepFreeze(testingCard({ windowStart: PAST_START, windowEnd: PAST_END }))
  const observations = deepFreeze([makeObservation({ interventionId: 'iv_1' })])
  const first = nextAction(card, { now: NOW, observations })
  const second = nextAction(card, { now: NOW, observations })
  assert.deepEqual(first, second)

  // 不传 now：默认取当前时间，但任何状态都应返回一个完整动作
  for (const status of LOOP_STATUSES) {
    const action = nextAction(baseCard({ status }))
    assertActionShape(action)
  }
  assert.doesNotThrow(() => nextAction(null))
  assertActionShape(nextAction(null))
  assertActionShape(nextAction(baseCard(), { observations: 'not-an-array' }))
})

test('纯规则源扫描：两个引擎只 import loop-schema，不碰 IO/网络/环境/模型', () => {
  const sources = ['../../src/domain/gaps.js', '../../src/domain/next-step.js'].map((relative) =>
    readFileSync(new URL(relative, import.meta.url), 'utf8'),
  )
  const forbidden = [
    /\bnode:/,
    /\brequire\s*\(/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bprocess\./,
    /\bMath\.random\b/,
    /\bsetTimeout\b/,
    /\bwindow\./,
    /\bdocument\./,
  ]
  for (const source of sources) {
    const specifiers = [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
    for (const specifier of specifiers) assert.equal(specifier, './loop-schema.js', `出现了非领域依赖：${specifier}`)
    for (const pattern of forbidden) assert.doesNotMatch(source, pattern)
  }
  assert.equal(typeof nextAction, 'function')
  assert.equal(typeof allowedTransitions, 'function')
  assert.equal(typeof assertTransition, 'function')
})

// ─────────────────────────── 状态机 API ───────────────────────────

const EXPECTED_TRANSITIONS = {
  draft: ['modeled'],
  modeled: ['draft', 'testing'],
  testing: ['reviewing', 'paused'],
  reviewing: ['revised'],
  revised: ['testing'],
  paused: ['modeled', 'archived'],
  archived: [],
}

test('allowedTransitions：严格按设计 §2 图 + §6 行 7；返回副本、未知状态为空', () => {
  for (const status of LOOP_STATUSES) {
    assert.deepEqual(allowedTransitions({ status }), EXPECTED_TRANSITIONS[status], status)
    assert.deepEqual(transitions({ status }), EXPECTED_TRANSITIONS[status], 'transitions 别名应与 allowedTransitions 一致')
    assert.ok(!allowedTransitions({ status }).includes(status), `${status} 不应允许自迁移`)
  }
  assert.deepEqual(allowedTransitions({ status: 'doing' }), [])
  assert.deepEqual(allowedTransitions(null), [])
  assert.deepEqual(allowedTransitions('draft'), ['modeled'], '允许直接传状态字符串')

  const mutable = allowedTransitions({ status: 'draft' })
  mutable.push('testing')
  assert.deepEqual(allowedTransitions({ status: 'draft' }), ['modeled'], '返回值被修改不能污染常量')
  assert.ok(Object.isFrozen(LOOP_TRANSITIONS.draft))
})

test('assertTransition：49 组状态对穷举，合法 ok=true，非法返回失败而不是抛异常', () => {
  for (const from of LOOP_STATUSES) {
    for (const to of LOOP_STATUSES) {
      const legal = EXPECTED_TRANSITIONS[from].includes(to)
      const result = assertTransition(from, to)
      assert.equal(result.ok, legal, `${from} → ${to} 判定错误`)
      assert.equal(result.from, from)
      assert.equal(result.to, to)
      if (legal) {
        assert.equal(result.reason, null)
      } else {
        assert.equal(result.reason, TRANSITION_REFUSAL.illegalTransition)
      }
    }
  }

  // 常见非法迁移样例：跳步 / 倒回 / 从归档出发
  for (const [from, to] of [
    ['draft', 'testing'],
    ['testing', 'revised'],
    ['reviewing', 'modeled'],
    ['archived', 'paused'],
    ['paused', 'reviewing'],
    ['modeled', 'archived'],
  ]) {
    const result = assertTransition(from, to)
    assert.equal(result.ok, false)
    assert.equal(result.reason, TRANSITION_REFUSAL.illegalTransition)
  }

  // 未知状态：不算迁移，也不抛异常
  for (const [from, to] of [
    ['doing', 'modeled'],
    ['draft', 'doing'],
    [null, 'modeled'],
    [undefined, undefined],
    [42, {}],
    [{ status: 'draft' }, { status: 'modeled' }],
  ]) {
    const result = assertTransition(from, to)
    assert.equal(typeof result, 'object')
    if (from === undefined && to === undefined) continue
    if (from === 42 || from === null || from === undefined || from === 'doing' || to === 'doing') {
      assert.equal(result.ok, false)
      assert.equal(result.reason, TRANSITION_REFUSAL.unknownStatus)
    }
  }
  assert.equal(assertTransition({ status: 'draft' }, { status: 'modeled' }).ok, true, '允许传带 status 的对象')
  assert.doesNotThrow(() => assertTransition(Symbol('x'), Symbol('y')))
})

// ─────────────────────────── 与 loop-schema 的契约 ───────────────────────────

test('动作能写回 loop-schema（text 用 fallbackText 填充后通过 validateLoopRecord）', () => {
  const cards = {
    draft: baseCard({ status: 'draft' }),
    modeled: baseCard({ status: 'modeled' }),
    testing: testingCard(),
    reviewing: baseCard({ status: 'reviewing' }),
    revised: baseCard({ status: 'revised' }),
    paused: baseCard({ status: 'paused' }),
    archived: baseCard({ status: 'archived' }),
  }
  for (const status of LOOP_STATUSES) {
    const action = nextAction(cards[status], { now: NOW })
    assert.equal(isNextActionType(action.type), true)
    const record = baseCard({
      status,
      nextAction: {
        type: action.type,
        // loop-schema 要求 text 非空；host 在落盘前用文案 key / fallbackText 填上（见交付说明）。
        text: action.fallbackText,
        estimateMin: action.estimateMin,
        dueAt: null,
      },
    })
    const result = validateLoopRecord(record, {})
    assert.equal(result.ok, true, `${status} 写回失败：${JSON.stringify(result.errors)}`)
  }
})
