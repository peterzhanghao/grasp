/**
 * 假模型流 fixtures —— 严格按 docs/refactor-spec.md 第 0 节的 chunk 协议生成。
 *
 * chunk 形状：
 *   { type:'block-start', index, blockType }
 *   { type:'text-delta', index, text }
 *   { type:'reasoning-delta', index, text }
 *   { type:'block-end', index, block }
 *   { type:'usage', usage }
 *   { type:'finish', reason:'stop'|'error'|'aborted', failure?, usage? }
 *
 * 失败以 finish.reason='error' + failure:{code,message} 出现；取消以 finish.reason='aborted' 出现。
 * code 取值：NO_ADAPTER | MISSING_CREDENTIAL | INVALID_CREDENTIAL | AUTH | RATE_LIMIT | QUOTA |
 *            ACCOUNT_QUOTA | CONTEXT_WINDOW_EXCEEDED（与 src/host/errors.js 的映射表一致）。
 *
 * 本文件只被 test/harness 与 test/integration 使用，不进入产品代码。
 */

export const FAILURE_CODES = [
  'NO_ADAPTER',
  'MISSING_CREDENTIAL',
  'INVALID_CREDENTIAL',
  'AUTH',
  'RATE_LIMIT',
  'QUOTA',
  'ACCOUNT_QUOTA',
  'CONTEXT_WINDOW_EXCEEDED',
]

/** 契约第 4 节：模型失败码 → 插件对外错误码（与 src/host/errors.js 一致，测试用它做断言）。 */
export const LLM_FAILURE_CODE_MAP = {
  NO_ADAPTER: 'LLM_UNAVAILABLE',
  MISSING_CREDENTIAL: 'LLM_AUTH',
  INVALID_CREDENTIAL: 'LLM_AUTH',
  AUTH: 'LLM_AUTH',
  RATE_LIMIT: 'LLM_RATE_LIMIT',
  QUOTA: 'LLM_RATE_LIMIT',
  ACCOUNT_QUOTA: 'LLM_RATE_LIMIT',
  CONTEXT_WINDOW_EXCEEDED: 'LLM_CONTEXT',
  UNKNOWN: 'LLM_UNAVAILABLE',
}

const DEFAULT_MODEL = Object.freeze({ provider: 'fake-provider', model: 'fake-model-v1', reasoningEffort: null })

export const DEFAULT_SELECTION = Object.freeze({ provider: 'fake-provider', model: 'fake-model-v1', reasoningEffort: null })

export const DEFAULT_REPLY = '（假模型回答）延迟会让同一个增益的纠正来回穿过目标。'

export function sleepAbortable(ms, signal) {
  if (!ms || ms <= 0) return Promise.resolve()
  return new Promise((resolve) => {
    let timer = null
    const finish = () => {
      if (timer) clearTimeout(timer)
      timer = null
      if (signal) signal.removeEventListener('abort', finish)
      resolve()
    }
    if (signal?.aborted) return finish()
    timer = setTimeout(finish, ms)
    signal?.addEventListener('abort', finish, { once: true })
  })
}

function splitText(text, chunkSize) {
  const value = String(text ?? '')
  if (!value) return []
  if (!chunkSize || chunkSize <= 0) return [value]
  const out = []
  for (let i = 0; i < value.length; i += chunkSize) out.push(value.slice(i, i + chunkSize))
  return out
}

export function normalizeScenario(scenario) {
  if (scenario == null) return { type: 'success', text: DEFAULT_REPLY }
  if (typeof scenario === 'string') return { type: 'success', text: scenario }
  if (Array.isArray(scenario)) return { type: 'chunks', chunks: scenario }
  if (typeof scenario === 'function') return { type: 'function', fn: scenario }
  if (typeof scenario === 'object' && scenario.type) return scenario
  throw new Error('无法识别的假模型脚本：' + JSON.stringify(scenario))
}

