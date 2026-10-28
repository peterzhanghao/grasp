import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PACK_KIND,
  MAX_PACK_BYTES,
  IMPORT_MODES,
  packageSizeBytes,
  validatePack,
  applyPack,
} from '../../src/domain/pack.js'
import { emptyState, SCHEMA_VERSION } from '../../src/domain/schema.js'
import { makeMiniCore } from './fixtures/mini-core.mjs'
import { makeV1State } from './fixtures/state-v1.mjs'

const ISO = '2026-10-28T00:00:00.000Z'
const core = makeMiniCore()
const clone = (v) => JSON.parse(JSON.stringify(v))

function noteRecord(id = 'n_1', text = '延迟不是慢，是我看到的是过去。', subject = { kind: 'node', id: 'delay' }) {
  return {
    id,
    subject,
    kind: '理解',
    text,
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
  }
}

function revisionsOf(text) {
  return [{ revision: 1, text, at: ISO, savedBy: 'ui' }]
}

function investigationRecord(id = 'inv_1', subject = { kind: 'node', id: 'delay' }) {
  return {
    id,
    subject,
    title: '延迟下同一增益会不会振荡？',
    claim: '当前主张',
    counter: '相反解释',
    nextTest: '把 D 从 0.6 调到 1.2',
    status: 'open',
    predictionIds: [],
    experimentRunIds: [],
    dialogSubjectKey: 'node:delay',
    createdAt: ISO,
    updatedAt: ISO,
  }
}

function predictionRecord(id = 'p_1') {
  return {
    id,
    investigationId: 'inv_1',
    subject: { kind: 'node', id: 'delay' },
    text: '低延迟会收敛',
    resolveBy: '末 4 秒振幅 < 0.04',
    status: 'open',
    resolvedAt: null,
    resolvedByRunId: null,
    resolutionNote: null,
    legacy: false,
    at: ISO,
  }
}

function experimentRunRecord(id = 'e_1') {
  return {
    id,
    experimentId: 'delay',
    modelId: 'delay-v2',
    modelVersion: 2,
    params: { K: 1.2, D: 0.6 },
    initial: { y: 0 },
    prediction: '平稳',
    observation: {},
    criterion: '末 4 秒振幅',
    verdict: 'drift',
    subject: { kind: 'node', id: 'delay' },
    investigationId: 'inv_1',
    legacy: false,
    at: ISO,
  }
}

function taskRecord(id = 't_1') {
  return {
    id,
    title: '分页越界',
    request: '第 99 页应返回空列表',
    goal: '越界返回空页',
    acceptance: [{ text: '第 99 页长度 0', evidence: '断言' }],
    boundary: ['不改第一页逻辑'],
    unknowns: [{ question: '空列表与 404 的取舍？', answer: null }],
    conceptIds: ['delay'],
    evidenceRefs: [{ kind: 'note', id: 'n_1' }],
    status: 'saved',
    revision: 1,
    revisions: [{ revision: 1, snapshot: {}, at: ISO, model: { provider: '', model: '', reasoningEffort: null } }],
    model: { provider: '', model: '', reasoningEffort: null },
    createdAt: ISO,
    updatedAt: ISO,
    legacy: false,
  }
}

