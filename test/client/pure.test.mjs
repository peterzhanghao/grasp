/**
 * 纯函数测试：图谱布局、内容索引、用户数据归一化、工具函数、文案字典。
 * 这些是 node --test 可直接 import 的无 React/DOM 模块。
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { FALLBACK_ZH, FALLBACK_EN, createTranslator, mergeDictionaries } from '../../src/client/i18n.js'
import { layoutSubjectGraph, NODE_SIZE } from '../../src/client/layout/graph.js'
import {
  indexCore,
  neighborsOf,
  relationsForNode,
  searchContent,
  historyForSubject,
  practiceForSubject,
  sourcesForSubject,
  experimentsForSubject,
  experimentKind,
  claimsForSubject,
  nodeEraLabel,
  subjectFromView,
} from '../../src/client/model.js'
import { indexStore } from '../../src/client/store.js'
import {
  subjectKey as utilSubjectKey,
  parseSubjectKey,
  newRequestId,
  classNames,
  truncate,
  formatTime,
  clamp,
} from '../../src/client/util.js'
import { makeCore, makeStore } from './fixtures/state-v2.mjs'

const ci = indexCore(makeCore())
const store = indexStore(makeStore())

test('i18n：zh/en fallback key 集合一致，插值与覆盖合并可用', () => {
  assert.deepEqual(Object.keys(FALLBACK_EN).sort(), Object.keys(FALLBACK_ZH).sort())
  assert.ok(Object.keys(FALLBACK_ZH).length > 300)
  const t = createTranslator({ zh: FALLBACK_ZH, en: FALLBACK_ZH })
  assert.equal(t('loop.app.title'), '掌控')
  assert.equal(t('loop.subject.neighbors', { count: '3' }), '3 个相关邻居')
  assert.equal(t('loop.unknown.key.for.test'), 'loop.unknown.key.for.test', '缺 key 回退显示 key')
  const merged = mergeDictionaries({ 'loop.app.title': '覆盖标题' }, {})
  assert.equal(merged.zh['loop.app.title'], '覆盖标题')
  assert.equal(merged.zh['loop.app.retry'], FALLBACK_ZH['loop.app.retry'], '未覆盖的 key 保留 fallback')
})

test('util：subjectKey、id、时间、截断', () => {
  assert.equal(utilSubjectKey({ kind: 'node', id: 'delay' }), 'node:delay')
  assert.deepEqual(parseSubjectKey('relation:e.x'), { kind: 'relation', id: 'e.x' })
  assert.equal(parseSubjectKey('bad'), null)
  assert.match(newRequestId(), /^r_[a-z0-9]+_[a-z0-9]+$/)
  assert.equal(classNames('a', null, ['b', { c: true, d: false }]), 'a b c')
  assert.equal(truncate('一二三四五', 3), '一二…')
  assert.equal(clamp(5, 0, 3), 3)
  assert.match(formatTime('2026-10-27T12:00:00.000Z'), /^2026-10-\d{2} \d{2}:\d{2}$/)
})

test('model：内容索引引用闭合', () => {
  assert.equal(ci.hasContent, true)
  assert.equal(ci.nodes.length, 4)
  assert.equal(ci.relations.length, 6)
  for (const relation of ci.relations) {
    assert.ok(ci.nodesById.has(relation.from), `relation.from 悬空：${relation.id}`)
    assert.ok(ci.nodesById.has(relation.to), `relation.to 悬空：${relation.id}`)
  }
  for (const claim of ci.claims) {
    if (claim.subject) assert.ok(ci.nodesById.has(claim.subject.id) || ci.relationsById.has(claim.subject.id))
  }
  assert.equal(ci.groupsById.get('g2').entryNodeId, 'feedback')
  assert.equal(ci.experiments.length, 3)
})

test('model：问题尺度邻居 3—7 个且带关系，按类型优先级', () => {
  const { neighbors, total } = neighborsOf(ci, 'delay', 7)
  assert.ok(neighbors.length >= 3 && neighbors.length <= 7, `邻居数量 ${neighbors.length} 不在 3—7`)
  assert.equal(total, new Set(neighbors.map((entry) => entry.node.id)).size + (total - neighbors.length))
  for (const entry of neighbors) {
    assert.ok(entry.node && entry.relation)
    assert.ok(!('x' in entry), '布局坐标不进入模型层')
  }
  const limited = neighborsOf(ci, 'delay', 2)
  assert.equal(limited.neighbors.length, 2)
  assert.equal(limited.total, total)
  assert.equal(relationsForNode(ci, 'delay').length, 3)
})

test('model：关系两端、主张、来源与实验关联', () => {
  const relationSubject = { kind: 'relation', id: 'e.delay-to-stability' }
  const claims = claimsForSubject(ci, relationSubject)
  assert.equal(claims.length, 0, 'fixture 中该关系无主张；UI 需显示 noClaims')
  const summary = sourcesForSubject(ci, { kind: 'node', id: 'feedback' })
  assert.ok(summary.length >= 1)
  assert.ok(summary.some((source) => source.verified === 'unverified'))
  const related = experimentsForSubject(ci, { kind: 'node', id: 'delay' })
  assert.deepEqual(related.map((experiment) => experiment.id), ['delay'])
  assert.equal(experimentKind(ci.experimentsById.get('delay')), 'delay')
  assert.equal(experimentKind({ id: 'greenbutwrong' }), 'green')
  assert.equal(experimentKind({ modelId: 'proxy-v2' }), 'proxy')
})

test('model：历史时间轴把未知年代单列，不编年表', () => {
  const history = historyForSubject(ci, { kind: 'node', id: 'delay' })
  assert.ok(history.known.length >= 1)
  assert.ok(history.unknown.some((entry) => entry.node.id === 'delay'), 'delay 无年代，应在时间不确定带')
  assert.ok(history.sources.length >= 1)
  assert.ok(history.gaps.length >= 1, '缺口应可显示检索路径')
  const era = nodeEraLabel(ci.nodesById.get('stability'))
  assert.equal(era.uncertain, false)
  assert.equal(era.text, '1868—1948')
})

test('model：实践视角按 practiceStages 分栏', () => {
  const practice = practiceForSubject(ci, { kind: 'node', id: 'delay' })
  assert.equal(practice.stages.length, 6)
  const goal = practice.stages.find((stage) => stage.stage === 'goal')
  assert.ok(goal.nodes.some((node) => node.id === 'goal'))
  const observation = practice.stages.find((stage) => stage.stage === 'observation')
  assert.ok(observation.nodes.some((node) => node.id === 'delay'))
})

test('model：搜索覆盖节点与关系', () => {
  const nodes = searchContent(ci, '延迟')
  assert.ok(nodes.nodes.some((node) => node.id === 'delay'))
  const relations = searchContent(ci, '限制')
  assert.ok(relations.relations.length >= 1)
  assert.deepEqual(searchContent(ci, '   ').nodes, [])
})

test('layout：图谱坐标在容器内、当前节点居中、连线与标签数量一致', () => {
  const { neighbors } = neighborsOf(ci, 'delay', 7)
  const width = 880
  const height = 560
  const layout = layoutSubjectGraph({ center: ci.nodesById.get('delay'), neighbors, width, height })
  assert.equal(layout.nodes.length, neighbors.length + 1)
  const centerNode = layout.nodes.find((entry) => entry.isCenter)
  assert.ok(Math.abs(centerNode.x - width / 2) < 1 && Math.abs(centerNode.y - height / 2) < 1)
  for (const entry of layout.nodes) {
    assert.ok(entry.x >= entry.size.width / 2 && entry.x <= width - entry.size.width / 2, `${entry.id} x 越界`)
    assert.ok(entry.y >= entry.size.height / 2 && entry.y <= height - entry.size.height / 2, `${entry.id} y 越界`)
  }
  assert.equal(layout.edges.length, neighbors.length)
  assert.equal(layout.labelNodes.length, neighbors.length)
  for (const edge of layout.edges) assert.match(edge.path, /^M [\d.]+ [\d.]+ C /)
  assert.equal(layout.stacked, false)
  assert.equal(NODE_SIZE.neighbor.width, 156)
})

test('layout：窄画布切换为纵向堆叠', () => {
  const { neighbors } = neighborsOf(ci, 'delay', 7)
  const layout = layoutSubjectGraph({ center: ci.nodesById.get('delay'), neighbors, width: 480, height: 640 })
  assert.equal(layout.stacked, true)
  const ys = layout.nodes.map((entry) => entry.y)
  assert.ok(new Set(ys).size >= layout.nodes.length - 1, '堆叠布局需要错开行')
})

test('store：v2 记录归一化 + v1 旧记录标记来源不确定', () => {
  assert.equal(store.notes.length, 4)
  const legacy = store.notesById.get('n_legacy_1')
  assert.deepEqual(legacy.subject, { kind: 'node', id: 'feedback' })
  assert.equal(legacy.legacyOriginUncertain, true, '旧 origin:user 必须标记来源不确定')
  const userNote = store.notesById.get('n_user_1')
  assert.equal(userNote.legacyOriginUncertain, false)
  assert.equal(userNote.authorSource, 'user')
  assert.equal(store.notesById.get('n_ai_1').authorSource, 'ai-draft')
  assert.equal(store.notesById.get('n_ai_1').adopted, true)
  const relationNotes = store.notesFor({ kind: 'relation', id: 'e.delay-to-stability' })
  assert.equal(relationNotes.length, 1)
  assert.equal(store.relationFor('e.delay-to-stability').status, 'challenged')
  assert.deepEqual(store.relationFor('e.delay-to-stability').evidenceNoteIds, ['n_relation_1'])
})

test('store：预测/研究问题/运行/任务/对话归一化', () => {
  assert.equal(store.predictions.length, 2)
  const legacyPrediction = store.predictions.find((item) => item.id === 'p_legacy')
  assert.equal(legacyPrediction.status, 'open')
  assert.equal(legacyPrediction.legacy, true)
  assert.equal(store.openPredictions().length, 2)
  assert.equal(store.openInvestigations().length, 1)
  assert.equal(store.runsFor({ kind: 'node', id: 'delay' }).length, 1)
  assert.equal(store.tasks.length, 1)
  const task = store.tasksById.get('t_1')
  assert.equal(task.revision, 2)
  assert.equal(task.revisions.length, 2)
  assert.equal(task.status, 'saved')
  const dialog = store.getDialog({ kind: 'node', id: 'delay' })
  assert.equal(dialog.messages.length, 3)
  assert.equal(dialog.messages[2].status, 'failed')
  assert.equal(dialog.messages[2].error.code, 'LLM_RATE_LIMIT')
  assert.equal(store.getDialog({ kind: 'node', id: 'absent' }), null)
})

test('subjectFromView：关系优先于节点', () => {
  assert.deepEqual(subjectFromView({ selectedRelationId: 'e.x', selectedNodeId: 'delay' }), {
    kind: 'relation',
    id: 'e.x',
  })
  assert.deepEqual(subjectFromView({ selectedNodeId: 'delay' }), { kind: 'node', id: 'delay' })
  assert.equal(subjectFromView({}), null)
  assert.equal(utilSubjectKey({ kind: 'node', id: 'delay' }), 'node:delay')
})
