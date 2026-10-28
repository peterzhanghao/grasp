/**
 * 掌控（Grasp）Host 入口。
 *
 * 只做装配：读取配置、建立存储与业务服务、注册 HTTP 路由与 agent 工具。
 * 业务实现按领域拆在 src/host/** 与 src/domain/**，这里不写业务逻辑。
 */
import { createLoopAtlas } from './src/host/plugin.js'

export const name = 'loop-atlas'

/** 没有 webServer 就没有插件页面，不激活；tools / llm 属于可选能力，在 plugin.js 内注入。 */
export const inject = ['webServer']

export function apply(ctx, config = {}) {
  const app = createLoopAtlas(ctx, config)

  ctx.effect(() => () => {
    app.dispose()
  })

  try {
    app.mount().catch((error) => {
      // 装配失败只记录，不把整个宿主插件树打掉；页面会用降级状态说明原因。
      logHostError(ctx, error)
      app.fail(error)
    })
  } catch (error) {
    logHostError(ctx, error)
    app.fail(error)
  }
}

function logHostError(ctx, error) {
  try {
    const logger = ctx.logger?.('loop-atlas')
    logger?.error?.(error)
  } catch {
    /* 日志通道异常不应影响装配流程 */
  }
}