function dialogRecord() {
  return {
    subject: { kind: 'node', id: 'delay' },
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

function makePack(overrides = {}) {
  const pack = {
    kind: PACK_KIND,
    schemaVersion: 2,
    version: '1.0.0',
    coreVersion: '1.0.0',
    exportedAt: ISO,
    notes: { n_1: noteRecord() },
    revisions: { n_1: revisionsOf(noteRecord().text) },
    relations: {},
    investigations: {},
    predictions: {},
    experiments: {},
    tasks: {},
    dialogs: {},
  }
  return { ...pack, ...overrides }
}

test('PACK 常量：kind、8 MiB 上限、mode 白名单', () => {
  assert.equal(PACK_KIND, 'loop-atlas-user-package')
  assert.equal(MAX_PACK_BYTES, 8 * 1024 * 1024)
  assert.deepEqual([...IMPORT_MODES].sort(), ['merge', 'replace', 'skip'])
  assert.equal(packageSizeBytes({ a: '中' }), new TextEncoder().encode('{"a":"中"}').length)
})

test('validatePack：合法包的 counts / normalized / conflicts 结构', () => {
  const result = validatePack(makePack(), { core, store: emptyState() })
  assert.equal(result.ok, true, JSON.stringify(result.errors))
  assert.deepEqual(result.schemaVersion, { from: 2, to: SCHEMA_VERSION })
  assert.deepEqual(result.conflicts, [])
  assert.equal(result.counts.total, 2) // note + revisions 记录
  assert.equal(result.counts.byTable.notes.records, 1)
  assert.equal(result.counts.byTable.notes.new, 1)
  assert.equal(result.normalized.kind, PACK_KIND)
  assert.equal(result.normalized.tables.notes.n_1.text, noteRecord().text)
  assert.ok(result.warnings.length >= 0)
})

test('validatePack：包外壳错误被拒绝（kind / schemaVersion / 非对象 / 体积上限）', () => {
  const badKind = validatePack({ ...makePack(), kind: 'something-else' }, { core })
  assert.equal(badKind.ok, false)
  assert.ok(badKind.errors.some((e) => e.code === 'PACK_KIND'))

  const badSchema = validatePack({ ...makePack(), schemaVersion: 9 }, { core })
  assert.equal(badSchema.ok, false)
  assert.ok(badSchema.errors.some((e) => e.code === 'PACK_SCHEMA'))

  const notObject = validatePack('no', { core })
  assert.equal(notObject.ok, false)
  assert.ok(notObject.errors.some((e) => e.code === 'PACK_TYPE'))

  const hugeText = '字'.repeat(Math.ceil(MAX_PACK_BYTES / 3) + 1024)
  const tooLarge = validatePack(makePack({ notes: { n_1: noteRecord('n_1', hugeText) } }), { core })
  assert.equal(tooLarge.ok, false)
  assert.ok(tooLarge.errors.some((e) => e.code === 'PACKAGE_TOO_LARGE'))
})

test('validatePack：逐表逐记录结构校验，非法记录进入 errors 而不是存储', () => {
  const invalidNote = validatePack(makePack({ notes: { n_1: null }, revisions: {} }), { core, store: emptyState() })
  assert.equal(invalidNote.ok, false)

  const emptyText = validatePack(
    makePack({ notes: { n_1: noteRecord('n_1', '') }, revisions: { n_1: revisionsOf('') } }),
    { core, store: emptyState() },
  )
  assert.equal(emptyText.ok, false)
  assert.ok(emptyText.errors.some((e) => e.code === 'EMPTY'))

  const badTask = validatePack(makePack({ tasks: { t_1: { ...taskRecord(), request: '' } } }), { core, store: emptyState() })
  assert.equal(badTask.ok, false)
  assert.ok(badTask.errors.some((e) => e.path.includes('tasks.t_1.request')))
})

test('validatePack：引用闭合——subject / edgeId / revisions / 证据 / 预测 / 实验 / 对话', () => {
  const notes = { n_1: noteRecord('n_1', 'ok', { kind: 'node', id: 'ghost' }) }
  const r1 = validatePack(makePack({ notes, revisions: { n_1: revisionsOf('ok') } }), { core, store: emptyState() })
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'DANGLING_REF' && e.path === 'notes.n_1.subject.id'))

  const r2 = validatePack(makePack({ relations: { 'e.missing': { edgeId: 'e.missing', annotation: '', status: 'open', evidenceNoteIds: [], version: 1, updatedAt: ISO } } }), {
    core,
    store: emptyState(),
  })
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.code === 'DANGLING_REF' && e.path.includes('relations')))

  const r3 = validatePack(makePack({ revisions: { ...makePack().revisions, ghost: revisionsOf('x') } }), { core, store: emptyState() })
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'DANGLING_REF' && e.path === 'revisions.ghost'))

  const badTask = validatePack(makePack({ tasks: { t_1: { ...taskRecord(), evidenceRefs: [{ kind: 'note', id: 'n_missing' }] } } }), { core, store: emptyState() })
  assert.equal(badTask.ok, false)
  assert.ok(badTask.errors.some((e) => e.code === 'DANGLING_REF' && e.path.includes('evidenceRefs')))

  const badInvestigation = validatePack(
    makePack({ investigations: { inv_1: { ...investigationRecord(), predictionIds: ['p_missing'] } } }),
    { core, store: emptyState() },
  )
  assert.equal(badInvestigation.ok, false)

  const badRun = validatePack(makePack({ experiments: { e_1: { ...experimentRunRecord(), investigationId: 'inv_missing' } } }), { core, store: emptyState() })
  assert.equal(badRun.ok, false)

  const badDialog = validatePack(makePack({ dialogs: { 'node:ghost': { ...dialogRecord(), subject: { kind: 'node', id: 'ghost' } } } }), { core, store: emptyState() })
  assert.equal(badDialog.ok, false)
})

