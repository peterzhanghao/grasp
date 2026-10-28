/**
 * R0 · v1 → v2 迁移 / 迁移前备份 / 回滚 / 幂等（契约 §2、§7 R0；决策文档 §10 迁移规则）
 *
 * 只在临时目录构造 v1 数据；不读写真实用户数据目录。
 * 运行：node --test test/integration/r0-migration.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { startPlugin, makeTempDataDir, removeTempDir } from '../harness/fake-ctx.mjs'

function v1Fixture() {
  return {
    schemaVersion: 1,
    notes: {
      n_v1_user: {
        id: 'n_v1_user',
        subjectId: 'feedback',
        subjectType: 'node',
        kind: '理解',
        text: 'v1 时代的普通笔记',
        origin: 'user',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        revision: 2,
        status: 'active',
      },
      n_v1_garbled: {
        id: 'n_v1_garbled',
        subjectId: 'delay',
        subjectType: 'node',
        kind: '证据',
        text: '迁移疑似编码损坏：\uFFFD\uFFFD 的文本',
        origin: 'user',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        revision: 1,
        status: 'active',
      },
    },
    revisions: {
      n_v1_user: [
        { revision: 1, text: 'v1 早期文本', at: '2026-01-01T00:00:00.000Z' },
        { revision: 2, text: 'v1 时代的普通笔记', at: '2026-01-02T00:00:00.000Z' },
      ],
    },
    experiments: {
      e_v1: {
        id: 'e_v1',
        experimentId: 'delay',
        params: { K: 1.2, D: 0.6 },
        result: { verdict: '平稳收敛' },
        prediction: 'v1 预测',
        at: '2026-01-03T00:00:00.000Z',
      },
    },
    contracts: {
      c_v1: {
        id: 'c_v1',
        title: 'v1 任务契约',
        text: '把验收证据写清楚',
        nodeIds: ['feedback'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
        revision: 1,
      },
    },
    predictions: {
      p_v1: {
        id: 'p_v1',
        subjectId: 'delay',
        text: 'D 变大时会振荡',
        resolveBy: '观察末段振幅',
        at: '2026-01-05T00:00:00.000Z',
        resolved: false,
      },
    },
    view: { selected: 'feedback', projection: 'theory' },
  }
}

function assertMigrationShape(state, label) {
  assert.equal(state.ok, true, label + '：ok 应为 true，fatal=' + JSON.stringify(state.fatal))
  assert.equal(state.schemaVersion, 2, label + '：schemaVersion')
  const notes = state.store.notes || {}
  assert.ok(notes.n_v1_user, label + '：迁移丢失笔记 n_v1_user')
  assert.ok(notes.n_v1_garbled, label + '：迁移丢失笔记 n_v1_garbled')
  assert.equal(notes.n_v1_user.revision, 2, label + '：修订号丢失')
  assert.equal(notes.n_v1_user.legacyOriginUncertain, true, label + '：旧 user 记录必须标记 legacyOriginUncertain')
  assert.equal(notes.n_v1_user.authorSource, 'user', label + '：authorSource 映射')
  assert.equal(notes.n_v1_garbled.encodingSuspected, true, label + '：含替换字符的旧记录应标记 encodingSuspected')

  const revisions = state.store.revisions?.n_v1_user || []
  assert.equal(revisions.length, 2, label + '：修订链丢失')

  const experiments = Object.values(state.store.experiments || {})
  assert.equal(experiments.length, 1, label + '：experiments 未迁移')
  assert.equal(experiments[0].legacy, true, label + '：迁移实验记录应标 legacy')

  const tasks = Object.values(state.store.tasks || {})
  assert.equal(tasks.length, 1, label + '：contracts 未迁移为 tasks')
  assert.ok(String(tasks[0].request || tasks[0].title || '').length > 0, label + '：迁移任务缺少请求文本')
  assert.equal(tasks[0].legacy, true, label + '：迁移任务应标 legacy')

  const predictions = Object.values(state.store.predictions || {})
  assert.equal(predictions.length, 1, label + '：predictions 未迁移')
  assert.equal(predictions[0].subject?.id, 'delay', label + '：prediction subject 映射')
  assert.ok(predictions[0].status, label + '：prediction 缺少 status')

  const view = state.store.view || {}
  assert.equal(view.selectedNodeId, 'feedback', label + '：view.selected 未迁移为 selectedNodeId')
}

test('R0 · v1 迁移：结构/来源标记/备份逐字节一致/回滚/幂等', async () => {
  const dataDir = await makeTempDataDir('it-migration')
  let host = null
  try {
    await mkdir(dataDir, { recursive: true })
    const v1Text = JSON.stringify(v1Fixture(), null, 2) + '\n'
    await writeFile(join(dataDir, 'state.json'), v1Text, 'utf8')

    host = await startPlugin({ dataDir })
    const state = (await host.get('/api/loop-atlas/state')).body
    assertMigrationShape(state, '首次迁移')
    assert.ok(state.migrationReport, '缺少 migrationReport')
    assert.equal(state.migrationReport.fromSchema, 1, 'migrationReport.fromSchema')
    assert.ok(state.migrationReport.counts, 'migrationReport 缺少 counts')

    // 备份文件必须存在且与迁移前原文件逐字节一致
    const backupDir = join(dataDir, 'backups')
    const backupNames = (await readdir(backupDir).catch(() => [])).filter((name) => /^state\.pre-v2-.*\.json$/.test(name))
    assert.ok(backupNames.length >= 1, '没有 state.pre-v2-*.json 备份文件')
    const backupText = await readFile(join(backupDir, backupNames[0]), 'utf8')
    assert.equal(backupText, v1Text, '迁移前备份与原始 v1 文件不一致（不能用于回滚）')

    // 迁移后的磁盘文件是合法 v2
    const diskAfter = JSON.parse(await readFile(join(dataDir, 'state.json'), 'utf8'))
    assert.equal(diskAfter.schemaVersion, 2, '迁移后磁盘 schemaVersion')

    // 回滚：把备份还原成 state.json 后重启，数据仍可读（会再次迁移）
    await host.dispose({ cleanupData: false })
    host = null
    await writeFile(join(dataDir, 'state.json'), backupText, 'utf8')
    host = await startPlugin({ dataDir })
    const rolledBack = (await host.get('/api/loop-atlas/state')).body
    assertMigrationShape(rolledBack, '回滚重启')
    assert.ok(rolledBack.migrationReport, '回滚重启后应再次迁移并报告')
    const backupNames2 = (await readdir(backupDir)).filter((name) => /^state\.pre-v2-.*\.json$/.test(name))
    assert.ok(backupNames2.length >= 2, '回滚后再次迁移没有新增备份：' + backupNames2.length)

    // 幂等：已是 v2 的数据再次启动不应重复迁移，也不应改写用户数据
    await host.dispose({ cleanupData: false })
    host = null
    const v2Before = JSON.parse(await readFile(join(dataDir, 'state.json'), 'utf8'))
    host = await startPlugin({ dataDir })
    const stateThird = (await host.get('/api/loop-atlas/state')).body
    assert.equal(stateThird.migrationReport, null, 'v2 数据不应再次迁移（migrationReport 应为 null）')
    const v2After = JSON.parse(await readFile(join(dataDir, 'state.json'), 'utf8'))
    assert.equal(JSON.stringify(v2After.notes), JSON.stringify(v2Before.notes), 'v2 数据被改写')
    assert.equal(JSON.stringify(v2After.tasks), JSON.stringify(v2Before.tasks), 'v2 tasks 被改写')
  } finally {
    if (host) await host.dispose({ cleanupData: true }).catch(() => {})
    await removeTempDir(dataDir).catch(() => {})
  }
})
