import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { migrateV1, migrateV2, migrateToV3, detectEncodingSuspicion, parseLegacyContractText, LEGACY_EXPERIMENT_ID_MAP } from '../../src/domain/migrate.js'
import { validateState, SCHEMA_VERSION } from '../../src/domain/schema.js'
import { makeV1State } from './fixtures/state-v1.mjs'
import { makeMiniCore } from './fixtures/mini-core.mjs'

const NOW = '2026-10-28T01:02:03.456Z'
const core = makeMiniCore()
const clone = (v) => JSON.parse(JSON.stringify(v))

test('migrateV1：备份标记、计数、meta 与 report 汇总', () => {
  const raw = makeV1State()
  const rawSnapshot = JSON.stringify(raw)
  const { state, report } = migrateV1(raw, { now: NOW, backupPath: 'D:\\backup\\state.pre-v2.json', contentVersion: '1.0.0' })

  assert.equal(JSON.stringify(raw), rawSnapshot, '迁移不得修改输入对象')
  assert.equal(report.ok, true)
  assert.equal(report.already, false)
  assert.equal(report.fromSchema, 1)
  assert.equal(report.toSchema, 2, 'v1→v2 是中间态，最终版本由 migrateV2 继续推到 v3')
  assert.equal(report.requiresBackup, true)
  assert.equal(report.backupPath, 'D:\\backup\\state.pre-v2.json')
  assert.equal(report.migratedAt, NOW)
  assert.deepEqual(
    { notes: report.counts.notes, revisions: report.counts.revisions, experiments: report.counts.experiments, tasks: report.counts.tasks, predictions: report.counts.predictions },
    { notes: 3, revisions: 3, experiments: 1, tasks: 1, predictions: 2 },
  )
  assert.equal(report.counts.encodingSuspected, 1)
  assert.equal(report.counts.legacyOriginUncertain, 3)
  assert.deepEqual(report.encodingSuspected, ['n_fixture_garbled'])

  assert.equal(state.schemaVersion, 2, 'migrateV1 输出 v2 中间态')
  assert.equal(state.meta.fromSchema, 1)
  assert.equal(state.meta.migratedAt, NOW)
  assert.equal(state.meta.backupPath, 'D:\\backup\\state.pre-v2.json')
  assert.equal(state.meta.contentVersion, '1.0.0')
  assert.ok(state.meta.notices.length >= 3)
  assert.ok(state.meta.notices.some((n) => n.id === 'legacy-origin-uncertain'))
  assert.ok(state.meta.notices.some((n) => n.id === 'encoding-suspected'))
})

test('migrateV1：笔记字段映射与乱码原文保留', () => {
  const raw = makeV1State()
  const { state } = migrateV1(raw, { now: NOW })
  const note = state.notes.n_fixture_garbled

  // 正文逐字保留（不猜测修复 '?' 乱码）
  assert.equal(note.text, raw.notes.n_fixture_garbled.text)
  assert.equal(note.encodingSuspected, true)
  // origin:user 无法无损区分 UI 与 agent → 来源不确定标记 + 保留旧字段
  assert.equal(note.authorSource, 'user')
  assert.equal(note.savedBy, 'ui')
  assert.equal(note.legacyOriginUncertain, true)
  assert.equal(note.legacyOrigin, 'user')
  // 非法旧 kind '??' 回退为合法枚举并记录 warning
  assert.equal(note.kind, '理解')
  assert.ok(state.meta.notices.length > 0)

  // subject 从 subjectId/subjectType 映射成 {kind,id}
  assert.deepEqual(note.subject, { kind: 'node', id: 'delay' })

  const archived = state.notes.n_fixture_archived
  assert.equal(archived.status, 'archived')
  assert.equal(archived.encodingSuspected, false)
  // 每条笔记都有修订链，修订带 savedBy
  assert.equal(state.revisions.n_fixture_evidence.length, 2)
  assert.equal(state.revisions.n_fixture_evidence[0].savedBy, 'ui')
  assert.equal(state.revisions.n_fixture_evidence[1].text, raw.revisions.n_fixture_evidence[1].text)
})

test('migrateV1：实验记录映射到 v2 ExperimentRun（版本、参数、判据、legacy）', () => {
  const { state } = migrateV1(makeV1State(), { now: NOW })
  const run = state.experiments.e_fixture_delay
  assert.equal(LEGACY_EXPERIMENT_ID_MAP.delayloop, 'delay')
  assert.equal(run.experimentId, 'delay')
  assert.equal(run.modelId, 'delay-v2')
  assert.equal(run.modelVersion, 2)
  assert.deepEqual(run.params, { K: 1.2, D: 1.2 })
  assert.deepEqual(run.observation.legacyResult, { crossings: 6 })
  assert.equal(run.verdict, 'mixed')
  assert.equal(run.legacy, true)
  assert.match(run.criterion, /未用新模型重新判定/)
  assert.equal(run.subject, null)
  assert.equal(run.at, '2026-10-27T12:49:39.039Z')
})

