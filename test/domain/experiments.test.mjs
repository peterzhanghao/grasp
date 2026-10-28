import test from 'node:test'
import assert from 'node:assert/strict'

import {
  EXPERIMENT_MODELS,
  DELAY_MODEL,
  DELAY_VERDICTS,
  runDelay,
  runProxy,
  runGreen,
  paginateForDemo,
  proxyVisible,
  proxyHidden,
} from '../../src/domain/experiments.js'

const finiteTrace = (trace) => trace.every((p) => Number.isFinite(p.t) && Number.isFinite(p.y) && Number.isFinite(p.u))

test('E01：runDelay 在 D=0 时正常跑完，不越界、不抛错', () => {
  const result = runDelay({ K: 1.2, D: 0 })
  assert.equal(result.trace.length, Math.round(DELAY_MODEL.T / DELAY_MODEL.dt) + 1)
  assert.ok(finiteTrace(result.trace), 'trace 中出现非有限数值')
  assert.equal(result.trace[0].t, 0)
  assert.ok(Math.abs(result.trace.at(-1).t - 16) < 1e-9)
  assert.ok(DELAY_VERDICTS.includes(result.verdict))
  // D=0 且 K=1.2：单调趋近稳态、无振荡
  assert.ok(result.metrics.lastAmplitude < 0.01)
  assert.equal(result.verdict, 'drift', 'K=1.2 的比例控制存在稳态偏差，应记为稳态偏差而不是「收敛到目标」')
})

test('runDelay 确定性可复现，且不改写入参', () => {
  const params = { K: 3, D: 1.5 }
  const a = runDelay(params)
  const b = runDelay(params)
  assert.deepEqual(a, b)
  assert.deepEqual(params, { K: 3, D: 1.5 })
  assert.equal(a.modelId, EXPERIMENT_MODELS.delay.id)
  assert.equal(a.modelVersion, EXPERIMENT_MODELS.delay.version)
  assert.deepEqual(a.uLimit, { min: -2, max: 2 })
  assert.equal(a.initial, 0, '初值 y(0)=0，host 会写成 { y: result.initial }')
})

test('E02/E03：参数扫描证明六类现象都可达且互斥（含真实计数）', () => {
  const counts = Object.fromEntries(DELAY_VERDICTS.map((v) => [v, 0]))
  const examples = {}
  let total = 0
  for (let K = 0.2; K <= 5.001; K += 0.2) {
    for (let D = 0; D <= 2.001; D += 0.1) {
      const k = Number(K.toFixed(1))
      const d = Number(D.toFixed(1))
      const result = runDelay({ K: k, D: d })
      assert.ok(DELAY_VERDICTS.includes(result.verdict), `非法判定：${result.verdict}`)
      counts[result.verdict] += 1
      total += 1
      if (!examples[result.verdict]) examples[result.verdict] = { K: k, D: d, result }
    }
  }
  // 参数扫描：K∈[0.2,5] step 0.2（25 档）× D∈[0,2] step 0.1（21 档）= 525 组
  assert.equal(total, 525)
  assert.equal(
    Object.values(counts).reduce((a, b) => a + b, 0),
    total,
    '六类判定必须互斥且穷尽（计数和 = 样本数）',
  )
  for (const [verdict, count] of Object.entries(counts)) {
    assert.ok(count > 0, `判定 ${verdict} 在参数扫描中不可达`)
  }
  console.log('[delay 参数扫描计数]', JSON.stringify(counts), 'total=', total)

  // 每个可达判定都带着可读 label/criterion
  for (const [verdict, example] of Object.entries(examples)) {
    assert.equal(example.result.verdict, verdict)
    assert.ok(example.result.verdictLabel.length > 0)
    assert.ok(example.result.criterion.includes('不是稳定性证明'))
  }

  // 低延迟与高延迟在同一增益下确实产生不同判定（R3 要求）
  const low = runDelay({ K: 1.2, D: 0.6 })
  const high = runDelay({ K: 1.2, D: 1.6 })
  assert.notEqual(low.verdict, high.verdict)
  assert.ok(['drift', 'converged'].includes(low.verdict))
  assert.ok(['oscillating', 'oscillating-below', 'diverging'].includes(high.verdict))
})

