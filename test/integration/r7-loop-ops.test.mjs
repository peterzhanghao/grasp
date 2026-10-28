import { SCHEMA_VERSION } from '../../src/domain/schema.js'
/**
 * R7 · Host ops v3（掌控卡 / 干预 / 观察 / 版本 / 首页导航）与 agent 只读工具（T03 / Issue #8）
 *
 * 全部走真实 HTTP（fake-ctx 起插件 + 临时数据目录）：
 * - 正例：六问建卡 → 更新 → 设计干预 → 回填观察 → 修订 → 暂停/归档 的完整生命周期。
 * - 反例：非法 verdict、悬空 loopId/interventionId、非法状态迁移、写盘失败不污染、
 *   agent 代写观察 verdict 被明确拒绝。
 * 运行：node --test test/integration/r7-loop-ops.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHost, getCore, getState, pickIds, assertOk, assertStatus, assertClientError, readStateFile } from './helpers.mjs'
import { breakStateWrite, fixStateWrite } from '../harness/fake-ctx.mjs'

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const ANSWERS = {
  goal: '改动提交前稳定通过测试且没有回归',
  measurement: '每次提交后跑一遍回归测试并记录失败数；每天看一次',
  action: '可以改代码和测试；改不了上游依赖的发布节奏',
  disturbance: '上游依赖升级导致测试偶发失败',
  delay: '大约 2 小时后能看到失败数的变化',
  hypothesis: '失败主要来自改动前没写回归测试；如果先写失败测试再改代码，失败数会下降',
}

async function createLoop(host, extra = {}) {
  const response = assertOk(
    await host.op('loop.createFromAnswers', { answers: ANSWERS, ...extra }),
    'loop.createFromAnswers',
  )
  return response.loop
}

/** T02 规则里 nextAction.text 固定为空串；host 落盘前必须用 ctaKey/fallbackText 填成合法非空文案。 */
function assertNextAction(loop, expectedType, label = '') {
  assert.ok(loop.nextAction, `${label}缺少 nextAction`)
  assert.equal(loop.nextAction.type, expectedType, `${label}nextAction.type`)
  assert.equal(typeof loop.nextAction.text, 'string', `${label}nextAction.text 类型`)
  assert.ok(loop.nextAction.text.trim().length > 0, `${label}nextAction.text 不能是空串`)
  assert.ok(Number.isInteger(loop.nextAction.estimateMin) && loop.nextAction.estimateMin >= 1, `${label}nextAction.estimateMin`)
  assert.ok(loop.nextAction.dueAt === null || !Number.isNaN(Date.parse(loop.nextAction.dueAt)), `${label}nextAction.dueAt`)
}

async function prepare(t, options = {}) {
  const { host, dataDir } = await createHost(t, options)
  const core = await getCore(host)
  const { nodeId } = pickIds(core)
  return { host, dataDir, core, nodeId }
}

/* ─────────────────────────── 建卡 ─────────────────────────── */

