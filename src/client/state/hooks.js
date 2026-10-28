/**
 * 浏览器侧基础 hooks：媒体查询、locale 变更订阅、元素尺寸、焦点陷阱、本地 id。
 */

const { useState, useEffect, useRef, useCallback, useMemo } = React

/** 订阅宿主 locale 快照变化，返回自增 tick（用于强制重渲染 t 文案）。 */
export function useLocaleRevision(locale) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!locale || typeof locale.subscribe !== 'function') return undefined
    const unsubscribe = locale.subscribe(() => setTick((value) => value + 1))
    return typeof unsubscribe === 'function' ? unsubscribe : undefined
  }, [locale])
  return tick
}

/** matchMedia 查询（SSR/无 window 时返回 false）。 */
export function useMediaQuery(query) {
  const getMatch = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    try {
      return window.matchMedia(query).matches
    } catch {
      return false
    }
  }, [query])
  const [matches, setMatches] = useState(getMatch)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    let media
    try {
      media = window.matchMedia(query)
    } catch {
      return undefined
    }
    const listener = (event) => setMatches(!!event.matches)
    setMatches(media.matches)
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
    if (typeof media.addListener === 'function') {
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
    return undefined
  }, [query])
  return matches
}

/** 观察元素尺寸；返回 [ref, size]。 */
export function useElementSize(initial) {
  const ref = useRef(null)
  const [size, setSize] = useState(initial || { width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    function measure() {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      setSize((previous) => {
        const next = { width: Math.round(rect.width), height: Math.round(rect.height) }
        return previous.width === next.width && previous.height === next.height ? previous : next
      })
    }
    measure()
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      return () => observer.disconnect()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    return undefined
  }, [])
  return [ref, size]
}

/** 本地自增 id（弹层标题/aria 关联用；不依赖 React.useId，便于冒烟测试）。 */
let localIdCounter = 0
export function nextLocalId(prefix) {
  localIdCounter += 1
  return `${prefix || 'la'}-${localIdCounter}`
}

/**
 * 让插件面板填满宿主分配的可视区域。
 *
 * 真实 Harness 的 main 容器有确定高度，CSS `height:100%` 即可；但开发期壳层
 * （以及某些宿主变体）父容器是 auto 高度，100% 不生效会让面板按内容撑高、底部
 * 状态条被裁掉。这里按「面板顶部到窗口底部」计算一次高度，作为 CSS 之外的后备，
 * 窗口尺寸变化时重算。
 * @returns {[object, number]} [根元素 ref, 应设置的高度 px]
 */
export function useFillViewportHeight() {
  const ref = useRef(null)
  const [height, setHeight] = useState(0)
  useEffect(() => {
    function measure() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return
      const element = ref.current
      if (!element) return
      const rect = element.getBoundingClientRect()
      let available = Math.max(420, Math.round(window.innerHeight - Math.max(0, rect.top)))
      // 若某个祖先明确限制了高度（真实宿主的面板容器），优先用它的可见范围，
      // 避免把高度算到宿主底部状态栏之外。
      let parent = element.parentElement
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent)
        const overflowY = style ? style.overflowY : ''
        if ((overflowY === 'hidden' || overflowY === 'auto' || overflowY === 'scroll') && parent.clientHeight > 200) {
          const parentRect = parent.getBoundingClientRect()
          const candidate = Math.round(parentRect.bottom - rect.top)
          if (candidate > 200) available = Math.min(available, candidate)
          break
        }
        parent = parent.parentElement
      }
      setHeight((previous) => (Math.abs(previous - available) <= 1 ? previous : available))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return [ref, height]
}

/** 复制到剪贴板并返回真实结果；调用方负责把结果渲染成 receipt。 */
export async function copyWithReceipt(copyText, text) {
  return copyText(text)
}

/** 按 key（通常是 subjectKey）隔离的文本草稿；切换主题不串题。 */
export function useKeyedDrafts() {
  const [drafts, setDrafts] = useState({})
  const getDraft = useCallback((key) => drafts[key] || '', [drafts])
  const setDraft = useCallback((key, text) => {
    setDrafts((previous) => (previous[key] === text ? previous : Object.assign({}, previous, { [key]: text })))
  }, [])
  const clearDraft = useCallback((key) => {
    setDrafts((previous) => {
      if (!(key in previous)) return previous
      const next = Object.assign({}, previous)
      delete next[key]
      return next
    })
  }, [])
  return { drafts, getDraft, setDraft, clearDraft }
}
