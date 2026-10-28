import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { GAP_TYPES, GAP_SEVERITIES, validateLoopRecord } from '../../src/domain/loop-schema.js'
import { diagnoseGaps, GAP_PRINCIPLE_REFS, MAX_DIAGNOSED_GAPS } from '../../src/domain/gaps.js'

const CORE = JSON.parse(readFileSync(new URL('../../data/core.json', import.meta.url), 'utf8'))
const CORE_NODE_IDS = new Set(CORE.nodes.map((node) => node.id))

const CARD_ID = 'lp_t02'
const NOW = '2026-10-28T12:00:00.000Z'
const BASE_TS = Date.parse('2026-10-28T00:00:00.000Z')
const atMinutes = (minutes) => new Date(BASE_TS + minutes * 60_000).toISOString()
const types = (gaps) => gaps.map((gap) => gap.type)

/**
 * 一张「六问都填了、没有明显结构缺口」的卡：作为反例基线，诊断结果应为空数组。
 * 字段形状与 src/domain/loop-schema.js 的 Loop 一致（测试只挑缺口相关字段）。
 */
function baseCard(overrides = {}) {
  return {
    id: CARD_ID,
    title: '让 agent 改完代码后稳定通过测试',
    status: 'modeled',
    goal: { quantity: '提交前测试通过率', criterion: '连续 5 次改动全部通过且无回滚', current: '3/5' },
    measurement: { how: 'CI 结果 + 本地测试', cadence: '每次改动', source: 'manual', confidence: 0.6 },
    action: { levers: ['缩小每次改动粒度'], cannot: ['修改外部服务'] },
    disturbances: [{ text: 'flaky 测试' }],
    delays: [{ from: '提交', to: '看到 CI 结果', estimateSeconds: 600, unknown: false }],
    boundary: { nonGoals: ['一次改完所有历史遗留'], notes: '' },
    hypothesis: { claim: '失败主要来自改动粒度过大', counter: '可能是测试本身不稳定', falsifier: '把改动拆小后失败率没有下降' },
    application: { acceptance: ['连续 5 次全绿'], stopConditions: [], checkpoints: [], taskIds: [] },
    ...overrides,
  }
}

function makeObservation({
  value,
  at,
  unit = '次',
  kind = 'count',
  verdict = 'inconclusive',
  loopId = CARD_ID,
  interventionId = null,
  reason = '',
  prediction = '',
}) {
  return {
    id: `ob_${at}_${String(value)}`,
    loopId,
    interventionId,
    at,
    source: 'manual',
    metric: { kind, value, unit },
    compare: { prediction, verdict, reason },
    evidenceRefs: [],
    noteIds: [],
  }
}

function series(values, { unit = '次', verdicts, loopId = CARD_ID } = {}) {
  return values.map((value, index) =>
    makeObservation({
      value,
      at: atMinutes(index * 10),
      unit,
      verdict: verdicts ? verdicts[index] || 'inconclusive' : 'inconclusive',
      loopId,
    }),
  )
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const item of Object.values(value)) deepFreeze(item)
  }
  return value
}

/** 通过 loop-schema 校验器的最小合法卡（用来证明诊断结果能写回 loop.gaps）。 */
function validRecord(overrides = {}) {
  return {
    id: 'lp_t02',
    title: '测试卡',
    systemType: 'coding-agent',
    summary: '一句话系统描述',
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
    createdAt: NOW,
    updatedAt: NOW,
    lastOpenedAt: null,
    ...overrides,
  }
}

// ─────────────────────────── 基线与结构类缺口 ───────────────────────────

test('缺口诊断：六问齐全的正常卡不误报（无观察 → 0 条）', () => {
  assert.deepEqual(diagnoseGaps(baseCard()), [])
  assert.deepEqual(diagnoseGaps(baseCard(), { observations: [] }), [])
})

test('unclear-goal：criterion 为空记 block；criterion 含不确定表述记 warn；具体判据不报', () => {
  const missing = diagnoseGaps(baseCard({ goal: { quantity: '提交前测试通过率', criterion: '', current: '' } }))
  assert.deepEqual(types(missing), ['unclear-goal'])
  assert.equal(missing[0].severity, 'block')
  assert.match(missing[0].evidenceText, /goal\.criterion/)

  const vague = diagnoseGaps(baseCard({ goal: { quantity: '体验', criterion: '说不清，反正要变好', current: '' } }))
  assert.deepEqual(types(vague), ['unclear-goal'])
  assert.equal(vague[0].severity, 'warn')
  assert.match(vague[0].evidenceText, /不确定表述/)

  assert.ok(!types(diagnoseGaps(baseCard())).includes('unclear-goal'))
})