test('R7 · 六问建卡：生成合法 lp_ 卡（modeled / version 1 / 一条版本），反例不落盘', async (t) => {
  const { host, core } = await prepare(t, { label: 'r7-create' })
  const { nodeId } = pickIds(core)

  // 反例：缺 answers / 空 answers / 空目标 / 非法 systemType / 非法缺口 / 悬空原理卡
  assertClientError(await host.op('loop.createFromAnswers', {}), 'VALIDATION', '缺 answers')
  assertClientError(await host.op('loop.createFromAnswers', { answers: {} }), 'VALIDATION', '空 answers')
  assertClientError(await host.op('loop.createFromAnswers', { answers: { goal: '' } }), 'VALIDATION', '空目标')
  assertClientError(
    await host.op('loop.createFromAnswers', { answers: { goal: '让测试稳定' }, systemType: 'alien' }),
    'VALIDATION',
    '非法 systemType',
  )
  assertClientError(
    await host.op('loop.createFromAnswers', { answers: { goal: '让测试稳定' }, gaps: [{ type: 'no-such-gap' }] }),
    'VALIDATION',
    '非法缺口类型',
  )
  assertStatus(
    await host.op('loop.createFromAnswers', {
      answers: { goal: '让测试稳定' },
      principleRefs: [{ nodeId: 'no-such-node' }],
    }),
    404,
    '悬空原理卡引用',
  )

  let state = await getState(host)
  assert.deepEqual(Object.keys(state.store.loops || {}), [], '反例写入了掌控卡')
  assert.deepEqual(Object.keys(state.store.observations || {}), [], '反例写入了观察')

  // 正例：带标题 / 系统类型 / 缺口 / 原理卡
  const loop = await createLoop(host, {
    title: '让回归测试重新可信',
    systemType: 'coding-agent',
    gaps: [{ type: 'late-measurement', severity: 'warn', evidenceText: '延迟 2 小时，检查周期是每天' }],
    principleRefs: [{ nodeId, userTranslation: '延迟会改变你能多快看到结果', whyHere: '上下班各看一次测试' }],
  })

  assert.match(loop.id, /^lp_/, '掌控卡 id 前缀')
  assert.equal(loop.status, 'modeled', '新建卡状态')
  assert.equal(loop.version, 1, '新建卡版本')
  assert.equal(loop.versions.length, 1, '新建卡版本历史一条')
  assert.equal(loop.versions[0].version, 1)
  assert.match(loop.createdAt, ISO, 'createdAt ISO')
  assert.match(loop.updatedAt, ISO, 'updatedAt ISO')
  assert.equal(loop.createdAt, loop.updatedAt)
  assert.equal(loop.legacy, false)
  assert.equal(loop.lastOpenedAt, null)
  assert.equal(loop.title, '让回归测试重新可信')
  assert.equal(loop.systemType, 'coding-agent')
  assert.equal(loop.goal.criterion, ANSWERS.goal, 'Q1 → goal.criterion')
  assert.equal(loop.measurement.how, ANSWERS.measurement, 'Q2 → measurement.how')
  assert.deepEqual(loop.action.levers, [ANSWERS.action], 'Q3 → action.levers')
  assert.equal(loop.disturbances[0].text, ANSWERS.disturbance, 'Q4 → disturbances')
  assert.equal(loop.delays[0].unknown, true, '自然语言延迟按未知记录')
  assert.equal(loop.hypothesis.claim, ANSWERS.hypothesis, 'Q6 → hypothesis.claim')
  assert.equal(loop.gaps[0].type, 'late-measurement')
  assert.equal(loop.gaps[0].severity, 'warn')
  assert.equal(loop.principleRefs[0].nodeId, nodeId)
  assert.equal(loop.nextCheck, null)
  assertNextAction(loop, 'intervene', '建卡后 ')
  assert.ok(loop.nextAction.text.includes('最小检验'), 'nextAction 应指向“设计一次最小检验”')
  assert.equal(loop.nextAction.estimateMin, 30)
  assert.equal(loop.nextAction.dueAt, null)
  // 版本快照是结构化克隆（不含嵌套 versions）
  assert.equal(loop.versions[0].snapshot.title, loop.title)
  assert.equal(loop.versions[0].snapshot.status, 'modeled')
  assert.equal(loop.versions[0].snapshot.versions, undefined)

  state = await getState(host)
  assert.equal(state.schemaVersion, 3, '/state schemaVersion')
  assert.deepEqual(state.store.loops[loop.id], loop, '/state 与建卡响应不一致')
  assert.equal(state.store.view.activeLoopId, null, '建卡不应偷偷改首页导航')
})

test('R7 · 模型不可用时建卡不依赖 LLM', async (t) => {
  const { host } = await prepare(t, { label: 'r7-no-llm', services: { llm: false, agentDefaultModel: false } })
  const state = await getState(host)
  assert.equal(state.modelAvailable, false, '本用例应处于模型不可用状态')
  const loop = await createLoop(host)
  assert.equal(loop.status, 'modeled')
  assert.equal(loop.version, 1)
})