test('validatePack：包内互相引用闭合（investigation ↔ prediction ↔ run ↔ note）', () => {
  const pack = makePack({
    investigations: { inv_1: { ...investigationRecord(), predictionIds: ['p_1'], experimentRunIds: ['e_1'] } },
    predictions: { p_1: predictionRecord() },
    experiments: { e_1: experimentRunRecord() },
    dialogs: { 'node:delay': dialogRecord() },
    tasks: { t_1: taskRecord() },
  })
  const result = validatePack(pack, { core, store: emptyState() })
  assert.equal(result.ok, true, JSON.stringify(result.errors))
  assert.equal(result.counts.byTable.investigations.records, 1)
  assert.equal(result.counts.byTable.dialogs.records, 1)
})

test('validatePack：表键与记录 id / 对话 subjectKey / relations edgeId 不一致被拒绝', () => {
  const notes = { n_1: noteRecord('n_2') }
  const r1 = validatePack(makePack({ notes, revisions: {} }), { core, store: emptyState() })
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'KEY_MISMATCH' && e.path === 'notes.n_1.id'))

  const r2 = validatePack(makePack({ dialogs: { 'node:delay': { ...dialogRecord(), subject: { kind: 'node', id: 'stability' } } } }), { core, store: emptyState() })
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.code === 'KEY_MISMATCH' && e.path === 'dialogs.node:delay'))

  const r3 = validatePack(makePack({ relations: { 'e.goal-to-feedback': { edgeId: 'e.other', annotation: '', status: 'open', evidenceNoteIds: [], version: 1, updatedAt: ISO } } }), {
    core,
    store: emptyState(),
  })
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'KEY_MISMATCH'))
})

test('validatePack：冲突显式返回（同 id 同内容=幂等，不同内容=冲突）', () => {
  const store = emptyState()
  store.notes.n_1 = noteRecord()
  store.revisions.n_1 = revisionsOf(noteRecord().text)

  const same = validatePack(makePack(), { core, store })
  assert.equal(same.ok, true)
  assert.deepEqual(same.conflicts, [])
  assert.equal(same.counts.byTable.notes.same, 1)

  const different = makePack({ notes: { n_1: noteRecord('n_1', '不同的正文') }, revisions: { n_1: revisionsOf('不同的正文') } })
  const conflict = validatePack(different, { core, store })
  assert.equal(conflict.ok, true, '结构性校验仍通过')
  assert.equal(conflict.conflicts.length, 2) // note + revision
  assert.deepEqual(conflict.conflicts.map((c) => `${c.table}:${c.id}`).sort(), ['notes:n_1', 'revisions:n_1'])
})

test('validatePack：缺失表只警告；未传 core 只警告并跳过节点引用', () => {
  const partial = makePack()
  delete partial.dialogs
  const r1 = validatePack(partial, { core, store: emptyState() })
  assert.equal(r1.ok, true)
  assert.ok(r1.warnings.some((w) => w.code === 'MISSING_TABLE' && w.path === 'dialogs'))

  const noCore = validatePack(makePack(), { store: emptyState() })
  assert.equal(noCore.ok, true)
  assert.ok(noCore.warnings.some((w) => w.code === 'NO_CORE'))
})

