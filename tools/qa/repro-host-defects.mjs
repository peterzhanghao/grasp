#!/usr/bin/env node
/**
 * Host 缺陷最小复现（qa 用，不改产品代码）。
 *
 * 目的：在共享临时目录里从真实 index.js apply() 启动插件，用最小步骤复现 2026-10-28 探针发现的
 * Host 侧问题；每条给出「期望 / 实际」。修复后重跑应全部变成 [FIXED]。
 *
 * 运行：node tools/qa/repro-host-defects.mjs
 * 退出码：0（这是复现证据，不是门禁；门禁是 test/integration + probe-host.mjs）
 */
import { readFile } from 'node:fs/promises'
import { startPlugin, makeTempDataDir, removeTempDir } from '../../test/harness/fake-ctx.mjs'
import { createLlmFixture } from '../../test/harness/llm-fixture.mjs'

const results = []
function record(id, reproduced, title, expected, actual) {
  results.push({ id, reproduced, title, expected, actual })
  const tag = reproduced ? '[REPRODUCED]' : '[FIXED]'
  console.log(`${tag} ${id} ${title}`)
  console.log('    期望：' + expected)
  console.log('    实际：' + actual)
}

async function withHost(fn) {
  const dataDir = await makeTempDataDir('repro')
  const llm = createLlmFixture()
  const host = await startPlugin({ dataDir, llm })
  try {
    return await fn(host, dataDir, llm)
  } finally {
    await host.dispose({ cleanupData: true }).catch(() => {})
    await removeTempDir(dataDir).catch(() => {})
  }
}

async function nodeIdOf(host) {
  const state = (await host.get('/api/loop-atlas/state')).body
  return state.core.nodes.find((node) => node.id === 'feedback')?.id || state.core.nodes[0].id
}

