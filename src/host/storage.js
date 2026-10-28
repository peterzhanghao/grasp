/**
 * 用户数据存储：串行提交队列 + 候选状态校验 + 临时文件原子写 + 迁移前备份。
 *
 * 关键不变量（契约第 4 节）：
 * 1. 写入永不提前修改已提交状态；只有 fsync + rename 都成功后才发布新状态。
 * 2. 任一次写入失败后队列仍可继续处理后续写入（不会留下永远 rejected 的链）。
 * 3. schemaVersion 1 的数据先做只读备份再迁移；迁移后再读回逐项核对。
 * 4. 任何异常都降级为"只读 + 可读原因"，绝不覆盖或删除用户原文件。
 */
import { readFile, mkdir, rename, copyFile, open, readdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { AppError, fromStorageFailure } from './errors.js'
import { SCHEMA_VERSION, emptyState, validateState } from '../domain/schema.js'
import { migrateToV3 } from '../domain/migrate.js'
import { validateContent } from '../domain/validate-content.js'

const MAX_STATE_BYTES = 64 * 1024 * 1024
const MAX_BACKUPS = 24

const nowIso = () => new Date().toISOString()
const clone = (value) => structuredClone(value)

function token() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

export function createStorage({ dataDir, coreFile, logger }) {
  const stateFile = join(dataDir, 'state.json')
  const backupDir = join(dataDir, 'backups')

  let core = null
  let committed = null
  let notices = []
  let migrationReport = null
  let fatal = null /** { code, message, path } */
  let readOnly = false
  let lastError = null
  let lastWrite = null  /** 串行队列：永远以已决状态继续，单个任务失败不会阻断后续任务。 */
  let chain = Promise.resolve()

  const log = (level, message) => {
    try {
      logger?.[level]?.(message)
    } catch {
      /* 日志失败不影响存储 */
    }
  }

  function enqueue(task) {
    const run = chain.then(task, task)
    chain = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  function snapshot() {
    return {
      ok: !fatal,
      schemaVersion: SCHEMA_VERSION,
      contentVersion: core?.version || null,
      core,
      store: committed ? clone(committed) : null,
      dataPath: stateFile,
      dataDir,
      backupDir,
      notices: notices.map((n) => ({ ...n })),
      migrationReport: migrationReport ? clone(migrationReport) : null,
      readOnly,
      fatal: fatal ? { ...fatal } : null,
      lastError: lastError ? { ...lastError } : null,
      lastWrite: lastWrite ? { ...lastWrite } : null,
      serverVersion: 1,
    }
  }

  function markFatal(code, message) {
    fatal = { code, message, path: stateFile }
    readOnly = true
    log('error', '[掌控] 数据不可用，进入只读模式：' + message)
  }

  async function readJsonFile(path) {
    const info = await stat(path)
    if (info.size > MAX_STATE_BYTES) throw new AppError('VALIDATION', `数据文件过大（${info.size} 字节）`, { path })
    const text = await readFile(path, 'utf8')
    return JSON.parse(text)
  }

  async function loadCore() {
    const raw = JSON.parse(await readFile(coreFile, 'utf8'))
    const check = validateContent(raw)
    if (!check.ok) {
      throw new AppError('VALIDATION', '内容包校验失败：' + check.errors.slice(0, 3).map((e) => e.message).join('；'), {
        errors: check.errors.slice(0, 40),
      })
    }
    for (const warning of check.warnings || []) {
      notices.push({ id: 'content:' + warning.code, level: 'warn', text: warning.message })
    }
    return raw
  }

  async function buildBackupPath(tag) {
    await mkdir(backupDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    return join(backupDir, `state.${tag}-${stamp}.json`)
  }

  /** 只拷贝当前磁盘文件，不修改旧备份。 */
  async function backupFile(tag) {
    const target = await buildBackupPath(tag)
    try {
      await copyFile(stateFile, target)
      return target
    } catch (error) {
      if (error && error.code === 'ENOENT') return null
      throw error
    }
  }

  async function pruneBackups() {
    try {
      const names = (await readdir(backupDir)).filter((name) => /^state\..*\.json$/.test(name))
      if (names.length <= MAX_BACKUPS) return
      const withTime = []
      for (const name of names) {
        const info = await stat(join(backupDir, name))
        withTime.push({ name, mtime: info.mtimeMs })
      }
      withTime.sort((a, b) => b.mtime - a.mtime)
      for (const item of withTime.slice(MAX_BACKUPS)) await unlink(join(backupDir, item.name))
    } catch {
      /* 清理失败不影响主流程 */
    }
  }

  /**
   * 原子写：临时文件 → fsync → rename。Windows 不允许对目录 fsync，
   * 因此目录项持久性依赖 NTFS 的 rename 语义；报告中如实说明，不宣称掉电安全。
   */
  async function writeStateAtomic(state) {
    await mkdir(dataDir, { recursive: true })
    const text = JSON.stringify(state, null, 2) + '\n'
    const tmp = `${stateFile}.${token()}.tmp`
    let handle = null
    try {
      handle = await open(tmp, 'w')
      await handle.writeFile(text, 'utf8')
      await handle.sync()
      await handle.close()
      handle = null
      await rename(tmp, stateFile)
    } catch (error) {
      if (handle) {
        try {
          await handle.close()
        } catch {
          /* ignore */
        }
      }
      try {
        await unlink(tmp)
      } catch {
        /* ignore */
      }
      throw error
    }
  }

  async function initFromScratch() {
    committed = emptyState()
    const check = validateState(committed, { core })
    if (!check.ok) throw new AppError('INTERNAL', '空状态不合法：' + check.errors.map((e) => e.message).join('；'))
    await writeStateAtomic(committed)
    notices.push({ id: 'store:created', level: 'info', text: '已创建新的本地数据文件：' + stateFile })
  }

  async function migrate(raw) {
    const backupPath = await backupFile('pre-v3')
    const { state, report } = migrateToV3(raw, { backupPath, contentVersion: core?.version || null })
    if (!report.ok || !state) {
      throw new AppError('INTERNAL', '迁移失败：' + String(report.error || '未知原因'), { backupPath })
    }
    // 把备份路径与内容版本写进 meta，用户能在界面里看到"迁移前文件在哪"。
    if (state.meta) {
      if (backupPath) state.meta.backupPath = backupPath
      state.meta.contentVersion = core?.version || null
      state.meta.migratedAt = state.meta.migratedAt || nowIso()
    }
    if (!Array.isArray(state.meta?.notices)) {
      state.meta = state.meta || {}
      state.meta.notices = []
    }
    if (backupPath) {
      state.meta.notices.push({ id: 'migration-backup', level: 'info', text: '迁移前的原始数据已备份到：' + backupPath })
    }
    const check = validateState(state, { core })
    if (!check.ok) {
      throw new AppError('INTERNAL', '迁移结果不合契约：' + check.errors.slice(0, 5).map((e) => e.message).join('；'), {
        backupPath,
      })
    }
    await writeStateAtomic(state)
    const readBack = JSON.parse(await readFile(stateFile, 'utf8'))
    const count = (value) => Object.keys(value || {}).length
    const tables = ['notes', 'revisions', 'predictions', 'experiments', 'tasks', 'interventions', 'observations']
    const counts = { loops: count(state.loops), investigations: count(state.investigations) }
    const readCounts = { loops: count(readBack.loops), investigations: count(readBack.investigations) }
    for (const table of tables) {
      counts[table] = count(state[table])
      readCounts[table] = count(readBack[table])
    }
    const mismatched = Object.keys(counts).filter((key) => counts[key] !== readCounts[key])
    if (mismatched.length) {
      throw new AppError('INTERNAL', '迁移写盘后读回不一致：' + mismatched.join(','), { backupPath, counts, readCounts })
    }
    committed = state
    migrationReport = { ...report, backupPath, verifiedAt: nowIso(), counts, readCounts, mismatched }
    notices.push({
      id: 'store:migrated',
      level: 'info',
      text: `数据已从 v${report.fromSchema || '?'} 迁移到 v${SCHEMA_VERSION}，原文件备份在 ${backupPath}`,
    })
  }

  let initPromise = null

  /**
   * 初始化一次，之后每次调用都返回**当前**快照。
   * 注意：不要把初始化时的快照缓存进 promise —— 读路径必须看到最新提交。
   */
  async function ensure() {
    if (!initPromise) {
      initPromise = initialize().catch((error) => {
        // 兜底：ensure 永不 reject，否则后续每次读取都会得到同一个失败 promise。
        markFatal('STATE_INIT', '初始化数据失败：' + String((error && error.message) || error))
      })
    }
    await initPromise
    return snapshot()
  }

  async function initialize() {
    try {
      core = await loadCore()
    } catch (error) {
      markFatal('CONTENT_INVALID', '内容包无法加载：' + String((error && error.message) || error))
      return
    }
    let raw = null
    try {
      raw = await readJsonFile(stateFile)
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        try {
          await initFromScratch()
        } catch (writeError) {
          markFatal('STORAGE_INIT', '无法创建数据文件：' + String((writeError && writeError.message) || writeError))
        }
        return
      }
      if (error instanceof SyntaxError) {
        markFatal('STATE_CORRUPT', '数据文件不是合法 JSON（原文件保留未覆盖）：' + error.message)
        return
      }
      markFatal('STATE_UNREADABLE', '无法读取数据文件：' + String((error && error.message) || error))
      return
    }

    const version = raw && raw.schemaVersion
    try {
      if (version === SCHEMA_VERSION) {
        const check = validateState(raw, { core })
        if (!check.ok) {
          markFatal('STATE_INVALID', '数据文件不符合 v' + SCHEMA_VERSION + ' 契约：' + check.errors.slice(0, 5).map((e) => e.message).join('；'))
          return
        }
        committed = raw
        for (const warning of check.warnings || []) notices.push({ id: 'state:' + warning.code, level: 'warn', text: warning.message })
      } else if (version === 1 || version === 2) {
        await migrate(raw)
      } else if (typeof version === 'number' && version > SCHEMA_VERSION) {
        markFatal('STATE_NEWER', `数据文件版本 ${version} 高于本插件支持的 ${SCHEMA_VERSION}；请升级插件，原文件未改动`)
      } else {
        markFatal('STATE_VERSION', '不认识的数据版本：' + String(version))
      }
    } catch (error) {
      // 迁移/加载失败一律降级为只读并保留原文件，绝不把用户数据覆盖或删掉。
      markFatal(
        error instanceof AppError && error.details && error.details.backupPath ? 'STATE_MIGRATION' : 'STATE_INIT',
        '初始化数据失败：' + String((error && error.message) || error),
      )
      return
    }

    // 上次进程被中断时留下的 pending：在加载阶段一次性落盘为"中断"，避免 UI 永远转圈。
    if (committed && reconcilePendingDialogs(committed)) {
      enqueue(async () => {
        try {
          await writeStateAtomic(committed)
        } catch (error) {
          notices.push({ id: 'store:reconcile-failed', level: 'warn', text: '清理中断回答时写盘失败：' + String((error && error.message) || error) })
        }
      })
    }
  }

  async function requireWritable() {
    const snap = await ensure()
    if (fatal) throw new AppError('READ_ONLY', fatal.message, fatal)
    if (readOnly) throw new AppError('READ_ONLY', '数据处于只读状态')
    return snap
  }

  /** 进程中断遗留的 streaming 记录：落盘为失败消息，避免 UI 永远转圈。 */
  function reconcilePendingDialogs(state) {
    let changed = false
    for (const [key, dialog] of Object.entries(state.dialogs || {})) {
      const pending = dialog && dialog.pending
      if (!pending) continue
      dialog.messages = dialog.messages || []
      const existing = dialog.messages.find((m) => m.requestId === pending.requestId && m.role === 'assistant')
      if (!existing) {
        dialog.messages.push({
          id: 'm_' + token(),
          role: 'assistant',
          text: '',
          at: pending.startedAt || nowIso(),
          requestId: pending.requestId,
          contextVersion: pending.contextVersion || '',
          model: {
            provider: String(pending.model?.provider || ''),
            model: String(pending.model?.model || ''),
            reasoningEffort: pending.model?.reasoningEffort ?? null,
          },
          status: 'failed',
          error: { code: 'INTERRUPTED', message: '宿主在这次回答完成前重启了，回答没有保存。可以重试。' },
          partial: false,
        })
      }
      dialog.pending = null
      dialog.updatedAt = nowIso()
      changed = true
      notices.push({ id: 'dialog:' + key, level: 'warn', text: '有一次未完成的回答被标记为中断：' + (pending.requestId || '') })
    }
    return changed
  }

  /**
   * 提交一次业务写入。
   * @param {(candidate: any, meta: any) => void} build 在候选状态上做修改；抛错则整体回滚
   * @param {object} meta 记录用元信息（op 等）
   */
  function commit(build, meta = {}) {
    return enqueue(async () => {
      await requireWritable()
      const candidate = clone(committed)
      // 注意：不要在每次提交里重写 pending 对话 —— 正在生成的回答会在结束时自己落盘，
      // 提前派生"中断"消息会造成重复与后续所有提交被校验拒绝（QA HOST-1）。
      build(candidate, Object.assign({ core }, meta))
      const check = validateState(candidate, { core })
      if (!check.ok) {
        throw new AppError('VALIDATION', '写入前校验失败：' + check.errors.slice(0, 5).map((e) => e.message).join('；'), {
          errors: check.errors.slice(0, 40),
        })
      }
      try {
        await writeStateAtomic(candidate)
      } catch (error) {
        lastError = {
          at: nowIso(),
          code: (error && error.code) || 'UNKNOWN',
          message: String((error && error.message) || error),
          op: meta.op || null,
        }
        throw fromStorageFailure(error)
      }
      committed = candidate
      lastWrite = { at: nowIso(), op: meta.op || null, ok: true }
      lastError = null
      return { snapshot: snapshot(), wroteAt: lastWrite.at }
    })
  }

  async function manualBackup() {
    return enqueue(async () => {
      await requireWritable()
      const path = await backupFile('manual')
      if (!path) throw new AppError('NOT_FOUND', '还没有数据文件可备份')
      await pruneBackups()
      return path
    })
  }

  /** 仅供宿主内部/测试读取，不 clone。 */
  function raw() {
    return { core, committed, fatal, readOnly }
  }

  return {
    ensure,
    snapshot,
    commit,
    manualBackup,
    raw,
    reconcilePendingDialogs,
    get dataPath() {
      return stateFile
    },
    get dataDir() {
      return dataDir
    },
    get backupDir() {
      return backupDir
    },
  }
}

export { SCHEMA_VERSION }
