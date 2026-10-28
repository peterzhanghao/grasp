/**
 * 模型解析：优先使用宿主为"新会话"选定的默认模型；其次取适配器注册表的第一个可用路由。
 * 只读取，不修改宿主模型设置。
 */

function normalizeSelection(selection) {
  if (!selection || typeof selection !== 'object') return null
  const provider = typeof selection.provider === 'string' ? selection.provider : null
  const model = typeof selection.model === 'string' ? selection.model : null
  if (!provider || !model) return null
  return {
    provider,
    model,
    reasoningEffort: selection.reasoningEffort ?? null,
  }
}

export function createModelResolver({ getDefaultModel, getLlm, logger }) {
  let cached = null
  let cachedAt = 0
  const TTL = 5000

  async function resolve(force = false) {
    const now = Date.now()
    if (!force && cached && now - cachedAt < TTL) return cached

    const defaultModel = getDefaultModel()
    if (defaultModel && typeof defaultModel.currentSelection === 'function') {
      try {
        const selection = normalizeSelection(defaultModel.currentSelection())
        if (selection) {
          cached = { ...selection, available: true, source: 'agent-default-model' }
          cachedAt = now
          return cached
        }
      } catch (error) {
        logger?.warn?.('[掌控] 读取默认模型失败：' + String((error && error.message) || error))
      }
    }

    const llm = getLlm()
    if (llm && typeof llm.listProviders === 'function') {
      try {
        const providers = llm.listProviders() || []
        for (const provider of providers) {
          const models = provider?.models || provider?.modelIds || []
          const modelId = (models[0] && (models[0].id || models[0])) || provider?.defaultModel || null
          if (provider?.id && modelId) {
            cached = { provider: provider.id, model: String(modelId), reasoningEffort: null, available: true, source: 'llm-registry' }
            cachedAt = now
            return cached
          }
        }
      } catch (error) {
        logger?.warn?.('[掌控] 读取模型适配器失败：' + String((error && error.message) || error))
      }
    }

    cached = {
      provider: null,
      model: null,
      reasoningEffort: null,
      available: !!llm,
      source: 'unavailable',
      reason: llm ? '宿主没有配置可用的默认模型' : '宿主没有加载 llm 服务',
    }
    cachedAt = now
    return cached
  }

  function invalidate() {
    cached = null
    cachedAt = 0
  }

  return { resolve, invalidate }
}