test('migrateV1：contracts → tasks，保留原文并解析【期望行为】【验收】', () => {
  const parsed = parseLegacyContractText('【期望行为】越界页返回空列表\n【验收】越界页长度为 0')
  assert.equal(parsed.goal, '越界页返回空列表')
  assert.deepEqual(parsed.acceptance, [{ text: '越界页长度为 0', evidence: '' }])

  const { state } = migrateV1(makeV1State(), { now: NOW })
  const task = state.tasks.c_fixture_pagination
  assert.equal(task.title, '示例任务契约：分页越界')
  // 原文完整保留在 request（不丢用户真实期望行为原文）
  assert.equal(task.request, '【期望行为】越界页返回空列表\n【验收】越界页长度为 0')
  assert.equal(task.goal, '越界页返回空列表')
  assert.deepEqual(task.acceptance, [{ text: '越界页长度为 0', evidence: '' }])
  assert.deepEqual(task.conceptIds, ['measurement', 'boundary'])
  assert.equal(task.status, 'saved')
  assert.equal(task.legacy, true)
  assert.equal(task.revisions.length, 1)
  assert.equal(task.revisions[0].snapshot.request, task.request)
})

test('migrateV1：predictions 映射（未解决 → open；旧 resolved 无结局 → inconclusive）', () => {
  const { state } = migrateV1(makeV1State(), { now: NOW })
  const open = state.predictions.p_fixture_open
  assert.equal(open.status, 'open')
  assert.deepEqual(open.subject, { kind: 'node', id: 'delay' })
  assert.equal(open.legacy, true)
  assert.equal(open.resolvedAt, null)

  const legacy = state.predictions.p_fixture_resolved_legacy
  assert.equal(legacy.status, 'inconclusive')
  assert.match(legacy.resolutionNote, /没有记录支持\/反驳/) 
})

test('migrateV1：view 迁移（上次落点 → subject 尺度 + selectedNodeId）', () => {
  const { state } = migrateV1(makeV1State(), { now: NOW })
  assert.deepEqual(state.view, {
    scale: 'subject',
    projection: 'practice',
    selectedNodeId: 'delay',
    selectedRelationId: null,
    activeInvestigationId: null,
    directoryOpen: true,
    rightOpen: true,
  })
})

test('migrateToV3：v1 → v2 → v3 链，结果通过全量校验（结构与引用闭合）', () => {
  const { state, report } = migrateToV3(makeV1State(), { now: NOW })
  assert.equal(report.ok, true)
  assert.equal(report.fromSchema, 1)
  assert.equal(report.toSchema, SCHEMA_VERSION)
  assert.deepEqual(report.chain, ['v1->v2', 'v2->v3'])
  assert.equal(state.schemaVersion, SCHEMA_VERSION)
  const result = validateState(state, { core })
  assert.equal(result.ok, true, JSON.stringify(result.errors))
})

test('migrateV1 幂等：对 v2 原样返回并 report.already=true', () => {
  const first = migrateV1(makeV1State(), { now: NOW })
  const second = migrateV1(first.state)
  assert.equal(second.report.already, true)
  assert.equal(second.report.ok, true)
  assert.deepEqual(second.state, first.state)
  assert.notEqual(second.state, first.state, '应返回独立对象，避免调用方共享引用')

  // 迁移两次也不改变结果
  const third = migrateV1(second.state)
  assert.deepEqual(third.state, first.state)
})

test('migrateV1：非法/不支持的输入返回 ok=false，不抛异常', () => {
  for (const bad of [null, undefined, 42, 'x', []]) {
    const result = migrateV1(bad)
    assert.equal(result.report.ok, false)
    assert.equal(result.state, null)
  }
  const future = migrateV1({ schemaVersion: 3, notes: {} })
  assert.equal(future.report.ok, false)
  assert.match(future.report.error, /不支持的 schemaVersion/)
})

test('detectEncodingSuspicion：识别 ? 替换字符、U+FFFD 与花码，但不误伤正常中文', () => {
  assert.equal(detectEncodingSuspicion('????"?"?,"????????"?'), true)
  assert.equal(detectEncodingSuspicion('锛氬欢杩燂拷'), true) // UTF-8 按 GBK 解码的典型花码
  assert.equal(detectEncodingSuspicion('正常的中文笔记，说的是延迟。'), false)
  assert.equal(detectEncodingSuspicion('真的吗?'), false) // 单个问号不判可疑
  assert.equal(detectEncodingSuspicion('x\uFFFDy'), true)
  assert.equal(detectEncodingSuspicion(''), false)
  assert.equal(detectEncodingSuspicion(null), false)
})

