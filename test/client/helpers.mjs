/**
 * 客户端测试辅助：
 * - createReactStub(): 无 DOM 的 React 桩（createElement + hooks），用于源码/产物的静态深渲染；
 * - createGlobals(): Node 中模拟 window/document；
 * - deepRender(): 递归调用函数组件，能抓出渲染期 ReferenceError / undefined 访问；
 * - makeT(): 用内置 zh fallback 的真实翻译；
 * - fakeCtx(): 按契约实现的最小 cordis ctx，用于插槽注册冒烟。
 */

import { FALLBACK_ZH, createTranslator } from '../../src/client/i18n.js'

export function createReactStub() {
  const noop = () => {}
  const context = {
    Provider: function Provider(props) {
      return props.children
    },
    Consumer: function Consumer(props) {
      return props.children
    },
  }
  const stub = {
    createElement(type, props, ...children) {
      const merged = Object.assign({}, props || {})
      if (children.length === 1) merged.children = children[0]
      else if (children.length > 1) merged.children = children
      return { type, props: merged, key: merged.key }
    },
    Fragment: Symbol('react.fragment'),
    createContext() {
      return context
    },
    useState(initial) {
      const value = typeof initial === 'function' ? initial() : initial
      return [value, noop]
    },
    useReducer(reducer, initial) {
      const value = typeof initial === 'function' ? initial() : initial
      return [value, noop]
    },
    useEffect: noop,
    useLayoutEffect: noop,
    useInsertionEffect: noop,
    useMemo(factory) {
      return factory()
    },
    useCallback(callback) {
      return callback
    },
    useRef(initial) {
      return { current: initial }
    },
    useContext() {
      return undefined
    },
    useId() {
      return 'la-test-id'
    },
    memo(component) {
      return component
    },
    forwardRef(render) {
      return function ForwardRefComponent(props) {
        return render(props, { current: null })
      }
    },
    Children: {
      map(children, fn) {
        const list = Array.isArray(children) ? children : [children]
        return list.map(fn)
      },
    },
  }
  return stub
}

export function createGlobals(options) {
  const opts = options || {}
  const listeners = new Map()
  const documentStub = {
    activeElement: null,
    addEventListener(type, listener) {
      listeners.set(type, listener)
    },
    removeEventListener(type) {
      listeners.delete(type)
    },
    querySelector() {
      return null
    },
    createElement() {
      return { style: {}, dataset: {}, setAttribute() {}, append() {}, remove() {}, appendChild() {}, click() {} }
    },
    body: { appendChild() {}, removeChild() {}, style: {}, setAttribute() {}, removeAttribute() {} },
    head: { appendChild() {} },
    documentElement: { style: {}, setAttribute() {}, removeAttribute() {}, lang: '' },
  }
  const localStorageStub = {
    store: new Map(),
    getItem(key) {
      return this.store.has(key) ? this.store.get(key) : null
    },
    setItem(key, value) {
      this.store.set(key, String(value))
    },
    removeItem(key) {
      this.store.delete(key)
    },
  }
  const windowStub = {
    innerWidth: opts.narrow ? 720 : 1440,
    innerHeight: 900,
    matchMedia(query) {
      const narrowQuery = /max-width:\s*919px/.test(query)
      return {
        matches: opts.narrow ? narrowQuery : false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      }
    },
    localStorage: localStorageStub,
    addEventListener() {},
    removeEventListener() {},
  }
  return { window: windowStub, document: documentStub, listeners }
}

/** 用内置中文 fallback 提供真实 t()。 */
export function makeT(dict) {
  return createTranslator({ zh: dict || FALLBACK_ZH, en: dict || FALLBACK_ZH })
}

const ELEMENT_LIMIT = 20000

/**
 * 递归渲染 React 元素树（不生成 DOM）。函数组件被直接调用一次；
 * 目的不是模拟状态，而是在 Node 里发现渲染期崩溃。
 */
export function deepRender(element, options) {
  const opts = options || {}
  const visited = []
  let count = 0
  const errors = []
  function walk(node, depth) {
    if (errors.length > 20) return ''
    if (depth > 80) return ''
    if (node === null || node === undefined || node === false || node === true) return ''
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) {
      let out = ''
      for (const child of node) out += walk(child, depth + 1)
      return out
    }
    if (typeof node !== 'object') return ''
    if (node.type === undefined) return ''
    count += 1
    if (count > ELEMENT_LIMIT) {
      errors.push(new Error('渲染元素超过上限，可能出现无限递归'))
      return ''
    }
    if (typeof node.type === 'function') {
      const name = node.type.name || 'Anonymous'
      visited.push(name)
      try {
        const rendered = node.type(node.props || {})
        return walk(rendered, depth + 1)
      } catch (error) {
        errors.push(
          new Error(`组件 ${name} 渲染失败：${error && error.message ? error.message : error}\n${error && error.stack ? error.stack : ''}`),
        )
        return ''
      }
    }
    if (typeof node.type === 'symbol') return walk(node.props && node.props.children, depth + 1)
    return walk(node.props && node.props.children, depth + 1)
  }
  const html = walk(element, 0)
  if (errors.length && !opts.collectErrorsOnly) {
    throw errors[0]
  }
  return { html, visited, elementCount: count, errors }
}