test('unmeasured：无测量来源记 block；靠感觉记 warn；只缺 cadence 记 info；正常不报', () => {
  const missing = diagnoseGaps(baseCard({ measurement: { how: '', cadence: '', source: 'unknown', confidence: null } }))
  assert.deepEqual(types(missing), ['unmeasured'])
  assert.equal(missing[0].severity, 'block')
  assert.match(missing[0].evidenceText, /measurement\.how/)

  const feeling = diagnoseGaps(baseCard({ measurement: { how: '靠感觉', cadence: '每天', source: 'manual', confidence: null } }))
  assert.deepEqual(types(feeling), ['unmeasured'])
  assert.equal(feeling[0].severity, 'warn')
  assert.match(feeling[0].evidenceText, /靠感觉/)

  const noCadence = diagnoseGaps(baseCard({ measurement: { how: 'CI 结果', cadence: '', source: 'manual', confidence: null } }))
  assert.deepEqual(types(noCadence), ['unmeasured'])
  assert.equal(noCadence[0].severity, 'info')
  assert.match(noCadence[0].evidenceText, /measurement\.cadence/)

  assert.ok(!types(diagnoseGaps(baseCard())).includes('unmeasured'))
})

test('late-measurement：延迟未知 / 延迟长于检查周期记 warn；短延迟不报', () => {
  const unknown = diagnoseGaps(
    baseCard({ delays: [{ from: '提交', to: '看到 CI 结果', estimateSeconds: null, unknown: true }] }),
  )
  assert.deepEqual(types(unknown), ['late-measurement'])
  assert.equal(unknown[0].severity, 'warn')
  assert.match(unknown[0].evidenceText, /estimateSeconds/)

  const slow = diagnoseGaps(
    baseCard({
      delays: [{ from: '提交', to: '看到 CI 结果', estimateSeconds: 7200, unknown: false }],
      measurement: { how: 'CI 结果', cadence: '每小时', source: 'manual', confidence: 0.6 },
    }),
  )
  assert.deepEqual(types(slow), ['late-measurement'])
  assert.match(slow[0].evidenceText, /7200/)

  const fast = diagnoseGaps(
    baseCard({
      delays: [{ from: '提交', to: '看到 CI 结果', estimateSeconds: 600, unknown: false }],
      measurement: { how: 'CI 结果', cadence: '每天', source: 'manual', confidence: 0.6 },
    }),
  )
  assert.deepEqual(fast, [])
  assert.ok(!types(diagnoseGaps(baseCard())).includes('late-measurement'))
})

test('authority-gap：levers 为空记 block；只有说不清的可改点记 warn；有具体动作不报', () => {
  const missing = diagnoseGaps(baseCard({ action: { levers: [], cannot: [] } }))
  assert.deepEqual(types(missing), ['authority-gap'])
  assert.equal(missing[0].severity, 'block')
  assert.match(missing[0].evidenceText, /action\.levers/)

  const vague = diagnoseGaps(baseCard({ action: { levers: ['说不清能改什么'], cannot: [] } }))
  assert.deepEqual(types(vague), ['authority-gap'])
  assert.equal(vague[0].severity, 'warn')

  assert.ok(!types(diagnoseGaps(baseCard())).includes('authority-gap'))
})

test('proxy：单一指标 + 没有独立验收条件 + 没有相反解释 → warn；有任一独立证据则不报', () => {
  const positive = diagnoseGaps(
    baseCard({
      application: { acceptance: [], stopConditions: [], checkpoints: [], taskIds: [] },
      hypothesis: { claim: '失败主要来自改动粒度过大', counter: '', falsifier: '把改动拆小后失败率没有下降' },
    }),
  )
  assert.deepEqual(types(positive), ['proxy'])
  assert.equal(positive[0].severity, 'warn')
  assert.match(positive[0].evidenceText, /application\.acceptance/)
  assert.match(positive[0].evidenceText, /提交前测试通过率/)

  const withAcceptance = diagnoseGaps(
    baseCard({
      application: { acceptance: ['连续 5 次全绿'], stopConditions: [], checkpoints: [], taskIds: [] },
      hypothesis: { claim: '失败主要来自改动粒度过大', counter: '', falsifier: '把改动拆小后失败率没有下降' },
    }),
  )
  assert.ok(!types(withAcceptance).includes('proxy'))

  const withCounter = diagnoseGaps(
    baseCard({
      application: { acceptance: [], stopConditions: [], checkpoints: [], taskIds: [] },
      hypothesis: { claim: '失败主要来自改动粒度过大', counter: '测试本身不稳定', falsifier: '把改动拆小后失败率没有下降' },
    }),
  )
  assert.ok(!types(withCounter).includes('proxy'))
})