test('validatePack：v1 数据包先迁移再校验（旧 id → v2 模型）', () => {
  const raw = makeV1State()
  const pack = {
    kind: PACK_KIND,
    schemaVersion: 1,
    notes: raw.notes,
    revisions: raw.revisions,
    experiments: raw.experiments,
    contracts: raw.contracts,
    predictions: raw.predictions,
    view: raw.view,
  }
  const result = validatePack(pack, { core, store: emptyState(), now: ISO })
  assert.equal(result.ok, true, JSON.stringify(result.errors))
  assert.deepEqual(result.schemaVersion, { from: 1, to: 2 })
  assert.equal(result.normalized.tables.experiments.e_fixture_delay.modelId, 'delay-v2')
  assert.equal(result.normalized.tables.notes.n_fixture_garbled.encodingSuspected, true)
  assert.ok(result.warnings.some((w) => w.code === 'MIGRATED'))
})

test('applyPack merge：写入新记录，第二次幂等跳过，保持候选对象引用', () => {
  const preview = validatePack(makePack({ investigations: { inv_1: investigationRecord() }, predictions: { p_1: predictionRecord() } }), { core, store: emptyState() })
  const candidate = emptyState()
  const reference = candidate
  const result = applyPack(candidate, preview.normalized, { mode: 'merge' })
  assert.equal(result.ok, true)
  assert.equal(candidate, reference, '必须原地修改候选状态，不能替换引用')
  assert.equal(candidate.notes.n_1.text, noteRecord().text)
  assert.equal(candidate.investigations.inv_1.id, 'inv_1')
  assert.equal(result.counts.new, result.applied)

  const again = applyPack(candidate, preview.normalized, { mode: 'merge' })
  assert.equal(again.ok, true)
  assert.equal(again.applied, 0)
  assert.ok(again.counts.skipped > 0)
})

test('applyPack merge：冲突时整体不写（候选状态不变）', () => {
  const store = emptyState()
  store.notes.n_1 = noteRecord('n_1', '原有正文')
  store.revisions.n_1 = revisionsOf('原有正文')
  const preview = validatePack(makePack({ notes: { n_1: noteRecord('n_1', '来包正文') }, revisions: { n_1: revisionsOf('来包正文') } }), {
    core,
    store,
  })
  const candidate = clone(store)
  const before = clone(candidate)
  const result = applyPack(candidate, preview.normalized, { mode: 'merge' })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'CONFLICT')
  assert.equal(result.applied, 0)
  assert.ok(result.conflicts.length > 0)
  assert.deepEqual(candidate, before, '冲突时不得写出任何记录')
})

test('applyPack skip：跳过已存在 id，其余照写', () => {
  const store = emptyState()
  store.notes.n_1 = noteRecord('n_1', '原有正文')
  store.revisions.n_1 = revisionsOf('原有正文')
  const preview = validatePack(
    makePack({
      notes: { n_1: noteRecord('n_1', '来包正文'), n_2: noteRecord('n_2', '第二条') },
      revisions: { n_1: revisionsOf('来包正文'), n_2: revisionsOf('第二条') },
    }),
    { core, store },
  )
  const candidate = clone(store)
  const result = applyPack(candidate, preview.normalized, { mode: 'skip' })
  assert.equal(result.ok, true)
  assert.equal(candidate.notes.n_1.text, '原有正文', 'skip 不得覆盖已有记录')
  assert.equal(candidate.notes.n_2.text, '第二条')
  assert.equal(result.counts.skipped, 2) // note n_1 + revisions n_1
})

test('applyPack replace：必须 confirm:true；确认后替换 8 张表且不动 meta/view/importLog', () => {
  const store = emptyState()
  store.notes.old = noteRecord('old', '将被替换掉的旧笔记')
  store.revisions.old = revisionsOf('将被替换掉的旧笔记')
  store.view.projection = 'practice'
  store.meta.contentVersion = 'v-old'
  const candidate = clone(store)
  const preview = validatePack(makePack(), { core, store: emptyState() })

  const denied = applyPack(candidate, preview.normalized, { mode: 'replace' })
  assert.equal(denied.ok, false)
  assert.equal(denied.code, 'CONFIRM_REQUIRED')
  assert.deepEqual(candidate, store, '未确认的 replace 不得修改任何东西')

  const applied = applyPack(candidate, preview.normalized, { mode: 'replace', confirm: true })
  assert.equal(applied.ok, true)
  assert.equal(candidate.notes.old, undefined, 'replace 应替换既有数据表')
  assert.equal(candidate.notes.n_1.text, noteRecord().text)
  assert.equal(candidate.view.projection, 'practice', 'view 不属于用户数据包，不能动')
  assert.equal(candidate.meta.contentVersion, 'v-old', 'meta 不能动')
})