async function main() {
  // R1：对话完成写入被 reconcilePendingDialogs 生成的非法派生消息阻断
  await withHost(async (host, dataDir, llm) => {
    const nodeId = await nodeIdOf(host)
    llm.enqueueSuccess('复现用的回答。')
    const stream = await host.openDialogStream({ subject: { kind: 'node', id: nodeId }, text: '复现对话' })
    const events = await stream.readAll()
    const types = events.map((event) => event.type)
    const errorEvent = events.find((event) => event.type === 'error')
    const disk = JSON.parse(await readFile(dataDir + '/state.json', 'utf8'))
    const dialogEntry = Object.values(disk.dialogs || {})[0]
    const reproduced =
      !types.includes('done') &&
      errorEvent?.code === 'VALIDATION' &&
      String(errorEvent?.error || '').includes('reasoningEffort') &&
      !!dialogEntry?.pending
    record(
      'HOST-1',
      reproduced,
      '对话成功流无法落盘：reconcilePendingDialogs 的派生 assistant 消息缺 model.reasoningEffort，被 schema 拒绝（start 已写 pending，finish 永远失败）',
      '事件含 done；assistant 状态 completed；磁盘 dialog.pending=null',
      `事件类型=${JSON.stringify(types)}；error=${JSON.stringify(errorEvent && { code: errorEvent.code, error: errorEvent.error })}；磁盘 pending=${!!dialogEntry?.pending}；磁盘 messages=${dialogEntry?.messages?.length}`,
    )
    // 连带：pending 残留后，下一次写也会被同样的派生消息卡住
    const next = await host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '后续写入' })
    record(
      'HOST-1b',
      next.status !== 200,
      'HOST-1 的连带影响：pending 残留后所有后续写提交都会被派生消息校验失败卡住',
      'note.save 200 且写入成功',
      `HTTP ${next.status} code=${next.body?.code} error=${String(next.body?.error).slice(0, 160)}`,
    )
  })

  // R2：读路径（GET /state、dialog.get、package.export 等）返回启动时快照
  await withHost(async (host, dataDir) => {
    const nodeId = await nodeIdOf(host)
    const saved = await host.op('view.save', { scale: 'subject', projection: 'history', selectedNodeId: nodeId, rightOpen: false })
    const disk = JSON.parse(await readFile(dataDir + '/state.json', 'utf8'))
    const readBackResponse = await host.get('/api/loop-atlas/state')
    const readBack = readBackResponse.body
    const reproduced =
      saved.body.view.selectedNodeId === nodeId && disk.view.selectedNodeId === nodeId && readBack.store.view.selectedNodeId !== nodeId
    record(
      'HOST-2',
      reproduced,
      'GET /state（以及 dialog.get / experiment.list / package.* 的读路径）返回 storage.ensure() 的启动快照，不随提交更新',
      'GET /state 返回最新已提交 view.selectedNodeId=节点；与磁盘一致',
      `commit 返回 selectedNodeId=${saved.body.view?.selectedNodeId}，磁盘=${disk.view?.selectedNodeId}，GET /state=${readBack.store?.view?.selectedNodeId}（HTTP ${readBackResponse.status}）`,
    )
  })

  // R3：experiment.run green 缺 criterion
  await withHost(async (host) => {
    const response = await host.op('experiment.run', { experimentId: 'green', params: { enabled: {} } })
    record(
      'HOST-3',
      response.status !== 200,
      'experiment.run green 必然 400：runGreen 结果没有 criterion 字段，ops 写入 undefined 被 schema 拒绝',
      'HTTP 200，run.criterion 为字符串判据',
      `HTTP ${response.status} ${JSON.stringify(response.body).slice(0, 320)}`,
    )
  })

  // R4：task.save 不传 model 时默认 model 为 null，被 schema 拒绝
  await withHost(async (host) => {
    const nodeId = await nodeIdOf(host)
    const response = await host.op('task.save', {
      request: '我希望实验记录可以复跑',
      title: 't',
      goal: 'g',
      acceptance: [{ text: 'a', evidence: 'e' }],
      boundary: ['b'],
      unknowns: [{ question: 'q' }],
      conceptIds: [nodeId],
    })
    record(
      'HOST-4',
      response.status !== 200,
      'task.save（契约 ops 表不带 model 字段）默认 model={provider:null,model:null} 被 schema 拒绝',
      'HTTP 200；task.model 为 {provider:"",model:"",reasoningEffort:null} 或沿用最近模型',
      `HTTP ${response.status} ${JSON.stringify(response.body).slice(0, 320)}`,
    )
  })

  // R5：导出 → 原样导入失败（importLog.sourceHash 为 null；pack 未计算 sourceHash）
  await withHost(async (host) => {
    const nodeId = await nodeIdOf(host)
    await host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '导入复现' })
    const pack = (await host.op('package.export', {})).body.pack
    const preview = await host.op('package.preview', { pack })
    const imported = await host.op('package.import', { pack, mode: 'merge' })
    record(
      'HOST-5',
      imported.status !== 200,
      'package.import 原样导出包 400：importLog.sourceHash=null 被 schema 拒绝（validatePack 未提供 sourceHash）',
      'preview.ok=true；import 200 且幂等跳过同 id 同内容',
      `preview HTTP ${preview.status} preview.ok=${preview.body?.preview?.ok} conflicts=${preview.body?.preview?.conflicts?.length}；import HTTP ${imported.status} ${JSON.stringify(imported.body).slice(0, 260)}`,
    )
  })

  // R6：IMPORT_INVALID 未映射 HTTP 状态（错误形状对，但 500）
  await withHost(async (host) => {
    const response = await host.op('package.import', { pack: { kind: 'other', schemaVersion: 2, tables: {} }, mode: 'merge' })
    record(
      'HOST-6',
      response.status === 500 && response.body?.code === 'IMPORT_INVALID',
      'errors.js 的 ERROR_STATUS 没有 IMPORT_INVALID，导致非法包返回 500 而不是 4xx',
      'HTTP 4xx（IMPORT_INVALID 映射到 400），body.code=IMPORT_INVALID',
      `HTTP ${response.status} code=${response.body?.code} error=${String(response.body?.error || '').slice(0, 140)}`,
    )
  })

  const reproduced = results.filter((item) => item.reproduced).length
  console.log(`\n复现汇总：REPRODUCED ${reproduced} / FIXED ${results.length - reproduced}（共 ${results.length}）`)
  return 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    console.error('复现脚本自身异常：', error)
    process.exitCode = 2
  })
