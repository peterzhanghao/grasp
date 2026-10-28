/*!
 * platform-stub.js —— 开发期假宿主平台桩（浏览器端）。
 *
 * 只实现 client.js 需要的宿主平台面：
 *   window.__ModuleLoader__.load({ id, factory(require) }) → 捕获插件、用 ReactLite 调 factory
 *   ctx.slots.register / ctx.layout.selectPanel / ctx.locale.register / bind
 *
 * 明确边界：这是 dev-server 的假宿主，不是 DeepSeek Harness 的插槽实现；
 * 页面上标注"仅开发期检查"，不得当作验收证据。
 */
;(function () {
  'use strict'
  var React = window.__REACT_LITE__
  var unknownReads = []
  var errors = []
  var registry = { slots: [], locale: {}, lang: 'zh', panel: null, plugin: null }

  window.__PLUGIN_DEV_STATE__ = registry
  window.__DEV_ERRORS__ = errors
  window.__DEV_UNKNOWNS__ = unknownReads

  function note(title, detail) {
    errors.push({ title: title, detail: String((detail && detail.stack) || detail) })
    if (window.console && console.error) console.error('[platform-stub] ' + title, detail)
  }

  function showErrorBox(title, detail) {
    var box = document.getElementById('dev-error')
    if (!box) return
    box.hidden = false
    box.textContent = title + '\n' + String((detail && detail.stack) || detail)
  }

  function queryLang() {
    try {
      var lang = new URLSearchParams(location.search).get('lang')
      return lang === 'en' ? 'en' : 'zh'
    } catch (error) {
      return 'zh'
    }
  }
  registry.lang = queryLang()

  function localeMessages(namespace) {
    var all = registry.locale[namespace]
    if (!all) return null
    return all[registry.lang] || all.zh || all.en || null
  }

  function translate(namespace, key, params) {
    var messages = localeMessages(namespace)
    var text
    if (messages && typeof messages[key] === 'string') text = messages[key]
    else if (typeof key === 'string' && key.indexOf('loop.') === 0 && messages && typeof messages[key.slice(5)] === 'string') text = messages[key.slice(5)]
    else text = key
    if (params && typeof params === 'object') {
      text = String(text).replace(/\{(\w+)\}/g, function (match, name) {
        return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
      })
    }
    return text
  }

  function makeLocaleService() {
    return {
      register: function (namespace, dictionaries) {
        registry.locale[namespace] = dictionaries || {}
        return function () {}
      },
      bind: function (namespace) {
        return function t(key, params) {
          return translate(namespace, key, params)
        }
      },
      current: function () {
        return registry.lang
      },
      subscribe: function (listener) {
        registry.localeSubscribers = registry.localeSubscribers || []
        registry.localeSubscribers.push(listener)
        return function () {
          var index = registry.localeSubscribers.indexOf(listener)
          if (index >= 0) registry.localeSubscribers.splice(index, 1)
        }
      },
      setLang: function (lang) {
        registry.lang = lang === 'en' ? 'en' : 'zh'
        var listeners = registry.localeSubscribers || []
        for (var i = 0; i < listeners.length; i += 1) {
          try {
            listeners[i](registry.lang)
          } catch (error) {
            note('locale 订阅回调失败', error)
          }
        }
        if (typeof registry.onLanguageChange === 'function') registry.onLanguageChange(registry.lang)
      },
    }
  }

  function makeLayoutService() {
    var layout = {
      selectPanel: function (panelId) {
        registry.panel = panelId
        var badge = document.getElementById('dev-panel-badge')
        if (badge) badge.textContent = '当前面板：' + panelId
        return true
      },
      closePanel: function () {
        registry.panel = null
      },
      currentPanel: function () {
        return registry.panel
      },
      appearance: function () {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      },
    }
    return layout
  }

  function makeSlotsService() {
    return {
      register: function (options, render) {
        var name = options && options.name
        registry.slots.push({ name: name, key: options && options.key, options: options })
        if (name === 'main') {
          registry.mainRender = render
          return function () {
            registry.mainRender = null
          }
        }
        if (name === 'settings.section') {
          registry.settingsRender = render
        }
        if (name === 'sidebar.footer.action') {
          registry.sidebarRender = render
        }
        return function () {}
      },
      /** 宿主插槽注入：把回调作为该插槽的扩展执行（开发期直接执行一次）。 */
      inject: function (name, callback) {
        registry.slotInjections = registry.slotInjections || []
        registry.slotInjections.push(name)
        try {
          var disposer = callback()
          return typeof disposer === 'function' ? disposer : function () {}
        } catch (error) {
          note('slots.inject(' + name + ') 失败', error)
          return function () {}
        }
      },
      get: function (name) {
        return registry.slots.filter(function (slot) {
          return slot.name === name
        })
      },
    }
  }

  /** client 插件在 apply 里用 ctx.effect(() => disposer, label) 注册清理。 */
  function makeEffectService() {
    var disposers = []
    registry.effectCount = 0
    return {
      effect: function (callback, label) {
        registry.effectCount += 1
        try {
          var disposer = callback()
          if (typeof disposer === 'function') {
            disposers.push(disposer)
            return disposer
          }
        } catch (error) {
          note('ctx.effect 失败：' + (label || ''), error)
        }
        return function () {}
      },
      disposeAll: function () {
        for (var i = disposers.length - 1; i >= 0; i -= 1) {
          try {
            disposers[i]()
          } catch (error) {
            note('effect 清理失败', error)
          }
        }
        disposers.length = 0
      },
    }
  }

  function tolerantService(name) {
    var target = { __serviceName: name }
    return new Proxy(target, {
      get: function (obj, prop) {
        if (prop in obj) return obj[prop]
        if (typeof prop === 'symbol') return undefined
        if (prop === 'then') return undefined
        unknownReads.push(name + '.' + String(prop))
        return function () {
          return undefined
        }
      },
    })
  }

  function describeSlotOptions(options) {
    try {
      return JSON.stringify(options)
    } catch (error) {
      return String(options)
    }
  }

  var ModuleLoader = {
    load: function (entry) {
      try {
        registry.entry = entry
        registry.entryId = entry && entry.id
        window.__DEV_LOADED__ = true
      } catch (error) {
        note('ModuleLoader.load 失败', error)
      }
    },
  }
  window.__ModuleLoader__ = ModuleLoader

  function renderHostChrome() {
    var chrome = document.getElementById('dev-registrations')
    if (!chrome) return
    var items = []
    for (var i = 0; i < registry.slots.length; i += 1) {
      var slot = registry.slots[i]
      items.push(slot.name + (slot.options && slot.options.key ? ' · ' + slot.options.key : ''))
    }
    chrome.textContent = items.length ? '已注册槽位：' + items.join('；') : '没有捕获到槽位注册'
  }

  function start() {
    if (!registry.entry) {
      showErrorBox('client.js 没有调用 window.__ModuleLoader__.load()', '检查 client.js 是否已构建并且脚本加载成功')
      return
    }
    var React2
    try {
      React2 = registry.entry.factory(function require(name) {
        if (name === 'react') return React
        throw new Error('[platform-stub] 不允许 require(' + JSON.stringify(name) + ')：契约只允许 react')
      })
    } catch (error) {
      note('factory 执行失败', error)
      showErrorBox('client.js factory 执行失败', error)
      return
    }
    if (!React2 || typeof React2.apply !== 'function') {
      showErrorBox('插件对象不合法', 'client.js factory 必须返回 { inject, apply(ctx) }')
      return
    }
    registry.plugin = React2
    var effectService = makeEffectService()
    registry.effectService = effectService
    var ctx = {
      effect: effectService.effect,
      slots: makeSlotsService(),
      layout: makeLayoutService(),
      locale: makeLocaleService(),
      logger: function (scope) {
        var log = function () {
          if (window.console && console.log) console.log.apply(console, ['[client:' + scope + ']'].concat(Array.prototype.slice.call(arguments)))
        }
        log.debug = log
        log.info = log
        log.warn = function () {
          if (window.console && console.warn) console.warn.apply(console, ['[client:' + scope + ']'].concat(Array.prototype.slice.call(arguments)))
        }
        log.error = log.warn
        return log
      },
      theme: tolerantService('theme'),
    }
    try {
      if (Array.isArray(React2.inject)) {
        for (var i = 0; i < React2.inject.length; i += 1) {
          if (!ctx[React2.inject[i]]) note('插件声明需要的服务缺失：' + React2.inject[i], '')
        }
      }
      React2.apply(ctx)
    } catch (error) {
      note('plugin.apply 失败', error)
      showErrorBox('插件 apply 失败', error)
      return
    }
    renderHostChrome()
    if (!registry.mainRender) {
      showErrorBox('没有注册 main 槽位', '契约要求 ctx.slots.register({ name:"main", key:"loop-atlas" }, ...)')
      return
    }
    var container = document.getElementById('root')
    try {
      React.mount(React.createElement(registry.mainRender, { host: 'dev-server' }), container)
    } catch (error) {
      note('main 槽位渲染失败', error)
      showErrorBox('主视图渲染失败', error)
    }
  }

  window.__BOOT__ = { start: start, state: registry, React: React }
})()