test('applyPack：mode 白名单与 normalized 校验', () => {
  const preview = validatePack(makePack(), { core, store: emptyState() })
  const candidate = emptyState()
  const badMode = applyPack(candidate, preview.normalized, { mode: 'overwrite' })
  assert.equal(badMode.ok, false)
  assert.equal(badMode.code, 'VALIDATION')

  const badNormalized = applyPack(candidate, {}, {})
  assert.equal(badNormalized.ok, false)
  assert.equal(badNormalized.code, 'VALIDATION')

  const badStore = applyPack(null, preview.normalized, {})
  assert.equal(badStore.ok, false)
})

test('validatePack 不修改传入的包与候选 store', () => {
  const pack = makePack()
  const store = emptyState()
  const packSnapshot = JSON.stringify(pack)
  const storeSnapshot = JSON.stringify(store)
  validatePack(pack, { core, store })
  assert.equal(JSON.stringify(pack), packSnapshot)
  assert.equal(JSON.stringify(store), storeSnapshot)
})

test('validatePack 支持 host 导出包的外层 tables 结构与 ctx.state 别名', () => {
  // host 的 package.export 产出 {kind, schemaVersion, contentVersion, pluginVersion, exportedAt, tables:{...}}
  const store = emptyState()
  store.notes.n_1 = noteRecord()
  store.revisions.n_1 = revisionsOf(noteRecord().text)
  const hostPack = {
    kind: PACK_KIND,
    schemaVersion: SCHEMA_VERSION,
    contentVersion: '1.0.0',
    pluginVersion: '1.0.0',
    exportedAt: ISO,
    tables: {
      notes: store.notes,
      revisions: store.revisions,
      relations: {},
      investigations: {},
      predictions: {},
      experiments: {},
      tasks: {},
      dialogs: {},
    },
  }
  // ctx.state 是 host 实际传的键（不是 store）
  const preview = validatePack(hostPack, { core, state: store })
  assert.equal(preview.ok, true, JSON.stringify(preview.errors))
  assert.equal(preview.counts.byTable.notes.records, 1)
  assert.equal(preview.counts.byTable.notes.same, 1, 'ctx.state 别名必须参与冲突/幂等判定')
  assert.deepEqual(preview.conflicts, [])
  const applied = applyPack(emptyState(), preview.normalized, { mode: 'merge' })
  assert.equal(applied.ok, true)
})

test('validatePack 返回确定性 sourceHash（64 hex，键顺序无关）', () => {
  const store = emptyState()
  store.notes.n_1 = noteRecord()
  store.revisions.n_1 = revisionsOf(noteRecord().text)
  const mk = () => ({
    kind: PACK_KIND,
    schemaVersion: 2,
    version: '1.0.0',
    notes: { n_1: noteRecord() },
    revisions: { n_1: revisionsOf(noteRecord().text) },
    relations: {},
    investigations: {},
    predictions: {},
    experiments: {},
    tasks: {},
    dialogs: {},
  })
  const reverseKeys = (value) => {
    if (Array.isArray(value)) return value.map(reverseKeys)
    if (value && typeof value === 'object') {
      const out = {}
      for (const key of Object.keys(value).reverse()) out[key] = reverseKeys(value[key])
      return out
    }
    return value
  }
  const a = validatePack(mk(), { core, store })
  const b = validatePack(reverseKeys(mk()), { core, store })
  assert.match(a.sourceHash, /^[0-9a-f]{64}$/)
  assert.equal(a.sourceHash, b.sourceHash, '同一内容不同对象键顺序必须得到同一指纹')
  // 内容不同 → 指纹不同
  const changed = validatePack(mk(), { core, store })
  const pack2 = mk()
  pack2.notes.n_1.text = '另一段正文'
  pack2.revisions.n_1[0].text = '另一段正文'
  const c = validatePack(pack2, { core, store })
  assert.notEqual(c.sourceHash, changed.sourceHash)
  // 校验失败时没有指纹
  const bad = validatePack({ ...mk(), kind: 'not-a-pack' }, { core, store })
  assert.equal(bad.ok, false)
  assert.equal(bad.sourceHash, null)
})