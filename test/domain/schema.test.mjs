import test from 'node:test'
import assert from 'node:assert/strict'

import {
  SCHEMA_VERSION,
  STATE_TABLES,
  DEFAULT_VIEW,
  emptyState,
  subjectKey,
  parseSubjectKey,
  isIsoTimestamp,
  canonicalJson,
  recordsEqual,
  normalizeRecord,
  normalizeRevisions,
  validateRecord,
  validateState,
  buildRefContext,
} from '../../src/domain/schema.js'
import { makeGraphCore } from './fixtures/mini-core.mjs'

const ISO = '2026-10-28T00:00:00.000Z'
const core = makeGraphCore()

function validNote(overrides = {}) {
  return {
    id: 'n_test_1',
    subject: { kind: 'node', id: 'delay' },
    kind: '理解',
    text: '延迟不是慢，是我看到的是过去。',
    status: 'active',
    authorSource: 'user',
    savedBy: 'ui',
    adopted: null,
    legacyOriginUncertain: false,
    encodingSuspected: false,
    parentRevision: null,
    createdAt: ISO,
    updatedAt: ISO,
    revision: 1,
    ...overrides,
  }
}

function noteRecord(id = 'n_1', overrides = {}) {
  return validNote({ id, ...overrides })
}

function validDialog(subject = { kind: 'node', id: 'delay' }) {
  return {
    subject,
    messages: [
      {
        id: 'm_1',
        role: 'user',
        text: '延迟为什么会导致振荡？',
        at: ISO,
        requestId: 'r_1',
        contextVersion: '1.0.0+1',
        model: { provider: 'fake', model: 'fake-model', reasoningEffort: null },
        status: 'completed',
        error: null,
        partial: false,
      },
    ],
    lastRequestId: 'r_1',
    updatedAt: ISO,
  }
}

function withTable(state, table, key, value) {
  if (!state[table]) state[table] = {}
  state[table][key] = value
  return state
}

test('SCHEMA_VERSION=2，STATE_TABLES 覆盖契约的 8 张表', () => {
  assert.equal(SCHEMA_VERSION, 2)
  assert.deepEqual(
    [...STATE_TABLES].sort(),
    ['dialogs', 'experiments', 'investigations', 'notes', 'predictions', 'relations', 'revisions', 'tasks'].sort(),
  )
  assert.equal(Object.keys(DEFAULT_VIEW).length, 7)
})

test('emptyState 通过全量校验，且每次返回独立对象', () => {
  const a = emptyState()
  const b = emptyState()
  a.view.selectedNodeId = 'delay'
  assert.equal(b.view.selectedNodeId, null, 'emptyState 不能返回共享引用')
  assert.deepEqual(validateState(emptyState(), { core }), { ok: true, errors: [], warnings: [] })
})

test('笔记记录校验：合法通过，非法字段/枚举/时间戳被拒绝', () => {
  const ctx = buildRefContext({ core, store: emptyState() })
  assert.equal(validateRecord('note', validNote(), ctx).ok, true)

  const cases = [
    [{ text: '' }, 'EMPTY'],
    [{ kind: '猜测' }, 'ENUM'],
    [{ status: 'deleted' }, 'ENUM'],
    [{ authorSource: 'system' }, 'ENUM'],
    [{ savedBy: 'server' }, 'ENUM'],
    [{ createdAt: '2026/10/28' }, 'ISO'],
    [{ updatedAt: 'yesterday' }, 'ISO'],
    [{ revision: 0 }, 'RANGE'],
    [{ adopted: 'yes' }, 'TYPE'],
    [{ legacyOriginUncertain: 'true' }, 'TYPE'],
    [{ subject: { kind: 'node', id: 'not-a-node' } }, 'DANGLING_REF'],
    [{ subject: { kind: 'planet', id: 'x' } }, 'ENUM'],
    [{ subject: null }, 'TYPE'],
  ]
  for (const [override, code] of cases) {
    const result = validateRecord('note', validNote(override), ctx)
    assert.equal(result.ok, false, `期望校验失败：${JSON.stringify(override)}`)
    assert.ok(result.errors.some((e) => e.code === code), `期望错误码 ${code}，实际 ${JSON.stringify(result.errors)}`)
  }
})

