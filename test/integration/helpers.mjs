/**
 * 集成测试共用工具：临时数据目录 + 假宿主 + 常用断言。
 * 只在 test/integration 使用。
 */
import assert from 'node:assert/strict'
import { startPlugin, makeTempDataDir, removeTempDir, readStateFile } from '../harness/fake-ctx.mjs'
import { createLlmFixture } from '../harness/llm-fixture.mjs'

export { readStateFile, makeTempDataDir, removeTempDir }

export const nowIso = () => new Date().toISOString()

/** 起一个隔离 host；t.after 自动清理。 */
export async function createHost(t, options = {}) {
  const dataDir = options.dataDir || (await makeTempDataDir('it-' + sanitize(options.label || 'host')))
  const llm = options.llm || createLlmFixture()
  const host = await startPlugin({
    ...options,
    dataDir,
    llm,
  })
  t.after(async () => {
    await host.dispose({ cleanupData: !options.keepData }).catch(() => {})
    if (!options.keepData) await removeTempDir(dataDir).catch(() => {})
  })
  return { host, dataDir, llm }
}

function sanitize(label) {
  return String(label).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 24)
}

/** 读取 /state 的完整响应体（含 core/store/dataPath/model/capabilities/lastWrite 等）。 */
export async function getState(host) {
  const response = await host.get('/api/loop-atlas/state')
  assert.equal(response.status, 200, 'GET /state HTTP 状态')
  return response.body
}

/** 只取内容包 core。 */
export async function getCore(host) {
  const body = await getState(host)
  assert.ok(body.core, '/state 没有返回 core（fatal=' + JSON.stringify(body.fatal) + '）')
  return body.core
}

export function pickIds(core) {
  const nodes = core?.nodes || []
  const node = nodes.find((item) => item.id === 'feedback') || nodes.find((item) => item.id === 'delay') || nodes[0] || null
  const relations = core?.relations || []
  const relation = relations[0] || null
  const secondNode = nodes.find((item) => item.id !== node?.id) || null
  return {
    nodeId: node?.id || null,
    node,
    relationId: relation?.id || null,
    relation,
    secondNodeId: secondNode?.id || null,
  }
}

export function assertStatus(response, expected, label) {
  assert.equal(response.status, expected, `${label}：HTTP 状态 ${response.status}（期望 ${expected}）${safeBody(response)}`)
}

export function assertOk(response, label) {
  assert.equal(response.status, 200, `${label}：HTTP 状态 ${response.status}${safeBody(response)}`)
  assert.equal(response.body?.ok, true, `${label}：ok 不为 true${safeBody(response)}`)
  return response.body
}

export function assertClientError(response, expectedCode, label) {
  assert.ok(response.status >= 400 && response.status < 500, `${label}：期望 4xx，实际 ${response.status}${safeBody(response)}`)
  assert.equal(response.body?.ok, false, `${label}：ok 应为 false${safeBody(response)}`)
  if (expectedCode) assert.equal(response.body?.code, expectedCode, `${label}：错误码${safeBody(response)}`)
  return response.body
}

function safeBody(response) {
  try {
    return ' | ' + JSON.stringify(response.body).slice(0, 600)
  } catch {
    return ''
  }
}

/** 打开对话流并读完；返回 { status, events, deltas, doneEvent, errorEvent }。 */
export async function readDialog(host, body, options = {}) {
  const stream = await host.openDialogStream(body, options)
  const events = await stream.readAll(options)
  const deltas = events.filter((event) => event.type === 'delta').map((event) => event.text)
  const startEvent = events.find((event) => event.type === 'start') || null
  const doneEvent = events.find((event) => event.type === 'done') || null
  const errorEvent = events.find((event) => event.type === 'error') || null
  return { stream, events, deltas, text: deltas.join(''), startEvent, doneEvent, errorEvent }
}

export async function getDialog(host, subject) {
  const response = await host.op('dialog.get', { subject })
  assertOk(response, 'dialog.get')
  return response.body
}

export function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

export async function waitUntil(predicate, { timeoutMs = 5000, label = '条件' } = {}) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return true
    await sleep(20)
  }
  throw new Error(`等待${label}超时`)
}
