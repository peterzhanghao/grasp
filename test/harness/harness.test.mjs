/**
 * harness 自测：用 test/harness/fixtures/sample-plugin.mjs 验证假 ctx、真实 HTTP 分发、
 * 假模型流与清理语义本身是否可靠（不对产品行为下结论）。
 *
 * 运行：node --test test/harness
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startPlugin, makeTempDataDir, removeTempDir } from './fake-ctx.mjs'
import { createLlmFixture, failure, success, createManualStream, collectChunks } from './llm-fixture.mjs'

const SAMPLE_PLUGIN = fileURLToPath(new URL('./fixtures/sample-plugin.mjs', import.meta.url))
const FIXTURE_ROOT = dirname(SAMPLE_PLUGIN)
const ENTRY = 'sample-plugin.mjs'

async function startFixtureHost({ dataDir, llm, services } = {}) {
  return startPlugin({ root: FIXTURE_ROOT, entry: ENTRY, dataDir, llm, services })
}

test('假 ctx：注册路由/工具、可选注入、HTTP 分发与清理', async (t) => {
  const dataDir = await makeTempDataDir('harness-basic')
  const llm = createLlmFixture()
  const host = await startFixtureHost({ dataDir, llm })
  t.after(async () => {
    await host.dispose({ cleanupData: true })
    await removeTempDir(dataDir)
  })

  assert.equal(host.routeList.length, 1, 'fixture 应注册一个路由')
  assert.deepEqual(host.listTools(), ['fixture_tool'])

  const health = await host.get('/api/fixture/state')
  assert.equal(health.status, 200)
  assert.equal(health.body.ok, true)
  assert.equal(health.body.hasLlm, true, 'llm 服务应被 inject 到')
  assert.equal(health.body.hasSelection, true, 'agentDefaultModel 服务应被 inject 到')
  assert.equal(health.body.selection.provider, 'fake-provider')
  assert.equal(health.body.dataPath, dataDir)

  const echo = await host.post('/api/fixture/echo', { hello: '回路' })
  assert.equal(echo.status, 200)
  assert.deepEqual(echo.body.echo, { hello: '回路' })

  const tool = await host.callTool('fixture_tool', { action: 'ping' })
  assert.deepEqual(tool, { ok: true, action: 'ping', dataDir })

  const missing = await host.get('/api/fixture/nope')
  assert.equal(missing.status, 404)

  const missingPrefix = await host.get('/other')
  assert.equal(missingPrefix.status, 404)
  assert.ok(Array.isArray(missingPrefix.body.routes))
})

test('假 ctx：服务缺失时可选注入跳过，插件本体仍可用', async (t) => {
  const dataDir = await makeTempDataDir('harness-optional')
  const host = await startFixtureHost({
    dataDir,
    services: { tools: false, llm: false, agentDefaultModel: false },
  })
  t.after(async () => {
    await host.dispose({ cleanupData: true })
    await removeTempDir(dataDir)
  })

  assert.deepEqual(host.listTools(), [], 'tools 缺失时不应注册工具')
  assert.ok(host.injectionSkips.length >= 3)
  const state = await host.get('/api/fixture/state')
  assert.equal(state.status, 200)
  assert.equal(state.body.hasLlm, false)
  assert.equal(state.body.hasSelection, false)
})

test('假模型流：成功 / 中途失败 / 取消 / 手动流，chunk 协议符合契约', async () => {
  const llm = createLlmFixture()

  llm.enqueueSuccess('负反馈依靠偏差驱动纠正。', { chunkSize: 4 })
  const ok = await collectChunks(llm.stream({ provider: 'p', model: 'm', messages: [] }))
  assert.equal(ok.text, '负反馈依靠偏差驱动纠正。')
  assert.equal(ok.finish.reason, 'stop')
  assert.ok(ok.chunks.some((chunk) => chunk.type === 'block-start'))
  assert.ok(ok.chunks.some((chunk) => chunk.type === 'block-end'))
  assert.ok(ok.chunks.some((chunk) => chunk.type === 'usage'))

  llm.enqueueFailure({ code: 'AUTH', message: '凭据无效', afterText: '先给一点文本' })
  const fail = await collectChunks(llm.stream({ provider: 'p', model: 'm', messages: [] }))
  assert.equal(fail.text, '先给一点文本')
  assert.equal(fail.finish.reason, 'error')
  assert.equal(fail.finish.failure.code, 'AUTH')

  // 取消：signal.abort() 后流必须尽快以 finish(aborted) 结束
  const controller = new AbortController()
  llm.enqueueSuccess('这是一段很慢的回答，用于取消测试。', { chunkSize: 2, delayMs: 30 })
  const collecting = collectChunks(llm.stream({ provider: 'p', model: 'm', messages: [], signal: controller.signal }))
  setTimeout(() => controller.abort(), 60)
  const aborted = await collecting
  assert.equal(aborted.finish.reason, 'aborted')

  // 手动流：测试可精确控制何时发文本
  const manual = createManualStream()
  llm.enqueue(manual.scenario)
  const iterator = llm.stream({ provider: 'p', model: 'm', messages: [] })
  const first = await iterator.next()
  assert.equal(first.value.type, 'block-start')
  manual.pushText('A').pushText('B')
  const second = await iterator.next()
  assert.deepEqual(second.value, { type: 'text-delta', index: 0, text: 'A' })
  manual.finish()
  const rest = []
  for await (const chunk of iterator) rest.push(chunk)
  assert.equal(rest[rest.length - 1].type, 'finish')
  assert.equal(rest[rest.length - 1].reason, 'stop')

  // 手动流 + signal.abort：必须立刻以 finish(aborted) 结束（宿主取消路径）
  const manualAbort = createManualStream()
  const abortFixture = createLlmFixture()
  abortFixture.enqueue(manualAbort.scenario)
  const abortController = new AbortController()
  const abortIterator = abortFixture.stream({ provider: 'p', model: 'm', messages: [], signal: abortController.signal })
  const abortFirst = await abortIterator.next()
  assert.equal(abortFirst.value.type, 'block-start')
  manualAbort.pushText('取消前文本')
  const abortDelta = await abortIterator.next()
  assert.equal(abortDelta.value.type, 'text-delta')
  abortController.abort()
  const abortRest = []
  for await (const chunk of abortIterator) abortRest.push(chunk)
  assert.equal(abortRest[abortRest.length - 1].type, 'finish')
  assert.equal(abortRest[abortRest.length - 1].reason, 'aborted')

  // 失败场景对象可复用
  const again = await collectChunks(createLlmFixture().stream({ messages: [], provider: 'p', model: 'm' }))
  assert.equal(again.finish.reason, 'stop')
  assert.ok(failure({ code: 'RATE_LIMIT' }).type === 'fail')
  assert.ok(success('x').type === 'success')
})

test('假宿主：对话 NDJSON 流可增量读取（真实 HTTP）', async (t) => {
  const dataDir = await makeTempDataDir('harness-stream')
  const llm = createLlmFixture()
  const host = await startFixtureHost({ dataDir, llm })
  t.after(async () => {
    await host.dispose({ cleanupData: true })
    await removeTempDir(dataDir)
  })

  llm.enqueueSuccess('先看机制，再谈条件。', { chunkSize: 3, delayMs: 0 })
  const stream = await host.openDialogStream(
    { requestId: 'r_test', messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] },
    { path: '/api/fixture/stream' },
  )
  assert.equal(stream.status, 200)
  const start = await stream.next()
  assert.equal(start.type, 'start')
  const rest = await stream.readAll()
  const deltas = rest.filter((event) => event.type === 'delta').map((event) => event.text)
  assert.equal(deltas.join(''), '先看机制，再谈条件。')
  assert.equal(rest[rest.length - 1].type, 'done')
  assert.ok(stream.rawLines.length >= 3, '应有真实 NDJSON 行')
})

test('假宿主：客户端断开连接会关闭响应（req/res close 可达）', async (t) => {
  const dataDir = await makeTempDataDir('harness-disconnect')
  const llm = createLlmFixture()
  const host = await startFixtureHost({ dataDir, llm })
  t.after(async () => {
    await host.dispose({ cleanupData: true })
    await removeTempDir(dataDir)
  })

  llm.enqueueSuccess('慢慢输出。', { chunkSize: 1, delayMs: 80 })
  const stream = await host.openDialogStream({ requestId: 'r_disconnect' }, { path: '/api/fixture/stream' })
  const first = await stream.next()
  assert.equal(first.type, 'start')
  stream.abort()
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 200))
  assert.ok(stream.error || stream.ended || stream.events.length >= 1, '断开后流应结束')
})

test('临时数据目录保险：拒绝真实用户数据目录', async () => {
  await assert.rejects(() => startPlugin({ dataDir: 'D:/plug-in/loop-atlas-data' }), /拒绝写入真实用户数据目录/)
  await assert.rejects(() => startPlugin({ dataDir: 'D:/plug-in/loop-atlas-data/sub' }), /拒绝写入真实用户数据目录/)
})

test('fixture 插件文件可读（防止 root 解析错误）', async () => {
  const source = await readFile(SAMPLE_PLUGIN, 'utf8')
  assert.ok(source.includes('export function apply'))
})