test('subjectKey / parseSubjectKey 与契约一致', () => {
  assert.equal(subjectKey({ kind: 'node', id: 'delay' }), 'node:delay')
  assert.equal(subjectKey({ kind: 'relation', id: 'e.a.b' }), 'relation:e.a.b')
  assert.deepEqual(parseSubjectKey('node:delay'), { kind: 'node', id: 'delay' })
  assert.equal(parseSubjectKey('delay'), null)
  assert.equal(parseSubjectKey('planet:x'), null)
  assert.equal(subjectKey(null), null)
})

test('normalizeRecord 补默认值、丢未知字段并记 warning，不改入参', () => {
  const raw = { id: 'n_x', text: '一段理解', unknownField: 1 }
  const snapshot = JSON.stringify(raw)
  const normalized = normalizeRecord('note', raw)
  assert.equal(JSON.stringify(raw), snapshot)
  assert.equal(normalized.ok, true)
  assert.equal(normalized.record.kind, '理解')
  assert.equal(normalized.record.status, 'active')
  assert.equal(normalized.record.authorSource, 'user')
  assert.equal(normalized.record.revision, 1)
  assert.ok(normalized.warnings.some((w) => w.code === 'UNKNOWN_FIELD'))

  const revisions = normalizeRevisions([{ revision: 1, text: 'a', at: ISO }])
  assert.equal(revisions.ok, true)
  assert.equal(revisions.record[0].savedBy, 'ui')
  assert.equal(normalizeRevisions('nope').ok, false)
})

test('canonicalJson / recordsEqual 与对象键顺序无关', () => {
  assert.equal(canonicalJson({ b: 1, a: { d: 2, c: 3 } }), canonicalJson({ a: { c: 3, d: 2 }, b: 1 }))
  assert.equal(recordsEqual({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 }), true)
  assert.equal(recordsEqual({ a: 1 }, { a: 2 }), false)
})

test('isIsoTimestamp 只接受契约要求的 ISO 8601（UTC Z）', () => {
  assert.equal(isIsoTimestamp('2026-10-28T00:00:00.000Z'), true)
  assert.equal(isIsoTimestamp('2026-10-28T00:00:00Z'), true)
  assert.equal(isIsoTimestamp('2026-10-28T08:00:00+08:00'), false)
  assert.equal(isIsoTimestamp('2026-10-28'), false)
  assert.equal(isIsoTimestamp(null), false)
})

test('全量状态校验：悬空 subject / 表键不一致 / 对话归属错误被拒绝', () => {
  const state = emptyState()
  state.notes.n_1 = noteRecord('n_1')
  state.revisions.n_1 = [{ revision: 1, text: state.notes.n_1.text, at: ISO, savedBy: 'ui' }]
  assert.equal(validateState(state, { core }).ok, true)

  const dangling = structuredClone(state)
  dangling.notes.n_1.subject = { kind: 'node', id: 'ghost' }
  const r1 = validateState(dangling, { core })
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'DANGLING_REF'))

  const keyMismatch = structuredClone(state)
  keyMismatch.notes.n_2 = { ...validNote(), id: 'n_1' }
  const r2 = validateState(keyMismatch, { core })
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.code === 'KEY_MISMATCH'))

  const dialogMismatch = structuredClone(state)
  dialogMismatch.dialogs['node:stability'] = validDialog({ kind: 'node', id: 'delay' })
  dialogMismatch.dialogs['node:stability'].messages[0].model.provider = 'fake'
  const r3 = validateState(dialogMismatch, { core })
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'KEY_MISMATCH' && e.path.startsWith('dialogs.')))

  const badView = structuredClone(state)
  badView.view.projection = 'timeline'
  const r4 = validateState(badView, { core })
  assert.equal(r4.ok, false)
  assert.ok(r4.errors.some((e) => e.code === 'ENUM' && e.path === 'view.projection'))
})

