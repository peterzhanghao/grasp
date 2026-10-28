/**
 * Host 装配层：把存储、模型解析、对话、业务操作、HTTP 路由与 agent 工具接起来。
 * 任何装配/加载失败都只降级插件能力，不影响宿主其他插件。
 */
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStorage } from './storage.js'
import { createModelResolver } from './model.js'
import { createDialogService } from './dialog.js'
import { createOps } from './ops.js'
import { createHttpHandler } from './http.js'
import { createToolDefinition, asToolError } from './tools.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const CORE_FILE = resolve(HERE, '..', '..', 'data', 'core.json')
const DEFAULT_DATA_DIR = resolve(HERE, '..', '..', '..', 'loop-atlas-data')

export const VERSION = '1.0.0'

function createLogger(ctx) {
  let channel = null
  try {
    channel = ctx.logger ? ctx.logger('loop-atlas') : null
  } catch {
    channel = null
  }
  const wrap = (level) => (message, error) => {
    try {
      if (!channel) return
      if (typeof channel[level] === 'function') {
        if (error instanceof Error) channel[level](message + '：' + error.message)
        else channel[level](message)
      }
    } catch {
      /* 日志失败不影响业务 */
    }
  }
  return { info: wrap('info'), warn: wrap('warn'), error: wrap('error'), debug: wrap('debug') }
}

export function createLoopAtlas(ctx, config = {}) {
  const dataDir = resolve(String(config.dataDir || DEFAULT_DATA_DIR))
  const logger = createLogger(ctx)

  const storage = createStorage({ dataDir, coreFile: CORE_FILE, logger })
  let llm = null
  let agentDefaultModel = null
  let failed = null
  let mounted = false
  let disposed = false

  const modelResolver = createModelResolver({
    getDefaultModel: () => agentDefaultModel,
    getLlm: () => llm,
    logger,
  })
  const dialog = createDialogService({
    storage,
    resolveModel: (force) => modelResolver.resolve(force),
    getLlm: () => llm,
    logger,
  })
  const ops = createOps({
    storage,
    dialog,
    resolveModel: (force) => modelResolver.resolve(force),
    getLlm: () => llm,
    logger,
  })
  const handler = createHttpHandler({
    storage,
    ops,
    dialog,
    resolveModel: (force) => modelResolver.resolve(force),
    version: VERSION,
  })

  async function mount() {
    if (mounted) return
    mounted = true
    if (disposed) return

    try {
      // 可选服务：缺失时插件仍可用（页面会说明模型不可用）。
      ctx.inject(['llm'], (serviceCtx) => {
        llm = serviceCtx.llm
        modelResolver.invalidate()
      })
      ctx.inject(['agentDefaultModel'], (serviceCtx) => {
        agentDefaultModel = serviceCtx.agentDefaultModel
        modelResolver.invalidate()
      })

      ctx.effect(() =>
        ctx.webServer.register({
          kind: 'prefix',
          path: '/api/loop-atlas',
          handler,
        }),
      )

      ctx.inject(['tools'], (toolCtx) => {
        const definition = createToolDefinition({ storage, ops })
        toolCtx.effect(() => {
          toolCtx.tools.register({
            ...definition,
            async execute(args) {
              try {
                return await definition.execute(args)
              } catch (error) {
                return asToolError(error)
              }
            },
          })
        })
      })
    } catch (error) {
      failed = error
      logger.error('[掌控] 注册路由或工具失败', error)
    }

    try {
      await storage.ensure()
    } catch (error) {
      failed = error
      logger.error('[掌控] 数据初始化失败', error)
    }
  }

  function fail(error) {
    failed = error
  }

  function dispose() {
    if (disposed) return
    disposed = true
    try {
      dialog.dispose()
    } catch {
      /* ignore */
    }
  }

  return {
    version: VERSION,
    storage,
    mount,
    fail,
    dispose,
    get error() {
      return failed
    },
    get dataDir() {
      return dataDir
    },
  }
}
