/**
 * 学习伙伴对话引擎：真实模型流式对话、按 subject 隔离的草稿与请求状态。
 *
 * 协议（contract §4 + Lead 确认，2026-10-28）：
 * - POST /dialog/stream，body { subject, text, requestId, retryRequestId? }
 * - NDJSON：start / delta / done / error（error 若带 message 表示失败回答已落盘，可用 requestId 重试）
 * - 停止：AbortController + POST /dialog/cancel { requestId }
 * - 重试：同一 /dialog/stream + retryRequestId（Host 复用原 user 消息，不重复）
 * - 回答归属发送时的 subject；切 subject 只影响显示。
 */

const { useState, useEffect, useRef, useCallback } = React

import { streamDialog, cancelDialog } from '../api.js'
import { newRequestId, subjectKey } from '../util.js'
import { toApiError } from './app.js'

function normalizeChatError(event, t) {
  const code = String((event && (event.code || (event.error && event.error.code))) || 'UNKNOWN')
  let message = (event && typeof event.error === 'string' && event.error) || ''
  if (!message && event && typeof event.message === 'string') message = event.message
  if (!message && event && event.message && typeof event.message === 'object') {
    message = event.message.error || event.message.text || ''
  }
  if (!message) message = t(`loop.error.${code}`)
  return { code, message: String(message) }
}

const EMPTY_STREAM = {
  phase: 'idle',
  text: '',
  requestId: null,
  error: null,
  model: null,
  sentText: '',
  retryRequestId: null,
  startedAt: null,
}

/**
 * @param {object} options
 * @param {() => Promise<any>} options.reload 重新读取 /state
 * @param {(receipt:object)=>void} options.addReceipt
 * @param {(key:string, params?:object)=>string} options.t
 */