/** 成功流：若干个 text-delta + block-end + usage + finish(stop)。 */
export function success(text = DEFAULT_REPLY, { chunkSize = 12, delayMs = 0, usage = { inputTokens: 12, outputTokens: 24 }, reasoning = null } = {}) {
  return { type: 'success', text, chunkSize, delayMs, usage, reasoning }
}

/** 中途失败流：先发 afterText 的部分文本，再以 finish(reason='error') 终止。 */
export function failure({ code = 'AUTH', message = '模型鉴权失败（fixture）', afterText = '', chunkSize = 12, delayMs = 0 } = {}) {
  if (!FAILURE_CODES.includes(code)) throw new Error('未知 failure code：' + code)
  return { type: 'fail', code, message, afterText, chunkSize, delayMs }
}

/** 慢流：每个 delta 之间等待 chunkDelayMs，用于取消/断连/并发测试。 */
export function slow(text = DEFAULT_REPLY, { chunkSize = 4, chunkDelayMs = 60, usage = { inputTokens: 1, outputTokens: 1 } } = {}) {
  return { type: 'success', text, chunkSize, delayMs: chunkDelayMs, usage, slow: true }
}

/** 直接抛出异常（非契约注入；用于验证宿主不会把异常吞成 200）。 */
export function throwError({ message = '假模型网络异常', code = 'ECONNRESET', afterText = '' } = {}) {
  return { type: 'throw', message, code, afterText }
}

/** 手动可控流：测试决定何时推文本、何时结束/失败；用于 A 生成中切 B、取消、断开等用例。 */
export function createManualStream() {
  const pending = []
  let waiter = null
  let closed = false
  const consumed = []
  let consumptionWaiter = null
  let started = false

  function notifyConsumption() {
    if (consumptionWaiter) {
      const fn = consumptionWaiter
      consumptionWaiter = null
      fn()
    }
  }

  function push(item) {
    if (closed) return
    consumed.push(item)
    if (waiter) {
      const fn = waiter
      waiter = null
      fn({ value: item, done: false })
    } else {
      pending.push(item)
    }
  }

  function closeChannel() {
    closed = true
    if (waiter) {
      const fn = waiter
      waiter = null
      fn({ value: undefined, done: true })
    }
  }

  const channel = {
    next() {
      notifyConsumption()
      if (pending.length) return Promise.resolve({ value: pending.shift(), done: false })
      if (closed) return Promise.resolve({ value: undefined, done: true })
      return new Promise((resolve) => {
        waiter = resolve
      })
    },
    close() {
      closeChannel()
    },
    get closed() {
      return closed
    },
  }

  const scenario = { type: 'manual', channel, manual: true }

  return {
    scenario,
    /** 推一段文本（会被包成 text-delta） */
    pushText(text) {
      push({ kind: 'text', text: String(text) })
      return this
    },
    /** 推一个完整 chunk（高级用法，例如 reasoning-delta） */
    pushChunk(chunk) {
      push({ kind: 'chunk', chunk })
      return this
    },
    /** 正常结束（block-end + usage + finish stop） */
    finish(usage = { inputTokens: 1, outputTokens: 1 }) {
      push({ kind: 'finish', usage })
      closeChannel()
      return this
    },
    /** 以模型失败码结束 */
    fail(code = 'AUTH', message = '手动注入的模型失败') {
      push({ kind: 'error', code, message })
      closeChannel()
      return this
    },
    /** 以 aborted 结束 */
    abort() {
      push({ kind: 'abort' })
      closeChannel()
      return this
    },
    get consumed() {
      return consumed.slice()
    },
    get started() {
      return started
    },
    /** 等到宿主开始消费这个流（第一次 next 调用）。 */
    waitForStart() {
      started = true
      if (consumed.length) return Promise.resolve()
      return new Promise((resolve) => {
        consumptionWaiter = resolve
      })
    },
    get pending() {
      return pending.length
    },
  }
}

function* chunkList(chunks) {
  for (const chunk of chunks) yield chunk
}

