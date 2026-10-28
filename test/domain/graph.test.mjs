import test from 'node:test'
import assert from 'node:assert/strict'

import {
  contentIndex,
  nodeById,
  edgeById,
  claimById,
  sourceById,
  resolveNodeId,
  subjectLabel,
  relationLabel,
  relationsForNode,
  neighbors,
  projectionLayers,
  timeline,
  practiceLoop,
  domainGroups,
  evidenceForSubject,
  relationTypeLabel,
  PRACTICE_STAGE_KEYS,
  RELATION_TYPE_LABELS,
} from '../../src/domain/graph.js'
import { makeGraphCore } from './fixtures/mini-core.mjs'

const core = makeGraphCore()

test('内容索引：node/relation/claim/source 查询与未知 id 返回 null', () => {
  const index = contentIndex(core)
  assert.equal(index.nodes.size, 5)
  assert.equal(index.relations.size, 3)
  assert.equal(nodeById(core, 'delay').title, '延迟')
  assert.equal(edgeById(core, 'e.delay-to-stability').type, 'formal')
  assert.equal(nodeById(core, 'ghost'), null)
  assert.equal(edgeById(core, 42), null)
  assert.equal(claimById(core, 'c.none'), null)
  assert.equal(sourceById(core, 's.maxwell1868').year, 1868)
  // 空内容不抛错
  assert.equal(nodeById({}, 'x'), null)
  assert.deepEqual(neighbors({}, 'x'), [])
})

test('关系类型标签使用契约文案', () => {
  assert.equal(RELATION_TYPE_LABELS.prerequisite, '依赖')
  assert.equal(RELATION_TYPE_LABELS.formal, '形式结果')
  assert.equal(RELATION_TYPE_LABELS.historical, '历史影响')
  assert.equal(relationTypeLabel('analogy'), '类比')
  assert.equal(relationTypeLabel('unknown-type'), 'unknown-type')
})

test('subjectLabel / relationLabel 用于 host 提示词与 UI 标题', () => {
  assert.equal(subjectLabel(core, { kind: 'node', id: 'delay' }), '延迟')
  assert.match(subjectLabel(core, { kind: 'relation', id: 'e.goal-to-feedback' }), /目标与被维持的量 → 负反馈（依赖）/)
  assert.equal(subjectLabel(core, { kind: 'node', id: 'ghost' }), null)
  assert.match(relationLabel(core, edgeById(core, 'e.delay-to-stability')), /延迟 → 稳定性与振荡（形式结果）/)
})

test('relationsForNode 同时返回出边与入边', () => {
  assert.equal(relationsForNode(core, 'goal').length, 1)
  assert.equal(relationsForNode(core, 'feedback').length, 2)
  assert.equal(relationsForNode(core, 'stability').length, 2)
  assert.deepEqual(relationsForNode(core, 'ghost'), [])
  assert.deepEqual(relationsForNode(core, 123), [])
})

test('neighbors：不含自身、按相关度排序、limit 生效且确定性', () => {
  assert.deepEqual(neighbors(core, 'delay'), ['stability'])
  assert.deepEqual(neighbors(core, 'goal'), ['feedback'])
  const first = neighbors(core, 'stability', 7)
  assert.ok(!first.includes('stability'))
  assert.deepEqual(first, neighbors(core, 'stability', 7), '同样输入必须同样顺序')
  assert.equal(neighbors(core, 'stability', 1).length, 1)
  assert.equal(neighbors(core, 'stability', 0).length, 2, 'limit 非法时回退默认 7（此处邻居只有 2 个）')
  assert.deepEqual(neighbors(core, 'ghost'), [])
})

test('resolveNodeId 支持 compat.legacyIds 的旧 id 映射', () => {
  const withLegacy = structuredClone(core)
  withLegacy.nodes[0].compat = { legacyIds: ['old-goal'] }
  assert.equal(resolveNodeId(withLegacy, 'goal'), 'goal')
  assert.equal(resolveNodeId(withLegacy, 'old-goal'), 'goal')
  assert.equal(resolveNodeId(withLegacy, 'never-existed'), null)
})

