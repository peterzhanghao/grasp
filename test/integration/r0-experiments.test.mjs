/**
 * R0 · 实验模型与判定（契约第 5 节 / 第 7 节 R0）
 *
 * 直接对 src/domain/experiments.js 的纯函数做数值层验证：
 * - E01 D=0 可运行（修复旧版 trace 越界 TypeError）
 * - 区间扫描后 6 类判定可达、互斥，且判定标签与判定码一致
 * - 结果确定性可复现（同参数同结果）
 * - E04 代理指标公式与文案一致（隐藏指标 1.2 后下降、2.6 更低、标签「隐藏/可见」）
 * - 全绿却错：allGreen 只代表已勾选用例通过
 *
 * 这些是 mock/纯函数验证，不是真实应用验收；真实界面上的判定展示见 docs/acceptance.md。
 *
 * 运行：node --test test/integration/r0-experiments.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPERIMENT_MODELS,
  DELAY_VERDICTS,
  runDelay,
  runProxy,
  runGreen,
  proxyVisible,
  proxyHidden,
} from '../../src/domain/experiments.js'

const VERDICT_LABELS = {
  converged: '收敛',
  'overshoot-settled': '过冲',
  oscillating: '振荡',
  'oscillating-below': '目标下方振荡',
  drift: '稳态偏差',
  diverging: '发散',
}

const finite = (value) => typeof value === 'number' && Number.isFinite(value)

test('E01 · D=0 可运行，且轨迹/指标全部有限', () => {
  const result = runDelay({ K: 1.2, D: 0 })
  assert.equal(result.modelId, 'delay-v2')
  assert.equal(result.modelVersion, 2)
  assert.deepEqual(result.params, { K: 1.2, D: 0 })
  assert.ok(Array.isArray(result.trace) && result.trace.length > 100, 'trace 长度应覆盖 16 秒窗口')
  for (const point of result.trace) {
    assert.ok(finite(point.t) && finite(point.y) && finite(point.u), '轨迹存在非有限数：' + JSON.stringify(point))
  }
  for (const key of ['final', 'peak', 'overshoot', 'lastAmplitude', 'drift', 'crossings', 'maxAbs']) {
    assert.ok(finite(result.metrics[key]), `metrics.${key} 不是有限数`)
  }
  assert.ok(DELAY_VERDICTS.includes(result.verdict), '未知 verdict：' + result.verdict)
  assert.ok(String(result.criterion).length > 40, 'criterion 文本缺失')
  assert.match(result.criterion, /不是稳定性证明|教学模型/, 'criterion 必须声明不是稳定性证明')
})

test('R0 · 区间扫描：6 类现象都可达，且每类至少出现一次', () => {
  const bucket = new Map()
  let total = 0
  for (let K = 0; K <= 5.0001; K += 0.1) {
    for (let D = 0; D <= 2.0001; D += 0.05) {
      const params = { K: Math.round(K * 100) / 100, D: Math.round(D * 100) / 100 }
      const result = runDelay(params)
      total += 1
      if (!bucket.has(result.verdict)) bucket.set(result.verdict, [])
      bucket.get(result.verdict).push({ ...params, metrics: result.metrics })
    }
  }
  const counts = Object.fromEntries([...bucket.entries()].map(([verdict, items]) => [verdict, items.length]))
  const missing = DELAY_VERDICTS.filter((verdict) => !counts[verdict])
  assert.deepEqual(missing, [], '区间扫描不可达的判定：' + missing.join(',') + '（实际计数 ' + JSON.stringify(counts) + '）')
  assert.ok(total > 1500, '扫描数量过少：' + total)
})

test('R0 · 低延迟与高延迟确实产生不同判定（判定不是常数）', () => {
  const low = runDelay({ K: 1.2, D: 0 })
  const high = runDelay({ K: 3, D: 1.5 })
  assert.notEqual(low.verdict, high.verdict, `低延迟 ${low.verdict} 与高延迟 ${high.verdict} 判定相同`)
  assert.ok(low.metrics.crossings >= 0 && high.metrics.crossings >= 0)
  const worst = runDelay({ K: 3, D: 2 })
  assert.ok(worst.metrics.lastAmplitude > 0.04, 'D=2、K=3 应有明显残余振荡，实际 lastAmplitude=' + worst.metrics.lastAmplitude)
})

test('R0 · 判定标签与判定码一致，且包含判据阈值说明', () => {
  const samples = [
    [0.2, 0.05],
    [1.2, 0.6],
    [3, 1.5],
    [5, 2],
    [0, 0],
  ]
  for (const [K, D] of samples) {
    const result = runDelay({ K, D })
    assert.ok(result.verdictLabel.includes('：') || result.verdictLabel.length > 6, 'verdictLabel 过短')
    const keyword = VERDICT_LABELS[result.verdict]
    assert.ok(result.verdictLabel.includes(keyword), `verdictLabel 与 verdict 不一致：${result.verdict} / ${result.verdictLabel}`)
    assert.match(result.criterion, /末 4 秒|振幅/, 'criterion 缺少判据窗口说明')
  }
})

test('R0 · 结果确定性可复现（同参数同 outputs）', () => {
  for (const params of [{ K: 1.2, D: 0 }, { K: 3, D: 1.5 }, { K: 0.5, D: 0.3 }]) {
    const a = runDelay(params)
    const b = runDelay(params)
    assert.deepEqual(a.metrics, b.metrics, '同参数 metrics 不一致：' + JSON.stringify(params))
    assert.deepEqual(a.trace, b.trace, '同参数 trace 不一致：' + JSON.stringify(params))
    assert.equal(a.verdict, b.verdict)
    assert.equal(a.criterion, b.criterion)
  }
})

test('R0 · 参数越界被钳制且留下 adjustments（不静默、不崩）', () => {
  const result = runDelay({ K: 99, D: -1 })
  assert.equal(result.params.K, 5, 'K 应钳制到 5')
  assert.equal(result.params.D, 0, 'D 应钳制到 0')
  assert.ok(result.adjustments.length >= 2, '缺少 adjustments 记录')
  const bad = runDelay({ K: 'oops', D: undefined })
  assert.ok(finite(bad.params.K) && finite(bad.params.D), '非数值参数应回退默认值')
})

test('E04 · 代理指标公式与文案一致：hidden 在 1.2 后下降、2.6 更低、标签「隐藏/可见」', () => {
  const at0 = runProxy({ e: 0 })
  const at12 = runProxy({ e: 1.2 })
  const at15 = runProxy({ e: 1.5 })
  const at26 = runProxy({ e: 2.6 })
  assert.equal(at12.hidden, proxyHidden(1.2), 'hidden(1.2) 与公式不一致')
  assert.equal(at26.visible, proxyVisible(2.6), 'visible(2.6) 与公式不一致')
  assert.ok(at15.hidden < at12.hidden, `hidden 在 1.5 应低于 1.2：${at15.hidden} vs ${at12.hidden}`)
  assert.ok(at26.hidden < at12.hidden, `hidden 在 2.6 应低于 1.2：${at26.hidden} vs ${at12.hidden}`)
  assert.ok(at12.visible < at26.visible, 'visible 应单调上升到 2.6 最高')
  assert.equal(at26.visible, Math.max(...[at0, at12, at15, at26].map((item) => item.visible)), 'visible(2.6) 应为区间最高')
  assert.ok(at26.ratioHiddenToVisible < at12.ratioHiddenToVisible, '隐藏/可见比例应在 2.6 低于 1.2')
  for (const sample of [at0, at12, at15, at26]) {
    assert.equal(sample.ratioLabel, '隐藏/可见', '比例标签必须写「隐藏/可见」')
    if (sample.visible > 0) {
      assert.ok(Math.abs(sample.ratioHiddenToVisible - sample.hidden / sample.visible) < 1e-9, 'ratioHiddenToVisible 计算不一致')
    } else {
      assert.equal(sample.ratioHiddenToVisible, 0, 'visible=0 时比例应为 0')
    }
    assert.match(sample.criterion, /hidden\(e\)=visible\(e\)−30·max\(0,e−1\.2\)|visible\(e\)=100/, 'criterion 缺少公式说明')
    assert.ok(sample.peakHidden && sample.peakHidden.e === 1.2, 'peakHidden 应在 e=1.2')
  }
  assert.equal(at0.hidden, 0, 'e=0 时 hidden 应为 0')
})

test('R0 · 全绿却错：allGreen 只表示已勾选用例通过', () => {
  const off = runGreen({ enabled: {} })
  assert.equal(off.allGreen, true, '默认勾选应全绿')
  assert.ok(off.cases.some((item) => item.id === 'beyond' && item.state === 'off'), 'beyond 默认应未勾选')
  assert.doesNotMatch(off.caveat, /功能正确$/, 'caveat 不得宣称功能正确')
  assert.match(off.caveat, /只表示|不证明|全绿/, 'caveat 未说明全绿含义')

  const on = runGreen({ enabled: { beyond: true } })
  assert.equal(on.allGreen, false, '勾选 beyond 后应失败')
  const beyond = on.cases.find((item) => item.id === 'beyond')
  assert.equal(beyond.state, 'fail', 'beyond 用例应为 fail')

  const none = runGreen({ enabled: { p1: false, p2: false, empty: false, beyond: false } })
  assert.equal(none.allGreen, false, '什么都没勾选时 allGreen 不能为 true')
  assert.ok(none.allGreenNote.includes('未运行不等于通过'), '空勾选提示不正确')

  const unknown = runGreen({ enabled: { notACase: true } })
  assert.ok(unknown.unknownCases.includes('notACase'), '未知用例应被记录')
})

test('R0 · 实验模型 id/version 与契约一致', () => {
  assert.deepEqual(EXPERIMENT_MODELS.delay, { id: 'delay-v2', version: 2 })
  assert.deepEqual(EXPERIMENT_MODELS.proxy, { id: 'proxy-v2', version: 2 })
  assert.deepEqual(EXPERIMENT_MODELS.green, { id: 'green-v2', version: 2 })
  const delay = runDelay({})
  const proxy = runProxy({})
  const green = runGreen({})
  assert.equal(delay.modelId, 'delay-v2')
  assert.equal(proxy.modelId, 'proxy-v2')
  assert.equal(green.modelId, 'green-v2')
})