export function useChat(options) {
  const { reload, addReceipt, t } = options
  const [streams, setStreams] = useState({})
  const [drafts, setDrafts] = useState({})
  const controllers = useRef(new Map())
  const requestIds = useRef(new Map())
  const activeKeys = useRef(new Set())
  const mounted = useRef(true)
  const reloadRef = useRef(reload)
  reloadRef.current = reload

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      for (const controller of controllers.current.values()) {
        try {
          controller.abort()
        } catch {
          /* 已结束 */
        }
      }
      controllers.current.clear()
    }
  }, [])

  const patchStream = useCallback((key, patch) => {
    if (!mounted.current) return
    setStreams((previous) => {
      const current = previous[key] || EMPTY_STREAM
      const next = Object.assign({}, current, typeof patch === 'function' ? patch(current) : patch)
      return Object.assign({}, previous, { [key]: next })
    })
  }, [])

  const settleAfterReload = useCallback(
    (key) => {
      const settle = () => {
        if (!mounted.current) return
        setStreams((previous) => {
          const current = previous[key]
          if (!current) return previous
          if (current.phase === 'finishing' || current.phase === 'cancelled') {
            return Object.assign({}, previous, {
              [key]: Object.assign({}, EMPTY_STREAM, {
                phase: 'idle',
                error: null,
              }),
            })
          }
          return previous
        })
      }
      const reloadPromise = reloadRef.current ? reloadRef.current() : Promise.resolve(null)
      Promise.resolve(reloadPromise)
        .catch(() => null)
        .then(settle)
      // 重读异常慢时也允许继续输入（真实回执仍以 /state 为准）。
      setTimeout(settle, 1500)
    },
    [],
  )

  const setDraft = useCallback((subject, text) => {
    const key = subjectKey(subject)
    setDrafts((previous) => (previous[key] === text ? previous : Object.assign({}, previous, { [key]: text })))
  }, [])

  const runStream = useCallback(
    async (subject, payload) => {
      const key = subjectKey(subject)
      if (!key) return null
      if (activeKeys.current.has(key)) return null
      activeKeys.current.add(key)
      const controller = new AbortController()
      controllers.current.set(key, controller)
      requestIds.current.set(key, payload.requestId)
      patchStream(key, {
        phase: 'streaming',
        text: '',
        requestId: payload.requestId,
        error: null,
        model: payload.model || null,
        sentText: payload.text || '',
        retryRequestId: payload.retryRequestId || null,
        startedAt: new Date().toISOString(),
      })
      let sawDone = false
      let streamError = null
      try {
        await streamDialog({
          subject,
          text: payload.text || '',
          requestId: payload.requestId,
          retryRequestId: payload.retryRequestId,
          signal: controller.signal,
          onEvent: (event) => {
            if (!mounted.current || !event || typeof event !== 'object') return
            if (event.type === 'start') {
              if (event.requestId) requestIds.current.set(key, event.requestId)
              patchStream(key, (current) => ({
                requestId: event.requestId || current.requestId,
                model: event.model || current.model,
                contextVersion: event.contextVersion || null,
              }))
              return
            }
            if (event.type === 'delta') {
              const chunk = String(event.text || '')
              if (chunk) patchStream(key, (current) => ({ text: current.text + chunk }))
              return
            }
            if (event.type === 'done') {
              sawDone = true
              patchStream(key, { phase: 'finishing' })
              return
            }
            if (event.type === 'error') {
              streamError = normalizeChatError(event, t)
              patchStream(key, {
                phase: 'error',
                error: streamError,
                requestId: event.requestId || requestIds.current.get(key) || null,
              })
            }
          },
        })
        if (!streamError && !sawDone) {
          streamError = { code: 'PROTOCOL', message: t('loop.error.PROTOCOL') }
          patchStream(key, { phase: 'error', error: streamError })
        }
      } catch (rawError) {
        const apiError = toApiError(rawError)
        if (apiError.code === 'CANCELED') {
          patchStream(key, { phase: 'cancelled', error: null, requestId: null })
        } else {
          patchStream(key, {
            phase: 'error',
            error: { code: apiError.code, message: apiError.message },
          })
        }
      } finally {
        controllers.current.delete(key)
        requestIds.current.delete(key)
        activeKeys.current.delete(key)
        settleAfterReload(key)
      }
      return payload.requestId
    },
    [patchStream, settleAfterReload, t],
  )

  const send = useCallback(
    async (subject, text) => {
      const value = String(text || '').trim()
      if (!value) return null
      const requestId = newRequestId()
      const result = await runStream(subject, { text: value, requestId })
      return result
    },
    [runStream],
  )

  const retry = useCallback(
    async (subject, failedRequestId) => {
      if (!failedRequestId) return null
      const requestId = newRequestId()
      return runStream(subject, { text: '', requestId, retryRequestId: failedRequestId })
    },
    [runStream],
  )

  /** 传输层失败（消息尚未落盘）时，改成一次全新的发送。 */
  const resend = useCallback(
    async (subject, text) => {
      const value = String(text || '').trim()
      if (!value) return null
      const requestId = newRequestId()
      return runStream(subject, { text: value, requestId })
    },
    [runStream],
  )

  const stop = useCallback(
    (subject) => {
      const key = subjectKey(subject)
      const controller = controllers.current.get(key)
      const requestId = requestIds.current.get(key)
      if (!controller) return
      patchStream(key, { phase: 'stopping' })
      try {
        controller.abort()
      } catch {
        /* 已结束 */
      }
      if (requestId) {
        cancelDialog(requestId)
          .then(() => {
            if (mounted.current) addReceipt({ kind: 'info', text: t('loop.chat.cancelled') })
          })
          .catch((rawError) => {
            const apiError = toApiError(rawError)
            // 请求已经结束时 Host 返回 NOT_FOUND 属正常竞态。
            if (apiError.code === 'NOT_FOUND') return
            if (mounted.current) {
              addReceipt({
                kind: 'error',
                text: `${t('loop.chat.cancelled')}（${apiError.code}）：${apiError.message}`,
                code: apiError.code,
              })
            }
          })
      }
    },
    [addReceipt, patchStream, t],
  )

  const dismissError = useCallback(
    (subject) => {
      const key = subjectKey(subject)
      setStreams((previous) => {
        const current = previous[key]
        if (!current || current.phase !== 'error') return previous
        return Object.assign({}, previous, { [key]: Object.assign({}, EMPTY_STREAM, { phase: 'idle' }) })
      })
    },
    [],
  )

  const streamFor = useCallback(
    (subject) => {
      const key = subjectKey(subject)
      return streams[key] || null
    },
    [streams],
  )

  return {
    streams,
    streamFor,
    draftFor(subject) {
      return drafts[subjectKey(subject)] || ''
    },
    setDraft,
    send,
    retry,
    resend,
    stop,
    dismissError,
    isStreaming(subject) {
      const stream = streamFor(subject)
      if (!stream) return false
      return stream.phase === 'streaming' || stream.phase === 'stopping' || stream.phase === 'finishing'
    },
  }
}