test('理论投影：先修/形式结果/限制/并行/应用/历史类比分层', () => {
  const theory = projectionLayers(core, 'theory')
  assert.equal(theory.projection, 'theory')
  const keys = theory.groups.map((g) => g.key)
  assert.deepEqual(keys, ['prerequisite', 'formal', 'constraint', 'parallel', 'application', 'context'])
  const formal = theory.groups.find((g) => g.key === 'formal')
  assert.equal(formal.items.length, 1)
  assert.equal(formal.items[0].id, 'e.delay-to-stability')
  assert.equal(formal.items[0].typeLabel, '形式结果')
  // 未显式传 projection 时默认理论视角
  assert.equal(projectionLayers(core).projection, 'theory')
})

test('历史投影：按 eraStart 排序，时间不确定单独一带，来源按年份排', () => {
  const history = projectionLayers(core, 'history')
  assert.equal(history.projection, 'history')
  const timelineGroup = history.groups.find((g) => g.key === 'timeline')
  const starts = timelineGroup.items.map((item) => item.eraStart)
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b))
  const unknown = history.groups.find((g) => g.key === 'unknown')
  assert.deepEqual(unknown.items.map((i) => i.id), ['goal'])
  const sources = history.groups.find((g) => g.key === 'sources').items
  assert.deepEqual(sources.map((s) => s.year), [1868, 1948])
  // range 精度与事件类型保留
  const cybersyn = timelineGroup.items.find((i) => i.id === 'cybersyn')
  assert.equal(cybersyn.eraPrecision, 'range')
  assert.equal(cybersyn.eraEnd, 1973)
  assert.equal(cybersyn.kind, 'event')
})

test('timeline() 顶层接口与投影结构一致', () => {
  const result = timeline(core)
  assert.equal(result.items.length, 5)
  assert.equal(result.groups.length, 3)
})

test('实践投影：目标→测量→行动→观测→验收→修订 六个阶段', () => {
  const practice = projectionLayers(core, 'practice')
  assert.equal(practice.projection, 'practice')
  assert.deepEqual(practice.stages.map((s) => s.key), [...PRACTICE_STAGE_KEYS])
  const labels = practice.stages.map((s) => s.label)
  assert.deepEqual(labels, ['目标', '测量', '行动', '观测', '验收', '修订'])
  const goalStage = practice.stages.find((s) => s.key === 'goal')
  assert.deepEqual(goalStage.nodeIds, ['goal'])
  const acceptance = practice.stages.find((s) => s.key === 'acceptance')
  assert.deepEqual(acceptance.nodeIds, ['stability'])
  // 没有任何节点挂某个阶段时也要返回该阶段（不丢结构）
  assert.equal(practiceLoop({ nodes: [] }).stages.length, 6)
})

test('领域尺度：按 order 排序并带入口节点标题', () => {
  const groups = domainGroups(core)
  assert.deepEqual(groups.map((g) => g.id), ['g1', 'g2', 'g3'])
  assert.equal(groups[0].entryNodeTitle, '目标与被维持的量')
  assert.equal(groups[0].question.length > 0, true)
  assert.deepEqual(domainGroups({}), [])
})

test('证据尺度：按 subject 汇总笔记/实验/预测/任务', () => {
  const store = {
    notes: {
      n_1: { id: 'n_1', subject: { kind: 'node', id: 'delay' }, text: 'a' },
      n_2: { id: 'n_2', subject: { kind: 'node', id: 'stability' }, text: 'b' },
    },
    experiments: {
      e_1: { id: 'e_1', subject: { kind: 'node', id: 'delay' } },
      e_2: { id: 'e_2', subject: null },
    },
    predictions: {
      p_1: { id: 'p_1', subject: { kind: 'node', id: 'delay' } },
    },
    tasks: {
      t_1: { id: 't_1', conceptIds: ['delay'], evidenceRefs: [] },
      t_2: { id: 't_2', conceptIds: [], evidenceRefs: [{ kind: 'note', id: 'n_1' }] },
      t_3: { id: 't_3', conceptIds: ['stability'], evidenceRefs: [] },
    },
  }
  const evidence = evidenceForSubject(core, store, 'node:delay')
  assert.equal(evidence.subject, 'node:delay')
  assert.deepEqual(evidence.notes.map((n) => n.id), ['n_1'])
  assert.deepEqual(evidence.runs.map((e) => e.id), ['e_1'])
  assert.deepEqual(evidence.predictions.map((p) => p.id), ['p_1'])
  assert.deepEqual(evidence.tasks.map((t) => t.id).sort(), ['t_1', 't_2'])
})
