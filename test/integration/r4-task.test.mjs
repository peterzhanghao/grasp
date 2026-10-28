/**
 * R4 · 会积累的应用：任务草案 / 版本 / 概念证据关联 / 导出→干净空间导入 / 冲突显式 / 不自动外发
 *
 * 模型是假 llm fixture（返回固定 JSON 草案）；真实模型生成质量由 Lead 实机验收。
 * 运行：node --test test/integration/r4-task.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHost, pickIds, getCore, getState, assertOk } from './helpers.mjs'
import { createLlmFixture, success } from '../harness/llm-fixture.mjs'

const DRAFT_JSON = JSON.stringify({
  title: '让实验记录可复跑',
  goal: '用户改参数后，能回看同一参数的运行结果与判定',
  acceptance: [
    { text: '运行记录包含 modelId/modelVersion/params/criterion', evidence: 'experiment.list 能取到这些字段' },
    { text: '同一参数复跑得到相同 metrics', evidence: '两次 run 的 metrics 深度相等' },
  ],
  boundary: ['不自动把任务发送到任何外部服务', '不修改公共内容包里的主张与来源'],
  unknowns: [{ question: '参数范围要不要限制在 K∈[0,5]、D∈[0,2]？' }, { question: '旧运行记录要不要迁移？' }],
  conceptIds: [],
})

function queueDraft(llm, conceptIds) {
  const payload = JSON.parse(DRAFT_JSON)
  payload.conceptIds = conceptIds
  llm.enqueue(success(JSON.stringify(payload)))
}

test('R4 · 任务草案：真实需求 → 三部分 → 保存/版本/归档', async (t) => {
  const { host, llm } = await createHost(t, { label: 'r4-draft' })
  const core = await getCore(host)
  const { nodeId, node } = pickIds(core)
  // 契约 TaskDraft.conceptIds 是概念节点 id（关系用 subject / evidenceRefs 关联）
  const conceptId = nodeId
  queueDraft(llm, [conceptId])

  const requestText = '我希望改完实验参数以后，还能看到上次同一组参数的结果，不想每次重新调'
  const draftResponse = assertOk(await host.op('task.draft', { requestText, subject: { kind: 'node', id: nodeId } }), 'task.draft')
  const draft = draftResponse.draft
  assert.ok(draft.title, 'draft.title 缺失')
  assert.ok(draft.goal, 'draft.goal 缺失')
  assert.ok(Array.isArray(draft.acceptance) && draft.acceptance.length >= 1, 'draft.acceptance 缺失')
  assert.ok(draft.acceptance.every((item) => item.text && item.evidence !== undefined), 'acceptance 项缺少 text/evidence')
  assert.ok(Array.isArray(draft.boundary) && draft.boundary.length >= 1, 'draft.boundary 缺失')
  assert.ok(Array.isArray(draft.unknowns) && draft.unknowns.length >= 1, 'draft.unknowns 缺失（未知项应以问题出现）')
  assert.ok(draft.unknowns.every((item) => item.question), 'unknowns 不是问题形式')
  assert.ok(draft.conceptIds.includes(conceptId), 'draft.conceptIds 未过滤保留合法概念')
  assert.ok(String(draft.request || '').length > 0, 'draft.request 缺失（必须保留用户真实需求原文）')
  assert.equal(draftResponse.model?.provider, 'fake-provider', 'task.draft 未报告真实模型来源')

  // 保存后落盘、可回看版本（evidenceRefs 契约 only note|experiment|prediction）
  const evidenceNote = assertOk(await host.op('note.save', { subject: { kind: 'node', id: nodeId }, kind: '证据', text: '任务草案关联的证据笔记' }), 'note.save(evidence)').note
  const evidenceRefs = [{ kind: 'note', id: evidenceNote.id }]
  const saved = assertOk(
    await host.op('task.save', {
      ...draft,
      request: requestText,
      evidenceRefs,
      conceptIds: [conceptId],
    }),
    'task.save',
  ).task
  assert.ok(saved.id, '缺少 task.id')
  assert.equal(saved.request, requestText, 'task.request 未保存用户原文')
  assert.equal(saved.revision, 1, '首次保存 revision')
  assert.equal(saved.revisions.length, 1, 'revisions 记录')
  assert.deepEqual(saved.conceptIds, [conceptId], '概念关联丢失')
  assert.deepEqual(saved.evidenceRefs, evidenceRefs, '证据关联丢失')

  // 修订：第二次保存产生新版本快照
  const edited = assertOk(
    await host.op('task.save', {
      ...saved,
      id: saved.id,
      request: requestText,
      goal: '修订后目标：任何一次运行都能被同一参数精确复现',
      acceptance: draft.acceptance,
      boundary: draft.boundary,
      unknowns: draft.unknowns,
      conceptIds: saved.conceptIds,
      evidenceRefs: saved.evidenceRefs,
    }),
    'task.save(edit)',
  ).task
  assert.equal(edited.revision, 2, '第二次保存 revision')
  assert.equal(edited.revisions.length, 2, '修订快照数量')
  assert.equal(edited.revisions[1].snapshot.goal, edited.goal, '修订快照与当前内容不一致')
  assert.equal(edited.createdAt, saved.createdAt, 'revision 更新不应改 createdAt')
  assert.equal(edited.title, saved.title, '标题未被改动')

  // 非法概念引用与非法证据引用都必须被拒绝且不写入
  const beforeCount = Object.keys((await getState(host)).store.tasks).length
  const badConcept = await host.op('task.save', { ...saved, id: undefined, conceptIds: ['no-such-node-xyz'] })
  assert.ok(badConcept.status >= 400 && badConcept.status < 500, '非法概念引用应 4xx，实际 ' + badConcept.status)
  assert.equal(badConcept.body?.code, 'NOT_FOUND', '非法概念引用错误码')
  const badEvidence = await host.op('task.save', { ...saved, id: undefined, evidenceRefs: [{ kind: 'note', id: 'n_missing_xyz' }] })
  assert.ok(badEvidence.status >= 400 && badEvidence.status < 500, '悬空证据引用应 4xx，实际 ' + badEvidence.status)
  assert.equal((await getState(host)).store.tasks ? Object.keys((await getState(host)).store.tasks).length : 0, beforeCount, '非法任务写入存储')

  // 归档
  const archived = assertOk(await host.op('task.archive', { id: saved.id, status: 'archived' }), 'task.archive').task
  assert.equal(archived.status, 'archived')
  assert.equal(node?.id, nodeId)
  return { taskId: saved.id, revision: edited.revision }
})

test('R4 · 导出 → 干净数据目录导入 → 任务与证据可读、实验可复跑', async (t) => {
  const source = await createHost(t, { label: 'r4-export-src' })
  const sourceCore = await getCore(source.host)
  const { nodeId } = pickIds(sourceCore)
  queueDraft(source.llm, [nodeId])
  const draft = assertOk(await source.host.op('task.draft', { requestText: '我要把一次运行完整复现出来' }), 'task.draft').draft
  const task = assertOk(await source.host.op('task.save', { ...draft, request: '我要把一次运行完整复现出来', conceptIds: [nodeId] }), 'task.save').task
  const note = assertOk(await source.host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '导出前的证据笔记' }), 'note.save').note
  const run = assertOk(await source.host.op('experiment.run', { experimentId: 'delay', params: { K: 3, D: 1.5 }, subject: { kind: 'node', id: nodeId } }), 'experiment.run').run
  const pack = assertOk(await source.host.op('package.export', {}), 'package.export').pack

  const target = await createHost(t, { label: 'r4-export-dst' })
  assertOk(await target.host.op('package.import', { pack, mode: 'merge' }), 'package.import')
  const state = await getState(target.host)
  assert.equal(state.store.tasks[task.id]?.goal, task.goal, '导入后任务不可读')
  assert.equal(state.store.notes[note.id]?.text, '导出前的证据笔记', '导入后证据笔记不可读')
  const importedRun = state.store.experiments[run.id]
  assert.ok(importedRun, '导入后实验记录不可读')
  assert.deepEqual(importedRun.params, { K: 3, D: 1.5 }, '导入后实验参数丢失')

  // 可跑：用导入记录里的参数重新运行，metrics 与原记录一致
  const rerun = assertOk(await target.host.op('experiment.run', { experimentId: 'delay', params: importedRun.params, subject: { kind: 'node', id: nodeId } }), 'rerun')
  assert.deepEqual(rerun.run.observation.metrics, importedRun.observation.metrics, '干净空间复跑 metrics 不一致')
  assert.equal(rerun.run.verdict, importedRun.verdict, '干净空间复跑判定不一致')

  // 任务回看入口（agent 工具 list_tasks）也能读到
  const listTool = await target.host.callTool('loop_atlas', { action: 'list_tasks' })
  assert.equal(listTool.ok, true, 'list_tasks 失败')
  assert.ok(listTool.tasks.some((item) => item.id === task.id), 'list_tasks 读不到导入任务')

  // 冲突显式：同 id 不同内容导入必须 409，且不静默覆盖
  const conflicting = JSON.parse(JSON.stringify(pack))
  conflicting.tables.tasks[task.id].title = '被篡改的标题'
  const conflict = await target.host.op('package.import', { pack: conflicting, mode: 'merge' })
  assert.equal(conflict.status, 409, '冲突导入应 409，实际 ' + conflict.status + ' ' + JSON.stringify(conflict.body).slice(0, 400))
  assert.equal(conflict.body.code, 'CONFLICT')
  assert.ok((conflict.body.details?.conflicts || []).length >= 1, '冲突清单为空')
  assert.equal((await getState(target.host)).store.tasks[task.id].title, task.title, '冲突导入静默覆盖了任务')
  return { taskId: task.id, runId: run.id }
})

test('R4 · 不自动外发：无 send 类 op、保存与导出不触发模型调用（结构断言）', async (t) => {
  const { host, llm } = await createHost(t, { label: 'r4-no-send' })
  const core = await getCore(host)
  const { nodeId } = pickIds(core)
  queueDraft(llm, [nodeId])
  const draft = assertOk(await host.op('task.draft', { requestText: '我要一个不会自己发出去的任务' }), 'task.draft').draft
  const callsAfterDraft = llm.calls.length

  const task = assertOk(await host.op('task.save', { ...draft, request: '我要一个不会自己发出去的任务' }), 'task.save').task
  assertOk(await host.op('package.export', {}), 'package.export')
  assert.equal(llm.calls.length, callsAfterDraft, '保存/导出任务时调用了模型（可能被用于外发）')

  // 契约里没有发送到外部服务的 op；未知 op 必须被拒绝而不是静默执行
  for (const op of ['task.send', 'package.send', 'task.publish', 'dialog.sendExternal']) {
    const response = await host.op(op, { id: task.id })
    assert.ok(response.status >= 400 && response.status < 500, `${op} 应被拒绝，实际 ${response.status}`)
  }
  const state = await getState(host)
  assert.ok(state.store.tasks[task.id], '任务没有保存到本地状态')
  // 导出包是纯数据，不包含任何外部投递目标字段
  assert.equal(Object.prototype.hasOwnProperty.call(state.store.tasks[task.id], 'sentTo'), false)
  return { draftModelCalls: callsAfterDraft, totalModelCalls: llm.calls.length }
})
