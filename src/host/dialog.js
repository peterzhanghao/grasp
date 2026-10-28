/**
 * 学习伙伴对话服务：真实宿主模型、按 subject 隔离、流式增量、取消/重试/中断恢复。
 *
 * 不变量：
 * - 消息归属只看发送时的 subject；UI 当前选中什么不会改变结果归属。
 * - 先持久化用户消息与 pending 状态，再调用模型；结束（成功/失败/取消）后持久化完整消息。
 * - 同一 subject 同时只允许一个进行中的请求；取消后可以重试，重试不重复用户消息。
 */
import { AppError, fromLlmFailure } from './errors.js'
import { buildMessages, contextVersion } from './prompt.js'

const MAX_TEXT = 4000
const DEFAULT_TIMEOUT_MS = 180000
const REQUEST_ID_RE = /^r_[A-Za-z0-9_-]{4,64}$/

const nowIso = () => new Date().toISOString()
const clone = (value) => structuredClone(value)

function requestId() {
  return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function messageId() {
  return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

/** 统一成 schema 要求的 model 对象：provider/model 必须是字符串，reasoningEffort 字符串或 null。 */
export function normalizeModelRecord(model) {
  return {
    provider: String((model && model.provider) || ''),
    model: String((model && model.model) || ''),
    reasoningEffort: model && typeof model.reasoningEffort === 'string' ? model.reasoningEffort : null,
  }
}

export function subjectKey(subject) {
  if (!subject || typeof subject !== 'object') return null
  if (subject.kind !== 'node' && subject.kind !== 'relation' && subject.kind !== 'investigation') return null
  if (typeof subject.id !== 'string' || !subject.id) return null
  return `${subject.kind}:${subject.id}`
}

export function ensureDialogRecord(state, subject) {
  const key = subjectKey(subject)
  if (!key) throw new AppError('VALIDATION', '对话主题不合法')
  if (!state.dialogs) state.dialogs = {}
  let dialog = state.dialogs[key]
  if (!dialog) {
    dialog = { subject: { kind: subject.kind, id: subject.id }, messages: [], lastRequestId: null, pending: null, updatedAt: nowIso() }
    state.dialogs[key] = dialog
  }
  if (!Array.isArray(dialog.messages)) dialog.messages = []
  return dialog
}

export function createDialogService({ storage, resolveModel, getLlm, logger }) {
  /** requestId -> { controller, subject, key, startedAt } */
  const active = new Map()
  /** subjectKey -> requestId */
  const bySubject = new Map()

  function logWarn(message, error) {
    try {
      logger?.warn?.(message + (error ? '：' + String((error && error.message) || error) : ''))
    } catch {
      /* ignore */
    }
  }

  async function currentSnapshot() {
    const snap = await storage.ensure()
    if (snap.fatal) throw new AppError('READ_ONLY', snap.fatal.message, snap.fatal)
    return snap
  }

  function validateSubject(core, subject) {
    const key = subjectKey(subject)
    if (!key) throw new AppError('VALIDATION', '对话主题不合法：需要 {kind:"node"|"relation"|"investigation", id}')
    if (subject.kind === 'node' && !(core.nodes || []).some((node) => node.id === subject.id)) {
      throw new AppError('NOT_FOUND', '没有这个节点：' + subject.id)
    }
    if (subject.kind === 'relation' && !(core.relations || []).some((relation) => relation.id === subject.id)) {
      throw new AppError('NOT_FOUND', '没有这条关系：' + subject.id)
    }
    return key
  }

  async function availability() {
    const model = await resolveModel()
    const llm = getLlm()
    if (!llm) return { ok: false, model: { ...model }, reason: '宿主没有加载 llm 服务' }
    if (!model.available || !model.provider || !model.model) {
      return { ok: false, model: { ...model }, reason: model.reason || '宿主没有配置可用的默认模型' }
    }
    return { ok: true, model: { ...model }, reason: null }
  }

  async function get({ subject }) {
    const snap = await currentSnapshot()
    const key = validateSubject(snap.core, subject)
    const stored = snap.store.dialogs?.[key]
    const dialog = stored ? clone(stored) : { subject: { kind: subject.kind, id: subject.id }, messages: [], lastRequestId: null, pending: null, updatedAt: null }
    // 进程中断留下的 pending：读的时候先呈现为"中断"，等下一次写入时由存储层落盘。
    if (dialog.pending) {
      const hasAnswer = dialog.messages.some((message) => message.requestId === dialog.pending.requestId && message.role === 'assistant')
      if (!hasAnswer) {
        dialog.messages.push({
          id: messageId(),
          role: 'assistant',
          text: '',
          at: dialog.pending.startedAt || nowIso(),
          requestId: dialog.pending.requestId,
          contextVersion: dialog.pending.contextVersion || '',
          model: normalizeModelRecord(dialog.pending.model),
          status: 'failed',
          error: { code: 'INTERRUPTED', message: '宿主在这次回答完成前重启了，回答没有保存。可以重试。' },
          partial: false,
          derived: true,
        })
      }
    }
    const info = await availability()
    return { dialog, available: info.ok, model: info.model, reason: info.reason }
  }

  function cancel(requestIdValue) {
    const entry = active.get(requestIdValue)
    if (!entry) return { ok: false, code: 'NOT_FOUND', message: '这个请求已经结束或不存在' }
    entry.controller.abort()
    return { ok: true }
  }

  function activeRequestForSubject(subject) {
    const key = subjectKey(subject)
    if (!key) return null
    const id = bySubject.get(key)
    if (!id) return null
    const entry = active.get(id)
    return entry ? { requestId: id, ...entry } : null
  }

  /**
   * 运行一次回答并逐条推送事件。
   * @param {{subject:any,text?:string,requestId?:string,retryRequestId?:string,investigationId?:string|null}} input
   * @param {(event:any)=>void} emit
   */
  async function stream(input, emit) {
    const subject = input?.subject
    const { core } = await currentSnapshot()
    const key = validateSubject(core, subject)
    const existing = activeRequestForSubject(subject)
    if (existing) {
      throw new AppError('BUSY', '这个主题上还有一条回答在生成，先停止或等它结束', { requestId: existing.requestId })
    }

    let text = typeof input.text === 'string' ? input.text.trim() : ''
    let removeRequestId = null
    let retryOf = null
    let reuseUserMessage = false
    if (input.retryRequestId) {
      if (!REQUEST_ID_RE.test(String(input.retryRequestId))) throw new AppError('VALIDATION', '重试目标请求号不合法')
      const snap = await currentSnapshot()
      const dialog = snap.store.dialogs?.[key]
      const userMessage = dialog?.messages?.find((message) => message.requestId === input.retryRequestId && message.role === 'user')
      if (!userMessage) throw new AppError('NOT_FOUND', '找不到要重试的那条提问')
      text = userMessage.text
      removeRequestId = input.retryRequestId
      retryOf = input.retryRequestId
      reuseUserMessage = true
    }
    if (!text) throw new AppError('VALIDATION', '问题不能为空')
    if (text.length > MAX_TEXT) throw new AppError('VALIDATION', `问题太长（上限 ${MAX_TEXT} 字）`)

    const investigationId = input.investigationId || null
    if (investigationId) {
      const snap = await currentSnapshot()
      if (!snap.store.investigations?.[investigationId]) throw new AppError('NOT_FOUND', '没有这个研究问题：' + investigationId)
    }

    const info = await availability()
    const supplied = input.requestId && input.requestId !== input.retryRequestId ? String(input.requestId) : ''
    const id = REQUEST_ID_RE.test(supplied) ? supplied : requestId()
    const controller = new AbortController()
    const startedAt = nowIso()

    active.set(id, { controller, subject, key, startedAt })
    bySubject.set(key, id)

    try {
      // 第一步：落盘用户消息与 pending（失败即整体失败，不调用模型）。
      const version = contextVersion(core, subject)
      await storage.commit(
        (candidate) => {
          const dialog = ensureDialogRecord(candidate, subject)
          if (removeRequestId) {
            dialog.messages = dialog.messages.filter(
              (message) => !(message.requestId === removeRequestId && message.role === 'assistant'),
            )
          }
          if (!reuseUserMessage) {
            dialog.messages.push({
              id: messageId(),
              role: 'user',
              text,
              at: startedAt,
              requestId: id,
              contextVersion: version,
              model: normalizeModelRecord(info.model),
              status: 'completed',
              error: null,
              partial: false,
            })
          }
          dialog.pending = {
            requestId: id,
            startedAt,
            contextVersion: version,
            model: normalizeModelRecord(info.model),
          }
          dialog.lastRequestId = id
          dialog.updatedAt = startedAt
        },
        { op: 'dialog.send' },
      )

      emit({ type: 'start', requestId: id, subject: { kind: subject.kind, id: subject.id }, model: info.model || null, contextVersion: version })

      if (!info.ok) {
        const failure = new AppError('LLM_UNAVAILABLE', info.reason || '模型不可用')
        await finish({ id, subject, text: '', status: 'failed', error: failure, model: info.model, version, usage: null })
        emit({ type: 'error', requestId: id, code: failure.code, message: failure.message })
        return
      }

      const snap = await currentSnapshot()
      const dialog = snap.store.dialogs?.[key]
      const messages = buildMessages({
        core: snap.core,
        state: snap.store,
        dialog,
        subject,
        text,
        investigationId,
      })

      let accumulated = ''
      let finishChunk = null
      let streamError = null
      const timeout = setTimeout(() => {
        try {
          controller.abort()
        } catch {
          /* ignore */
        }
      }, DEFAULT_TIMEOUT_MS)

      try {
        const iterator = getLlm().stream({
          provider: info.model.provider,
          model: info.model.model,
          reasoningEffort: info.model.reasoningEffort ?? undefined,
          messages,
          signal: controller.signal,
        })
        for await (const chunk of iterator) {
          if (!chunk || typeof chunk !== 'object') continue
          if (chunk.type === 'text-delta' && typeof chunk.text === 'string') {
            accumulated += chunk.text
            emit({ type: 'delta', requestId: id, text: chunk.text })
          } else if (chunk.type === 'finish') {
            finishChunk = chunk
            break
          }
        }
      } catch (error) {
        streamError = error
      } finally {
        clearTimeout(timeout)
      }

      const aborted = controller.signal.aborted && !streamError
      let status = 'completed'
      let error = null
      if (streamError) {
        status = 'failed'
        error = streamError instanceof AppError ? streamError : fromLlmFailure({ code: 'UNKNOWN', message: String((streamError && streamError.message) || streamError) })
      } else if (aborted) {
        status = 'cancelled'
        error = new AppError('CANCELED', '已停止这次回答')
      } else if (finishChunk && finishChunk.reason === 'error') {
        status = 'failed'
        error = fromLlmFailure(finishChunk.failure)
      } else if (finishChunk && finishChunk.reason === 'aborted') {
        status = 'cancelled'
        error = new AppError('CANCELED', '已停止这次回答')
      } else if (!finishChunk) {
        status = 'failed'
        error = new AppError('LLM_UNAVAILABLE', '模型流没有给出结束标记，回答可能不完整')
      }

      const usage = finishChunk?.usage || null
      const saved = await finish({
        id,
        subject,
        text: accumulated,
        status,
        error,
        model: info.model,
        version,
        usage,
      })

      if (status === 'completed') {
        emit({ type: 'done', requestId: id, message: saved.message, usage })
      } else {
        emit({
          type: 'error',
          requestId: id,
          code: error.code,
          message: error.message,
          message: saved.message,
          partial: saved.message.partial,
        })
      }
    } finally {
      active.delete(id)
      if (bySubject.get(key) === id) bySubject.delete(key)
    }
  }

  async function finish({ id, subject, text, status, error, model, version, usage }) {
    const at = nowIso()
    let savedMessage = null
    try {
      await storage.commit(
        (candidate) => {
          const dialog = ensureDialogRecord(candidate, subject)
          const message = {
            id: messageId(),
            role: 'assistant',
            text,
            at,
            requestId: id,
            contextVersion: version,
            model: normalizeModelRecord(model),
            status,
            error: error ? { code: error.code, message: error.message } : null,
            partial: status !== 'completed' && !!text,
            usage: usage || null,
          }
          dialog.messages.push(message)
          dialog.pending = null
          dialog.updatedAt = at
          savedMessage = message
        },
        { op: 'dialog.finish' },
      )
    } catch (storageError) {
      logWarn('[掌控] 回答已生成但保存失败', storageError)
      throw storageError instanceof AppError
        ? storageError
        : new AppError('STORAGE_WRITE', '回答已生成，但写入本地数据失败：' + String((storageError && storageError.message) || storageError))
    }
    return { message: savedMessage }
  }

  function dispose() {
    for (const entry of active.values()) {
      try {
        entry.controller.abort()
      } catch {
        /* ignore */
      }
    }
    active.clear()
    bySubject.clear()
  }

  return { get, stream, cancel, availability, dispose, activeRequestForSubject }
}