/* ─────────────────────────── 更新 / 版本 ─────────────────────────── */

test('R7 · loop.update 只改白名单字段；未知字段与状态字段被拒且不写盘', async (t) => {
  const { host } = await prepare(t, { label: 'r7-update' })
  const loop = await createLoop(host)
  const firstSnapshotTitle = loop.versions[0].snapshot.title

  // patch 形式：白名单字段
  const updated = assertOk(
    await host.op('loop.update', {
      id: loop.id,
      patch: {
        title: '让回归测试重新可信（v2 草稿）',
        summary: '一个会自我纠正的提交前测试回路',
        goal: { quantity: '失败数', criterion: '回归测试失败数 = 0', current: '5' },
        // T02 规则的 text 是空串；只给 fallbackText，host 必须补成合法非空 text。
        nextAction: { type: 'measure', fallbackText: '记录一次当前失败数', estimateMin: 5, dueAt: null },
      },
    }),
    'loop.update(patch)',
  ).loop
  assert.equal(updated.title, '让回归测试重新可信（v2 草稿）')
  assert.equal(updated.summary, '一个会自我纠正的提交前测试回路')
  assert.equal(updated.goal.criterion, '回归测试失败数 = 0')
  assert.equal(updated.nextAction.type, 'measure')
  assert.equal(updated.nextAction.text, '记录一次当前失败数', 'host 应用 fallbackText 填充 text')
  assertNextAction(updated, 'measure', '显式 nextAction 后 ')
  assert.equal(updated.version, 1, 'update 不改版本号')
  assert.equal(updated.versions.length, 1, 'update 不追加版本快照')
  assert.ok(Date.parse(updated.updatedAt) >= Date.parse(loop.updatedAt), 'updatedAt 应更新')

  // 平铺形式也接受
  const flat = assertOk(await host.op('loop.update', { id: loop.id, summary: '平铺字段也可以' }), 'loop.update(flat)').loop
  assert.equal(flat.summary, '平铺字段也可以')
  assertNextAction(flat, 'intervene', '未显式给 nextAction 时按规则刷新 ')

  // 版本快照未被后续 update 污染
  let state = await getState(host)
  assert.equal(state.store.loops[loop.id].versions[0].snapshot.title, firstSnapshotTitle, '版本快照被后续修改污染')

  // 反例：status 不是 update 的白名单字段；未知字段；无字段；错误类型；悬空 id
  assertClientError(await host.op('loop.update', { id: loop.id, status: 'paused' }), 'VALIDATION', 'status 不走 update')
  assertClientError(await host.op('loop.update', { id: loop.id, patch: { foo: 1 } }), 'VALIDATION', '未知字段')
  assertClientError(await host.op('loop.update', { id: loop.id }), 'VALIDATION', '没有字段')
  assertClientError(await host.op('loop.update', { id: loop.id, title: '' }), 'VALIDATION', '空标题')
  assertClientError(await host.op('loop.update', { id: loop.id, goal: 123 }), 'VALIDATION', 'goal 类型错误')
  assertStatus(await host.op('loop.update', { id: 'lp_missing', title: 'x' }), 404, '悬空 loop id')

  state = await getState(host)
  assert.equal(state.store.loops[loop.id].title, '让回归测试重新可信（v2 草稿）', '失败的 update 写入了存储')
  assert.equal(Object.keys(state.store.loops).length, 1)
})

/* ─────────────────────────── 完整生命周期 ─────────────────────────── */

