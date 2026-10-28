/**
 * Host API 客户端（contract §4）。
 *
 * - GET  /api/loop-atlas/state          → 全量状态
 * - POST /api/loop-atlas/ops            → { op, payload } → { ok, ... }
 * - POST /api/loop-atlas/dialog/stream  → text/x-ndjson 流
 * - POST /api/loop-atlas/dialog/cancel  → { requestId }
 *
 * 所有失败都转成 ApiError：code 来自宿主 {ok:false,code,error,details}；
 * 客户端不得吞错，UI 必须显示真实 code / 原因。
 */

export const API_BASE = '/api/loop-atlas'

export class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message)
    this.name = 'ApiError'
    this.code = code || 'UNKNOWN'
    this.status = typeof status === 'number' ? status : 0
    this.details = details === undefined ? null : details
  }
}

function errorFromBody(status, body, fallbackText) {
  const code = body && typeof body.code === 'string' ? body.code : status ? `HTTP` : 'UNKNOWN'
  const message =
    (body && (body.error || body.message)) ||
    fallbackText ||
    (status ? `宿主返回 HTTP ${status}` : '请求失败')
  return new ApiError(String(message), status ? code : code || 'UNKNOWN', status, body && body.details)
}

async function readJsonBody(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { __unparsed: text.slice(0, 400) }
  }
}

/** GET /state；失败抛 ApiError。 */
export async function fetchState() {
  let response
  try {
    response = await fetch(`${API_BASE}/state`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
  } catch (error) {
    throw new ApiError(String((error && error.message) || error), 'NETWORK', 0)
  }
  const body = await readJsonBody(response)
  if (!response.ok) throw errorFromBody(response.status, body)
  if (!body || body.ok !== true) throw errorFromBody(response.status, body, 'GET /state 未返回 ok:true')
  return body
}

/** POST /ops；宿主成功返回 {ok:true,...}，失败返回 4xx 错误信封。 */
export async function runOp(op, payload) {
  let response
  try {
    response = await fetch(`${API_BASE}/ops`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ op, payload: payload || {} }),
    })
  } catch (error) {
    throw new ApiError(String((error && error.message) || error), 'NETWORK', 0)
  }
  const body = await readJsonBody(response)
  if (!response.ok) throw errorFromBody(response.status, body)
  if (!body) throw new ApiError(`操作 ${op} 返回空响应`, 'PROTOCOL', response.status)
  if (body.ok === false) throw errorFromBody(response.status || 500, body)
  return body
}

/** 读取错误响应体（流式请求失败时用）。 */
export async function readErrorEnvelope(response, fallback) {
  let body = null
  try {
    const text = await response.text()
    if (text) body = JSON.parse(text)
  } catch {
    body = null
  }
  if (body && typeof body === 'object') return errorFromBody(response.status, body)
  return new ApiError(fallback || `宿主返回 HTTP ${response.status}`, 'HTTP', response.status)
}

/** 把一条 NDJSON 文本行转事件；非法行抛 PROTOCOL。 */
export function parseNdjsonLine(line) {
  try {
    return JSON.parse(line)
  } catch (error) {
    throw new ApiError(`流式响应行不是合法 JSON：${String((error && error.message) || error)}`, 'PROTOCOL', 0)
  }
}

/** 逐行读取 NDJSON 流；返回最后一个事件（便于断言）。 */
async function consumeNdjson(response, onEvent, signal) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new ApiError('当前环境不支持流式读取（ReadableStream 缺失）', 'PROTOCOL', response.status)
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let last = null
  const emit = (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const event = parseNdjsonLine(trimmed)
    last = event
    if (typeof onEvent === 'function') onEvent(event)
  }
  try {
    for (;;) {
      if (signal && signal.aborted) throw new ApiError('请求已取消', 'CANCELED', 0)
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let index
      while ((index = buffer.indexOf('\n')) >= 0) {
        emit(buffer.slice(0, index))
        buffer = buffer.slice(index + 1)
      }
    }
    buffer += decoder.decode()
    emit(buffer)
    return last
  } finally {
    // 提前退出（abort）时显式释放 reader；失败不覆盖原始错误。
    try {
      reader.releaseLock()
    } catch {
      /* reader 已释放 */
    }
  }
}

/**
 * POST /dialog/stream。
 * @param {object} options
 * @param {{kind:string,id:string}} options.subject
 * @param {string} [options.text] 新问题正文（重试时为空）
 * @param {string} options.requestId 客户端生成的新请求号
 * @param {string} [options.retryRequestId] 要重试的失败请求号
 * @param {AbortSignal} [options.signal]
 * @param {(event:object)=>void} [options.onEvent]
 */
export async function streamDialog({ subject, text, requestId, retryRequestId, signal, onEvent }) {
  const payload = { subject, text: text || '', requestId }
  if (retryRequestId) payload.retryRequestId = retryRequestId
  let response
  try {
    response = await fetch(`${API_BASE}/dialog/stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (error) {
    if (error && (error.name === 'AbortError' || error.code === 'ABORT_ERR')) {
      throw new ApiError('已停止', 'CANCELED', 0)
    }
    throw new ApiError(String((error && error.message) || error), 'NETWORK', 0)
  }
  if (!response.ok) throw await readErrorEnvelope(response, `对话请求失败（HTTP ${response.status}）`)
  const contentType = String(response.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('application/json')) {
    // 兼容：宿主用 JSON 信封直接报错（例如模型不可用），而不是开流。
    const body = await readJsonBody(response)
    if (body && body.ok === false) throw errorFromBody(response.status, body)
    throw new ApiError('对话接口没有返回 NDJSON 流', 'PROTOCOL', response.status)
  }
  return consumeNdjson(response, onEvent, signal)
}

/** POST /dialog/cancel；失败回退 ops dialog.cancel。 */
export async function cancelDialog(requestId) {
  try {
    const response = await fetch(`${API_BASE}/dialog/cancel`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ requestId }),
    })
    const body = await readJsonBody(response)
    if (response.ok && body && body.ok !== false) return body
    // 宿主可能对已结束请求返回 NOT_FOUND；回退 ops 再试一次。
    if (response.status !== 404) throw errorFromBody(response.status, body)
  } catch (error) {
    if (error instanceof ApiError && error.status !== 404 && error.code !== 'NOT_FOUND') throw error
  }
  return runOp('dialog.cancel', { requestId })
}

/** ops dialog.get；返回 {dialog, available, model, reason}。 */
export async function fetchDialog(subject) {
  const body = await runOp('dialog.get', { subject })
  return body
}
