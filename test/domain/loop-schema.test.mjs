import test from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyLoopTables,
  validateLoopRecord,
  validateInterventionRecord,
  validateObservationRecord,
  validateLoopTables,
  LOOP_STATUSES,
  GAP_TYPES,
} from '../../src/domain/loop-schema.js'

const NOW = '2026-10-28T12:00:00.000Z'
const LATER = '2026-10-30T12:00:00.000Z'

function makeLoop(overrides = {}) {
  return {
    id: 'lp_demo',
    title: '让 agent 改完代码后稳定通过测试',
    systemType: 'coding-agent',
    summary: '改代码 → 跑测试 → 提交前评审',
    goal: { quantity: '提交前测试通过率', criterion: '连续 5 次改动均通过', current: '3/5' },
    measurement: { how: 'CI 结果 + 本地测试', cadence: '每次改动', source: 'manual', confidence: 0.6 },
    action: { levers: ['改测试选择顺序', '缩小改动粒度'], cannot: ['修改外部服务'] },
    disturbances: [{ text: 'flaky 测试' }],
    delays: [{ from: '提交', to: '看到 CI 结果', estimateSeconds: 600, unknown: false }],
    boundary: { nonGoals: ['一次改完所有历史遗留'], notes: '只处理本周新增改动' },
    hypothesis: {
      claim: '失败主要来自改动粒度过大，一次改太多文件',
      counter: '可能是测试本身不稳定',
      falsifier: '把改动拆小后失败率没有下降',
    },
    gaps: [{ type: 'unmeasured', severity: 'warn', evidenceText: '没有记录失败类型分布' }],
    principleRefs: [{ nodeId: 'feedback', userTranslation: '测试就是测量环节', whyHere: '失败来自测量延迟' }],
    status: 'modeled',
    nextAction: { type: 'intervene', text: '下次改动只改一个文件，记录测试结果', estimateMin: 30, dueAt: null },
    nextCheck: {
      criterion: '连续 3 次单文件改动全部通过',
      predicted: '失败率下降',
      windowStart: NOW,
      windowEnd: LATER,
      interventionId: null,
    },
    application: { acceptance: ['连续 5 次通过'], stopConditions: ['出现新失败类型'], checkpoints: ['提交前人工看测试列表'], taskIds: [] },
    version: 1,
    versions: [{ version: 1, at: NOW, changeSummary: '初始建模', snapshot: {} }],
    legacy: false,
    createdAt: NOW,
    updatedAt: NOW,
    lastOpenedAt: null,
    ...overrides,
  }
}

const core = { nodes: [{ id: 'feedback' }, { id: 'measurement' }] }

test('掌控卡：合法记录通过', () => {
  const result = validateLoopRecord(makeLoop(), {})
  assert.equal(result.ok, true, JSON.stringify(result.errors))
})

test('掌控卡：合法记录 + 内容包原理卡引用通过', () => {
  const result = validateLoopTables({ loops: { lp_demo: makeLoop() }, interventions: {}, observations: {} }, { core })
  assert.equal(result.ok, true, JSON.stringify(result.errors))
})

test('掌控卡：状态与缺口枚举非法时拒绝', () => {
  const result = validateLoopRecord(makeLoop({ status: 'doing', gaps: [{ type: 'made-up' }] }), {})
  assert.equal(result.ok, false)
  const paths = result.errors.map((item) => item.path)
  assert.ok(paths.includes('loop.status'))
  assert.ok(paths.some((path) => path.includes('gaps')))
})

test('掌控卡：nextCheck 时间窗倒置被拒绝', () => {
  const loop = makeLoop({
    nextCheck: { criterion: 'x', predicted: 'y', windowStart: LATER, windowEnd: NOW, interventionId: null },
  })
  const result = validateLoopRecord(loop, {})
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((item) => item.path === 'loop.nextCheck.windowEnd' && item.code === 'RANGE'))
})