test('R7 · 生命周期：干预 → 观察 → 修订 → 第二轮 → 暂停 → 归档（含非法迁移反例）', async (t) => {
  const { host, dataDir, nodeId } = await prepare(t, { label: 'r7-lifecycle' })
  const loop = await createLoop(host)

  // 非法迁移：刚建的 modeled 卡不能直接修订，也不能直接暂停/归档（T02 严格状态机）
  assertClientError(await host.op('loop.revise', { id: loop.id }), 'CONFLICT', 'modeled 不能直接修订')
  assertClientError(await host.op('loop.pause', { id: loop.id }), 'CONFLICT', '暂停只允许 testing→paused')
  assertClientError(await host.op('loop.archive', { id: loop.id }), 'CONFLICT', '归档只允许 paused→archived')

  // 1) 设计一次最小检验：modeled → testing
  const windowStart = new Date(Date.now() - 60_000).toISOString()
  const windowEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const created = assertOk(
    await host.op('intervention.create', {
      loopId: loop.id,
      action: '先写一个会失败的回归测试，再改代码',
      predicted: '回归测试失败数从 5 降到 0',
      criterion: '回归测试失败数 = 0 且没有新增失败',
      windowStart,
      windowEnd,
    }),
    'intervention.create',
  )
  const intervention = created.intervention
  assert.match(intervention.id, /^iv_/, '干预 id 前缀')
  assert.equal(intervention.loopId, loop.id)
  assert.equal(intervention.status, 'planned')
  assert.equal(intervention.predicted, '回归测试失败数从 5 降到 0')
  assert.equal(intervention.windowStart, windowStart)
  assert.equal(intervention.windowEnd, windowEnd)
  assert.equal(created.loop.status, 'testing', '设计检验后卡进入 testing')
  assert.equal(created.loop.nextCheck.interventionId, intervention.id)
  assert.equal(created.loop.nextCheck.criterion, '回归测试失败数 = 0 且没有新增失败')
  assert.equal(created.loop.nextCheck.windowEnd, windowEnd)
  assertNextAction(created.loop, 'observe', '设计检验后 ')
  assert.equal(created.loop.nextAction.dueAt, windowEnd)

  // 反例：testing 时不能再建第二个干预；缺字段 / 悬空卡被拒
  assertClientError(await host.op('intervention.create', { loopId: loop.id, action: 'x', predicted: 'y' }), 'CONFLICT', 'testing 不能重复设计检验')
  assertClientError(await host.op('intervention.create', { loopId: loop.id, predicted: 'y' }), 'VALIDATION', '缺 action')
  assertStatus(await host.op('intervention.create', { loopId: 'lp_none', action: 'x', predicted: 'y' }), 404, '悬空 loopId')

  // 2) 结束干预
  const finished = assertOk(await host.op('intervention.finish', { id: intervention.id, status: 'done' }), 'intervention.finish').intervention
  assert.equal(finished.status, 'done')
  assertClientError(await host.op('intervention.finish', { id: intervention.id, status: 'done' }), 'CONFLICT', '不能重复结束')
  assertClientError(await host.op('intervention.finish', { id: intervention.id, status: 'bogus' }), 'VALIDATION', '非法结束状态')
  assertStatus(await host.op('intervention.finish', { id: 'iv_none', status: 'done' }), 404, '悬空干预')

  // 3) 观察 verdict 强制：缺失 / 不在白名单都不允许保存
  assertClientError(await host.op('observation.create', { loopId: loop.id }), 'VALIDATION', '缺少 compare')
  assertClientError(
    await host.op('observation.create', { loopId: loop.id, compare: { prediction: '失败数 = 0' } }),
    'VALIDATION',
    '缺少 verdict',
  )
  assertClientError(
    await host.op('observation.create', { loopId: loop.id, compare: { prediction: '失败数 = 0', verdict: 'maybe' } }),
    'VALIDATION',
    '非法 verdict',
  )
  let state = await getState(host)
  assert.equal(Object.keys(state.store.observations).length, 0, '非法观察写入了存储')
  assert.equal(state.store.loops[loop.id].status, 'testing', '非法观察改变了卡状态')

  // 反例：悬空 loopId / 悬空 interventionId / 跨卡干预 / 悬空证据
  assertStatus(await host.op('observation.create', { loopId: 'lp_none', compare: { verdict: 'supported' } }), 404, '悬空 loopId')
  assertStatus(
    await host.op('observation.create', { loopId: loop.id, interventionId: 'iv_none', compare: { verdict: 'supported' } }),
    404,
    '悬空 interventionId',
  )
  assertClientError(
    await host.op('observation.create', {
      loopId: loop.id,
      evidenceRefs: [{ kind: 'note', id: 'n_none' }],
      compare: { verdict: 'supported' },
    }),
    'NOT_FOUND',
    '悬空证据引用',
  )
  const anotherLoop = await createLoop(host)
  const anotherIntervention = assertOk(
    await host.op('intervention.create', { loopId: anotherLoop.id, action: '另一个动作', predicted: '另一个预测' }),
    'intervention.create(another)',
  ).intervention
  assertClientError(
    await host.op('observation.create', { loopId: loop.id, interventionId: anotherIntervention.id, compare: { verdict: 'supported' } }),
    'VALIDATION',
    '跨卡干预',
  )

  // 4) 合法观察：testing → reviewing
  const note = assertOk(
    await host.op('note.save', { subject: { kind: 'node', id: nodeId }, kind: '证据', text: '回归测试仍有 3 个失败' }),
    'note.save',
  ).note
  const observed = assertOk(
    await host.op('observation.create', {
      loopId: loop.id,
      interventionId: intervention.id,
      source: 'manual',
      metric: { kind: 'count', value: 3, unit: '个' },
      compare: { prediction: '失败数从 5 降到 0', verdict: 'refuted', reason: '只降到 3 个失败' },
      noteIds: [note.id],
      evidenceRefs: [{ kind: 'note', id: note.id }],
    }),
    'observation.create',
  )
  const observation = observed.observation
  assert.match(observation.id, /^ob_/, '观察 id 前缀')
  assert.equal(observation.loopId, loop.id)
  assert.equal(observation.interventionId, intervention.id)
  assert.equal(observation.compare.verdict, 'refuted')
  assert.equal(observation.metric.unit, '个')
  assert.deepEqual(observation.noteIds, [note.id])
  assert.equal(observed.loop.status, 'reviewing', '回填观察后卡进入 reviewing')
  assertNextAction(observed.loop, 'revise', '回填观察后 ')
  // reviewing 状态下不允许再回填一条观察（一个检验一个判定）
  assertClientError(await host.op('observation.create', { loopId: loop.id, compare: { verdict: 'supported' } }), 'CONFLICT', 'reviewing 不能重复回填')

  // 5) 修订出新版本：reviewing → revised
  const revised = assertOk(
    await host.op('loop.revise', {
      id: loop.id,
      changeSummary: '把判据收窄成“没有新增失败”',
      patch: { hypothesis: { claim: '主要是缺回归测试', counter: '也可能是环境不稳定', falsifier: '若先写测试失败数仍不降' } },
    }),
    'loop.revise',
  ).loop
  assert.equal(revised.version, 2, '修订版本 +1')
  assert.equal(revised.status, 'revised')
  assert.equal(revised.versions.length, 2, '版本历史两条')
  assert.equal(revised.versions[1].version, 2)
  assert.equal(revised.versions[1].changeSummary, '把判据收窄成“没有新增失败”')
  assert.equal(revised.versions[1].snapshot.status, 'revised')
  assert.equal(revised.versions[1].snapshot.versions, undefined)
  assert.equal(revised.nextCheck, null, '修订后旧的 nextCheck 应清空')
  assertNextAction(revised, 'intervene', '修订后 ')
  assert.ok(revised.nextAction.text.includes('下一次检验'), '修订后 nextAction 应指向设计下一次检验')
  assert.equal(revised.hypothesis.falsifier, '若先写测试失败数仍不降')
  // 修订后继续改卡，旧版本快照不能被污染
  const revisedTitle = revised.title
  assertOk(await host.op('loop.update', { id: loop.id, title: '修订后我又改了标题' }), 'loop.update(after revise)')
  state = await getState(host)
  assert.equal(state.store.loops[loop.id].versions[1].snapshot.title, revisedTitle, '旧版本快照被后续修改污染')
  assertClientError(await host.op('loop.revise', { id: loop.id }), 'CONFLICT', 'revised 不能连续修订')

  // 6) 第二轮：revised → testing → paused → archived
  const second = assertOk(
    await host.op('intervention.create', { loopId: loop.id, action: '第二轮：先补环境说明再跑', predicted: '失败数降到 0' }),
    'intervention.create(second)',
  )
  assert.equal(second.loop.status, 'testing')
  assert.equal(second.loop.nextCheck.interventionId, second.intervention.id)
  assertNextAction(second.loop, 'observe', '第二轮设计检验后 ')
  assertClientError(await host.op('loop.archive', { id: loop.id }), 'CONFLICT', 'testing 不能直接归档')
  const paused = assertOk(await host.op('loop.pause', { id: loop.id }), 'loop.pause').loop
  assert.equal(paused.status, 'paused')
  assertNextAction(paused, 'answer', '暂停后 ')
  assertClientError(await host.op('loop.pause', { id: loop.id }), 'CONFLICT', '不能重复暂停')
  const archived = assertOk(await host.op('loop.archive', { id: loop.id }), 'loop.archive').loop
  assert.equal(archived.status, 'archived')
  assertNextAction(archived, 'pause', '归档后 ')
  assert.ok(archived.nextAction.text.includes('归档'), '归档后的 nextAction 应说明卡已归档')
  assertClientError(await host.op('loop.archive', { id: loop.id }), 'CONFLICT', '不能重复归档')
  assertClientError(await host.op('loop.pause', { id: loop.id }), 'CONFLICT', '归档后不能暂停')
  assertClientError(await host.op('loop.revise', { id: loop.id }), 'CONFLICT', '归档后不能修订')
  assertStatus(await host.op('loop.pause', { id: 'lp_missing' }), 404, '悬空卡不能暂停')

  // 7) 落盘核对：内存与磁盘一致，旧观察永远保留
  state = await getState(host)
  const disk = await readStateFile(dataDir)
  assert.equal(state.store.loops[loop.id].status, 'archived')
  assert.equal(disk.loops[loop.id].status, 'archived')
  assert.equal(disk.loops[loop.id].version, 2)
  assert.equal(Object.keys(disk.observations).length, 1)
  assert.equal(disk.observations[observation.id].compare.verdict, 'refuted')
  assert.equal(disk.interventions[intervention.id].status, 'done')
  assert.equal(Object.keys(disk.interventions).length, 3, '两张卡各一轮干预 + 本轮一条（另一张卡 1 条）')

  // 8) package.* v3：导出包含新表，预览可通过
  const pack = assertOk(await host.op('package.export', {}), 'package.export').pack
  assert.ok(pack.tables.loops[loop.id], '导出包缺少掌控卡')
  assert.ok(pack.tables.observations[observation.id], '导出包缺少观察')
  assert.ok(pack.tables.interventions[intervention.id], '导出包缺少干预')
  const preview = assertOk(await host.op('package.preview', { pack }), 'package.preview')
  assert.equal(preview.preview.ok, true, '导出的 v3 包应能通过预览校验')

  // 9) 导出包 → 干净数据目录导入：掌控卡/干预/观察不丢
  const target = await createHost(t, { label: 'r7-import-target' })
  assertOk(await target.host.op('package.import', { pack, mode: 'merge' }), 'package.import(v3)')
  const importedState = await getState(target.host)
  assert.equal(importedState.store.loops[loop.id].status, 'archived', '导入后掌控卡不可读')
  assert.equal(importedState.store.loops[loop.id].version, 2)
  assert.equal(importedState.store.observations[observation.id].compare.verdict, 'refuted', '导入后观察不可读')
  assert.equal(importedState.store.interventions[intervention.id].status, 'done', '导入后干预不可读')
})

