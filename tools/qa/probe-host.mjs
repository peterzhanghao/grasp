#!/usr/bin/env node
/**
 * Host 契约探针（开发期工具，不是验收证据本身）。
 *
 * 用 test/harness 的假宿主从真实 index.js apply() 启动插件，逐项检查 docs/refactor-spec.md
 * 第 0/4 节与第 7 节 R0 硬门槛：
 *   A. 启动/状态/健康接口形状
 *   B. ops 清单逐项（合法调用、错误码、幂等）
 *   C. 对话 NDJSON：成功 / 失败 / 重试 / 取消 / BUSY / A-B 不串题 / 断连
 *   D. 写失败注入：失败不污染内存、下一次写恢复（R0）
 *   E. 导入：非法记录 / 悬空引用 / 冲突显式 / 幂等 / 覆盖需 confirm
 *   F. 迁移 + 备份文件与原文逐字节一致 + 回滚后仍可读（R0）
 *   G. agent 工具：来源标注 ai-draft / savedBy=agent
 *   H. 缺 llm / agentDefaultModel 时的降级
 *
 * 运行：node tools/qa/probe-host.mjs [--json tools/qa/evidence/probe-xxx.json]
 * 退出码：0 = 全部 PASS/SKIP；1 = 存在 FAIL（把失败清单给对应 owner 复现）。
 */
import { mkdir, writeFile, readFile, readdir, stat, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  startPlugin,
  makeTempDataDir,
  removeTempDir,
  breakStateWrite,
  fixStateWrite,
  readStateFile,
  setStateFileReadOnly,
  listDataDir,
} from '../../test/harness/fake-ctx.mjs'
import { createLlmFixture, success, failure, slow, createManualStream, LLM_FAILURE_CODE_MAP } from '../../test/harness/llm-fixture.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const EVIDENCE_DIR = join(HERE, 'evidence')
const now = () => new Date().toISOString()
const results = []
const startedAt = now()

function log(line = '') {
  console.log(line)
}

function record(id, status, title, detail) {
  results.push({ id, status, title, detail: detail === undefined ? null : detail, at: now() })
  const tag = status === 'PASS' ? '[PASS]' : status === 'SKIP' ? '[SKIP]' : '[FAIL]'
  const suffix = status === 'PASS' ? '' : ' :: ' + (typeof detail === 'string' ? detail : JSON.stringify(detail))
  console.log(`${tag} ${id} ${title}${suffix}`)
}

async function check(id, title, fn) {
  try {
    const detail = await fn()
    record(id, 'PASS', title, detail)
    return detail
  } catch (error) {
    record(id, 'FAIL', title, String((error && error.message) || error))
    return undefined
  }
}