test('missing-counter-signal：falsifier 为空或不可观察 → warn；有可观察反证条件不报', () => {
  const missing = diagnoseGaps(baseCard({ hypothesis: { claim: '失败主要来自改动粒度过大', counter: '测试本身不稳定', falsifier: '' } }))
  assert.deepEqual(types(missing), ['missing-counter-signal'])
  assert.equal(missing[0].severity, 'warn')
  assert.match(missing[0].evidenceText, /hypothesis\.falsifier/)

  const vague = diagnoseGaps(
    baseCard({ hypothesis: { claim: '失败主要来自改动粒度过大', counter: '测试本身不稳定', falsifier: '说不清' } }),
  )
  assert.deepEqual(types(vague), ['missing-counter-signal'])

  assert.ok(!types(diagnoseGaps(baseCard())).includes('missing-counter-signal'))
})

// ─────────────────────────── 观察类缺口 ───────────────────────────

test('saturated：最近连续观察值完全不动且预测未被支持 → warn；数值有变化不报', () => {
  const positive = diagnoseGaps(baseCard(), { observations: series([8, 10, 10, 10]) })
  assert.deepEqual(types(positive), ['saturated'])
  assert.equal(positive[0].severity, 'warn')
  assert.match(positive[0].evidenceText, /10/)
  assert.match(positive[0].evidenceText, /完全没有变化/)

  const moving = diagnoseGaps(baseCard(), { observations: series([8, 10, 12]) })
  assert.ok(!types(moving).includes('saturated'))
  const single = diagnoseGaps(baseCard(), { observations: series([10]) })
  assert.ok(!types(single).includes('saturated'))
})

test('oscillating：至少 4 条数值观察且方向反转 ≥2 次 → warn；单调变化不报', () => {
  const positive = diagnoseGaps(baseCard(), { observations: series([4, 6, 4, 6]) })
  assert.deepEqual(types(positive), ['oscillating'])
  assert.equal(positive[0].severity, 'warn')
  assert.match(positive[0].evidenceText, /方向反转/)
  assert.match(positive[0].evidenceText, /4 → 6/)

  const monotonic = diagnoseGaps(baseCard(), { observations: series([1, 2, 3, 4]) })
  assert.deepEqual(monotonic, [])
  // 只有一次「上去又下来」（3 个点）不算来回摆动
  const oneReversal = diagnoseGaps(baseCard(), { observations: series([4, 6, 4]) })
  assert.ok(!types(oneReversal).includes('oscillating'))
})

test('drift：数值稳定（相对波动 ≤5%）但最近 3 条里 ≥2 条反驳 → warn；波动大或反驳少不报', () => {
  const positive = diagnoseGaps(baseCard(), {
    observations: series([10, 10.1, 10.2], { verdicts: ['refuted', 'supported', 'refuted'] }),
  })
  assert.deepEqual(types(positive), ['drift'])
  assert.equal(positive[0].severity, 'warn')
  assert.match(positive[0].evidenceText, /判定「反驳」/)

  const tooFewRefuted = diagnoseGaps(baseCard(), {
    observations: series([10, 10.1, 10.2], { verdicts: ['supported', 'refuted', 'supported'] }),
  })
  assert.ok(!types(tooFewRefuted).includes('drift'))

  const volatile = diagnoseGaps(baseCard(), {
    observations: series([1, 5, 9], { verdicts: ['refuted', 'refuted', 'refuted'] }),
  })
  assert.ok(!types(volatile).includes('drift'))
})

test('adaptation-failure：最近 3 条观察都反驳 → warn；只有 2 条反驳不报', () => {
  const positive = diagnoseGaps(baseCard(), {
    observations: series([10, 12, 14], {
      verdicts: ['refuted', 'refuted', 'refuted'],
      // 给最后一条一个可引用的原因，证明 evidenceText 引用观察值而不是编造
    }).map((observation, index) =>
      index === 2
        ? { ...observation, compare: { ...observation.compare, reason: '失败率没有下降' } }
        : observation,
    ),
  })
  assert.deepEqual(types(positive), ['adaptation-failure'])
  assert.equal(positive[0].severity, 'warn')
  assert.match(positive[0].evidenceText, /判定「反驳」/)
  assert.match(positive[0].evidenceText, /失败率没有下降/)

  const twoRefuted = diagnoseGaps(baseCard(), {
    observations: series([10, 12], { verdicts: ['refuted', 'refuted'] }),
  })
  assert.ok(!types(twoRefuted).includes('adaptation-failure'))
})