test('全量状态校验：修订链缺失/漂移是 warning，不阻断加载', () => {
  const state = emptyState()
  state.notes.n_1 = noteRecord('n_1')
  const r1 = validateState(state, { core })
  assert.equal(r1.ok, true)
  assert.ok(r1.warnings.some((w) => w.code === 'MISSING_REVISION'))

  state.revisions.n_1 = [{ revision: 2, text: '别的正文', at: ISO, savedBy: 'ui' }]
  const r2 = validateState(state, { core })
  assert.equal(r2.ok, true)
  assert.ok(r2.warnings.some((w) => w.code === 'REVISION_DRIFT'))

  const orphan = emptyState()
  orphan.revisions.ghost = [{ revision: 1, text: 'x', at: ISO, savedBy: 'ui' }]
  const r3 = validateState(orphan, { core })
  assert.equal(r3.ok, true)
  assert.ok(r3.warnings.some((w) => w.code === 'ORPHAN_REVISION'))
})

test('全量状态校验：任务证据/概念引用与预测/实验互指闭合', () => {
  const state = emptyState()
  state.notes.n_1 = noteRecord('n_1')
  state.revisions.n_1 = [{ revision: 1, text: state.notes.n_1.text, at: ISO, savedBy: 'ui' }]
  const task = normalizeRecord('task', {
    id: 't_1',
    request: '要让分页越界返回空列表',
    conceptIds: ['delay'],
    evidenceRefs: [{ kind: 'note', id: 'n_1' }],
    createdAt: ISO,
    updatedAt: ISO,
  }).record
  state.tasks.t_1 = task
  assert.equal(validateState(state, { core }).ok, true)

  const danglingTask = structuredClone(state)
  danglingTask.tasks.t_1.conceptIds = ['ghost']
  const r1 = validateState(danglingTask, { core })
  assert.equal(r1.ok, false)

  const danglingRef = structuredClone(state)
  danglingRef.tasks.t_1.evidenceRefs = [{ kind: 'note', id: 'n_missing' }]
  const r2 = validateState(danglingRef, { core })
  assert.equal(r2.ok, false)

  const inv = normalizeRecord('investigation', {
    id: 'inv_1',
    subject: { kind: 'node', id: 'delay' },
    title: '延迟下同一增益会不会振荡？',
    createdAt: ISO,
    updatedAt: ISO,
  }).record
  inv.predictionIds = ['p_missing']
  state.investigations.inv_1 = inv
  const r3 = validateState(state, { core })
  assert.equal(r3.ok, false)
})

test('validateState 接受 meta / importLog 的结构校验', () => {
  const state = emptyState()
  state.importLog.push({ id: 'imp_1', at: ISO, mode: 'merge', counts: { notes: 1 }, conflicts: 0, sourceHash: 'abc' })
  assert.equal(validateState(state, { core }).ok, true)

  const bad = emptyState()
  bad.importLog.push({ id: 'imp_1', at: 'now', mode: 'overwrite', counts: null, conflicts: -1, sourceHash: 'x' })
  const r = validateState(bad, { core })
  assert.equal(r.ok, false)
  assert.ok(r.errors.length >= 3)
})

test('未提供 core 时只跳过节点/关系引用，其他结构校验照常', () => {
  const state = emptyState()
  state.notes.n_1 = noteRecord('n_1', { subject: { kind: 'node', id: 'any-node' } })
  state.revisions.n_1 = [{ revision: 1, text: state.notes.n_1.text, at: ISO, savedBy: 'ui' }]
  const r = validateState(state)
  assert.equal(r.ok, true, JSON.stringify(r.errors))
})
