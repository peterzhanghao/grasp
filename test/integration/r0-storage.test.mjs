/**
 * R0 · 提交队列 / 写失败恢复 / 只读降级（契约 §4 提交语义 1—3，§7 R0）
 *
 * 用假宿主启动真实 Host；数据目录一律临时目录，不触碰真实用户数据。
 * 写失败注入方式：把 state.json 设为只读（Windows 上 rename 覆盖只读目标会 EPERM），
 * 旧磁盘内容因此完全保留——用于验证"失败不污染内存、下一次写可恢复"。
 *
 * 运行：node --test test/integration/r0-storage.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHost, pickIds, getCore, getState, assertOk } from './helpers.mjs'
import {
  setStateFileReadOnly,
  readStateFile,
  listDataDir,
  makeTempDataDir,
  removeTempDir,
} from '../harness/fake-ctx.mjs'

async function corruptDataDir(t, label, text) {
  const dataDir = await makeTempDataDir('it-corrupt-' + label)
  await writeFile(join(dataDir, 'state.json'), text, 'utf8')
  t.after(() => removeTempDir(dataDir).catch(() => {}))
  return dataDir
}

test('R0 · 写失败：507 STORAGE_WRITE、内存与磁盘不变、无临时文件残留', async (t) => {
  const { host, dataDir } = await createHost(t, { label: 'storage-fail' })
  const core = await getCore(host)
  const { nodeId } = pickIds(core)
  assert.ok(nodeId, '内容包没有节点 id')

  const baseline = assertOk(await host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '基线笔记' }), 'baseline save')
  const beforeCount = Object.keys((await getState(host)).store.notes).length
  const diskBefore = await readFile(join(dataDir, 'state.json'), 'utf8')

  await setStateFileReadOnly(dataDir, true)
  let failed
  try {
    failed = await host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '这次写入应失败' })
  } finally {
    await setStateFileReadOnly(dataDir, false)
  }
  assert.equal(failed.status, 507, '失败写 HTTP 状态应为 507（STORAGE_WRITE），实际 ' + failed.status + ' ' + JSON.stringify(failed.body))
  assert.equal(failed.body.ok, false)
  assert.equal(failed.body.code, 'STORAGE_WRITE', '失败写错误码')
  assert.ok(String(failed.body.error || '').length > 0, '失败回执缺少可读原因')

  const stateAfterFail = await getState(host)
  assert.equal(Object.keys(stateAfterFail.store.notes).length, beforeCount, '失败写污染了内存（GET 读到未提交笔记）')
  assert.ok(stateAfterFail.lastError?.code, 'lastError 未记录真实失败原因')
  assert.notEqual(stateAfterFail.lastError.code, 'UNKNOWN', 'lastError.code 不应是 UNKNOWN')
  const diskAfterFail = await readFile(join(dataDir, 'state.json'), 'utf8')
  assert.equal(diskAfterFail, diskBefore, '失败写改动了磁盘旧内容')
  const leftovers = (await listDataDir(dataDir)).filter((name) => name.endsWith('.tmp'))
  assert.deepEqual(leftovers, [], '失败后残留临时文件：' + JSON.stringify(leftovers))

  // 恢复后第一次写必须成功（队列不能被 rejected 卡死）
  const recovered = assertOk(await host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '恢复后的写入' }), 'recovered save')
  assert.ok(recovered.note?.id)
  const stateAfterRecover = await getState(host)
  assert.equal(Object.keys(stateAfterRecover.store.notes).length, beforeCount + 1, '恢复后的写入没有进入内存状态')
  const disk = await readStateFile(dataDir)
  assert.ok(Object.values(disk.notes).some((note) => note.text === '恢复后的写入'), '恢复后的写入没有落盘')
  assert.equal(stateAfterRecover.lastError, null, '成功写入后 lastError 应清空')
  assert.equal(stateAfterRecover.store.notes[baseline.note.id].text, '基线笔记')
})

test('R0 · 连续多次写失败后队列仍可恢复（不会永远 rejected）', async (t) => {
  const { host, dataDir } = await createHost(t, { label: 'storage-multi-fail' })
  const { nodeId } = pickIds(await getCore(host))

  await setStateFileReadOnly(dataDir, true)
  const failures = []
  try {
    for (let i = 0; i < 3; i += 1) {
      failures.push(await host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '连续失败 ' + i }))
    }
  } finally {
    await setStateFileReadOnly(dataDir, false)
  }
  failures.forEach((failed, index) => {
    assert.equal(failed.status, 507, `连续失败的第 ${index} 次状态：` + failed.status)
    assert.equal(failed.body.code, 'STORAGE_WRITE')
  })
  const recovered = await host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '三次失败后的恢复写入' })
  assert.equal(recovered.status, 200, '连续失败后恢复写应成功：' + JSON.stringify(recovered.body).slice(0, 300))
  const state = await getState(host)
  assert.equal(Object.keys(state.store.notes).length, 1, '恢复后状态应为 1 条笔记，实际 ' + Object.keys(state.store.notes).length)
})

test('R0 · 并发写经过串行队列，不丢更新', async (t) => {
  const { host } = await createHost(t, { label: 'storage-concurrent' })
  const { nodeId, relationId } = pickIds(await getCore(host))
  const targets = [
    { kind: 'node', id: nodeId },
    ...(relationId ? [{ kind: 'relation', id: relationId }] : []),
    { kind: 'node', id: nodeId },
    { kind: 'node', id: nodeId },
    { kind: 'node', id: nodeId },
    { kind: 'node', id: nodeId },
  ].slice(0, 5)
  assert.equal(targets.length, 5)
  const responses = await Promise.all(targets.map((subject, index) => host.op('note.save', { subject, text: '并发笔记 ' + index })))
  responses.forEach((response, index) => {
    assert.equal(response.status, 200, `并发第 ${index} 条写入失败：` + JSON.stringify(response.body).slice(0, 300))
  })
  const state = await getState(host)
  assert.equal(Object.keys(state.store.notes).length, 5, '并发写丢失了更新')
  const revisions = Object.values(state.store.revisions).reduce((sum, list) => sum + list.length, 0)
  assert.equal(revisions, 5, 'revisions 数量不一致')
})

test('R0 · 数据文件损坏 → 只读降级且原文件不被覆盖', async (t) => {
  const original = '{ this is not json'
  const dataDir = await corruptDataDir(t, 'broken', original)
  const { host } = await createHost(t, { label: 'storage-corrupt', dataDir, keepData: true })
  const state = await getState(host)
  assert.equal(state.ok, false, '损坏数据时 ok 应为 false')
  assert.ok(state.fatal, '缺少 fatal 说明')
  assert.equal(state.fatal.code, 'STATE_CORRUPT', 'fatal.code 应为 STATE_CORRUPT，实际 ' + state.fatal.code)
  assert.ok(String(state.fatal.message).length > 0, 'fatal 缺少可读原因')

  const write = await host.op('note.save', { subject: { kind: 'node', id: 'feedback' }, text: '只读时不应写入' })
  assert.equal(write.status, 503, '只读时写操作 HTTP 状态应为 503，实际 ' + write.status)
  assert.equal(write.body.code, 'READ_ONLY', '只读时错误码')
  assert.equal(await readFile(join(dataDir, 'state.json'), 'utf8'), original, '损坏的原文件被改写')
})

test('R0 · 更高 schemaVersion → 只读降级且不覆盖用户文件', async (t) => {
  const original = JSON.stringify({ schemaVersion: 99, notes: {} })
  const dataDir = await corruptDataDir(t, 'newer', original)
  const { host } = await createHost(t, { label: 'storage-newer', dataDir, keepData: true })
  const state = await getState(host)
  assert.equal(state.ok, false)
  assert.equal(state.fatal?.code, 'STATE_NEWER', 'fatal.code 应为 STATE_NEWER，实际 ' + state.fatal?.code)
  const write = await host.op('note.save', { subject: { kind: 'node', id: 'feedback' }, text: 'x' })
  assert.equal(write.body.code, 'READ_ONLY', '写操作应返回 READ_ONLY')
  assert.equal(await readFile(join(dataDir, 'state.json'), 'utf8'), original, '更高版本数据文件被改写')
})