test('观察结论不受传入顺序影响：先按 at 排序，再判断摆动', () => {
  const shuffled = [
    makeObservation({ value: 6, at: atMinutes(30) }),
    makeObservation({ value: 4, at: atMinutes(20) }),
    makeObservation({ value: 6, at: atMinutes(10) }),
    makeObservation({ value: 4, at: atMinutes(0) }),
  ]
  const gaps = diagnoseGaps(baseCard(), { observations: shuffled })
  assert.ok(types(gaps).includes('oscillating'), `实际：${JSON.stringify(gaps)}`)
})

test('观察只归属本卡：loopId 不同的观察被忽略；没有 loopId 的观察保留', () => {
  const foreign = series([10, 10, 10], { loopId: 'lp_other' })
  assert.deepEqual(diagnoseGaps(baseCard(), { observations: foreign }), [])

  const foreignRefuted = series([10, 12, 14], { verdicts: ['refuted', 'refuted', 'refuted'], loopId: 'lp_other' })
  assert.deepEqual(diagnoseGaps(baseCard(), { observations: foreignRefuted }), [])

  const anonymous = series([10, 10, 10], { loopId: '' })
  assert.ok(types(diagnoseGaps(baseCard(), { observations: anonymous })).includes('saturated'))
})

test('非数值观察（text 或 value 不是数字）不参与数值类缺口判定', () => {
  const textObservations = [0, 1, 2, 3].map((index) =>
    makeObservation({ value: '来回摆动', at: atMinutes(index), kind: 'text' }),
  )
  const malformed = [0, 1].map((index) => makeObservation({ value: '3', at: atMinutes(index), kind: 'count' }))
  assert.deepEqual(diagnoseGaps(baseCard(), { observations: [...textObservations, ...malformed] }), [])
})

// ─────────────────────────── 显示规则、确定性与形状 ───────────────────────────

test('显示规则：同一卡最多 3 条，按 block→warn→info 排序，再按设计 §5 表顺序', () => {
  const broken = baseCard({
    goal: { quantity: '', criterion: '', current: '' },
    measurement: { how: '', cadence: '', source: 'unknown', confidence: null },
    action: { levers: [], cannot: [] },
    hypothesis: { claim: '', counter: '', falsifier: '' },
  })
  const gaps = diagnoseGaps(broken)
  assert.equal(gaps.length, MAX_DIAGNOSED_GAPS)
  assert.deepEqual(types(gaps), ['unclear-goal', 'unmeasured', 'authority-gap'])
  assert.ok(gaps.every((gap) => gap.severity === 'block'))

  const mixed = diagnoseGaps(
    baseCard({
      goal: { quantity: '提交前测试通过率', criterion: '', current: '' },
      hypothesis: { claim: '失败主要来自改动粒度过大', counter: '测试本身不稳定', falsifier: '' },
    }),
  )
  assert.deepEqual(types(mixed), ['unclear-goal', 'missing-counter-signal'])
  assert.deepEqual(mixed.map((gap) => gap.severity), ['block', 'warn'])
})

test('缺口形状：字段齐全、枚举合法、evidenceText 非空、原理卡引用 1—2 条', () => {
  const gaps = diagnoseGaps(
    baseCard({
      goal: { quantity: '', criterion: '', current: '' },
      measurement: { how: '', cadence: '', source: 'unknown', confidence: null },
      action: { levers: [], cannot: [] },
      hypothesis: { claim: '', counter: '', falsifier: '' },
    }),
  )
  assert.equal(gaps.length, 3)
  for (const gap of gaps) {
    assert.deepEqual(Object.keys(gap).sort(), ['evidenceText', 'severity', 'suggestedPrincipleRefs', 'type'])
    assert.ok(GAP_TYPES.includes(gap.type), `非法缺口类型：${gap.type}`)
    assert.ok(GAP_SEVERITIES.includes(gap.severity), `非法严重度：${gap.severity}`)
    assert.ok(typeof gap.evidenceText === 'string' && gap.evidenceText.length > 0)
    assert.ok(Array.isArray(gap.suggestedPrincipleRefs))
    assert.ok(gap.suggestedPrincipleRefs.length >= 1 && gap.suggestedPrincipleRefs.length <= 2)
    assert.ok(gap.suggestedPrincipleRefs.every((ref) => typeof ref === 'string' && ref.length > 0))
  }
})

