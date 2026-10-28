/**
 * 渲染冒烟：在 Node 中用 React 桩递归渲染面板与弹层（源码模块，非 bundle）。
 *
 * 注意：这不是视觉验收，也不证明宿主内可用；它只保证各尺度/视角/窄屏/弹层
 * 在不依赖浏览器环境的情况下能完整渲染，没有渲染期 ReferenceError。
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { createReactStub, createGlobals, makeT, deepRender } from './helpers.mjs'
import { makeState, makeStore, makeCore } from './fixtures/state-v2.mjs'

const reactStub = createReactStub()
globalThis.React = reactStub
globalThis.h = reactStub.createElement
const baseGlobals = createGlobals({})
globalThis.window = baseGlobals.window
globalThis.document = baseGlobals.document

const { Panel } = await import('../../src/client/App.js')
const { TaskEditor } = await import('../../src/client/views/TaskEditor.js')
const { ResourcesDialog } = await import('../../src/client/views/ResourcesDialog.js')
const { ContinueDialog } = await import('../../src/client/views/ContinueDialog.js')
const { SourceDialog } = await import('../../src/client/views/SourceDialog.js')
const { ReceiptsDialog } = await import('../../src/client/views/ReceiptsDialog.js')
const { SubjectList } = await import('../../src/client/views/SubjectList.js')
const { NotesSection } = await import('../../src/client/views/NotesSection.js')
const { indexCore } = await import('../../src/client/model.js')
const { indexStore } = await import('../../src/client/store.js')

const t = makeT()

function makeApp(data) {
  return {
    phase: 'ready',
    data,
    error: null,
    staleError: null,
    receipts: [
      { id: 'receipt-1', kind: 'ok', text: '已保存（宿主确认）：笔记', at: '2026-10-27T12:00:00.000Z' },
      { id: 'receipt-2', kind: 'error', text: '写入存储失败：磁盘满', code: 'STORAGE_WRITE', at: '2026-10-27T12:01:00.000Z' },
    ],
    refreshing: false,
    addReceipt() {},
    clearReceipts() {},
    load: async () => data,
    perform: async () => ({}),
    ready: true,
  }
}

function render(element) {
  return deepRender(element, { collectErrorsOnly: true })
}

function assertClean(rendered, label) {
  assert.deepEqual(
    rendered.errors.map((error) => error.message),
    [],
    `${label} 渲染出错`,
  )
}

function renderPanel(data, options) {
  const opts = options || {}
  const element = reactStub.createElement(Panel, {
    app: makeApp(data),
    t: opts.t || t,
    ctx: {},
    localeDict: null,
  })
  return render(element)
}

function subjectView(patch) {
  const data = makeState()
  Object.assign(data.store.view, {
    scale: 'subject',
    projection: 'theory',
    selectedNodeId: 'delay',
    selectedRelationId: null,
    directoryOpen: true,
    rightOpen: true,
  }, patch || {})
  return data
}

test('问题尺度 / 理论视角：图谱 + 节点档案完整渲染', () => {
  const rendered = renderPanel(subjectView())
  assertClean(rendered, 'subject/theory')
  assert.ok(rendered.visited.includes('TopBar'))
  assert.ok(rendered.visited.includes('GraphCanvas'))
  assert.ok(rendered.visited.includes('NodeDossier'))
  assert.ok(rendered.visited.includes('Partner'))
  assert.match(rendered.html, /延迟/)
  assert.match(rendered.html, /负反馈/)
  assert.match(rendered.html, /相关邻居/)
  assert.match(rendered.html, /当前节点/)
  assert.match(rendered.html, /从目标与边界开始|目标与系统边界/)
})

test('问题尺度 / 历史视角：时间轴与"时间不确定"带', () => {
  const rendered = renderPanel(subjectView({ projection: 'history' }))
  assertClean(rendered, 'subject/history')
  assert.ok(rendered.visited.includes('HistoryView'))
  assert.match(rendered.html, /历史视角/)
  assert.match(rendered.html, /时间不确定/)
  assert.match(rendered.html, /1868/)
})

test('问题尺度 / 实践视角：六阶段工作回路', () => {
  const rendered = renderPanel(subjectView({ projection: 'practice' }))
  assertClean(rendered, 'subject/practice')
  assert.ok(rendered.visited.includes('PracticeView'))
  assert.match(rendered.html, /实践视角/)
  for (const label of ['目标', '上下文', '行动', '观测', '验收', '修订']) {
    assert.match(rendered.html, new RegExp(label))
  }
})

test('选中的关系：右侧关系详情含主张/条件/代价/批注/证据', () => {
  const rendered = renderPanel(subjectView({ selectedRelationId: 'e.delay-to-stability' }))
  assertClean(rendered, 'relation/inspector')
  assert.ok(rendered.visited.includes('RelationInspector'))
  assert.match(rendered.html, /关系详情/)
  assert.match(rendered.html, /延迟是稳定判定的限制条件/)
  assert.match(rendered.html, /在什么条件下成立/)
  assert.match(rendered.html, /相信或使用它的代价/)
  assert.match(rendered.html, /我的批注/)
  assert.match(rendered.html, /取消选中关系/)
  // 关系 evidence 笔记
  assert.match(rendered.html, /在我设定的参数下/)
})

test('列表替代视图：可搜索、节点与关系都可选', () => {
  const ci = indexCore(makeCore())
  const element = reactStub.createElement(SubjectList, {
    t,
    ci,
    center: ci.nodesById.get('delay'),
    neighbors: [{ node: ci.nodesById.get('feedback'), relation: ci.relationsById.get('e.delay-to-feedback'), direction: 'out' }],
    selectedNodeId: 'delay',
    selectedRelationId: null,
    onSelectNode() {},
    onSelectRelation() {},
  })
  const rendered = render(element)
  assertClean(rendered, 'subject/list')
  assert.match(rendered.html, /节点 · 4/)
  assert.match(rendered.html, /关系 · 3/)
  assert.match(rendered.html, /延迟 → 稳定性与振荡/)
  assert.match(rendered.html, /负反馈/)
})

test('领域尺度：8 个单元卡片（title + question + 能力目标）', () => {
  const data = subjectView({ scale: 'domain' })
  const rendered = renderPanel(data)
  assertClean(rendered, 'domain')
  assert.ok(rendered.visited.includes('DomainScale'))
  assert.match(rendered.html, /目标与系统边界/)
  assert.match(rendered.html, /要维持的量是什么？/)
  assert.match(rendered.html, /绑定目标量并划出边界/)
  assert.match(rendered.html, /解决什么问题/)
  assert.match(rendered.html, /能力目标/)
})

test('证据尺度：实验 / 预测 / 研究问题 / 笔记 / 任务草案内联', () => {
  const data = subjectView({ scale: 'evidence' })
  const rendered = renderPanel(data)
  assertClean(rendered, 'evidence')
  assert.ok(rendered.visited.includes('EvidenceScale'))
  assert.ok(rendered.visited.includes('ExperimentCard'))
  assert.match(rendered.html, /证据尺度/)
  assert.match(rendered.html, /延迟下的反复纠正/)
  assert.match(rendered.html, /负反馈在什么延迟下不再稳定/)
  assert.match(rendered.html, /下一项检验/)
  assert.match(rendered.html, /D=0.9、K=1.2 时会出现目标下方振荡/)
  assert.match(rendered.html, /让验收等待观测窗口/)
  assert.match(rendered.html, /延迟不是噪声/)
})

test('证据尺度：研究问题被选中时对话主题切到 investigation', () => {
  const data = subjectView({ scale: 'evidence', activeInvestigationId: 'inv_1', selectedNodeId: 'delay' })
  const rendered = renderPanel(data)
  assertClean(rendered, 'evidence/investigation')
  assert.match(rendered.html, /负反馈在什么延迟下不再稳定/)
})

test('窄屏：图/阅读/对话 分段切换出现，保持同一 subject', () => {
  const previousWindow = globalThis.window
  globalThis.window = createGlobals({ narrow: true }).window
  try {
    const rendered = renderPanel(subjectView())
    assertClean(rendered, 'narrow')
    assert.match(rendered.html, /窄屏|图|阅读|对话/)
    assert.ok(rendered.visited.includes('GraphCanvas'))
    assert.match(rendered.html, /延迟/)
  } finally {
    globalThis.window = previousWindow
  }
})

test('任务草案：已保存视图可回看版本并可对比', () => {
  const ci = indexCore(makeCore())
  const storeIndex = indexStore(makeStore())
  const element = reactStub.createElement(TaskEditor, {
    t,
    ci,
    storeIndex,
    subject: { kind: 'node', id: 'delay' },
    perform: async () => ({}),
    addReceipt() {},
    initialTaskId: 't_1',
    onBack() {},
  })
  const rendered = render(element)
  assertClean(rendered, 'task/saved')
  assert.match(rendered.html, /让验收等待观测窗口/)
  assert.match(rendered.html, /第 2 版/)
  assert.match(rendered.html, /版本/)
  assert.match(rendered.html, /验收/)
  assert.match(rendered.html, /边界/)
  assert.match(rendered.html, /未知项/)
  assert.match(rendered.html, /不会自动发送/)
  assert.match(rendered.html, /对比当前与所选版本/)
})

test('任务草案：空白起步先问"要改变什么行为"', () => {
  const ci = indexCore(makeCore())
  const storeIndex = indexStore(makeStore())
  const element = reactStub.createElement(TaskEditor, {
    t,
    ci,
    storeIndex,
    subject: { kind: 'node', id: 'delay' },
    perform: async () => ({}),
    addReceipt() {},
    onBack() {},
  })
  const rendered = render(element)
  assertClean(rendered, 'task/new')
  assert.match(rendered.html, /你要改变什么行为/)
  assert.match(rendered.html, /真实需求/)
  assert.match(rendered.html, /生成可编辑草案/)
  assert.match(rendered.html, /不会自动发送/)
})

test('笔记：来源标识、旧记录来源不确定提示、归档/恢复入口', () => {
  const storeIndex = indexStore(makeStore())
  const notes = storeIndex.notesFor({ kind: 'node', id: 'feedback' }).concat(storeIndex.notesFor({ kind: 'node', id: 'delay' }))
  const element = reactStub.createElement(NotesSection, {
    t,
    subject: { kind: 'node', id: 'delay' },
    notes,
    draft: '',
    onDraftChange() {},
    onSave: async () => ({}),
    onSaveEdit: async () => ({}),
    onArchive: async () => ({}),
    onDelete: async () => ({}),
  })
  const rendered = render(element)
  assertClean(rendered, 'notes')
  assert.match(rendered.html, /用户原文/)
  assert.match(rendered.html, /AI 草案/)
  assert.match(rendered.html, /旧记录来源不确定/)
  assert.match(rendered.html, /归档/)
  assert.match(rendered.html, /保存为我的笔记/)
})

test('资料与备份弹层：路径、备份/导出/导入、迁移报告、导入历史', () => {
  const data = subjectView()
  const element = reactStub.createElement(ResourcesDialog, {
    open: true,
    onClose() {},
    t,
    data,
    storeIndex: indexStore(data.store),
    perform: async () => ({}),
    addReceipt() {},
    copyText: async () => ({ ok: true }),
  })
  const rendered = render(element)
  assertClean(rendered, 'resources')
  assert.match(rendered.html, /资料与备份/)
  assert.match(rendered.html, /state\.json/)
  assert.match(rendered.html, /立即备份/)
  assert.match(rendered.html, /导出用户数据包/)
  assert.match(rendered.html, /导入用户数据包/)
  assert.match(rendered.html, /迁移报告/)
  assert.match(rendered.html, /导入历史/)
})

test('继续研究弹层：上次阅读、研究问题与下一项检验、待验证预测', () => {
  const data = subjectView()
  const element = reactStub.createElement(ContinueDialog, {
    open: true,
    onClose() {},
    t,
    ci: indexCore(data.core),
    storeIndex: indexStore(data.store),
    view: data.store.view,
    onGoSubject() {},
    onGoInvestigation() {},
    onGoRun() {},
  })
  const rendered = render(element)
  assertClean(rendered, 'continue')
  assert.match(rendered.html, /继续研究/)
  assert.match(rendered.html, /上次阅读/)
  assert.match(rendered.html, /负反馈在什么延迟下不再稳定/)
  assert.match(rendered.html, /下一项检验/)
  assert.match(rendered.html, /待验证的预测/)
})

test('来源弹层：核验程度、出处、URL/检索路径不编造', () => {
  const ci = indexCore(makeCore())
  const source = ci.sourcesById.get('s.maxwell1868')
  const element = reactStub.createElement(SourceDialog, {
    open: true,
    t,
    source,
    onClose() {},
    onCopy() {},
  })
  const rendered = render(element)
  assertClean(rendered, 'source')
  assert.match(rendered.html, /On Governors/)
  assert.match(rendered.html, /未核验/)
  assert.match(rendered.html, /Royal Society/)
})

test('回执弹层：真实回执带 code，迁移提示可见', () => {
  const data = subjectView()
  const element = reactStub.createElement(ReceiptsDialog, {
    open: true,
    t,
    receipts: [
      { id: 'r1', kind: 'ok', text: '已保存（宿主确认）：笔记', at: '2026-10-27T12:00:00.000Z' },
      { id: 'r2', kind: 'error', text: '写入存储失败：磁盘满', code: 'STORAGE_WRITE', at: '2026-10-27T12:01:00.000Z' },
    ],
    notices: [{ level: 'info', text: '旧数据已迁移；备份保留。' }],
    onClose() {},
    onClear() {},
  })
  const rendered = render(element)
  assertClean(rendered, 'receipts')
  assert.match(rendered.html, /回执与提示/)
  assert.match(rendered.html, /写入存储失败/)
  assert.match(rendered.html, /STORAGE_WRITE/)
  assert.match(rendered.html, /旧数据已迁移/)
})

test('模型不可用 / 只读 / fatal：降级提示可见且可操作', () => {
  const data = subjectView()
  data.modelAvailable = false
  data.modelReason = '没有配置默认模型'
  data.readOnly = true
  data.fatal = '存储文件不可写'
  const rendered = renderPanel(data)
  assertClean(rendered, 'degraded')
  assert.match(rendered.html, /模型不可用/)
  assert.match(rendered.html, /只读|ROAD|read-only/)
  assert.match(rendered.html, /存储文件不可写/)
})

test('语言切换：t() 换成 key 兜底仍能整棵树渲染（不崩溃）', () => {
  const enT = (key) => key
  const rendered = renderPanel(subjectView(), { t: enT })
  assertClean(rendered, 'english keys fallback')
  assert.match(rendered.html, /loop\./)
})