test('E02 回归：旧模型误判参数现在被判为振荡，而不是「平稳收敛」', () => {
  const oldSamples = [
    { K: 0.2, D: 0.05 },
    { K: 1.2, D: 0.6 },
    { K: 3, D: 1.5 },
  ]
  const verdicts = oldSamples.map((p) => runDelay(p).verdict)
  // 三组参数不再全部同类（E03：旧版 225 组全报「平稳收敛」）
  assert.ok(new Set(verdicts).size >= 2, `期望出现不同判定，实际：${verdicts.join(',')}`)
  // 旧版把 K=3,D=1.5（末 4 秒振幅 0.82）误报为平稳收敛；新版必须识别为振荡类
  const k3 = runDelay({ K: 3, D: 1.5 })
  assert.ok(['oscillating', 'oscillating-below', 'diverging'].includes(k3.verdict), `K=3,D=1.5 实际判定：${k3.verdict}`)
  assert.ok(k3.metrics.lastAmplitude > 0.5)
  // K=1.2,D=0.6 确实没有振荡（末段振幅应接近 0），但仍不等于「到目标」
  const k12 = runDelay({ K: 1.2, D: 0.6 })
  assert.ok(k12.metrics.lastAmplitude < 0.01)
  assert.notEqual(k12.verdict, 'converged')
})

test('目标下方振荡必须能被识别：不靠「穿越目标次数」', () => {
  // 情形一：末窗口完全不穿越目标，但存在持续振荡 → oscillating-below
  const below = runDelay({ K: 1, D: 1.6 })
  assert.equal(below.metrics.crossings, 0, '该参数全程不穿越目标')
  assert.ok(below.metrics.lastAmplitude >= 0.04, '但仍存在可见振荡')
  assert.equal(below.verdict, 'oscillating-below')
  assert.match(below.verdictLabel, /不穿越目标/)

  // 情形二：全程有穿越（瞬态），但末窗口振荡已在目标下方 → oscillating-below
  const tailBelow = runDelay({ K: 1.2, D: 1.2 })
  assert.ok(tailBelow.metrics.crossings > 0, '瞬态曾穿越目标')
  assert.equal(tailBelow.evidence.tailCrossings, 0, '末窗口不再穿越目标')
  assert.equal(tailBelow.verdict, 'oscillating-below')

  // 情形三：末窗口穿越目标 → oscillating
  const crossing = runDelay({ K: 3, D: 1.5 })
  assert.ok(crossing.evidence.tailCrossings > 0)
  assert.equal(crossing.verdict, 'oscillating')
  assert.match(crossing.verdictLabel, /穿越目标/)
})

test('metrics 字段齐全、数值在模型允许范围内', () => {
  for (const params of [{ K: 0, D: 0 }, { K: 5, D: 2 }, { K: 2.2, D: 0.8 }, { K: 1.4, D: 1.4 }]) {
    const r = runDelay(params)
    for (const key of ['final', 'peak', 'overshoot', 'lastAmplitude', 'drift', 'crossings', 'maxAbs']) {
      assert.ok(Number.isFinite(r.metrics[key]), `metrics.${key} 非有限数`)
    }
    assert.ok(r.metrics.overshoot >= 0)
    assert.ok(r.metrics.lastAmplitude >= 0)
    assert.ok(r.metrics.crossings >= 0 && Number.isInteger(r.metrics.crossings))
    assert.ok(Math.abs(r.metrics.drift - (1 - r.metrics.final)) < 1e-12)
    // 执行器饱和 ±2 ⇒ |y| ≤ 2（数值容许）
    assert.ok(r.metrics.maxAbs <= 2 + 1e-9)
    assert.ok(r.metrics.peak >= r.metrics.final - 1e-9 || r.metrics.peak >= 0)
  }
})

test('数值兜底：NaN 回退默认值、超界钳制并写进 criterion/adjustments', () => {
  const r = runDelay({ K: Number.NaN, D: 99 })
  assert.deepEqual(r.params, { K: 1.2, D: 2 })
  assert.equal(r.adjustments.length, 2)
  assert.match(r.criterion, /参数已兜底/)
  assert.match(r.criterion, /D 由 99 调整为 2/)
  const ok = runDelay({ K: 2, D: 1 })
  assert.deepEqual(ok.adjustments, [])
  assert.doesNotMatch(ok.criterion, /参数已兜底/)
})

