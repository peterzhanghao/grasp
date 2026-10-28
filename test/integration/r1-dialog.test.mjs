/**
 * R1 · 一条完整学习链 + 主题隔离 + 失败/重试/取消回执（契约 §4 Dialog 流、§7 R1）
 *
 * 模型是 test/harness 的假 llm fixture（chunk 协议与契约一致），不是真模型；
 * 本文件验证 Host 侧的会话状态机、归属与持久化，真实模型对话由 Lead 实机验收。
 *
 * 运行：node --test test/integration/r1-dialog.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { startPlugin } from '../harness/fake-ctx.mjs'
import { createLlmFixture, createManualStream, LLM_FAILURE_CODE_MAP } from '../harness/llm-fixture.mjs'
import { createHost, readDialog, getDialog, pickIds, getCore, getState, assertOk, sleep } from './helpers.mjs'

function messageTexts(dialog, role) {
  return (dialog.messages || []).filter((message) => message.role === role).map((message) => message.text)
}

test('R1 · 完整学习链：选关系 → 流式回答 → 保存证据 → 重开仍在同一 subject', async (t) => {
  const { host, dataDir, llm } = await createHost(t, { label: 'r1-chain', keepData: true })
  const core = await getCore(host)
  const { nodeId, relationId } = pickIds(core)
  const subject = relationId ? { kind: 'relation', id: relationId } : { kind: 'node', id: nodeId }
  assert.ok(subject.id, '内容包没有可用的 subject')

  // 1) 选中关系（用户当前工作对象）
  const view = assertOk(await host.op('view.save', { scale: 'subject', projection: 'theory', selectedRelationId: relationId || null, selectedNodeId: relationId ? null : nodeId }), 'view.save')
  assert.ok(view.view, 'view.save 未返回 view')

  // 2) 真实 HTTP 流式对话（假模型，chunk 协议与契约一致）
  llm.enqueueSuccess('这条关系的条件比结论更重要：延迟大小改变判定。', { chunkSize: 5 })
  const answer = await readDialog(host, { subject, text: '这条关系在什么条件下不成立？' })
  assert.equal(answer.stream.status, 200, '对话流 HTTP 状态')
  assert.ok(answer.startEvent, '缺少 start 事件')
  assert.ok(answer.doneEvent, '缺少 done 事件：' + JSON.stringify(answer.events).slice(0, 500))
  assert.equal(answer.doneEvent.message.status, 'completed')
  assert.equal(answer.doneEvent.message.text, answer.text, 'done 消息与增量不一致')
  assert.ok(answer.startEvent.contextVersion, 'start 缺少 contextVersion')
  assert.equal(answer.startEvent.requestId, answer.doneEvent.message.requestId, 'requestId 前后不一致')

  // 3) 把回答存为人工证据笔记（用户采纳后 authorSource=user）
  const note = assertOk(
    await host.op('note.save', {
      subject,
      kind: '证据',
      text: answer.doneEvent.message.text,
      authorSource: 'user',
      savedBy: 'ui',
    }),
    'note.save',
  )
  assert.equal(note.note.authorSource, 'user')

  // 4) 同一 subject 的对话与证据可读
  const dialogBefore = await getDialog(host, subject)
  assert.equal(dialogBefore.dialog.messages.filter((message) => message.role === 'user').length, 1, 'user 消息数')
  assert.equal(dialogBefore.dialog.messages.filter((message) => message.role === 'assistant' && message.status === 'completed').length, 1, 'completed assistant 数')
  assert.equal(dialogBefore.available, true, '模型可用性')

  // 5) 关闭再打开（模拟刷新/进程重启）：同一 subject 的对话与笔记仍可恢复
  await host.dispose({ cleanupData: false })
  const reopened = await startPlugin({ dataDir, llm: createLlmFixture() })
  t.after(async () => {
    await reopened.dispose({ cleanupData: true }).catch(() => {})
  })
  const dialogAfter = await getDialog(reopened, subject)
  assert.equal(dialogAfter.dialog.messages.length, dialogBefore.dialog.messages.length, '重开后消息数量变化')
  const assistantAfter = dialogAfter.dialog.messages.filter((message) => message.role === 'assistant').pop()
  assert.equal(assistantAfter.text, answer.text, '重开后回答文本变化')
  const stateAfter = await getState(reopened)
  assert.equal(stateAfter.store.notes[note.note.id]?.text, answer.text, '重开后证据笔记丢失')
  if (relationId) {
    assert.equal(stateAfter.store.view?.selectedRelationId, relationId, '重开后选中关系丢失')
  }
  return { subject, requestId: answer.startEvent.requestId, noteId: note.note.id }
})

test('R1 · 失败/重试：真实失败回执、重试不重复 user 消息', async (t) => {
  const { host, llm } = await createHost(t, { label: 'r1-failure' })
  const { nodeId } = pickIds(await getCore(host))
  const subject = { kind: 'node', id: nodeId }

  llm.enqueueFailure({ code: 'RATE_LIMIT', message: '限流（fixture）' })
  const failed = await readDialog(host, { subject, text: '一次会失败的提问' })
  assert.ok(failed.errorEvent, '失败流缺少 error 事件')
  assert.equal(failed.errorEvent.code, LLM_FAILURE_CODE_MAP.RATE_LIMIT, '失败 code 映射')
  assert.ok(String(failed.errorEvent.message || '').length > 0, '失败原因不可读')

  const dialogFailed = await getDialog(host, subject)
  const assistantFailed = dialogFailed.dialog.messages.filter((message) => message.role === 'assistant').pop()
  assert.equal(assistantFailed.status, 'failed', 'assistant 状态应为 failed')
  assert.equal(assistantFailed.error?.code, 'LLM_RATE_LIMIT', '持久化的错误码')

  const userCountBefore = dialogFailed.dialog.messages.filter((message) => message.role === 'user').length
  llm.enqueueSuccess('重试成功的回答。')
  const retried = await readDialog(host, { subject, retryRequestId: failed.startEvent.requestId })
  assert.ok(retried.doneEvent, '重试后缺少 done：' + JSON.stringify(retried.events).slice(0, 500))
  const dialogRetried = await getDialog(host, subject)
  const userCountAfter = dialogRetried.dialog.messages.filter((message) => message.role === 'user').length
  assert.equal(userCountAfter, userCountBefore, '重试重复写入了 user 消息')
  const completed = dialogRetried.dialog.messages.filter((message) => message.role === 'assistant' && message.status === 'completed')
  assert.equal(completed.length, 1, '重试后 completed assistant 数量')
  assert.equal(completed[0].text, '重试成功的回答。')
  return { failedCode: failed.errorEvent.code, userCount: userCountAfter }
})

test('R1 · 取消：CANCELED 回执 + partial 保存 + pending 清空 + 可再次提问', async (t) => {
  const { host, llm } = await createHost(t, { label: 'r1-cancel' })
  const { nodeId } = pickIds(await getCore(host))
  const subject = { kind: 'node', id: nodeId }

  const manual = createManualStream()
  llm.enqueue(manual.scenario)
  const stream = await host.openDialogStream({ subject, text: '慢慢回答，我马上停止' })
  const start = await stream.next()
  assert.equal(start.type, 'start')
  manual.pushText('取消前的部分内容。')
  let delta = null
  for (let i = 0; i < 20 && !delta; i += 1) {
    const event = await stream.next({ timeoutMs: 3000 })
    if (!event) break
    if (event.type === 'delta') delta = event
  }
  assert.ok(delta, '取消前未收到 delta')

  const cancel = await host.post('/api/loop-atlas/dialog/cancel', { requestId: start.requestId })
  assert.equal(cancel.status, 200, 'cancel HTTP 状态')
  const rest = await stream.readAll()
  const error = rest.find((event) => event.type === 'error')
  assert.ok(error, '取消后缺少 error 回执：' + JSON.stringify(rest).slice(0, 400))
  assert.ok(['CANCELED', 'ABORTED'].includes(error.code), '取消回执 code：' + error.code)

  await sleep(200)
  const dialog = (await getDialog(host, subject)).dialog
  const cancelled = dialog.messages.filter((message) => message.role === 'assistant' && message.status === 'cancelled')
  assert.equal(cancelled.length, 1, 'cancelled assistant 数量')
  assert.equal(cancelled[0].partial, true, 'partial 标记')
  assert.ok(String(cancelled[0].text).includes('取消前'), 'partial 文本未保存')
  assert.equal(dialog.pending, null, 'pending 未清空')

  // 取消后可以再次提问，且不会出现 BUSY
  llm.enqueueSuccess('取消之后再问一次，正常回答。')
  const again = await readDialog(host, { subject, text: '取消后再问' })
  assert.ok(again.doneEvent, '取消后再次提问失败：' + JSON.stringify(again.events).slice(0, 400))
  return { cancelCode: error.code, partial: cancelled[0].text }
})

test('R1 · A 生成中切 B 并取消 A：不串题，迟到结果写回发起时的 subject', async (t) => {
  const { host, llm } = await createHost(t, { label: 'r1-ab' })
  const core = await getCore(host)
  const { nodeId, secondNodeId } = pickIds(core)
  assert.ok(secondNodeId, '内容包只有一个节点，无法做 A/B 隔离')
  const subjectA = { kind: 'node', id: nodeId }
  const subjectB = { kind: 'node', id: secondNodeId }

  const manual = createManualStream()
  llm.enqueue(manual.scenario)
  const streamA = await host.openDialogStream({ subject: subjectA, text: 'A 主题的提问' })
  const startA = await streamA.next()
  assert.equal(startA.type, 'start', 'A start')
  manual.pushText('A 主题回答的前半段。')
  await streamA.next()

  // 用户切到 B（UI 选中变化）并发起另一个主题的请求
  llm.enqueueSuccess('B 主题的完整回答。')
  const answerB = await readDialog(host, { subject: subjectB, text: 'B 主题的提问' })
  assert.ok(answerB.doneEvent, 'B 没有 done：' + JSON.stringify(answerB.events).slice(0, 400))

  // A 迟到完成
  manual.pushText('A 主题回答的后半段。')
  try {
    manual.finish()
  } catch {
    /* ignore */
  }
  const eventsA = await streamA.readAll()
  assert.ok(eventsA.find((event) => event.type === 'done'), 'A 没有 done：' + JSON.stringify(eventsA).slice(0, 400))

  const dialogA = (await getDialog(host, subjectA)).dialog
  const dialogB = (await getDialog(host, subjectB)).dialog
  const textA = messageTexts(dialogA, 'assistant').join('\n')
  const textB = messageTexts(dialogB, 'assistant').join('\n')
  assert.ok(textA.includes('A 主题'), 'A 回答未写回 A：' + textA.slice(0, 200))
  assert.ok(textB.includes('B 主题'), 'B 回答未写回 B：' + textB.slice(0, 200))
  assert.ok(!textA.includes('B 主题'), 'A 主题混入 B 的回答')
  assert.ok(!textB.includes('A 主题'), 'B 主题混入 A 的回答')
  assert.equal(messageTexts(dialogA, 'user').join(''), 'A 主题的提问', 'A 的 user 消息归属')
  assert.equal(messageTexts(dialogB, 'user').join(''), 'B 主题的提问', 'B 的 user 消息归属')
  return { subjectA: textA.slice(0, 60), subjectB: textB.slice(0, 60) }
})