/* ─────────────────────────── 首页导航 ─────────────────────────── */

test('R7 · view.setActive 校验 screen 与卡引用，并记录 lastOpenedAt', async (t) => {
  const { host } = await prepare(t, { label: 'r7-view' })
  const loop = await createLoop(host)
  assertClientError(await host.op('view.setActive', {}), 'VALIDATION', '缺少 screen')
  assertClientError(await host.op('view.setActive', { screen: 'nowhere', activeLoopId: null }), 'VALIDATION', '非法 screen')
  assertStatus(await host.op('view.setActive', { screen: 'loop', activeLoopId: 'lp_none' }), 404, '悬空卡')
  assertClientError(await host.op('view.setActive', { screen: 'loop', activeLoopId: 42 }), 'VALIDATION', '非字符串 id')

  const active = assertOk(await host.op('view.setActive', { screen: 'loop', activeLoopId: loop.id }), 'view.setActive')
  assert.equal(active.view.screen, 'loop')
  assert.equal(active.view.activeLoopId, loop.id)
  let state = await getState(host)
  assert.match(state.store.loops[loop.id].lastOpenedAt, ISO, '打开卡应记录 lastOpenedAt')

  const home = assertOk(await host.op('view.setActive', { screen: 'home', activeLoopId: null }), 'view.setActive(home)')
  assert.equal(home.view.screen, 'home')
  assert.equal(home.view.activeLoopId, null)
  state = await getState(host)
  assert.equal(state.store.view.activeLoopId, null)
})

