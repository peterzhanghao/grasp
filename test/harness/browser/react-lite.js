/*!
 * react-lite.js —— 开发期检查专用的最小 React 兼容运行时（浏览器端）。
 *
 * 用途：test/harness/dev-server.mjs 在真实 Chromium 里加载 client.js，
 * 提供 createElement / hooks / 一个最小 DOM 渲染器，使布局截图与键盘遍历可做。
 *
 * 明确边界：
 * - 这不是 React，也不是 react-dom；不支持并发渲染、合成事件细节、受控输入完整语义、
 *   Portals、Suspense、Transition 等；
 * - 状态更新采用"从根重渲染 + 重建 DOM"，只保留 hook 状态、ref 对象、effect 依赖与焦点位置；
 * - 因此本文件产生的任何"视觉通过"只属于"假宿主 + 真实浏览器布局检查"，
 *   不能替代真实 DeepSeek Harness 里的视觉验收（见 docs/acceptance.md）。
 *
 * 支持的 React API：createElement / Fragment / StrictMode（透明）/ memo / forwardRef /
 * createContext / useContext / useState / useReducer / useRef / useMemo / useCallback /
 * useEffect / useLayoutEffect / useId / Children.map|toArray|forEach / isValidElement / version。
 */
;(function () {
  'use strict'

  var ELEMENT = Symbol.for('react.element')
  var FRAGMENT = Symbol.for('react.fragment')
  var UNITLESS = {
    animationIterationCount: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    columns: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowSpan: true,
    gridRowStart: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnSpan: true,
    gridColumnStart: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true,
  }
  var SVG_TAGS = {
    svg: true,
    g: true,
    path: true,
    circle: true,
    ellipse: true,
    line: true,
    polyline: true,
    polygon: true,
    rect: true,
    text: true,
    tspan: true,
    defs: true,
    marker: true,
    mask: true,
    pattern: true,
    clipPath: true,
    linearGradient: true,
    radialGradient: true,
    stop: true,
    use: true,
  }

  var currentRender = null
  var currentContextStack = []
  var currentOwner = null
  var idCounter = 0

  /* ─────────────────────────── element ─────────────────────────── */

  function createElement(type, config) {
    var props = {}
    var key = null
    var ref = null
    if (config) {
      for (var name in config) {
        if (!Object.prototype.hasOwnProperty.call(config, name)) continue
        if (name === 'key') key = config[name] === undefined ? null : '' + config[name]
        else if (name === 'ref') ref = config[name]
        else props[name] = config[name]
      }
    }
    var children = Array.prototype.slice.call(arguments, 2)
    if (children.length === 1) props.children = children[0]
    else if (children.length > 1) props.children = children
    if (ref !== null) props.ref = ref
    return { $$typeof: ELEMENT, type: type, props: props, key: key, _owner: currentOwner }
  }

  function isValidElement(value) {
    return !!(value && value.$$typeof === ELEMENT)
  }

  function Fragment(props) {
    return props.children
  }

  function StrictMode(props) {
    return props.children
  }

  function memo(component) {
    return component
  }

  function forwardRef(render) {
    function Forwarded(props) {
      return render(props, props.ref)
    }
    Forwarded.displayName = 'ForwardRef'
    return Forwarded
  }

  function createContext(defaultValue) {
    var context = { _defaultValue: defaultValue, _currentValue: defaultValue, Provider: null, Consumer: null }
    context.Provider = function Provider(props) {
      currentContextStack.push({ context: context, value: props.value })
      try {
        return props.children
      } finally {
        currentContextStack.pop()
      }
    }
    context.Consumer = function Consumer(props) {
      var value = readContext(context)
      return typeof props.children === 'function' ? props.children(value) : props.children
    }
    return context
  }

  function readContext(context) {
    for (var i = currentContextStack.length - 1; i >= 0; i -= 1) {
      if (currentContextStack[i].context === context) return currentContextStack[i].value
    }
    return context._defaultValue
  }

  function useContext(context) {
    return readContext(context)
  }

  /* ─────────────────────────── hooks ─────────────────────────── */

  function requireRender(hookName) {
    if (!currentRender) throw new Error('[react-lite] ' + hookName + ' 只能在函数组件渲染期间调用')
    return currentRender
  }

  function getHook(ctx, initialValue) {
    var index = ctx.hookIndex++
    var hook = ctx.hookArray[index]
    if (!hook) {
      hook = { index: index, value: typeof initialValue === 'function' ? initialValue() : initialValue, deps: undefined, cleanup: null }
      ctx.hookArray[index] = hook
    }
    return hook
  }

  function useState(initial) {
    var ctx = requireRender('useState')
    var hook = getHook(ctx, initial)
    if (!hook.setState) {
      hook.setState = function setState(next) {
        var value = typeof next === 'function' ? next(hook.value) : next
        if (Object.is(value, hook.value)) return
        hook.value = value
        scheduleRender(ctx.root)
      }
    }
    return [hook.value, hook.setState]
  }

  function useReducer(reducer, initialArg, init) {
    var ctx = requireRender('useReducer')
    var initialState = typeof init === 'function' ? init(initialArg) : initialArg
    var hook = getHook(ctx, initialState)
    if (!hook.dispatch) {
      hook.dispatch = function dispatch(action) {
        var next = reducer(hook.value, action)
        if (Object.is(next, hook.value)) return
        hook.value = next
        scheduleRender(ctx.root)
      }
    }
    return [hook.value, hook.dispatch]
  }

  function useRef(initial) {
    var ctx = requireRender('useRef')
    var hook = getHook(ctx, { current: initial })
    return hook.value
  }

  function depsEqual(a, b) {
    if (a === b) return true
    if (!a || !b || a.length !== b.length) return false
    for (var i = 0; i < a.length; i += 1) if (!Object.is(a[i], b[i])) return false
    return true
  }

  function useMemo(factory, deps) {
    var ctx = requireRender('useMemo')
    var hook = getHook(ctx, undefined)
    var changed = hook.deps === undefined && deps !== undefined ? true : !depsEqual(hook.deps, deps)
    if (changed || hook.deps === undefined) {
      hook.value = factory()
      hook.deps = deps ? deps.slice() : undefined
    }
    return hook.value
  }

  function useCallback(callback, deps) {
    return useMemo(function () {
      return callback
    }, deps)
  }

  function useEffectImpl(fn, deps) {
    var ctx = requireRender('useEffect')
    var hook = getHook(ctx, undefined)
    ctx.pendingEffects.push({ hook: hook, fn: fn, deps: deps ? deps.slice() : undefined, changed: !depsEqual(hook.deps, deps) })
    hook.deps = deps ? deps.slice() : undefined
  }

  function useEffect(fn, deps) {
    useEffectImpl(fn, deps)
  }

  function useLayoutEffect(fn, deps) {
    useEffectImpl(fn, deps)
  }

  function useId() {
    requireRender('useId')
    idCounter += 1
    return ':rl' + idCounter + ':'
  }

  var Children = {
    map: function (children, fn) {
      if (children === null || children === undefined || children === false) return children
      var list = Array.isArray(children) ? children : [children]
      return list.map(function (child, index) {
        return fn(child, index)
      })
    },
    forEach: function (children, fn) {
      var list = Array.isArray(children) ? children : [children]
      list.forEach(function (child, index) {
        if (child !== null && child !== undefined && child !== false) fn(child, index)
      })
    },
    toArray: function (children) {
      if (children === null || children === undefined || children === false) return []
      return Array.isArray(children) ? children.slice() : [children]
    },
    count: function (children) {
      if (children === null || children === undefined || children === false) return 0
      return Array.isArray(children) ? children.length : 1
    },
    only: function (children) {
      return children
    },
  }

  var React = {
    version: '19.3.1-react-lite',
    createElement: createElement,
    cloneElement: function (element, config) {
      var children = Array.prototype.slice.call(arguments, 2)
      return createElement.apply(null, [element.type, Object.assign({}, element.props, config, { key: element.key })].concat(children))
    },
    isValidElement: isValidElement,
    createContext: createContext,
    useContext: useContext,
    Fragment: FRAGMENT,
    StrictMode: StrictMode,
    memo: memo,
    forwardRef: forwardRef,
    useState: useState,
    useReducer: useReducer,
    useRef: useRef,
    useMemo: useMemo,
    useCallback: useCallback,
    useEffect: useEffect,
    useLayoutEffect: useLayoutEffect,
    useId: useId,
    Children: Children,
  }
  React.__createElement = createElement
  React.__FRAGMENT = FRAGMENT

  /* ─────────────────────────── 渲染器 ─────────────────────────── */

  var roots = new WeakMap()

  function componentName(type) {
    return type && (type.displayName || type.name) ? type.displayName || type.name : 'Anonymous'
  }

  function scheduleRender(root) {
    if (root.scheduled) return
    root.scheduled = true
    Promise.resolve().then(function () {
      root.scheduled = false
      if (root.unmounted) return
      renderRoot(root)
    })
  }

  function renderRoot(root) {
    if (root.unmounted) return
    root.renderedPaths = []
    root.pendingEffects = []
    var previousActive = document.activeElement
    var activePath = previousActive && previousActive.getAttribute ? previousActive.getAttribute('data-rl-path') : null
    var selectionStart = null
    var selectionEnd = null
    try {
      if (previousActive && typeof previousActive.selectionStart === 'number') {
        selectionStart = previousActive.selectionStart
        selectionEnd = previousActive.selectionEnd
      }
    } catch (error) {
      selectionStart = null
    }

    var env = { root: root, path: 'root', index: 0, parentDom: null, inSvg: false }
    var tree
    currentOwner = null
    try {
      tree = renderNode(root.element, env)
    } catch (error) {
      reportError(root, error)
      return
    }
    var container = root.container
    while (container.firstChild) container.removeChild(container.firstChild)
    if (tree) container.appendChild(tree)

    flushEffects(root)

    if (activePath) {
      var restored = container.querySelector('[data-rl-path="' + cssEscape(activePath) + '"]')
      if (restored && typeof restored.focus === 'function') {
        try {
          restored.focus({ preventScroll: true })
          if (selectionStart !== null && typeof restored.setSelectionRange === 'function') {
            restored.setSelectionRange(selectionStart, selectionEnd)
          }
        } catch (error) {
          /* 焦点恢复失败不阻断渲染 */
        }
      }
    }
    root.lastRenderedPaths = root.renderedPaths
    root.renderedPaths = null
  }

  function reportError(root, error) {
    root.errors.push(error)
    // 把错误渲染成页面可见文本，便于浏览器检查时发现
    var container = root.container
    var box = document.createElement('pre')
    box.className = 'rl-error'
    box.setAttribute('role', 'alert')
    box.textContent = '[react-lite] 渲染失败：' + (error && error.stack ? error.stack : String(error))
    while (container.firstChild) container.removeChild(container.firstChild)
    container.appendChild(box)
    if (window.console && console.error) console.error('[react-lite]', error)
    if (window.__REACT_LITE_ERRORS__) window.__REACT_LITE_ERRORS__.push(String((error && error.stack) || error))
  }

  function pathFor(vnode, env) {
    var type = typeof vnode.type === 'function' ? componentName(vnode.type) : String(vnode.type)
    var key = vnode.key === null || vnode.key === undefined ? env.index : vnode.key
    return env.path + '/' + type + ':' + key
  }

  function renderNode(vnode, env) {
    if (vnode === null || vnode === undefined || vnode === false || vnode === true) return null
    if (typeof vnode === 'string' || typeof vnode === 'number') return document.createTextNode(String(vnode))
    if (Array.isArray(vnode)) {
      var fragment = document.createDocumentFragment()
      for (var i = 0; i < vnode.length; i += 1) {
        var child = renderNode(vnode[i], { root: env.root, path: env.path, index: i, parentDom: env.parentDom, inSvg: env.inSvg })
        if (child) fragment.appendChild(child)
      }
      return fragment
    }
    if (!vnode || !vnode.$$typeof) {
      // 允许直接返回 DOM 节点（极少见）
      if (vnode instanceof Node) return vnode
      return null
    }
    if (vnode.type === FRAGMENT) {
      return renderNode(vnode.props.children, { root: env.root, path: env.path + '/frag', index: 0, parentDom: env.parentDom, inSvg: env.inSvg })
    }
    if (typeof vnode.type === 'function') return renderComponent(vnode, env)
    return renderHost(vnode, env)
  }

  function renderComponent(vnode, env) {
    var path = pathFor(vnode, env)
    var root = env.root
    root.renderedPaths.push(path)
    var hookArray = root.hookStore.get(path)
    if (!hookArray) {
      hookArray = []
      root.hookStore.set(path, hookArray)
    }
    var ctx = {
      root: root,
      path: path,
      hookArray: hookArray,
      hookIndex: 0,
      pendingEffects: [],
      depth: env.depth || 0,
    }
    var previousRender = currentRender
    var previousOwner = currentOwner
    currentRender = ctx
    currentOwner = vnode
    var output
    try {
      output = vnode.type(vnode.props)
    } finally {
      currentRender = previousRender
      currentOwner = previousOwner
    }
    root.pendingEffects.push(ctx)
    var childEnv = {
      root: root,
      path: path,
      index: 0,
      parentDom: null,
      inSvg: env.inSvg,
      depth: (env.depth || 0) + 1,
    }
    return renderNode(output, childEnv)
  }

  function renderHost(vnode, env) {
    var type = vnode.type
    var props = vnode.props || {}
    var inSvg = env.inSvg || !!SVG_TAGS[type]
    var dom = inSvg ? document.createElementNS('http://www.w3.org/2000/svg', type) : document.createElement(type)
    dom.setAttribute('data-rl-path', pathFor(vnode, env))
    applyProps(dom, props, inSvg)
    var children = props.children
    if (props.dangerouslySetInnerHTML && props.dangerouslySetInnerHTML.__html != null) {
      dom.innerHTML = String(props.dangerouslySetInnerHTML.__html)
    } else if (children !== undefined && children !== null && children !== false) {
      var childEnv = { root: env.root, path: pathFor(vnode, env), index: 0, parentDom: dom, inSvg: inSvg }
      var rendered = renderNode(children, childEnv)
      if (rendered) dom.appendChild(rendered)
    }
    if (props.ref) setRef(props.ref, dom)
    return dom
  }

  function setRef(ref, dom) {
    try {
      if (typeof ref === 'function') ref(dom)
      else if (ref && typeof ref === 'object') ref.current = dom
    } catch (error) {
      if (window.console && console.warn) console.warn('[react-lite] ref 失败', error)
    }
  }

  var EVENT_NAMES = {
    doubleclick: 'dblclick',
    mouseenter: 'mouseenter',
    mouseleave: 'mouseleave',
  }

  function eventNameFromProp(propName) {
    var name = propName.slice(2).toLowerCase()
    if (name === 'change') return 'change'
    if (name === 'input') return 'input'
    return EVENT_NAMES[name] || name
  }

  function applyProps(dom, props, inSvg) {
    for (var name in props) {
      if (!Object.prototype.hasOwnProperty.call(props, name)) continue
      if (name === 'children' || name === 'ref' || name === 'key' || name === 'dangerouslySetInnerHTML') continue
      var value = props[name]
      if (name === 'style') {
        applyStyle(dom, value)
        continue
      }
      if (name === 'className' || name === 'class') {
        if (value === null || value === undefined || value === false) dom.removeAttribute('class')
        else dom.setAttribute('class', String(value))
        continue
      }
      if (name === 'htmlFor') {
        dom.setAttribute('for', String(value))
        continue
      }
      if (name.length > 2 && name.slice(0, 2) === 'on' && typeof value === 'function') {
        var event = eventNameFromProp(name)
        dom.addEventListener(event, value)
        // React 的 onChange 在输入控件上等价于 input 事件
        if (name === 'onChange' && (dom.tagName === 'INPUT' || dom.tagName === 'TEXTAREA' || dom.tagName === 'SELECT')) {
          dom.addEventListener('input', value)
        }
        continue
      }
      if (name === 'value') {
        if (dom.tagName === 'TEXTAREA') dom.value = value == null ? '' : String(value)
        else if (dom.tagName === 'SELECT') dom.value = value == null ? '' : String(value)
        else if (dom.tagName === 'INPUT') dom.value = value == null ? '' : String(value)
        else dom.setAttribute('value', String(value))
        continue
      }
      if (name === 'checked' || name === 'selected' || name === 'disabled' || name === 'readOnly' || name === 'multiple' || name === 'required' || name === 'open') {
        dom[name] = !!value
        continue
      }
      if (name === 'tabIndex') {
        dom.setAttribute('tabindex', String(value))
        continue
      }
      if (name === 'colSpan' || name === 'rowSpan' || name === 'maxLength' || name === 'minLength' || name === 'contentEditable' || name === 'spellCheck') {
        dom.setAttribute(name.toLowerCase(), String(value))
        continue
      }
      if (name === 'srcSet') {
        dom.setAttribute('srcset', String(value))
        continue
      }
      if (value === null || value === undefined || value === false) {
        if (inSvg || name.indexOf('-') >= 0) dom.removeAttribute(name)
        else if (name in dom) dom[name] = ''
        continue
      }
      if (typeof value === 'object') {
        // 允许 data-* 之外的 object 属性（例如 aria 对象很少见）
        dom.setAttribute(name, JSON.stringify(value))
        continue
      }
      if (inSvg) {
        dom.setAttribute(svgAttrName(name), String(value))
        continue
      }
      if (name === 'role' || name.indexOf('aria-') === 0 || name.indexOf('data-') === 0) {
        dom.setAttribute(name, String(value))
        continue
      }
      if (name in dom) {
        try {
          dom[name] = value
        } catch (error) {
          dom.setAttribute(name, String(value))
        }
      } else {
        dom.setAttribute(name, typeof value === 'boolean' ? '' : String(value))
      }
    }
  }

  function svgAttrName(name) {
    if (name === 'viewBox' || name === 'preserveAspectRatio') return name
    return name.replace(/[A-Z]/g, function (letter) {
      return '-' + letter.toLowerCase()
    })
  }

  function applyStyle(dom, style) {
    if (!style) return
    if (typeof style === 'string') {
      dom.setAttribute('style', style)
      return
    }
    for (var name in style) {
      if (!Object.prototype.hasOwnProperty.call(style, name)) continue
      var value = style[name]
      if (value === null || value === undefined) continue
      var cssName = name.indexOf('--') === 0 ? name : name.replace(/[A-Z]/g, function (letter) {
        return '-' + letter.toLowerCase()
      })
      var cssValue = typeof value === 'number' && !UNITLESS[name] ? value + 'px' : String(value)
      dom.style.setProperty(cssName, cssValue)
    }
  }

  function flushEffects(root) {
    var renderedSet = new Set(root.renderedPaths || [])
    var previous = root.lastRenderedPaths || []
    for (var i = 0; i < previous.length; i += 1) {
      var path = previous[i]
      if (renderedSet.has(path)) continue
      var hooks = root.hookStore.get(path)
      if (hooks) runCleanups(hooks)
    }
    var queue = root.pendingEffects || []
    for (var q = 0; q < queue.length; q += 1) {
      var ctx = queue[q]
      for (var e = 0; e < ctx.pendingEffects.length; e += 1) {
        var entry = ctx.pendingEffects[e]
        if (!entry.changed) continue
        if (entry.hook.cleanup) {
          try {
            entry.hook.cleanup()
          } catch (error) {
            reportEffectError(root, error)
          }
          entry.hook.cleanup = null
        }
        try {
          var cleanup = entry.fn()
          entry.hook.cleanup = typeof cleanup === 'function' ? cleanup : null
        } catch (error) {
          reportEffectError(root, error)
        }
      }
    }
  }

  function runCleanups(hooks) {
    for (var i = 0; i < hooks.length; i += 1) {
      var hook = hooks[i]
      if (hook && hook.cleanup) {
        try {
          hook.cleanup()
        } catch (error) {
          if (window.console && console.warn) console.warn('[react-lite] effect 清理失败', error)
        }
        hook.cleanup = null
      }
    }
  }

  function reportEffectError(root, error) {
    if (window.console && console.error) console.error('[react-lite] effect 执行失败', error)
    if (window.__REACT_LITE_ERRORS__) window.__REACT_LITE_ERRORS__.push(String((error && error.stack) || error))
    if (root) root.errors.push(error)
  }

  function mount(element, container) {
    if (!container) throw new Error('[react-lite] mount 需要容器节点')
    var existing = roots.get(container)
    if (existing) {
      existing.element = element
      renderRoot(existing)
      return existing
    }
    var root = {
      container: container,
      element: element,
      hookStore: new Map(),
      scheduled: false,
      unmounted: false,
      pendingEffects: [],
      lastRenderedPaths: [],
      renderedPaths: [],
      errors: [],
    }
    roots.set(container, root)
    renderRoot(root)
    return root
  }

  function unmount(container) {
    var root = roots.get(container)
    if (!root) return
    root.unmounted = true
    roots.delete(container)
    var previous = root.lastRenderedPaths || []
    for (var i = 0; i < previous.length; i += 1) {
      var hooks = root.hookStore.get(previous[i])
      if (hooks) runCleanups(hooks)
    }
    while (container.firstChild) container.removeChild(container.firstChild)
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value)
    return String(value).replace(/["\\]/g, '\\$&')
  }

  React.mount = mount
  React.unmount = unmount

  window.__REACT_LITE_ERRORS__ = []
  window.__REACT_LITE__ = React
  window.ReactLite = React
})()