/**
 * 创建可编程假 LLM。
 *
 * - fixture.stream({ provider, model, messages, signal }) 是 async generator；
 * - enqueue(scenario)：FIFO；
 * - when(predicate|string, scenario)：按最后一次用户文本匹配；
 * - calls：所有调用记录（provider/model/messages 等）。
 *
 * scenario 可以是字符串（成功流文本）、success()/failure()/slow()/throwError()、
 * createManualStream().scenario，或自定义 async generator 函数。
 */
export function createLlmFixture({ defaultScenario = success(), listProviders = null } = {}) {
  const queue = []
  const rules = []
  const calls = []
  const callListeners = []
  let fallback = normalizeScenario(defaultScenario)

  function takeScenario(options) {
    if (queue.length) return normalizeScenario(queue.shift())
    const lastUserText = extractLastUserText(options?.messages)
    for (let i = 0; i < rules.length; i += 1) {
      const rule = rules[i]
      const hit = typeof rule.match === 'string' ? lastUserText.includes(rule.match) : rule.match(options)
      if (hit) {
        if (rule.once) rules.splice(i, 1)
        return normalizeScenario(rule.scenario)
      }
    }
    return fallback
  }

  async function* stream(options = {}) {
    const record = {
      at: new Date().toISOString(),
      provider: options.provider ?? null,
      model: options.model ?? null,
      reasoningEffort: options.reasoningEffort ?? null,
      messages: options.messages ?? [],
      hasSignal: !!options.signal,
    }
    const scenario = takeScenario(options)
    record.scenarioType = scenario.type
    calls.push(record)
    for (const listener of callListeners) {
      try {
        listener(record)
      } catch {
        /* 测试观察者异常不影响流 */
      }
    }
    yield* compileScenario(scenario, options.signal, options)
  }

  return {
    stream,
    calls,
    enqueue(scenario) {
      queue.push(scenario)
      return this
    },
    enqueueSuccess(text = DEFAULT_REPLY, opts) {
      return this.enqueue(success(text, opts))
    },
    enqueueFailure(opts) {
      return this.enqueue(failure(opts))
    },
    enqueueSlow(text = DEFAULT_REPLY, opts) {
      return this.enqueue(slow(text, opts))
    },
    when(match, scenario, { once = false } = {}) {
      rules.push({ match, scenario, once })
      return this
    },
    onCall(listener) {
      callListeners.push(listener)
      return this
    },
    setDefault(scenario) {
      fallback = normalizeScenario(scenario)
      return this
    },
    get pendingCount() {
      return queue.length
    },
    get lastCall() {
      return calls[calls.length - 1] || null
    },
    reset() {
      queue.length = 0
      rules.length = 0
      calls.length = 0
      callListeners.length = 0
      fallback = normalizeScenario(defaultScenario)
      return this
    },
    /** 供 model.js 的 llm.listProviders() 兜底逻辑使用 */
    listProviders() {
      if (typeof listProviders === 'function') return listProviders()
      return listProviders || []
    },
  }
}

function extractLastUserText(messages) {
  if (!Array.isArray(messages)) return ''
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message && message.role === 'user') {
      const content = message.content
      if (typeof content === 'string') return content
      if (Array.isArray(content)) {
        return content
          .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
          .map((block) => block.text)
          .join('')
      }
    }
  }
  return ''
}