test('R1 · 同一 subject 同时只允许一个进行中请求（BUSY，不写第二条 user 消息）', async (t) => {
  const { host, llm } = await createHost(t, { label: 'r1-busy' })
  const { nodeId } = pickIds(await getCore(host))
  const subject = { kind: 'node', id: nodeId }

  const manual = createManualStream()
  llm.enqueue(manual.scenario)
  const first = await host.openDialogStream({ subject, text: '第一条进行中' })
  const start = await first.next()
  assert.equal(start.type, 'start')
  const userCountDuring = (await getDialog(host, subject)).dialog.messages.filter((message) => message.role === 'user').length
  assert.equal(userCountDuring, 1, '进行中请求的 user 消息数')

  const second = await host.openDialogStream({ subject, text: '第二条应被拒绝' })
  const events = await second.readAll()
  const error = events.find((event) => event.type === 'error')
  assert.ok(error, '第二条请求缺少错误事件：' + JSON.stringify(events).slice(0, 300))
  assert.equal(error.code, 'BUSY', '第二条请求 code')
  const userCountAfter = (await getDialog(host, subject)).dialog.messages.filter((message) => message.role === 'user').length
  assert.equal(userCountAfter, 1, '被 BUSY 拒绝的请求不应写入 user 消息')

  await host.post('/api/loop-atlas/dialog/cancel', { requestId: start.requestId })
  await first.readAll().catch(() => [])
})