/* ─────────────────────────── 写盘失败不污染 ─────────────────────────── */

test('R7 · 写盘失败返回 507：内存与磁盘不污染，恢复后下一次写入成功', async (t) => {
  const { host, dataDir } = await prepare(t, { label: 'r7-writefail' })
  const first = await createLoop(host)
  const baseline = await getState(host)
  assert.deepEqual(Object.keys(baseline.store.loops), [first.id])

  // 把 state.json 换成同名目录：rename 会失败，且旧的已提交状态没有变。
  await breakStateWrite(dataDir)

  const failedCreate = await host.op('loop.createFromAnswers', { answers: { goal: '写盘失败时不该出现的卡' } })
  assert.equal(failedCreate.status, 507, '写失败应映射为 507')
  assert.equal(failedCreate.body.ok, false)
  assert.equal(failedCreate.body.code, 'STORAGE_WRITE')

  let afterFail = await getState(host)
  assert.deepEqual(Object.keys(afterFail.store.loops), [first.id], '失败写入污染了内存 loops')
  assert.equal(afterFail.store.loops[first.id].title, first.title)
  assert.ok(afterFail.lastError, '失败应记录 lastError')

  const failedUpdate = await host.op('loop.update', { id: first.id, title: '不该生效的标题' })
  assert.equal(failedUpdate.status, 507)
  afterFail = await getState(host)
  assert.equal(afterFail.store.loops[first.id].title, first.title, '失败写入改了内存里的卡')

  // 恢复写能力：下一次提交应成功，磁盘回到一致状态。
  await fixStateWrite(dataDir)
  const recovered = await createLoop(host, { title: '恢复后的新卡' })
  const finalState = await getState(host)
  assert.equal(Object.keys(finalState.store.loops).length, 2, '恢复后应有旧卡 + 新卡')
  assert.ok(finalState.store.loops[recovered.id], '恢复后的写入没生效')
  assert.equal(finalState.store.loops[first.id].title, first.title, '旧卡内容被失败写入篡改')
  const disk = await readStateFile(dataDir)
  assert.equal(Object.keys(disk.loops).length, 2)
  assert.equal(disk.loops[first.id].title, first.title)
  assert.equal(disk.loops[recovered.id].status, 'modeled')
})

