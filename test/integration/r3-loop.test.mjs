/**
 * R3 · 会回来的技艺：预测 → 运行 → 观察 → 判定 → 修订 → 下一预测（契约 §7 R3）
 *
 * 模型是领域纯函数（delay-v2），经真实 Host ops 与磁盘写入，不是真实应用验收。
 * 运行：node --test test/integration/r3-loop.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHost, pickIds, getCore, getState, assertOk, getDialog } from './helpers.mjs'

test('R3 · 完整循环：预测 → 运行 → 确定性复跑 → 判定 → 修订 → 下一预测', async (t) => {
  const { host } = await createHost(t, { label: 'r3-loop' })
  const core = await getCore(host)
  const { nodeId, relationId } = pickIds(core)
  const subject = relationId ? { kind: 'relation', id: relationId } : { kind: 'node', id: nodeId }

  // 0) 建研究问题
  const investigation = assertOk(
    await host.op('investigation.save', {
      subject,
      title: '延迟如何改变稳定性判断',
      claim: '延迟足够大时，同一增益下回路会持续振荡',
      counter: '也可能只是采样窗口不够长',
      nextTest: '固定 K=3，比较 D=0.2 与 D=1.5 的末段振幅',
    }),
    'investigation.save',
  ).investigation
  assert.ok(investigation.id, '缺少 investigation.id')

  // 1) 写预测（含可判定条件）
  const prediction = assertOk(
    await host.op('prediction.save', {
      subject,
      investigationId: investigation.id,
      text: 'K=3、D=1.5 时末段仍在振荡，不再收敛',
      resolveBy: 'lastAmplitude ≥ 0.04 且末 4 秒穿越目标',
    }),
    'prediction.save',
  ).prediction
  assert.equal(prediction.status, 'open')
  assert.equal(prediction.investigationId, investigation.id)
  assert.ok(prediction.resolveBy.includes('lastAmplitude'))

  // 2) 运行低延迟对照组
  const low = assertOk(
    await host.op('experiment.run', {
      experimentId: 'delay',
      params: { K: 3, D: 0.2 },
      prediction: prediction.text,
      subject,
      investigationId: investigation.id,
      predictionId: prediction.id,
    }),
    'experiment.run(low)',
  )
  const lowRun = low.run
  assert.equal(lowRun.modelId, 'delay-v2', 'run.modelId')
  assert.equal(lowRun.modelVersion, 2, 'run.modelVersion')
  assert.deepEqual(lowRun.params, { K: 3, D: 0.2 }, 'run.params')
  assert.ok(lowRun.criterion && lowRun.criterion.length > 20, 'run.criterion 缺失')
  assert.ok(lowRun.at && !Number.isNaN(Date.parse(lowRun.at)), 'run.at 不是 ISO 时间')
  assert.equal(lowRun.subject.id, subject.id, 'run.subject 未绑定')
  assert.equal(lowRun.investigationId, investigation.id, 'run.investigationId 未绑定')
  assert.ok(lowRun.verdict, 'run.verdict 缺失')
  assert.ok(low.result.metrics, 'result.metrics 缺失')

  // 3) 运行高延迟组；判定必须与低延迟不同（不是强迫相同答案）
  const high = assertOk(
    await host.op('experiment.run', {
      experimentId: 'delay',
      params: { K: 3, D: 1.5 },
      prediction: prediction.text,
      subject,
      investigationId: investigation.id,
      predictionId: prediction.id,
    }),
    'experiment.run(high)',
  )
  assert.notEqual(lowRun.verdict, high.run.verdict, `低延迟与高延迟判定相同（都是 ${lowRun.verdict}），不满足"可验证差异"`)
  assert.ok(high.run.observation?.metrics?.lastAmplitude > 0, '高延迟 run 缺少 lastAmplitude')

  // 4) 确定性可复现：同一参数再跑一次，metrics 必须一致
  const repeated = assertOk(
    await host.op('experiment.run', { experimentId: 'delay', params: { K: 3, D: 1.5 }, subject }),
    'experiment.run(repeat)',
  )
  assert.deepEqual(repeated.run.observation.metrics, high.run.observation.metrics, '同参数复跑 metrics 不一致')
  assert.equal(repeated.run.verdict, high.run.verdict, '同参数复跑判定不一致')

  // 5) 观察记录可列出、可按 subject 过滤
  const listed = assertOk(await host.op('experiment.list', { subject }), 'experiment.list')
  assert.ok(listed.runs.length >= 3, 'experiment.list 数量')
  assert.ok(listed.runs.every((run) => run.subject?.id === subject.id), 'experiment.list 返回了别的 subject 的记录')

  // 6) 判定：预测被支持 / 驳回，并绑定 run
  const resolved = assertOk(
    await host.op('prediction.resolve', {
      id: prediction.id,
      status: high.run.verdict === 'converged' ? 'refuted' : 'supported',
      runId: high.run.id,
      note: '以末段振幅与判据对照',
    }),
    'prediction.resolve',
  ).prediction
  assert.equal(resolved.resolvedByRunId, high.run.id, 'resolvedByRunId')
  assert.ok(resolved.resolvedAt, 'resolvedAt 缺失')
  assert.ok(['supported', 'refuted'].includes(resolved.status))

  // 7) 修订研究问题结论，并写一条修订后的个人理解
  const revised = assertOk(await host.op('investigation.resolve', { id: investigation.id, status: 'revised' }), 'investigation.resolve').investigation
  assert.equal(revised.status, 'revised')
  const note = assertOk(
    await host.op('note.save', {
      subject,
      kind: '理解',
      text: '在这组参数里，延迟放大后同一增益不再收敛；这只是教学模型结论，不是真实系统稳定性证明。',
      authorSource: 'user',
      savedBy: 'ui',
    }),
    'note.save',
  ).note
  assert.ok(note.id)

  // 8) 下一预测（回到问题，而不是结束）
  const nextPrediction = assertOk(
    await host.op('prediction.save', {
      subject,
      investigationId: investigation.id,
      text: '把 K 降到 1.2 后，D=1.5 仍会在目标下方振荡',
      resolveBy: '末 4 秒峰峰值 ≥ 0.04 且不穿越目标',
    }),
    'prediction.save(next)',
  ).prediction
  assert.equal(nextPrediction.status, 'open')
  const state = await getState(host)
  const storedInvestigation = state.store.investigations[investigation.id]
  assert.ok(storedInvestigation.predictionIds.includes(prediction.id), '研究问题未关联预测')
  assert.ok(storedInvestigation.predictionIds.includes(nextPrediction.id), '研究问题未关联下一预测')
  assert.ok(storedInvestigation.experimentRunIds.includes(high.run.id), '研究问题未关联实验记录')
  assert.equal(state.store.notes[note.id].text.includes('不是真实系统稳定性证明'), true)
})

test('R3 · 不强迫先写预测：不带 prediction 也能运行并记录', async (t) => {
  const { host } = await createHost(t, { label: 'r3-optional-prediction' })
  const core = await getCore(host)
  const { nodeId } = pickIds(core)
  const run = assertOk(await host.op('experiment.run', { experimentId: 'proxy', params: { e: 1.5 } }), 'experiment.run')
  assert.equal(run.run.prediction, '', '无预测时 run.prediction 应为空而不是报错')
  assert.equal(run.run.modelId, 'proxy-v2')
  const green = assertOk(await host.op('experiment.run', { experimentId: 'green', params: { enabled: {} } }), 'experiment.run(green)')
  assert.equal(green.run.verdict, 'pass', 'green 默认全绿 verdict')
  assert.ok(green.run.criterion.includes('不证明') || green.run.criterion.includes('只表示'), 'green 判据缺少诚实边界')
  void nodeId
})

test('R3 · 运行记录拒绝不存在的实验与非法 subject', async (t) => {
  const { host } = await createHost(t, { label: 'r3-invalid' })
  const badExperiment = await host.op('experiment.run', { experimentId: 'no-such-experiment' })
  assert.ok(badExperiment.status >= 400 && badExperiment.status < 500, '未知实验应 4xx，实际 ' + badExperiment.status)
  assert.equal(badExperiment.body.code, 'NOT_FOUND')
  const badSubject = await host.op('experiment.run', { experimentId: 'delay', params: { K: 1 }, subject: { kind: 'node', id: 'no-such-node' } })
  assert.ok(badSubject.status >= 400 && badSubject.status < 500, '悬空 subject 应 4xx，实际 ' + badSubject.status)
  const state = await getState(host)
  assert.equal(Object.keys(state.store.experiments || {}).length, 0, '非法运行写入了存储')
  void getDialog
})