test('掌控卡：原理卡引用不存在的节点被拒绝', () => {
  const loop = makeLoop({ principleRefs: [{ nodeId: 'not-in-pack', userTranslation: '', whyHere: '' }] })
  const result = validateLoopRecord(loop, { nodeIds: new Set(['feedback']) })
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((item) => item.code === 'DANGLING_REF'))
})

test('掌控卡：版本号必须严格递增', () => {
  const loop = makeLoop({
    version: 2,
    versions: [
      { version: 1, at: NOW, changeSummary: 'a', snapshot: {} },
      { version: 1, at: LATER, changeSummary: 'b', snapshot: {} },
    ],
  })
  const result = validateLoopRecord(loop, {})
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((item) => item.code === 'ORDER'))
})

test('干预：引用不存在的卡被拒绝', () => {
  const intervention = { id: 'iv_1', loopId: 'lp_missing', action: '拆小改动', predicted: '失败率下降', windowStart: NOW, windowEnd: LATER, status: 'planned', at: NOW }
  const result = validateInterventionRecord(intervention, { loopIds: new Set(['lp_demo']) })
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((item) => item.code === 'DANGLING_REF'))
})

test('观察：verdict 非法、数值型指标缺数字、悬空笔记引用均被拒绝', () => {
  const observation = {
    id: 'ob_1',
    loopId: 'lp_demo',
    interventionId: null,
    at: NOW,
    source: 'manual',
    metric: { kind: 'count', value: 'three', unit: '次' },
    compare: { prediction: '失败率下降', verdict: 'maybe', reason: '' },
    evidenceRefs: [],
    noteIds: ['n_missing'],
  }
  const result = validateObservationRecord(observation, { loopIds: new Set(['lp_demo']), noteIds: new Set(['n_ok']) })
  assert.equal(result.ok, false)
  const paths = result.errors.map((item) => item.path)
  assert.ok(paths.includes('observation.metric.value'))
  assert.ok(paths.includes('observation.compare.verdict'))
  assert.ok(paths.includes('observation.noteIds[0]'))
})

test('观察：干预与观察必须属于同一张卡', () => {
  const state = {
    loops: { lp_a: makeLoop({ id: 'lp_a' }) },
    interventions: { iv_1: { id: 'iv_1', loopId: 'lp_a', action: 'a', predicted: 'b', windowStart: NOW, windowEnd: LATER, status: 'done', at: NOW } },
    observations: {
      ob_1: {
        id: 'ob_1',
        loopId: 'lp_b',
        interventionId: 'iv_1',
        at: NOW,
        source: 'manual',
        metric: { kind: 'text', value: 'ok', unit: '' },
        compare: { prediction: '', verdict: 'inconclusive', reason: '' },
        evidenceRefs: [],
        noteIds: [],
      },
    },
    notes: {},
    dialogs: {},
    tasks: {},
    view: { activeLoopId: null },
  }
  const result = validateLoopTables(state, {})
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((item) => item.code === 'CROSS_LOOP'))
})

test('v3 视图与笔记的 loop 引用闭合', () => {
  const state = {
    loops: {},
    interventions: {},
    observations: {},
    notes: { n_1: { id: 'n_1', subject: { kind: 'loop', id: 'lp_missing' } } },
    dialogs: { 'loop:lp_missing': { subject: { kind: 'loop', id: 'lp_missing' } } },
    tasks: {},
    view: { activeLoopId: 'lp_missing' },
  }
  const result = validateLoopTables(state, {})
  assert.equal(result.ok, false)
  const paths = result.errors.map((item) => item.path)
  assert.ok(paths.includes('notes.n_1.subject.id'))
  assert.ok(paths.includes('dialogs.loop:lp_missing.subject.id'))
  assert.ok(paths.includes('view.activeLoopId'))
})

test('空表集合稳定且状态枚举覆盖设计', () => {
  const tables = emptyLoopTables()
  assert.deepEqual(Object.keys(tables), ['loops', 'interventions', 'observations'])
  assert.deepEqual(LOOP_STATUSES, ['draft', 'modeled', 'testing', 'reviewing', 'revised', 'paused', 'archived'])
  assert.equal(GAP_TYPES.length, 10)
})
