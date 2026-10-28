/**
 * 应用状态：GET /state 的加载、写操作回执、view 持久化。
 *
 * 硬约束：UI 只有拿到宿主真实回执才显示成功；写失败必须带 code + 原因；
 * view.save 失败不再静默（状态条显示真实原因）。
 */

const { useState, useEffect, useRef, useCallback } = React

import { fetchState, runOp, ApiError } from '../api.js'

export const SCALES = ['domain', 'subject', 'evidence']
export const PROJECTIONS = ['theory', 'history', 'practice']
export const PERSISTED_VIEW_FIELDS = [
  'scale',
  'projection',
  'selectedNodeId',
  'selectedRelationId',
  'activeInvestigationId',
  'directoryOpen',
  'rightOpen',
]

export function toApiError(error) {
  if (error instanceof ApiError) return error
  return new ApiError(String((error && error.message) || error), 'UNKNOWN', 0)
}

/** 兼容 v1 view（selected/projection）并补默认值。 */
export function normalizeView(raw) {
  const view = raw && typeof raw === 'object' ? raw : {}
  return {
    scale: SCALES.includes(view.scale) ? view.scale : 'subject',
    projection: PROJECTIONS.includes(view.projection) ? view.projection : 'theory',
    selectedNodeId: view.selectedNodeId || (typeof view.selected === 'string' ? view.selected : null),
    selectedRelationId: view.selectedRelationId || null,
    activeInvestigationId: view.activeInvestigationId || null,
    directoryOpen: view.directoryOpen !== false,
    rightOpen: view.rightOpen !== false,
  }
}

export function pickPersistedView(view) {
  const out = {}
  for (const field of PERSISTED_VIEW_FIELDS) out[field] = view[field]
  return out
}

export function useAppState(t) {
  const [phase, setPhase] = useState('loading')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [staleError, setStaleError] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const mounted = useRef(true)
  const receiptSeq = useRef(0)
  const loadingRef = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const addReceipt = useCallback((receipt) => {
    if (!mounted.current) return null
    receiptSeq.current += 1
    const entry = Object.assign(
      { id: `receipt-${receiptSeq.current}`, at: new Date().toISOString(), kind: 'info' },
      receipt,
    )
    setReceipts((previous) => [entry, ...previous].slice(0, 40))
    return entry
  }, [])

  const clearReceipts = useCallback(() => setReceipts([]), [])

  const load = useCallback(
    async (options) => {
      const opts = options || {}
      if (loadingRef.current) return null
      loadingRef.current = true
      if (opts.showRefreshing) setRefreshing(true)
      try {
        const next = await fetchState()
        if (!mounted.current) return next
        setData(next)
        setPhase('ready')
        setError(null)
        setStaleError(null)
        return next
      } catch (rawError) {
        const apiError = toApiError(rawError)
        if (!mounted.current) return null
        setStaleError(apiError)
        setPhase((previous) => (previous === 'loading' ? 'error' : previous))
        setError(apiError)
        if (!opts.quiet) {
          addReceipt({
            kind: 'error',
            text: `${t('loop.app.loadError')}：${apiError.message}`,
            code: apiError.code,
            details: apiError.details,
          })
        }
        return null
      } finally {
        loadingRef.current = false
        if (mounted.current) setRefreshing(false)
      }
    },
    [addReceipt, t],
  )

  useEffect(() => {
    load({ quiet: true })
    // 只在挂载时读取一次；后续由写操作/手动刷新触发。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 执行写操作；成功/失败都落到真实回执。成功后静默重读 state。 */
  const perform = useCallback(
    async (opName, payload, options) => {
      const opts = options || {}
      try {
        const result = await runOp(opName, payload)
        if (opts.receipt !== false) {
          const text =
            typeof opts.successText === 'function'
              ? opts.successText(result)
              : opts.successText || t('loop.status.saveOk', { what: opts.label || opName })
          addReceipt({ kind: 'ok', text, details: result })
        }
        if (opts.reload !== false) load({ quiet: true })
        return result
      } catch (rawError) {
        const apiError = toApiError(rawError)
        if (opts.receipt !== false) {
          addReceipt({
            kind: 'error',
            text: opts.errorPrefix ? `${opts.errorPrefix}：${apiError.message}` : apiError.message,
            code: apiError.code,
            details: apiError.details,
          })
        }
        throw apiError
      }
    },
    [addReceipt, load, t],
  )

  return {
    phase,
    data,
    error,
    staleError,
    receipts,
    refreshing,
    addReceipt,
    clearReceipts,
    load,
    perform,
    ready: phase === 'ready' && !!data,
  }
}

/**
 * view 状态：先本地响应，防抖持久化到 Host；失败通过 onPersistError 可见。
 * @returns {[view, updateView]}
 */
export function useView(initialView, onPersistError) {
  const [view, setView] = useState(() => normalizeView(initialView))
  const latest = useRef(view)
  const timer = useRef(null)
  const mounted = useRef(true)
  const errorHandler = useRef(onPersistError)
  errorHandler.current = onPersistError

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const persist = useCallback((next) => {
    runOp('view.save', pickPersistedView(next)).catch((rawError) => {
      const apiError = toApiError(rawError)
      if (errorHandler.current) errorHandler.current(apiError)
    })
  }, [])

  const updateView = useCallback(
    (patch) => {
      const previous = latest.current
      const next = Object.assign({}, previous, typeof patch === 'function' ? patch(previous) : patch)
      latest.current = next
      setView(next)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        if (mounted.current) persist(latest.current)
      }, 350)
    },
    [persist],
  )

  return [view, updateView]
}

/** 写一条本地提示（不来自宿主时也明确 kind，避免 UI 假装是保存回执）。 */
export function infoReceipt(kind, text, details) {
  return { kind, text, details }
}