test('R1 · 客户端断开 → 取消模型流并保存 cancelled（不留下 streaming）', async (t) => {
  const { host, llm } = await createHost(t, { label: 'r1-disconnect' })
  const { nodeId } = pickIds(await getCore(host))
  const subject = { kind: 'node', id: nodeId }
  llm.enqueueSlow('很慢的回答，用来模拟用户关闭页面。', { chunkSize: 2, chunkDelayMs: 70 })
  const stream = await host.openDialogStream({ subject, text: '断开测试' })
  const start = await stream.next()
  assert.equal(start.type, 'start')
  const delta = await stream.next({ timeoutMs: 5000 })
  assert.equal(delta.type, 'delta')
  stream.abort()
  await sleep(600)
  const dialog = (await getDialog(host, subject)).dialog
  const terminal = dialog.messages.filter((message) => message.role === 'assistant' && ['cancelled', 'failed'].includes(message.status))
  assert.ok(terminal.length >= 1, '断开后没有保存终态')
  assert.equal(dialog.pending, null, '断开后 pending 未清空')
  assert.equal(dialog.messages.some((message) => message.status === 'streaming'), false, '残留 streaming 消息')
  return { status: terminal[0].status }
})

test('R1 · 模型不可用：先开始、后真实报错、不伪装成功；对话仍可恢复', async (t) => {
  const { host, dataDir } = await createHost(t, { label: 'r1-unavailable', services: { llm: false, agentDefaultModel: false } })
  const core = await getCore(host)
  const { nodeId } = pickIds(core)
  const subject = { kind: 'node', id: nodeId }
  const state = await getState(host)
  assert.equal(state.capabilities?.llm, false, 'capabilities.llm 应如实为 false')

  const stream = await host.openDialogStream({ subject, text: '模型不可用时提问' })
  const events = await stream.readAll()
  const start = events.find((event) => event.type === 'start')
  const error = events.find((event) => event.type === 'error')
  assert.ok(start, '模型不可用时也应有 start 事件')
  assert.ok(error, '缺少 error 事件')
  assert.equal(error.code, 'LLM_UNAVAILABLE', '不可用 code')
  const dialog = await getDialog(host, subject)
  assert.equal(dialog.available, false, 'dialog.get available 应为 false')
  const assistant = dialog.dialog.messages.filter((message) => message.role === 'assistant').pop()
  assert.equal(assistant.status, 'failed', 'assistant 应为 failed 而不是成功')
  assert.equal(assistant.error?.code, 'LLM_UNAVAILABLE', '持久化错误码')
  assert.ok((await getState(host)).store.dialogs[`node:${nodeId}`], '对话没有持久化到 subject 下')
})