function skip(id, title, reason) {
  record(id, 'SKIP', title, reason)
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label} 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`)
}

function section(title) {
  console.log('\n── ' + title + ' ' + '─'.repeat(Math.max(4, 60 - title.length)))
}

function pickIds(core) {
  const node = (core?.nodes || []).find((item) => item.id === 'feedback') || (core?.nodes || [])[0] || null
  const relation = (core?.relations || [])[0] || (core?.edges || [])[0] || null
  return { nodeId: node?.id || null, relationId: relation?.id || null, nodeTitle: node?.title || null }
}

async function rawGet(host, path) {
  return host.get(path)
}

/* ────────────────────────── 主流程 ────────────────────────── */

async function main() {
  const jsonFlag = process.argv.indexOf('--json')
  const jsonPath = jsonFlag >= 0 ? process.argv[jsonFlag + 1] : join(EVIDENCE_DIR, 'probe-latest.json')

  section('A. 启动 / 状态 / 健康')
  const dataDir = await makeTempDataDir('probe-host')
  const llm = createLlmFixture()
  let host
  try {
    host = await startPlugin({ dataDir, llm })
  } catch (error) {
    record('A0', 'FAIL', '从 index.js apply() 启动插件', String((error && error.stack) || error))
    await writeEvidence(jsonPath)
    return 1
  }

  try {
    await check('A1', '注册 /api/loop-atlas 路由', async () => {
      expect(host.routeList.length >= 1, '没有注册任何路由：' + JSON.stringify(host.routeList.map((r) => r.path)))
      return host.routeList.map((route) => route.kind + ' ' + route.path)
    })

    let stateBody = null
    await check('A2', 'GET /state 字段符合契约', async () => {
      const response = await host.get('/api/loop-atlas/state')
      expectEqual(response.status, 200, 'HTTP 状态')
      stateBody = response.body
      for (const key of ['ok', 'schemaVersion', 'contentVersion', 'core', 'store', 'dataPath', 'model', 'capabilities', 'notices', 'serverVersion']) {
        expect(Object.prototype.hasOwnProperty.call(stateBody, key), '缺少字段：' + key)
      }
      expectEqual(stateBody.schemaVersion, 2, 'schemaVersion')
      expectEqual(stateBody.ok, true, 'ok')
      return { contentVersion: stateBody.contentVersion, dataPath: stateBody.dataPath, model: stateBody.model, capabilities: stateBody.capabilities }
    })

    await check('A3', 'GET /health', async () => {
      const response = await host.get('/api/loop-atlas/health')
      expectEqual(response.status, 200, 'HTTP 状态')
      expectEqual(response.body.ok, true, 'ok')
      expect(response.body.version, '缺少 version')
      return response.body
    })

    const { nodeId, relationId } = pickIds(stateBody?.core)
    expect(nodeId, '内容包没有节点 id，无法继续')
    log(`  使用节点 ${nodeId}${relationId ? ' / 关系 ' + relationId : '（当前内容包无 relation）'}`)

    section('B. ops 清单（契约第 4 节）')
    let noteId = null
    await check('B01', 'note.save 返回真实 note 与 wroteAt', async () => {
      const response = await host.op('note.save', { subject: { kind: 'node', id: nodeId }, kind: '理解', text: '探针笔记：延迟会改变纠正效果。' })
      expectEqual(response.status, 200, 'HTTP 状态')
      expectEqual(response.body.ok, true, 'ok')
      noteId = response.body.note?.id
      expect(noteId, '没有返回 note.id')
      expectEqual(response.body.note.authorSource, 'user', 'authorSource')
      expectEqual(response.body.note.savedBy, 'ui', 'savedBy')
      expect(response.body.note.createdAt && response.body.note.updatedAt, '缺少时间戳')
      return response.body.note
    })

    await check('B02', 'note.save 非法 subject → 4xx 且不写入', async () => {
      const response = await host.op('note.save', { subject: { kind: 'node', id: 'no-such-node-xyz' }, kind: '理解', text: 'x' })
      expect(response.status >= 400 && response.status < 500, '期望 4xx，实际 ' + response.status)
      expectEqual(response.body.ok, false, 'ok')
      expect(response.body.code, '缺少 code')
      return { status: response.status, code: response.body.code }
    })

    await check('B03', 'note.save 空文本 → VALIDATION', async () => {
      const response = await host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '   ' })
      expect(response.status >= 400 && response.status < 500, '期望 4xx，实际 ' + response.status)
      expectEqual(response.body.code, 'VALIDATION', 'code')
      return response.body
    })

    await check('B04', 'note.archive / note.delete', async () => {
      const archived = await host.op('note.archive', { noteId })
      expectEqual(archived.body.note?.status, 'archived', 'archive 后 status')
      const restored = await host.op('note.archive', { noteId })
      expectEqual(restored.body.note?.status, 'active', '再次 archive 应恢复 active')
      const extra = await host.op('note.save', { subject: { kind: 'node', id: nodeId }, kind: '疑问', text: '临时删除用' })
      const extraId = extra.body.note.id
      const deleted = await host.op('note.delete', { noteId: extraId })
      expectEqual(deleted.body.ok, true, 'delete ok')
      const state = (await host.get('/api/loop-atlas/state')).body
      expect(!state.store.notes[extraId], '删除后仍在 store 中')
      return { ok: true }
    })

    if (relationId) {
      await check('B05', 'relation.annotate：个人批注 / 状态 / 版本递增', async () => {
        const first = await host.op('relation.annotate', { edgeId: relationId, annotation: '探针批注：条件成立才成立', status: 'supported' })
        expectEqual(first.status, 200, 'HTTP 状态')
        expectEqual(first.body.relation?.status, 'supported', 'status')
        expectEqual(first.body.relation?.version, 2, 'version 应递增到 2')
        const evidence = await host.op('relation.annotate', { edgeId: relationId, evidenceNoteIds: [noteId] })
        expectEqual(evidence.body.relation?.evidenceNoteIds?.[0], noteId, 'evidenceNoteIds')
        return first.body.relation
      })
      await check('B06', 'relation.annotate 悬空证据笔记 → 4xx 且不写', async () => {
        const response = await host.op('relation.annotate', { edgeId: relationId, evidenceNoteIds: ['n_missing_xyz'] })
        expect(response.status >= 400 && response.status < 500, '期望 4xx，实际 ' + response.status)
        return { status: response.status, code: response.body.code }
      })
    } else {
      skip('B05', 'relation.annotate', '当前内容包没有 relations')
      skip('B06', 'relation.annotate 悬空引用', '当前内容包没有 relations')
    }

    let investigationId = null
    await check('B07', 'investigation.save / resolve', async () => {
      const saved = await host.op('investigation.save', {
        subject: { kind: 'node', id: nodeId },
        title: '延迟如何改变判定',
        claim: '延迟足够大时同一增益会振荡',
        counter: '振荡可能只是采样噪声',
        nextTest: '固定 K 扫 D 观察 lastAmplitude',
      })
      expectEqual(saved.status, 200, 'HTTP 状态')
      investigationId = saved.body.investigation?.id
      expect(investigationId, '没有返回 investigation.id')
      expectEqual(saved.body.investigation.dialogSubjectKey, 'node:' + nodeId, 'dialogSubjectKey')
      const resolved = await host.op('investigation.resolve', { id: investigationId, status: 'testing' })
      expectEqual(resolved.body.investigation?.status, 'testing', 'status')
      return { investigationId }
    })

    let predictionId = null
    await check('B08', 'prediction.save / resolve（可绑定 run）', async () => {
      const saved = await host.op('prediction.save', {
        subject: { kind: 'node', id: nodeId },
        investigationId,
        text: 'K=1.2、D=1.5 时会出现持续振荡',
        resolveBy: 'lastAmplitude 不趋于 0 且穿越目标',
      })
      expectEqual(saved.status, 200, 'HTTP 状态')
      predictionId = saved.body.prediction?.id
      expectEqual(saved.body.prediction?.status, 'open', 'status')
      return { predictionId }
    })

    section('B. 实验（契约第 5 节，经 ops experiment.run）')
    let delayRunId = null
    let delayRunZero = null
    await check('B10 / E01', 'D=0 可运行（不得越界）', async () => {
      const response = await host.op('experiment.run', { experimentId: 'delay', params: { K: 1.2, D: 0 } })
      expectEqual(response.status, 200, 'HTTP 状态')
      expectEqual(response.body.ok, true, 'ok')
      const result = response.body.result
      expect(result?.trace?.length > 0, 'result.trace 为空')
      expect(result?.metrics, 'result.metrics 缺失')
      expectEqual(result.modelId, 'delay-v2', 'modelId')
      expectEqual(result.modelVersion, 2, 'modelVersion')
      expect(result.criterion, '缺少 criterion 文本')
      expectEqual(response.body.run?.modelId, 'delay-v2', 'run.modelId')
      delayRunId = response.body.run?.id
      delayRunZero = { result, run: response.body.run }
      return { verdict: result.verdict, final: result.metrics.final, traceLength: result.trace.length }
    })

    await check('B11', 'delay 判定区分不同现象（低延迟 vs 高延迟）', async () => {
      const cases = [
        { K: 0.2, D: 0.05, label: '低增益低延迟' },
        { K: 1.2, D: 0.6, label: '默认参数' },
        { K: 3, D: 1.5, label: '高增益高延迟' },
        { K: 5, D: 2, label: '极限参数' },
      ]
      const observed = []
      for (const item of cases) {
        const response = await host.op('experiment.run', { experimentId: 'delay', params: { K: item.K, D: item.D } })
        expectEqual(response.status, 200, `${item.label} HTTP 状态`)
        observed.push({ label: item.label, K: item.K, D: item.D, verdict: response.body.result?.verdict, metrics: response.body.result?.metrics })
      }
      const verdicts = [...new Set(observed.map((item) => item.verdict))]
      expect(verdicts.length >= 2, '不同参数得到相同判定，说明判定不能区分现象：' + JSON.stringify(observed.map((o) => [o.label, o.verdict])))
      return observed
    })

    await check('B12 / E04', '代理指标：1.2 后下降、2.6 更低、比例标签为“隐藏/可见”', async () => {
      const samples = []
      for (const e of [0, 1.2, 1.5, 2.6]) {
        const response = await host.op('experiment.run', { experimentId: 'proxy', params: { e } })
        expectEqual(response.status, 200, `e=${e} HTTP 状态`)
        const result = response.body.result
        samples.push({ e, visible: result.visible, hidden: result.hidden, ratioLabel: result.ratioLabel, criterion: result.criterion })
      }
      const byE = Object.fromEntries(samples.map((item) => [item.e.toFixed(1), item]))
      expect(byE['1.5'].hidden < byE['1.2'].hidden, `hidden 在 e=1.5 应低于 e=1.2：${byE['1.5'].hidden} vs ${byE['1.2'].hidden}`)
      expect(byE['2.6'].hidden < byE['1.2'].hidden, `hidden 在 e=2.6 应低于 e=1.2：${byE['2.6'].hidden} vs ${byE['1.2'].hidden}`)
      const labelText = JSON.stringify(samples)
      expect(labelText.includes('隐藏/可见') || labelText.includes('比例'), '比例标签未写“隐藏/可见”：' + labelText)
      return samples
    })

    await check('B13 / E05', 'green：全绿只代表已勾选用例通过，beyond 勾上即失败', async () => {
      const off = await host.op('experiment.run', { experimentId: 'green', params: { enabled: {} } })
      expectEqual(off.status, 200, 'HTTP 状态')
      expectEqual(off.body.result?.allGreen, true, '默认应全绿')
      const caveat = String(off.body.result?.caveat || '')
      expect(caveat.includes('已勾选') || caveat.includes('不等于'), 'caveat 未说明“全绿≠功能正确”：' + caveat)
      const on = await host.op('experiment.run', { experimentId: 'green', params: { enabled: { beyond: true } } })
      expectEqual(on.body.result?.allGreen, false, '勾选 beyond 后应失败')
      return { allGreenOff: off.body.result.allGreen, allGreenOn: on.body.result.allGreen, caveat }
    })

    await check('B14', 'experiment.list 可按 subject 过滤', async () => {
      const response = await host.op('experiment.list', { subject: { kind: 'node', id: nodeId } })
      expectEqual(response.status, 200, 'HTTP 状态')
      expect(Array.isArray(response.body.runs), 'runs 不是数组')
      return { count: response.body.runs.length }
    })

    await check('B15', 'prediction.resolve 绑定 run 且记录判据', async () => {
      const response = await host.op('prediction.resolve', { id: predictionId, status: 'supported', runId: delayRunId, note: '探针判定' })
      expectEqual(response.body.ok, true, 'ok')
      expectEqual(response.body.prediction?.status, 'supported', 'status')
      expectEqual(response.body.prediction?.resolvedByRunId, delayRunId, 'resolvedByRunId')
      expect(response.body.prediction?.resolvedAt, '缺少 resolvedAt')
      return response.body.prediction
    })

    section('B. 任务草案 / 视图 / 资料与备份（R3/R4 底层）')
    let draft = null
    await check('B16 / R4', 'task.draft 从真实需求生成三部分（目标/验收/边界）', async () => {
      llm.enqueue(
        success(
          JSON.stringify({
            title: '让延迟实验保存可复跑记录',
            goal: '用户改参数后能回看同一参数的结果',
            acceptance: [{ text: '运行记录包含参数与判定', evidence: 'experiment.list 能取到该记录' }],
            boundary: ['不自动发送到外部', '不修改公共内容包'],
            unknowns: [{ question: '要支持哪些参数范围？' }],
            conceptIds: [nodeId],
          }),
        ),
      )
      const response = await host.op('task.draft', { requestText: '我希望实验参数和结果能保存下来，下次还能看到', subject: { kind: 'node', id: nodeId } })
      expectEqual(response.status, 200, 'HTTP 状态')
      expectEqual(response.body.ok, true, 'ok')
      draft = response.body.draft
      expect(draft?.acceptance?.length >= 1, 'draft.acceptance 为空')
      expect(draft?.boundary?.length >= 1, 'draft.boundary 为空')
      expect(draft?.unknowns?.length >= 1, 'draft.unknowns 为空')
      return draft
    })

    let taskId = null
    await check('B17 / R4', 'task.save 落盘、版本可回看、archive', async () => {
      expect(draft, '前置 task.draft 失败，跳过')
      const saved = await host.op('task.save', { ...draft, request: '我希望实验参数和结果能保存下来，下次还能看到' })
      expectEqual(saved.status, 200, 'HTTP 状态')
      taskId = saved.body.task?.id
      expect(taskId, '没有 task.id')
      expect(saved.body.task.revisions?.length >= 1, '缺少 revisions')
      const second = await host.op('task.save', { ...draft, id: taskId, request: '我希望实验参数和结果能保存下来，下次还能看到', goal: '修订后的目标' })
      expectEqual(second.body.task?.revision, 2, '第二次保存 revision 应为 2')
      expect(second.body.task.revisions?.length >= 2, 'revisions 未累积')
      const archived = await host.op('task.archive', { id: taskId, status: 'archived' })
      expectEqual(archived.body.task?.status, 'archived', 'archive 状态')
      return { taskId, revision: second.body.task.revision }
    })

    await check('B18', 'view.save 持久化三尺度/视角/选中', async () => {
      const response = await host.op('view.save', { scale: 'subject', projection: 'history', selectedNodeId: nodeId, rightOpen: false })
      expectEqual(response.status, 200, 'HTTP 状态')
      expectEqual(response.body.view?.projection, 'history', 'projection')
      expectEqual(response.body.view?.scale, 'subject', 'scale')
      const state = (await host.get('/api/loop-atlas/state')).body
      expectEqual(state.store.view?.selectedNodeId, nodeId, 'state.view.selectedNodeId')
      return response.body.view
    })

    await check('B19', 'package.export → preview → import（同包幂等）', async () => {
      const exported = await host.op('package.export', {})
      expectEqual(exported.status, 200, 'export HTTP 状态')
      const pack = exported.body.pack
      expect(pack?.kind === 'loop-atlas-user-package', 'pack.kind 不正确：' + JSON.stringify(pack?.kind))
      expectEqual(pack.schemaVersion, 2, 'pack.schemaVersion')
      expect(pack.tables, 'pack.tables 缺失（契约要求逐表校验）')
      const before = (await host.get('/api/loop-atlas/state')).body.store.notes
      const preview = await host.op('package.preview', { pack })
      expectEqual(preview.status, 200, 'preview HTTP 状态')
      const imported = await host.op('package.import', { pack, mode: 'merge' })
      expect(imported.status === 200, '同包 merge 导入应成功或幂等，实际 HTTP ' + imported.status + ' ' + JSON.stringify(imported.body).slice(0, 400))
      const after = (await host.get('/api/loop-atlas/state')).body.store.notes
      expectEqual(Object.keys(after).length, Object.keys(before).length, '同包幂等导入后笔记数量变化')
      return { notes: Object.keys(after).length, packTables: Object.keys(pack.tables) }
    })

    await check('B20', 'backup.create 返回真实存在的备份文件', async () => {
      const response = await host.op('backup.create', {})
      expectEqual(response.status, 200, 'HTTP 状态')
      const path = response.body.path
      expect(path, '没有返回备份路径')
      const info = await stat(path)
      expect(info.size > 0, '备份文件为空')
      return { path, size: info.size }
    })

    await check('B21', 'migration.report 可读', async () => {
      const response = await host.op('migration.report', {})
      expectEqual(response.status, 200, 'HTTP 状态')
      expect(response.body.dataPath, '缺少 dataPath')
      return { dataPath: response.body.dataPath, backups: (response.body.backups || []).length }
    })

    await check('B22', '未知 op / 非法 JSON / 非法方法 的错误形状', async () => {
      const unknown = await host.op('no.such.op', {})
      expect(unknown.status >= 400, '未知 op 应 4xx，实际 ' + unknown.status)
      expectEqual(unknown.body.ok, false, 'unknown op ok')
      expect(unknown.body.code, 'unknown op 缺少 code')
      const badJson = await host.request('/api/loop-atlas/ops', { method: 'POST', rawBody: '{oops', headers: { 'content-type': 'application/json' } })
      expectEqual(badJson.status, 400, '非法 JSON HTTP 状态')
      expectEqual(badJson.body.code, 'VALIDATION', '非法 JSON code')
      const put = await host.request('/api/loop-atlas/state', { method: 'PUT' })
      expectEqual(put.status, 405, 'PUT 状态')
      return { unknownStatus: unknown.status, unknownCode: unknown.body.code, badJsonStatus: badJson.status, putStatus: put.status }
    })

    section('C. 对话流（R1 核心：真实模型流 → 回执 → 归属）')
    const dialogSubject = { kind: 'node', id: nodeId }
    let okRequestId = null

    await check('C1', '成功流：start/delta/done 且 assistant 消息落盘 completed', async () => {
      llm.enqueueSuccess('延迟会推迟纠正动作，因此同一增益可能从收敛变成持续振荡。', { chunkSize: 6 })
      const stream = await host.openDialogStream({ subject: dialogSubject, text: '为什么延迟会让系统振荡？' })
      expectEqual(stream.status, 200, 'HTTP 状态')
      const events = await stream.readAll()
      const start = events.find((event) => event.type === 'start')
      const done = events.find((event) => event.type === 'done')
      const deltas = events.filter((event) => event.type === 'delta').map((event) => event.text).join('')
      expect(start, '缺少 start 事件')
      okRequestId = start.requestId
      expect(start.requestId && start.requestId.startsWith('r_'), 'requestId 形状不对：' + start.requestId)
      expect(start.model?.provider, 'start 缺少真实模型 provider')
      expect(start.contextVersion, 'start 缺少 contextVersion')
      expect(deltas.length > 0, '没有 delta 事件')
      expect(done, '缺少 done 事件')
      expectEqual(done.message?.status, 'completed', 'assistant status')
      expectEqual(done.message?.text, deltas, 'done.message.text 与流式增量不一致')
      const dialog = await host.op('dialog.get', { subject: dialogSubject })
      const messages = dialog.body.dialog?.messages || []
      expectEqual(messages.filter((message) => message.role === 'assistant' && message.status === 'completed').length, 1, 'completed assistant 数量')
      expectEqual(dialog.body.available, true, 'dialog.get available')
      return { requestId: okRequestId, deltas: deltas.length, messages: messages.length }
    })

    await check('C2', '失败流：error 事件带真实 code，assistant 落盘 failed + error', async () => {
      llm.enqueueFailure({ code: 'AUTH', message: '凭据无效（fixture）' })
      const stream = await host.openDialogStream({ subject: dialogSubject, text: '再试一次' })
      const events = await stream.readAll()
      const start = events.find((event) => event.type === 'start')
      const error = events.find((event) => event.type === 'error')
      expect(start, '缺少 start')
      expect(error, '缺少 error 事件')
      expectEqual(error.code, LLM_FAILURE_CODE_MAP.AUTH, 'error.code 映射')
      const dialog = await host.op('dialog.get', { subject: dialogSubject })
      const failed = (dialog.body.dialog?.messages || []).filter((message) => message.role === 'assistant' && message.status === 'failed')
      expectEqual(failed.length, 1, 'failed assistant 数量')
      expectEqual(failed[0].error?.code, 'LLM_AUTH', 'assistant error.code')
      return { errorCode: error.code, persistedCode: failed[0].error.code }
    })

    await check('C3', '重试：不重复 user 消息，旧失败回答被替换，重试成功', async () => {
      llm.enqueueSuccess('重试后的完整回答。')
      const dialogBefore = (await host.op('dialog.get', { subject: dialogSubject })).body.dialog
      const userBefore = dialogBefore.messages.filter((message) => message.role === 'user').length
      const failedRequestId = dialogBefore.messages.filter((message) => message.role === 'assistant' && message.status === 'failed').pop()?.requestId
      expect(failedRequestId, '找不到失败请求号')
      const stream = await host.openDialogStream({ subject: dialogSubject, retryRequestId: failedRequestId })
      const events = await stream.readAll()
      expect(events.find((event) => event.type === 'done'), '重试没有 done：' + JSON.stringify(events).slice(0, 500))
      const dialogAfter = (await host.op('dialog.get', { subject: dialogSubject })).body.dialog
      const userAfter = dialogAfter.messages.filter((message) => message.role === 'user').length
      expectEqual(userAfter, userBefore, '重试后 user 消息数量变化（重复提问）')
      return { userBefore, userAfter, retryRequestId: failedRequestId }
    })

    await check('C4', '取消：取消后保存 cancelled + partial，并给 CANCELED 回执', async () => {
      const manual = createManualStream()
      llm.enqueue(manual.scenario)
      const stream = await host.openDialogStream({ subject: dialogSubject, text: '给我一段慢慢说的回答' })
      const start = await stream.next()
      expectEqual(start.type, 'start', '第一个事件')
      manual.pushText('这一段是取消前的部分内容。')
      // 等宿主收到至少一个 delta 再取消
      let delta = null
      for (let i = 0; i < 20 && !delta; i += 1) {
        const event = await stream.next({ timeoutMs: 3000 })
        if (!event) break
        if (event.type === 'delta') delta = event
      }
      expect(delta, '取消前没有收到 delta')
      const cancel = await host.post('/api/loop-atlas/dialog/cancel', { requestId: start.requestId })
      expectEqual(cancel.status, 200, 'cancel HTTP 状态')
      const rest = await stream.readAll()
      const error = rest.find((event) => event.type === 'error')
      expect(error, '取消后缺少 error 事件：' + JSON.stringify(rest).slice(0, 500))
      expect(error.code === 'CANCELED' || error.code === 'ABORTED', '取消回执 code：' + error.code)
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 300))
      const dialog = (await host.op('dialog.get', { subject: dialogSubject })).body.dialog
      const cancelled = dialog.messages.filter((message) => message.role === 'assistant' && message.status === 'cancelled')
      expectEqual(cancelled.length, 1, 'cancelled assistant 数量')
      expect(cancelled[0].partial === true, 'cancelled 消息 partial 应为 true')
      expect(String(cancelled[0].text).includes('取消前'), 'partial 文本未保存')
      expectEqual(dialog.pending, null, 'pending 应被清空')
      return { errorCode: error.code, partial: cancelled[0].text }
    })

    await check('C5', '同一 subject 同时只允许一个进行中请求 → BUSY', async () => {
      const manual = createManualStream()
      llm.enqueue(manual.scenario)
      const first = await host.openDialogStream({ subject: dialogSubject, text: '第一条进行中的问题' })
      const start = await first.next()
      expectEqual(start.type, 'start', '第一条流 start')
      const second = await host.openDialogStream({ subject: dialogSubject, text: '第二条应被拒绝' })
      const events = await second.readAll()
      const error = events.find((event) => event.type === 'error')
      expect(error, '第二条流没有错误事件：' + JSON.stringify(events).slice(0, 400))
      expectEqual(error.code, 'BUSY', '第二条流 code')
      await host.post('/api/loop-atlas/dialog/cancel', { requestId: start.requestId })
      try {
        manual.finish()
      } catch {
        /* 流可能已因取消而结束 */
      }
      await first.readAll().catch(() => [])
      return { busyCode: error.code }
    })

    await check('C6', 'A 生成中切 B：回答写回发起时的 subject，不串题', async () => {
      const subjectA = { kind: 'node', id: nodeId }
      const secondNode = (stateBody?.core?.nodes || []).find((node) => node.id !== nodeId)
      expect(secondNode, '内容包只有一个节点，无法测试 A/B 隔离')
      const subjectB = { kind: 'node', id: secondNode.id }
      const manual = createManualStream()
      llm.enqueue(manual.scenario)
      const streamA = await host.openDialogStream({ subject: subjectA, text: 'A 主题的问题' })
      const startA = await streamA.next()
      expectEqual(startA.type, 'start', 'A start')
      manual.pushText('A 主题的回答片段。')
      await streamA.next() // 至少一个 delta
      // 切到 B 并发起新请求
      llm.enqueueSuccess('B 主题的完整回答。')
      const streamB = await host.openDialogStream({ subject: subjectB, text: 'B 主题的问题' })
      const eventsB = await streamB.readAll()
      expect(eventsB.find((event) => event.type === 'done'), 'B 没有 done')
      // A 迟到完成
      manual.pushText('A 主题的后半段。')
      manual.finish()
      const eventsA = await streamA.readAll()
      expect(eventsA.find((event) => event.type === 'done'), 'A 没有 done')
      const dialogA = (await host.op('dialog.get', { subject: subjectA })).body.dialog
      const dialogB = (await host.op('dialog.get', { subject: subjectB })).body.dialog
      const textA = dialogA.messages.filter((message) => message.role === 'assistant').map((message) => message.text).join('\n')
      const textB = dialogB.messages.filter((message) => message.role === 'assistant').map((message) => message.text).join('\n')
      expect(textA.includes('A 主题'), 'A 回答没有写回 A：' + textA.slice(0, 200))
      expect(textB.includes('B 主题'), 'B 回答没有写回 B：' + textB.slice(0, 200))
      expect(!textA.includes('B 主题'), 'A 主题混入了 B 的回答')
      expect(!textB.includes('A 主题'), 'B 主题混入了 A 的回答')
      return { subjectA: textA.slice(0, 80), subjectB: textB.slice(0, 80) }
    })

    await check('C7', '客户端断开 → 取消并保存 cancelled（req close）', async () => {
      llm.enqueueSlow('很慢的回答，用来模拟用户关页面。', { chunkSize: 2, chunkDelayMs: 80 })
      const stream = await host.openDialogStream({ subject: dialogSubject, text: '断连测试' })
      const start = await stream.next()
      expectEqual(start.type, 'start', 'start')
      const event = await stream.next({ timeoutMs: 5000 })
      expect(event, '没有收到任何 delta')
      stream.abort()
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 500))
      const dialog = (await host.op('dialog.get', { subject: dialogSubject })).body.dialog
      const cancelled = dialog.messages.filter((message) => message.role === 'assistant' && message.status === 'cancelled')
      const failed = dialog.messages.filter((message) => message.role === 'assistant' && message.status === 'failed')
      expect(cancelled.length + failed.length >= 1, '断连后没有落盘 cancelled/failed 终态')
      expectEqual(dialog.pending, null, 'pending 应被清空')
      return { cancelled: cancelled.length, failed: failed.length }
    })

    await check('C8', '重开同一 subject：对话与模型状态恢复', async () => {
      const before = (await host.op('dialog.get', { subject: dialogSubject })).body
      await host.dispose({ cleanupData: false })
      host = await startPlugin({ dataDir, llm })
      const after = (await host.op('dialog.get', { subject: dialogSubject })).body
      expectEqual(after.available, true, '重开后 available')
      expectEqual((after.dialog?.messages || []).length, (before.dialog?.messages || []).length, '重开后消息数量')
      const lastAssistant = [...(after.dialog?.messages || [])].reverse().find((message) => message.role === 'assistant')
      expect(lastAssistant, '重开后找不到 assistant 消息')
      return { messages: after.dialog.messages.length, available: after.available, model: after.model }
    })

    section('D. 写失败注入（R0 硬门槛：失败不污染内存，下一次写可恢复）')
    await check('D1', '写失败 → STORAGE_WRITE + 内存/磁盘不变 + 下一次写恢复', async () => {
      const before = (await host.get('/api/loop-atlas/state')).body.store.notes
      const beforeCount = Object.keys(before).length
      const diskBefore = await readFile(join(dataDir, 'state.json'), 'utf8')
      await setStateFileReadOnly(dataDir, true)
      const failed = await host.op('note.save', { subject: { kind: 'node', id: nodeId }, kind: '证据', text: '这次写入应失败' })
      expectEqual(failed.status, 507, '失败写 HTTP 状态（期望 507 STORAGE_WRITE），实际 ' + failed.status + '：' + JSON.stringify(failed.body).slice(0, 300))
      expectEqual(failed.body.code, 'STORAGE_WRITE', '失败写 code')
      expect(String(failed.body.error || '').length > 0, '失败回执缺少可读原因')
      const inMemory = (await host.get('/api/loop-atlas/state')).body.store.notes
      expectEqual(Object.keys(inMemory).length, beforeCount, '失败写污染了内存（GET 读到未提交笔记）')
      const diskAfter = await readFile(join(dataDir, 'state.json'), 'utf8')
      expectEqual(diskAfter, diskBefore, '失败写改动了磁盘旧内容')
      const leftovers = (await listDataDir(dataDir)).filter((name) => name.endsWith('.tmp'))
      expectEqual(leftovers.length, 0, '失败后残留临时文件：' + JSON.stringify(leftovers))
      await setStateFileReadOnly(dataDir, false)
      const retried = await host.op('note.save', { subject: { kind: 'node', id: nodeId }, kind: '证据', text: '恢复后的写入' })
      expectEqual(retried.status, 200, '恢复后第一次写 HTTP 状态：' + JSON.stringify(retried.body).slice(0, 300))
      expectEqual(retried.body.ok, true, '恢复后 ok')
      const afterState = (await host.get('/api/loop-atlas/state')).body.store.notes
      expectEqual(Object.keys(afterState).length, beforeCount + 1, '恢复后的写入没有进入内存状态')
      const disk = await readStateFile(dataDir)
      expect(Object.values(disk.notes).some((note) => note.text === '恢复后的写入'), '恢复后的写入没有落盘')
      return { beforeCount, afterCount: Object.keys(afterState).length }
    })

    section('E. 导入校验（R0：非法记录 / 悬空引用 / 冲突显式 / 幂等）')
    const exported = (await host.op('package.export', {})).body.pack
    const clone = (value) => JSON.parse(JSON.stringify(value))
    const baselineNotes = (await host.get('/api/loop-atlas/state')).body.store.notes

    function makePack(mutator) {
      const pack = clone(exported)
      pack.tables = pack.tables || {}
      mutator(pack.tables)
      return pack
    }

    await check('E1', '非法记录（null / 缺字段）→ 4xx IMPORT_INVALID，且不写入', async () => {
      const pack = makePack((tables) => {
        tables.notes = { ...(tables.notes || {}), bad_note_null: null, bad_note_missing: { id: 'bad_note_missing' } }
      })
      const response = await host.post('/api/loop-atlas/import', { pack, mode: 'merge' })
      expect(response.status >= 400 && response.status < 500, '期望 4xx，实际 ' + response.status + '：' + JSON.stringify(response.body).slice(0, 300))
      expectEqual(response.body.ok, false, 'ok')
      expectEqual(response.body.code, 'IMPORT_INVALID', 'code')
      const after = (await host.get('/api/loop-atlas/state')).body.store.notes
      expect(!after.bad_note_null && !after.bad_note_missing, '非法记录进入了存储：' + JSON.stringify(Object.keys(after)))
      return { status: response.status, code: response.body.code, errors: response.body.details?.errors?.length }
    })

    await check('E2', '悬空引用（subject 不存在）→ 4xx，且不写入', async () => {
      const pack = makePack((tables) => {
        tables.notes = {
          ...(tables.notes || {}),
          note_dangling: {
            id: 'note_dangling',
            subject: { kind: 'node', id: 'no-such-node-xyz' },
            kind: '理解',
            text: '悬空引用记录',
            status: 'active',
            authorSource: 'import',
            savedBy: 'ui',
            adopted: null,
            legacyOriginUncertain: false,
            encodingSuspected: false,
            parentRevision: null,
            createdAt: now(),
            updatedAt: now(),
            revision: 1,
          },
        }
      })
      const response = await host.post('/api/loop-atlas/import', { pack, mode: 'merge' })
      expect(response.status >= 400 && response.status < 500, '期望 4xx，实际 ' + response.status + '：' + JSON.stringify(response.body).slice(0, 300))
      const after = (await host.get('/api/loop-atlas/state')).body.store.notes
      expect(!after.note_dangling, '悬空引用记录进入存储')
      return { status: response.status, code: response.body.code }
    })

    await check('E3', '同 id 不同内容冲突 → 显式 409 且整体不写', async () => {
      const targetNoteId = Object.keys(baselineNotes)[0]
      expect(targetNoteId, '没有基准笔记可制造冲突')
      const pack = clone(exported)
      if (!pack.tables?.notes?.[targetNoteId]) throw new Error('导出的包中没有目标笔记')
      pack.tables.notes[targetNoteId].text = '被篡改的内容（应冲突）'
      const response = await host.post('/api/loop-atlas/import', { pack, mode: 'merge' })
      expectEqual(response.status, 409, '冲突导入 HTTP 状态（期望 409 CONFLICT），实际 ' + response.status + '：' + JSON.stringify(response.body).slice(0, 400))
      expectEqual(response.body.code, 'CONFLICT', 'conflict code')
      const conflicts = response.body.details?.conflicts || []
      expect(conflicts.length > 0, '冲突没有显式返回清单')
      const after = (await host.get('/api/loop-atlas/state')).body.store.notes
      expectEqual(after[targetNoteId].text, baselineNotes[targetNoteId].text, '冲突导入改动了已有记录')
      return { status: response.status, conflicts: conflicts.length }
    })

    await check('E4', 'mode=skip 跳过已存在 id，不覆盖', async () => {
      const targetNoteId = Object.keys(baselineNotes)[0]
      const pack = clone(exported)
      if (!pack.tables?.notes?.[targetNoteId]) throw new Error('导出的包中没有目标笔记')
      pack.tables.notes[targetNoteId].text = 'skip 模式下的不同内容'
      const response = await host.post('/api/loop-atlas/import', { pack, mode: 'skip' })
      expect(response.status === 200, 'skip 导入 HTTP 状态：' + response.status + ' ' + JSON.stringify(response.body).slice(0, 300))
      const after = (await host.get('/api/loop-atlas/state')).body.store.notes
      expectEqual(after[targetNoteId].text, baselineNotes[targetNoteId].text, 'skip 模式覆盖了已有记录')
      return { skipped: targetNoteId }
    })

    await check('E5', 'mode=replace 未带 confirm → VALIDATION', async () => {
      const response = await host.post('/api/loop-atlas/import', { pack: exported, mode: 'replace' })
      expectEqual(response.status, 400, 'replace 无 confirm HTTP 状态')
      expectEqual(response.body.code, 'VALIDATION', 'code')
      return response.body
    })

    await check('E6', '非法包壳（kind/schemaVersion）→ 4xx', async () => {
      const wrongKind = await host.post('/api/loop-atlas/import', { pack: { kind: 'other', schemaVersion: 2, tables: {} }, mode: 'merge' })
      expect(wrongKind.status >= 400 && wrongKind.status < 500, 'kind 错误应 4xx，实际 ' + wrongKind.status)
      const wrongSchema = await host.post('/api/loop-atlas/import', { pack: { kind: 'loop-atlas-user-package', schemaVersion: 99, tables: {} }, mode: 'merge' })
      expect(wrongSchema.status >= 400 && wrongSchema.status < 500, 'schemaVersion 错误应 4xx，实际 ' + wrongSchema.status)
      return { kindStatus: wrongKind.status, schemaStatus: wrongSchema.status }
    })

    await check('E7', '超过 8 MiB 的包 → PACKAGE_TOO_LARGE', async () => {
      const big = clone(exported)
      big.tables = { notes: { big_note: { ...(Object.values(exported.tables?.notes || {})[0] || {}), id: 'big_note', text: 'x'.repeat(8.5 * 1024 * 1024) } } }
      const response = await host.post('/api/loop-atlas/import', { pack: big, mode: 'merge' })
      expectEqual(response.status, 413, '超大包 HTTP 状态（期望 413）实际 ' + response.status)
      return { status: response.status, code: response.body.code }
    })

    section('G. Agent 工具（来源标注不得冒充用户原文）')
    await check('G1', '工具已注册且名称为 loop_atlas', async () => {
      expect(host.listTools().includes('loop_atlas'), '没有注册 loop_atlas 工具：' + JSON.stringify(host.listTools()))
      const definition = host.tool('loop_atlas')
      expect(definition.parameters?.properties?.action, '工具参数缺少 action')
      return { tools: host.listTools() }
    })

    await check('G2', 'agent save_note → authorSource=ai-draft / savedBy=agent / adopted=null', async () => {
      const result = await host.callTool('loop_atlas', { action: 'save_note', subject: { kind: 'node', id: nodeId }, kind: '证据', text: 'agent 写的草稿' })
      expectEqual(result.ok, true, '工具返回 ok')
      expectEqual(result.note.authorSource, 'ai-draft', 'authorSource')
      expectEqual(result.note.savedBy, 'agent', 'savedBy')
      expectEqual(result.note.adopted, null, 'adopted')
      return result.note
    })

    await check('G3', 'agent read_node / search / save_prediction', async () => {
      const read = await host.callTool('loop_atlas', { action: 'read_node', nodeId })
      expectEqual(read.ok, true, 'read_node ok')
      expect(read.node?.id, 'read_node 没有 node')
      const search = await host.callTool('loop_atlas', { action: 'search', query: stateBody?.core?.nodes?.find?.((node) => node.id === nodeId)?.title?.slice(0, 2) || '反馈' })
      expectEqual(search.ok, true, 'search ok')
      const prediction = await host.callTool('loop_atlas', { action: 'save_prediction', subject: { kind: 'node', id: nodeId }, text: 'agent 预测', resolveBy: '可观察条件' })
      expectEqual(prediction.ok, true, 'save_prediction ok')
      return { node: read.node?.id, hits: (search.hits || search.nodes || []).length }
    })
  } finally {
    await host.dispose({ cleanupData: true }).catch(() => {})
  }

  /* F. 迁移 + 备份 + 回滚（独立数据目录） */
  section('F. 迁移 / 备份 / 回滚（R0）')
  const migrationDataDir = await makeTempDataDir('probe-migration')
  try {
    const v1 = {
      schemaVersion: 1,
      notes: {
        n_v1_probe: {
          id: 'n_v1_probe',
          subjectId: 'feedback',
          subjectType: 'node',
          kind: '理解',
          text: 'v1 时代的一条笔记',
          origin: 'user',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          revision: 1,
          status: 'active',
        },
      },
      revisions: { n_v1_probe: [{ revision: 1, text: 'v1 时代的一条笔记', at: '2026-01-01T00:00:00.000Z' }] },
      experiments: {},
      contracts: { c_v1_probe: { id: 'c_v1_probe', title: 'v1 契约', text: '把要求写清楚', nodeIds: ['feedback'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', revision: 1 } },
      predictions: { p_v1_probe: { id: 'p_v1_probe', subjectId: 'feedback', text: 'v1 预测', resolveBy: '条件', at: '2026-01-01T00:00:00.000Z', resolved: false } },
      view: { selected: 'feedback', projection: 'theory' },
    }
    const v1Text = JSON.stringify(v1, null, 2) + '\n'
    await mkdir(migrationDataDir, { recursive: true })
    await writeFile(join(migrationDataDir, 'state.json'), v1Text, 'utf8')

    let migrationHost = await startPlugin({ dataDir: migrationDataDir })
    let backupPath = null
    await check('F1', 'v1 数据自动迁移，/state 报告 migrationReport', async () => {
      const state = await migrationHost.get('/api/loop-atlas/state')
      expectEqual(state.status, 200, 'HTTP 状态')
      expectEqual(state.body.ok, true, 'ok')
      expectEqual(state.body.schemaVersion, 2, '迁移后 schemaVersion')
      expect(state.body.migrationReport, '缺少 migrationReport')
      expectEqual(state.body.migrationReport.fromSchema, 1, 'fromSchema')
      const notes = Object.keys(state.body.store.notes || {})
      expect(notes.includes('n_v1_probe'), '迁移丢失笔记')
      expectEqual(state.body.store.notes.n_v1_probe.legacyOriginUncertain, true, 'legacyOriginUncertain 标记')
      expectEqual(state.body.store.notes.n_v1_probe.authorSource, 'user', 'authorSource 映射')
      expect(Object.keys(state.body.store.tasks || {}).length >= 1, 'contracts 未迁移为 tasks')
      return { report: state.body.migrationReport, notes: notes.length }
    })

    await check('F2', '迁移前备份文件存在且与迁移前原文件逐字节一致', async () => {
      const backupDir = join(migrationDataDir, 'backups')
      const names = (await readdir(backupDir)).filter((name) => /^state\.pre-v2-.*\.json$/.test(name))
      expect(names.length >= 1, '没有 state.pre-v2-*.json 备份：' + JSON.stringify(await readdir(backupDir).catch(() => [])))
      backupPath = join(backupDir, names[0])
      const text = await readFile(backupPath, 'utf8')
      expect(text === v1Text, '备份内容与迁移前原文不一致')
      return { backupPath, size: text.length }
    })

    await check('F3', '备份可回滚：还原 v1 后重启仍可读、可再次迁移', async () => {
      await migrationHost.dispose({ cleanupData: false })
      await writeFile(join(migrationDataDir, 'state.json'), v1Text, 'utf8')
      migrationHost = await startPlugin({ dataDir: migrationDataDir })
      const state = await migrationHost.get('/api/loop-atlas/state')
      expectEqual(state.body.ok, true, '回滚后 ok')
      expect(Object.keys(state.body.store.notes || {}).includes('n_v1_probe'), '回滚重启后笔记丢失')
      expect(state.body.migrationReport, '回滚重启后缺少 migrationReport')
      const backups = (await readdir(join(migrationDataDir, 'backups'))).filter((name) => /^state\.pre-v2-.*\.json$/.test(name))
      expect(backups.length >= 2, '再次迁移没有新增备份：' + backups.length)
      return { notes: Object.keys(state.body.store.notes).length, backups: backups.length }
    })

    await check('F4', '已是 v2 的数据不重复迁移', async () => {
      await migrationHost.dispose({ cleanupData: false })
      const before = JSON.parse(await readFile(join(migrationDataDir, 'state.json'), 'utf8'))
      migrationHost = await startPlugin({ dataDir: migrationDataDir })
      const state = await migrationHost.get('/api/loop-atlas/state')
      expectEqual(state.body.migrationReport, null, 'v2 数据不应再迁移，migrationReport 应为 null')
      const after = JSON.parse(await readFile(join(migrationDataDir, 'state.json'), 'utf8'))
      expectEqual(after.schemaVersion, 2, '磁盘 schemaVersion')
      expectEqual(Object.keys(after.notes || {}).length, Object.keys(before.notes || {}).length, 'v2 数据被改动')
      return { schemaVersion: after.schemaVersion }
    })
    await migrationHost.dispose({ cleanupData: true })
  } catch (error) {
    record('F0', 'FAIL', '迁移段执行异常', String((error && error.stack) || error))
    await removeTempDir(migrationDataDir)
  }

  /* H. 缺 llm 服务时的降级 */
  section('H. 缺 llm / agentDefaultModel 的降级')
  const degradedDataDir = await makeTempDataDir('probe-degraded')
  let degradedHost = null
  try {
    degradedHost = await startPlugin({ dataDir: degradedDataDir, services: { llm: false, agentDefaultModel: false } })
    const state = (await degradedHost.get('/api/loop-atlas/state')).body
    const { nodeId: degradedNodeId } = pickIds(state.core)
    await check('H1', 'capabilities.llm=false 且页面仍有真实原因', async () => {
      expect(state.capabilities && state.capabilities.llm === false, 'capabilities.llm 应为 false：' + JSON.stringify(state.capabilities))
      expect(state.modelAvailable === false || state.model?.available === false, 'model 可用性没有如实报告')
      expect(state.modelReason || state.model?.reason, '缺少不可用原因')
      return { capabilities: state.capabilities, reason: state.modelReason || state.model?.reason }
    })

    await check('H2', '模型不可用时对话流先开始后给真实 LLM_UNAVAILABLE，不伪装成功', async () => {
      const stream = await degradedHost.openDialogStream({ subject: { kind: 'node', id: degradedNodeId }, text: '模型不可用时问一句' })
      const events = await stream.readAll()
      const error = events.find((event) => event.type === 'error')
      expect(error, '没有 error 事件：' + JSON.stringify(events).slice(0, 300))
      expectEqual(error.code, 'LLM_UNAVAILABLE', 'error code')
      const dialog = (await degradedHost.op('dialog.get', { subject: { kind: 'node', id: degradedNodeId } })).body.dialog
      const assistant = dialog.messages.filter((message) => message.role === 'assistant').pop()
      expect(assistant, '没有落盘 assistant 终态')
      expect(assistant.status === 'failed', 'assistant 状态应为 failed')
      return { code: error.code, status: assistant.status }
    })

    await check('H3', '模型不可用时 task.draft → 503 LLM_UNAVAILABLE', async () => {
      const response = await degradedHost.op('task.draft', { requestText: '我要改变的行为是让保存有反馈' })
      expectEqual(response.status, 503, 'HTTP 状态')
      expectEqual(response.body.code, 'LLM_UNAVAILABLE', 'code')
      return { status: response.status, code: response.body.code }
    })
  } finally {
    if (degradedHost) await degradedHost.dispose({ cleanupData: true }).catch(() => {})
  }

  return await writeEvidence(jsonPath)
}

async function writeEvidence(jsonPath) {
  const passed = results.filter((item) => item.status === 'PASS').length
  const failed = results.filter((item) => item.status === 'FAIL').length
  const skipped = results.filter((item) => item.status === 'SKIP').length
  const summary = { startedAt, finishedAt: now(), passed, failed, skipped, results }
  try {
    await mkdir(dirname(jsonPath), { recursive: true })
    await writeFile(jsonPath, JSON.stringify(summary, null, 2), 'utf8')
    log(`\n证据已写入：${jsonPath}`)
  } catch (error) {
    log('证据写入失败：' + String(error?.message || error))
  }
  log(`\n合计：PASS ${passed} / FAIL ${failed} / SKIP ${skipped}`)
  if (failed > 0) {
    log('\n失败项清单（可直接给对应 owner 复现）：')
    for (const item of results.filter((entry) => entry.status === 'FAIL')) {
      log(`- ${item.id} ${item.title}\n    ${item.detail}`)
    }
  }
  return failed > 0 ? 1 : 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    console.error('探针自身异常：', error)
    process.exitCode = 2
  })