test('E04 代理指标：隐藏指标在 e≈1.2 之后下降，且比例标签是「隐藏/可见」', () => {
  const atPeak = runProxy({ e: 1.2 })
  const at15 = runProxy({ e: 1.5 })
  const at26 = runProxy({ e: 2.6 })

  // 公式核对
  assert.ok(Math.abs(atPeak.visible - proxyVisible(1.2)) < 1e-12)
  assert.ok(Math.abs(atPeak.hidden - proxyHidden(1.2)) < 1e-12)
  assert.ok(Math.abs(atPeak.peakHidden.value - proxyHidden(1.2)) < 1e-9)
  assert.equal(atPeak.peakHidden.e, 1.2)

  // 旧版缺陷：1.2→1.5 hidden 仍上升（73.29→79.99）。新版必须下降。
  assert.ok(at15.hidden < atPeak.hidden, `hidden 在 1.5 应低于峰值：${at15.hidden} vs ${atPeak.hidden}`)
  // e=2.6：visible 最高、hidden 明显更低
  assert.ok(at26.visible > atPeak.visible)
  assert.ok(at26.hidden < atPeak.hidden)
  assert.ok(at26.hidden < at26.visible)
  // 比例标签与数值方向一致
  assert.equal(at26.ratioLabel, '隐藏/可见')
  assert.ok(Math.abs(at26.ratioHiddenToVisible - at26.hidden / at26.visible) < 1e-12)
  assert.ok(at26.ratioHiddenToVisible < 1)

  // 峰值确实在 e=1.2（0.001 网格扫描）
  let maxValue = -Infinity
  for (let e = 0; e <= 2.6 + 1e-9; e += 0.001) maxValue = Math.max(maxValue, proxyHidden(e))
  assert.ok(Math.abs(maxValue - atPeak.peakHidden.value) < 1e-9)

  assert.equal(atPeak.verdict, 'pass')
  assert.equal(at26.verdict, 'mixed')
  assert.match(at26.verdictLabel, /指标改善≠目的改善/)
  assert.ok(at26.criterion.includes('隐藏/可见'))
})

test('代理实验参数兜底与边界', () => {
  const clamped = runProxy({ e: 99 })
  assert.equal(clamped.params.e, 2.6)
  assert.equal(clamped.adjustments.length, 1)
  const zero = runProxy({ e: 0 })
  assert.equal(zero.visible, 0)
  assert.equal(zero.ratioHiddenToVisible, 0)
})

test('runGreen：默认全绿但 beyond 未勾选；勾上 beyond 立刻失败', () => {
  const normal = runGreen()
  assert.equal(normal.allGreen, true)
  assert.deepEqual(
    normal.cases.map((c) => `${c.id}:${c.state}`),
    ['p1:pass', 'p2:pass', 'empty:pass', 'beyond:off'],
  )
  assert.equal(normal.cases.find((c) => c.id === 'beyond').state, 'off')

  const exposed = runGreen({ enabled: { beyond: true } })
  assert.equal(exposed.allGreen, false)
  assert.equal(exposed.cases.find((c) => c.id === 'beyond').state, 'fail')
  assert.equal(exposed.failedCount, 1)
  assert.match(exposed.allGreenNote, /越界页/)
  // 全绿只代表已勾选用例通过
  assert.match(normal.allGreenNote, /仅此含义/)
  assert.match(normal.caveat, /不证明功能正确|不构成稳定性证明/)
  // host 会把 result.criterion 写进 ExperimentRun.criterion（schema 要求字符串）
  assert.equal(typeof normal.criterion, 'string')
  assert.ok(normal.criterion.length > 40)
  assert.match(normal.criterion, /allGreen 只表示|不是稳定性证明/)
  assert.equal(exposed.criterion, normal.criterion, 'criterion 不应随勾选变化')
})

test('runGreen：分页函数在越界时回退第一页（教学缺陷本身可复现）', () => {
  assert.deepEqual(paginateForDemo(['a', 'b', 'c', 'd', 'e'], 99), ['a', 'b', 'c'])
  assert.deepEqual(paginateForDemo(['a', 'b', 'c', 'd', 'e'], 2), ['d', 'e'])
})

test('runGreen：没有勾选任何检查时 allGreen=false，并说明未运行不等于通过', () => {
  const none = runGreen({ enabled: { p1: false, p2: false, empty: false, beyond: false } })
  assert.equal(none.allGreen, false)
  assert.equal(none.checkedCount, 0)
  assert.match(none.allGreenNote, /没有勾选/)
  assert.equal(none.cases.every((c) => c.state === 'off'), true)
})

test('runGreen：未知用例名被忽略且写进 caveat', () => {
  const r = runGreen({ enabled: { notACase: true } })
  assert.deepEqual(r.unknownCases, ['notACase'])
  assert.match(r.caveat, /忽略了未知用例/)
})