test('migrateV1：旧修订缺失时补一条当前正文修订（不丢正文）', () => {
  const raw = makeV1State()
  delete raw.revisions.n_fixture_evidence
  const { state, report } = migrateV1(raw, { now: NOW })
  const revisions = state.revisions.n_fixture_evidence
  assert.equal(revisions.length, 1)
  assert.equal(revisions[0].text, raw.notes.n_fixture_evidence.text)
  assert.ok(report.warnings.some((w) => w.code === 'REVISIONS_SYNTHESIZED'))
})

test('真实 v1 state.json（只读）迁移 smoke：源文件不被修改、可过全量校验', (t) => {
  const dataPath = 'D:\\plug-in\\loop-atlas-data\\state.json'
  if (!existsSync(dataPath)) return t.skip('用户数据文件不存在（干净环境）')
  let bytesBefore
  let raw
  try {
    bytesBefore = readFileSync(dataPath)
    raw = JSON.parse(bytesBefore.toString('utf8'))
  } catch (err) {
    return t.skip(`无法读取用户数据：${err.message}`)
  }
  if (raw.schemaVersion !== 1) return t.skip('用户数据已是 v2，无需迁移 smoke')

  const { state, report } = migrateV1(raw, { now: NOW, backupPath: 'test://readonly' })
  const bytesAfter = readFileSync(dataPath)
  assert.deepEqual(bytesAfter, bytesBefore, '迁移测试不得修改真实用户数据文件')
  assert.equal(report.ok, true)
  assert.equal(report.counts.notes, Object.keys(raw.notes || {}).length)

  // 乱码笔记：原文逐字保留并标记 encodingSuspected
  for (const id of report.encodingSuspected) {
    assert.equal(state.notes[id].text, raw.notes[id].text)
    assert.equal(state.notes[id].encodingSuspected, true)
  }

  // 用当前内容包校验迁移结果（若内容组未交付 v2 则跳过校验部分）
  const coreText = readFileSync(new URL('../../data/core.json', import.meta.url), 'utf8')
  const currentCore = JSON.parse(coreText)
  if (currentCore.schemaVersion === 2) {
    const result = validateState(state, { core: currentCore })
    assert.equal(result.ok, true, JSON.stringify(result.errors))
  }
})

test('migrateV2：研究问题映射为掌控卡，预测/实验映射为干预或观察，v2 表保留', () => {
  const { state: v2 } = migrateV1(makeV1State(), { now: NOW, backupPath: 'D:\\backup\\state.pre-v3.json' })
  v2.investigations = {
    inv_1: {
      id: 'inv_1',
      subject: { kind: 'node', id: 'delay' },
      title: '延迟与振荡',
      claim: 'D=1.2 时振荡由延迟放大',
      counter: '可能是增益过大',
      nextTest: '把 K 降到 0.6 再跑一次',
      status: 'testing',
      predictionIds: ['p_fixture_open'],
      experimentRunIds: ['e_fixture_delay'],
      dialogSubjectKey: '',
      createdAt: NOW,
      updatedAt: NOW,
    },
  }
  v2.predictions.p_fixture_open.investigationId = 'inv_1'

  const { state, report } = migrateV2(v2, { now: NOW })
  assert.equal(report.ok, true)
  assert.equal(report.fromSchema, 2)
  assert.equal(report.toSchema, SCHEMA_VERSION)
  assert.equal(state.schemaVersion, SCHEMA_VERSION)
  assert.equal(state.loops.lp_inv_1.status, 'testing')
  assert.equal(state.loops.lp_inv_1.hypothesis.claim, 'D=1.2 时振荡由延迟放大')
  assert.equal(state.loops.lp_inv_1.nextAction.text, '把 K 降到 0.6 再跑一次')
  assert.equal(state.interventions.iv_p_fixture_open.status, 'planned')
  assert.equal(state.observations.ob_p_fixture_resolved_legacy.compare.verdict, 'inconclusive')
  assert.equal(state.observations.ob_run_e_fixture_delay.source, 'experiment')
  assert.ok(state.loops.lp_legacy_v2, '无归属的实验/旧预测要有 legacy 卡兜底')
  // v2 旧表原样保留，可追溯、可回退
  assert.equal(state.investigations.inv_1.title, '延迟与振荡')
  assert.equal(state.notes.n_fixture_evidence.text, '示例证据：D=1.2 时穿越目标 6 次。')
  assert.equal(state.meta.backupPath, 'D:\\backup\\state.pre-v3.json')
  const check = validateState(state, { core })
  assert.equal(check.ok, true, JSON.stringify(check.errors))

  const again = migrateV2(state, { now: NOW })
  assert.equal(again.report.already, true)
  assert.deepEqual(again.state, state)
})
