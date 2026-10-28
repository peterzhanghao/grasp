/**
 * R0 · 导入校验（契约 §4 ops / 导入校验；§7 R0）
 *
 * 覆盖：非法记录、悬空引用、同 id 不同内容冲突（显式、整体不写）、同 id 同内容幂等、
 * mode=skip 不覆盖、mode=replace 需 confirm 且先备份、包壳校验、8 MiB 上限、
 * 导出→干净空间导入→可读。
 *
 * 运行：node --test test/integration/r0-import.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { stat, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { createHost, pickIds, getCore, getState, assertOk, assertClientError } from './helpers.mjs'
import { SCHEMA_VERSION } from '../../src/domain/schema.js'

const clone = (value) => JSON.parse(JSON.stringify(value))

async function exportPack(host) {
  const response = await host.op('package.export', {})
  assertOk(response, 'package.export')
  return response.body.pack
}

function noteCount(state) {
  return Object.keys(state.store?.notes || {}).length
}

test('R0 · 导出 → 干净数据目录导入 → 可读', async (t) => {
  const source = await createHost(t, { label: 'import-src' })
  const sourceCore = await getCore(source.host)
  const { nodeId, relationId } = pickIds(sourceCore)
  const note = assertOk(await source.host.op('note.save', { subject: { kind: 'node', id: nodeId }, kind: '证据', text: '导出包中的证据' }), 'note.save')
  if (relationId) {
    assertOk(await source.host.op('relation.annotate', { edgeId: relationId, annotation: '导出包中的个人批注', status: 'challenged', evidenceNoteIds: [note.note.id] }), 'relation.annotate')
  }
  const run = assertOk(await source.host.op('experiment.run', { experimentId: 'delay', params: { K: 1.2, D: 0 }, subject: { kind: 'node', id: nodeId }, prediction: 'D=0 应收敛' }), 'experiment.run')
  const pack = await exportPack(source.host)
  assert.equal(pack.kind, 'loop-atlas-user-package')
  assert.equal(pack.schemaVersion, SCHEMA_VERSION)
  assert.ok(pack.tables?.notes?.[note.note.id], '导出包缺少笔记')

  const target = await createHost(t, { label: 'import-dst' })
  const imported = assertOk(await target.host.op('package.import', { pack, mode: 'merge' }), 'package.import')
  assert.ok(imported.applied || imported.counts || imported.imported, '导入回执缺少 counts/applied')
  const state = await getState(target.host)
  assert.equal(state.store.notes[note.note.id]?.text, '导出包中的证据', '导入后笔记不可读')
  assert.ok(Object.values(state.store.experiments).some((item) => item.id === run.run.id), '导入后实验记录不可读')
  assert.ok(state.store.importLog?.length >= 1, 'importLog 未记录导入')
  const log = state.store.importLog[state.store.importLog.length - 1]
  assert.equal(log.mode, 'merge', 'importLog.mode')
  assert.ok(log.at, 'importLog 缺少时间')
  return { noteId: note.note.id, runId: run.run.id }
})

test('R0 · 同 id 同内容重复导入 → 幂等跳过，不产生冲突', async (t) => {
  const source = await createHost(t, { label: 'import-idem-src' })
  const core = await getCore(source.host)
  const { nodeId } = pickIds(core)
  assertOk(await source.host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '幂等笔记' }), 'save')
  const pack = await exportPack(source.host)

  const target = await createHost(t, { label: 'import-idem-dst' })
  const first = assertOk(await target.host.op('package.import', { pack, mode: 'merge' }), '第一次导入')
  const afterFirst = await getState(target.host)
  const second = await target.host.op('package.import', { pack, mode: 'merge' })
  assert.equal(second.status, 200, '第二次同包导入应幂等成功，实际 ' + second.status + ' ' + JSON.stringify(second.body).slice(0, 400))
  const afterSecond = await getState(target.host)
  assert.equal(noteCount(afterSecond), noteCount(afterFirst), '重复导入改变了笔记数量')
  assert.equal(Object.keys(afterSecond.store.revisions).length, Object.keys(afterFirst.store.revisions).length, '重复导入改变了修订数量')
})

test('R0 · 同 id 不同内容 → 409 CONFLICT，显式冲突清单，整体不写', async (t) => {
  const host = await createHost(t, { label: 'import-conflict' })
  const core = await getCore(host.host)
  const { nodeId } = pickIds(core)
  const note = assertOk(await host.host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '原始内容' }), 'save')
  const pack = await exportPack(host.host)
  const before = await getState(host.host)

  const conflicting = clone(pack)
  conflicting.tables.notes[note.note.id].text = '被篡改的内容'
  const response = await host.host.op('package.import', { pack: conflicting, mode: 'merge' })
  assert.equal(response.status, 409, '冲突导入应 409，实际 ' + response.status + ' ' + JSON.stringify(response.body).slice(0, 400))
  assert.equal(response.body.ok, false)
  assert.equal(response.body.code, 'CONFLICT', '冲突错误码')
  const conflicts = response.body.details?.conflicts || []
  assert.ok(conflicts.length >= 1, '冲突未显式返回清单')
  const after = await getState(host.host)
  assert.equal(after.store.notes[note.note.id].text, '原始内容', '冲突导入改动了已有记录')
  assert.equal(noteCount(after), noteCount(before), '冲突导入写入了部分数据')

  // 预览接口也应报出冲突，而不是静默
  const preview = await host.host.op('package.preview', { pack: conflicting })
  assert.equal(preview.status, 200)
  assert.ok(preview.body.preview, 'preview 缺少 preview 对象')
  return { conflicts: conflicts.length, previewOk: preview.body.preview.ok, previewConflicts: preview.body.preview.conflicts?.length }
})

test('R0 · 非法记录（null / 缺字段）→ IMPORT_INVALID 且不写入', async (t) => {
  const host = await createHost(t, { label: 'import-invalid' })
  const core = await getCore(host.host)
  const { nodeId } = pickIds(core)
  assertOk(await host.host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '合法笔记' }), 'save')
  const pack = await exportPack(host.host)
  const before = await getState(host.host)

  const invalid = clone(pack)
  invalid.tables.notes = { ...invalid.tables.notes, bad_null: null, bad_missing: { id: 'bad_missing' } }
  const response = await host.host.op('package.import', { pack: invalid, mode: 'merge' })
  assert.ok(response.status >= 400 && response.status < 500, '非法记录应 4xx，实际 ' + response.status)
  assert.equal(response.body.ok, false)
  assert.equal(response.body.code, 'IMPORT_INVALID', '错误码应为 IMPORT_INVALID，实际 ' + response.body.code)
  const after = await getState(host.host)
  assert.ok(!after.store.notes.bad_null && !after.store.notes.bad_missing, '非法记录进入存储')
  assert.equal(noteCount(after), noteCount(before), '非法记录导入改变了合法数据')

  // 单条缺字段（非 null）也要被逐条校验
  const missingField = clone(pack)
  missingField.tables.notes = { ...missingField.tables.notes, note_missing_text: { id: 'note_missing_text', subject: { kind: 'node', id: nodeId }, kind: '理解', status: 'active' } }
  const second = await host.host.op('package.import', { pack: missingField, mode: 'merge' })
  assert.ok(second.status >= 400 && second.status < 500, '缺字段笔记应 4xx，实际 ' + second.status + ' ' + JSON.stringify(second.body).slice(0, 300))
  assert.ok(!(await getState(host.host)).store.notes.note_missing_text, '缺字段笔记进入存储')
  return { firstCode: response.body.code, secondCode: second.body.code }
})

test('R0 · 悬空引用（subject / evidenceNoteIds / investigationId）→ 4xx 且不写入', async (t) => {
  const host = await createHost(t, { label: 'import-dangling' })
  const core = await getCore(host.host)
  const { nodeId, relationId } = pickIds(core)
  assertOk(await host.host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '合法笔记' }), 'save')
  const pack = await exportPack(host.host)
  const before = await getState(host.host)

  const danglingNote = clone(pack)
  danglingNote.tables.notes = {
    ...danglingNote.tables.notes,
    note_dangling_subject: {
      id: 'note_dangling_subject',
      subject: { kind: 'node', id: 'no-such-node-xyz' },
      kind: '理解',
      text: '悬空 subject',
      status: 'active',
      authorSource: 'import',
      savedBy: 'ui',
      adopted: null,
      legacyOriginUncertain: false,
      encodingSuspected: false,
      parentRevision: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revision: 1,
    },
  }
  const r1 = await host.host.op('package.import', { pack: danglingNote, mode: 'merge' })
  assert.ok(r1.status >= 400 && r1.status < 500, '悬空 subject 应 4xx，实际 ' + r1.status + ' ' + JSON.stringify(r1.body).slice(0, 300))
  assert.ok(!(await getState(host.host)).store.notes.note_dangling_subject, '悬空 subject 记录进入存储')

  let r2status = null
  if (relationId) {
    const danglingEvidence = clone(pack)
    danglingEvidence.tables.relations = {
      ...(danglingEvidence.tables.relations || {}),
      [relationId]: { edgeId: relationId, annotation: '', status: 'supported', evidenceNoteIds: ['n_missing_evidence'], version: 2, updatedAt: new Date().toISOString() },
    }
    const r2 = await host.host.op('package.import', { pack: danglingEvidence, mode: 'merge' })
    assert.ok(r2.status >= 400 && r2.status < 500, '悬空证据笔记应 4xx，实际 ' + r2.status)
    r2status = r2.status
  }

  const danglingInvestigation = clone(pack)
  danglingInvestigation.tables.predictions = {
    ...(danglingInvestigation.tables.predictions || {}),
    p_dangling: {
      id: 'p_dangling',
      investigationId: 'inv_missing',
      subject: { kind: 'node', id: nodeId },
      text: '悬空 investigation 的预测',
      resolveBy: '条件',
      status: 'open',
      resolvedAt: null,
      resolvedByRunId: null,
      resolutionNote: null,
      legacy: false,
      at: new Date().toISOString(),
    },
  }
  const r3 = await host.host.op('package.import', { pack: danglingInvestigation, mode: 'merge' })
  assert.ok(r3.status >= 400 && r3.status < 500, '悬空 investigationId 应 4xx，实际 ' + r3.status + ' ' + JSON.stringify(r3.body).slice(0, 300))
  const after = await getState(host.host)
  assert.ok(!after.store.predictions.p_dangling, '悬空预测进入存储')
  assert.equal(noteCount(after), noteCount(before), '悬空引用导入改变了合法数据')
  return { danglingSubject: r1.status, danglingEvidence: r2status, danglingInvestigation: r3.status }
})

test('R0 · mode=skip 跳过已存在 id，不覆盖已有内容', async (t) => {
  const host = await createHost(t, { label: 'import-skip' })
  const core = await getCore(host.host)
  const { nodeId } = pickIds(core)
  const note = assertOk(await host.host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '原始内容' }), 'save')
  const pack = await exportPack(host.host)
  const skipped = clone(pack)
  skipped.tables.notes[note.note.id].text = 'skip 模式下的新内容'
  const response = await host.host.op('package.import', { pack: skipped, mode: 'skip' })
  assert.equal(response.status, 200, 'skip 导入应 200，实际 ' + response.status + ' ' + JSON.stringify(response.body).slice(0, 400))
  const after = await getState(host.host)
  assert.equal(after.store.notes[note.note.id].text, '原始内容', 'skip 模式覆盖了已有记录')
})

test('R0 · mode=replace：无 confirm 拒绝；带 confirm 先备份再覆盖', async (t) => {
  const host = await createHost(t, { label: 'import-replace' })
  const core = await getCore(host.host)
  const { nodeId } = pickIds(core)
  assertOk(await host.host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '会被替换的笔记' }), 'save')
  const pack = await exportPack(host.host)
  const backupDir = join(host.dataDir, 'backups')

  const noConfirm = await host.host.op('package.import', { pack, mode: 'replace' })
  assert.equal(noConfirm.status, 400, 'replace 无 confirm 应 400，实际 ' + noConfirm.status)
  assert.equal(noConfirm.body.code, 'VALIDATION')

  const backupsBefore = (await readdir(backupDir).catch(() => [])).filter((name) => name.startsWith('state.'))
  const confirmed = await host.host.op('package.import', { pack, mode: 'replace', confirm: true })
  assert.equal(confirmed.status, 200, 'replace 带 confirm 应成功，实际 ' + confirmed.status + ' ' + JSON.stringify(confirmed.body).slice(0, 400))
  const backupsAfter = (await readdir(backupDir).catch(() => [])).filter((name) => name.startsWith('state.'))
  assert.ok(backupsAfter.length > backupsBefore.length, 'replace 导入前没有自动备份')
  const lastBackup = join(backupDir, backupsAfter.sort().pop())
  assert.ok((await stat(lastBackup)).size > 0, '自动备份文件为空')
  return { backupsBefore: backupsBefore.length, backupsAfter: backupsAfter.length }
})

test('R0 · 包壳 kind / schemaVersion 不合法 → 4xx', async (t) => {
  const host = await createHost(t, { label: 'import-shell' })
  const wrongKind = await host.host.op('package.import', { pack: { kind: 'other', schemaVersion: 2, tables: {} }, mode: 'merge' })
  assert.ok(wrongKind.status >= 400 && wrongKind.status < 500, 'kind 错误应 4xx，实际 ' + wrongKind.status)
  const wrongSchema = await host.host.op('package.import', { pack: { kind: 'loop-atlas-user-package', schemaVersion: 99, tables: {} }, mode: 'merge' })
  assert.ok(wrongSchema.status >= 400 && wrongSchema.status < 500, 'schemaVersion 错误应 4xx，实际 ' + wrongSchema.status)
  return { kind: wrongKind.status, schema: wrongSchema.status }
})

test('R0 · 超过 8 MiB 的包 → PACKAGE_TOO_LARGE（不写入）', async (t) => {
  const host = await createHost(t, { label: 'import-too-large' })
  const core = await getCore(host.host)
  const { nodeId } = pickIds(core)
  assertOk(await host.host.op('note.save', { subject: { kind: 'node', id: nodeId }, text: '合法笔记' }), 'save')
  const pack = await exportPack(host.host)
  const big = clone(pack)
  big.tables.notes = {
    big_note: {
      ...Object.values(pack.tables.notes)[0],
      id: 'big_note',
      text: 'x'.repeat(8.5 * 1024 * 1024),
    },
  }
  const response = await host.host.op('package.import', { pack: big, mode: 'merge' })
  assert.equal(response.status, 413, '超大包应 413，实际 ' + response.status + ' ' + JSON.stringify(response.body).slice(0, 300))
  assert.equal(response.body.code, 'PACKAGE_TOO_LARGE', '超大包错误码')
  assert.ok(!(await getState(host.host)).store.notes.big_note, '超大包写入了数据')
})