/* ─────────────────────────── agent 权限边界 ─────────────────────────── */

test('R7 · agent 工具只读卡与今天，写 observation verdict 被明确拒绝', async (t) => {
  const { host, nodeId } = await prepare(t, { label: 'r7-agent' })
  const loop = await createLoop(host)

  // 工具定义里能看到只读动作；没有能写 verdict 的写入动作
  const definition = host.tool('loop_atlas')
  assert.ok(definition.parameters.properties.action.enum.includes('read_loops'))
  assert.ok(definition.parameters.properties.action.enum.includes('read_today'))

  const readLoops = await host.callTool('loop_atlas', { action: 'read_loops' })
  assert.equal(readLoops.ok, true)
  assert.equal(readLoops.readOnly, true)
  assert.equal(readLoops.count, 1)
  assert.equal(readLoops.loops[0].id, loop.id)
  assert.equal(readLoops.activeLoopId, null)

  const before = await getState(host)

  // 没有激活卡时 read_today 是空视图，而不是报错
  const emptyToday = await host.callTool('loop_atlas', { action: 'read_today' })
  assert.equal(emptyToday.ok, true)
  assert.equal(emptyToday.loop, null)
  assert.deepEqual(emptyToday.gaps, [])
  assert.equal(emptyToday.nextAction, null)

  assertOk(await host.op('view.setActive', { screen: 'loop', activeLoopId: loop.id }), 'view.setActive')
  const today = await host.callTool('loop_atlas', { action: 'read_today' })
  assert.equal(today.ok, true)
  assert.equal(today.readOnly, true)
  assert.equal(today.loop.id, loop.id)
  assert.deepEqual(today.gaps, loop.gaps)
  assert.equal(today.nextAction.type, 'intervene')
  assert.ok(Array.isArray(today.observations))

  // agent 不能替用户写观察 verdict：动作被拒、参数被拒、数据不变
  const deniedByAction = await host.callTool('loop_atlas', {
    action: 'save_observation',
    compare: { prediction: '失败数 = 0', verdict: 'supported' },
  })
  assert.equal(deniedByAction.ok, false)
  assert.equal(deniedByAction.code, 'FORBIDDEN')
  assert.match(deniedByAction.error, /只能由用户本人/)

  const deniedByVerdictArg = await host.callTool('loop_atlas', { action: 'read_today', verdict: 'supported' })
  assert.equal(deniedByVerdictArg.ok, false)
  assert.equal(deniedByVerdictArg.code, 'FORBIDDEN')

  const deniedPlain = await host.callTool('loop_atlas', { action: 'save_observation', loopId: loop.id })
  assert.equal(deniedPlain.code, 'FORBIDDEN')

  const after = await getState(host)
  assert.deepEqual(after.store.observations, before.store.observations, 'agent 被拒后仍写入了观察')
  assert.equal(Object.keys(after.store.observations).length, 0)

  // 只读工具不产生写入；已有写权限（save_note）保持不变
  assert.deepEqual(
    Object.values(after.store.loops).map((item) => [item.id, item.updatedAt]),
    Object.values(before.store.loops).map((item) => [item.id, item.updatedAt]),
    '只读工具改动了掌控卡',
  )
  const note = await host.callTool('loop_atlas', { action: 'save_note', subject: { kind: 'node', id: nodeId }, text: 'agent 可以写笔记' })
  assert.equal(note.ok, true)
  assert.equal(note.note.authorSource, 'ai-draft', 'agent 笔记仍标记为 ai-draft')
})

test('R7 · GET /health 报告真实 schemaVersion（T01 遗留漂移修复）', async (t) => {
  const { host } = await createHost(t, { label: 'health' })
  const res = await host.get('/api/loop-atlas/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.equal(res.body.schemaVersion, SCHEMA_VERSION, '/health 的 schemaVersion 必须来自 domain 常量')
})