test('10 类缺口都可达，且原理卡引用与设计 §5 映射一致、都指向内容包现有节点', () => {
  const fixtures = {
    'unclear-goal': baseCard({ goal: { quantity: '提交前测试通过率', criterion: '', current: '' } }),
    unmeasured: baseCard({ measurement: { how: '', cadence: '', source: 'unknown', confidence: null } }),
    'late-measurement': baseCard({ delays: [{ from: '提交', to: '看到 CI', estimateSeconds: null, unknown: true }] }),
    'authority-gap': baseCard({ action: { levers: [], cannot: [] } }),
    saturated: baseCard(),
    proxy: baseCard({
      application: { acceptance: [], stopConditions: [], checkpoints: [], taskIds: [] },
      hypothesis: { claim: '失败主要来自改动粒度过大', counter: '', falsifier: '把改动拆小后失败率没有下降' },
    }),
    'missing-counter-signal': baseCard({ hypothesis: { claim: '失败主要来自改动粒度过大', counter: '测试本身不稳定', falsifier: '' } }),
    oscillating: baseCard(),
    drift: baseCard(),
    'adaptation-failure': baseCard(),
  }
  const observationsByFixture = {
    saturated: series([8, 10, 10, 10]),
    oscillating: series([4, 6, 4, 6]),
    drift: series([10, 10.1, 10.2], { verdicts: ['refuted', 'supported', 'refuted'] }),
    'adaptation-failure': series([10, 12, 14], { verdicts: ['refuted', 'refuted', 'refuted'] }),
  }

  assert.deepEqual(Object.keys(GAP_PRINCIPLE_REFS).sort(), [...GAP_TYPES].sort())
  const reached = new Set()
  for (const [type, card] of Object.entries(fixtures)) {
    const gaps = diagnoseGaps(card, { observations: observationsByFixture[type] || [] })
    const gap = gaps.find((item) => item.type === type)
    assert.ok(gap, `缺口 ${type} 没有命中，实际：${JSON.stringify(types(gaps))}`)
    assert.deepEqual(gap.suggestedPrincipleRefs, [...GAP_PRINCIPLE_REFS[type]])
    for (const ref of gap.suggestedPrincipleRefs) {
      assert.ok(CORE_NODE_IDS.has(ref), `原理卡 nodeId ${ref} 不在 data/core.json`)
    }
    reached.add(type)
  }
  assert.deepEqual([...reached].sort(), [...GAP_TYPES].sort())
})

test('纯函数：不改写入参，同一输入返回同一结果', () => {
  const card = deepFreeze(baseCard())
  const observations = deepFreeze([
    ...series([10, 10, 10], { verdicts: ['refuted', 'refuted', 'refuted'] }),
    ...series([4, 6, 4, 6]),
  ])
  const first = diagnoseGaps(card, { observations })
  const second = diagnoseGaps(card, { observations })
  assert.deepEqual(first, second)
  assert.ok(Array.isArray(first))
})

test('防御性：空卡/非法输入不抛异常，且仍按严重度给出最多 3 条', () => {
  for (const bad of [null, undefined, 42, 'card', []]) {
    const gaps = diagnoseGaps(bad)
    assert.ok(Array.isArray(gaps))
    assert.ok(gaps.length <= MAX_DIAGNOSED_GAPS)
  }
  assert.deepEqual(diagnoseGaps({}), diagnoseGaps(null))
  assert.deepEqual(types(diagnoseGaps({})), ['unclear-goal', 'unmeasured', 'authority-gap'])
  assert.deepEqual(diagnoseGaps(baseCard(), { observations: 'not-an-array' }), [])
})

test('诊断结果能写回 loop.gaps 并通过 loop-schema 校验（shape 契约）', () => {
  const card = baseCard({
    goal: { quantity: '', criterion: '', current: '' },
    action: { levers: [], cannot: [] },
  })
  const gaps = diagnoseGaps(card)
  const record = validRecord({ gaps })
  const result = validateLoopRecord(record, {})
  assert.equal(result.ok, true, JSON.stringify(result.errors))
  assert.equal(record.gaps.length, gaps.length)
})