async function* compileScenario(scenario, signal, options = {}) {
  if (scenario.type === 'function') {
    yield* scenario.fn(options, signal)
    return
  }
  if (scenario.type === 'chunks') {
    for (const chunk of chunkList(scenario.chunks)) {
      if (signal?.aborted) {
        yield { type: 'finish', reason: 'aborted' }
        return
      }
      yield chunk
    }
    return
  }
  if (scenario.type === 'manual') {
    yield* compileManual(scenario, signal)
    return
  }
  if (scenario.type === 'throw') {
    if (scenario.afterText) {
      yield { type: 'block-start', index: 0, blockType: 'text' }
      for (const delta of splitText(scenario.afterText, 8)) yield { type: 'text-delta', index: 0, text: delta }
    }
    const error = new Error(scenario.message)
    error.code = scenario.code
    throw error
  }

  const isFail = scenario.type === 'fail'
  const text = isFail ? scenario.afterText || '' : scenario.text || ''
  const deltas = splitText(text, scenario.chunkSize || 0)
  const usage = scenario.usage || null

  if (scenario.reasoning) {
    yield { type: 'block-start', index: 0, blockType: 'reasoning' }
    for (const part of splitText(scenario.reasoning, 16)) {
      if (signal?.aborted) {
        yield { type: 'finish', reason: 'aborted' }
        return
      }
      await sleepAbortable(scenario.delayMs || 0, signal)
      if (signal?.aborted) {
        yield { type: 'finish', reason: 'aborted' }
        return
      }
      yield { type: 'reasoning-delta', index: 0, text: part }
    }
    yield { type: 'block-end', index: 0, block: { type: 'reasoning', text: scenario.reasoning } }
  }

  yield { type: 'block-start', index: scenario.reasoning ? 1 : 0, blockType: 'text' }
  const textIndex = scenario.reasoning ? 1 : 0
  for (const delta of deltas) {
    if (signal?.aborted) {
      yield { type: 'finish', reason: 'aborted' }
      return
    }
    if (scenario.delayMs) await sleepAbortable(scenario.delayMs, signal)
    if (signal?.aborted) {
      yield { type: 'finish', reason: 'aborted' }
      return
    }
    yield { type: 'text-delta', index: textIndex, text: delta }
  }

  if (signal?.aborted) {
    yield { type: 'finish', reason: 'aborted' }
    return
  }

  if (isFail) {
    yield { type: 'finish', reason: 'error', failure: { code: scenario.code, message: scenario.message } }
    return
  }

  yield { type: 'block-end', index: textIndex, block: { type: 'text', text } }
  if (usage) yield { type: 'usage', usage }
  yield { type: 'finish', reason: 'stop', usage }
}

async function* compileManual(scenario, signal) {
  const channel = scenario.channel
  let text = ''
  let aborted = false
  const onAbort = () => {
    aborted = true
    channel.close()
  }
  if (signal?.aborted) aborted = true
  else signal?.addEventListener?.('abort', onAbort, { once: true })
  try {
    yield { type: 'block-start', index: 0, blockType: 'text' }
    while (true) {
      const item = await channel.next()
      if (item.done) break
      const entry = item.value
      if (entry.kind === 'text') {
        text += entry.text
        yield { type: 'text-delta', index: 0, text: entry.text }
      } else if (entry.kind === 'chunk') {
        yield entry.chunk
      } else if (entry.kind === 'error') {
        yield { type: 'finish', reason: 'error', failure: { code: entry.code, message: entry.message } }
        return
      } else if (entry.kind === 'abort') {
        yield { type: 'finish', reason: 'aborted' }
        return
      } else if (entry.kind === 'finish') {
        if (aborted || signal?.aborted) {
          yield { type: 'finish', reason: 'aborted' }
          return
        }
        yield { type: 'block-end', index: 0, block: { type: 'text', text } }
        yield { type: 'usage', usage: entry.usage || null }
        yield { type: 'finish', reason: 'stop', usage: entry.usage || null }
        return
      }
    }
    if (aborted || signal?.aborted) {
      yield { type: 'finish', reason: 'aborted' }
      return
    }
    yield { type: 'block-end', index: 0, block: { type: 'text', text } }
    yield { type: 'finish', reason: 'stop', usage: null }
  } finally {
    signal?.removeEventListener?.('abort', onAbort)
  }
}

/** 消费一个假流，返回 { chunks, text, finish }。 */
export async function collectChunks(iterable) {
  const chunks = []
  let text = ''
  let finish = null
  if (!iterable) return { chunks, text, finish }
  for await (const chunk of iterable) {
    chunks.push(chunk)
    if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
    if (chunk && chunk.type === 'finish') {
      finish = chunk
      break
    }
  }
  return { chunks, text, finish }
}

/** 供测试断言：模型默认选择对象是否与 fixture 默认一致。 */
export function defaultSelection() {
  return { ...DEFAULT_SELECTION }
}
