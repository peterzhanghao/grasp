/**
 * 假宿主 harness —— 按 docs/refactor-spec.md 第 0/4 节实现 Cordis 插件运行环境。
 *
 * 能力：
 * - FakeContext：effect / inject（可选服务注入）/ webServer.register / tools.register /
 *   agentDefaultModel.currentSelection / llm.stream / logger / setTimeout / setInterval / on / get。
 * - 真实 node:http 服务：按 kind:'exact'|'prefix' 把请求分发给插件注册的 handler，
 *   测试请求真的走 HTTP，因此可以测 NDJSON 流、客户端断开、并发与慢流。
 * - startPlugin()：从 index.js apply(ctx, config) 启动插件；数据目录强制临时目录。
 * - host.op()/host.get()/host.openDialogStream()/host.callTool()/host.dispose()。
 *
 * 只在 test/** 与 tools/qa/** 使用；不是产品代码。
 */
import http from 'node:http'
import { EventEmitter } from 'node:events'
import { mkdtemp, rm, readFile, mkdir, stat, writeFile, chmod, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createLlmFixture, DEFAULT_SELECTION } from './llm-fixture.mjs'

export const HARNESS_DIR = dirname(fileURLToPath(import.meta.url))
export const PLUGIN_ROOT = resolve(HARNESS_DIR, '..', '..')
export const REAL_DATA_DIR = resolve('D:/plug-in/loop-atlas-data')

let hostSeq = 0

export function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

export async function waitFor(predicate, { timeoutMs = 5000, intervalMs = 20, label = '条件' } = {}) {
  const started = Date.now()
  let lastError = null
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await predicate()
      if (value) return value
    } catch (error) {
      lastError = error
    }
    await delay(intervalMs)
  }
  throw new Error(`等待${label}超时（${timeoutMs}ms）` + (lastError ? `：${lastError.message}` : ''))
}

/** 每个 host 一个临时数据目录；绝不落在真实用户数据目录。 */
export async function makeTempDataDir(label = 'loop-atlas-qa') {
  const path = await mkdtemp(join(tmpdir(), label + '-'))
  if (isInsideRealData(path)) {
    throw new Error('拒绝使用真实用户数据目录：' + path)
  }
  return path
}

function isInsideRealData(path) {
  const normalized = resolve(String(path)).toLowerCase()
  const real = REAL_DATA_DIR.toLowerCase()
  return normalized === real || normalized.startsWith(real + '\\') || normalized.startsWith(real + '/')
}

function assertSafeDataDir(path) {
  if (!isAbsolute(path)) throw new Error('dataDir 必须是绝对路径：' + path)
  if (isInsideRealData(path)) throw new Error('测试拒绝写入真实用户数据目录：' + path)
}

export async function removeTempDir(path) {
  if (!path) return
  if (isInsideRealData(path)) throw new Error('拒绝删除真实用户数据目录：' + path)
  await rm(path, { recursive: true, force: true }).catch(() => {})
}

export async function readStateFile(dataDir) {
  return JSON.parse(await readFile(join(dataDir, 'state.json'), 'utf8'))
}

export async function writeStateFile(dataDir, state) {
  await mkdir(dataDir, { recursive: true })
  const path = join(dataDir, 'state.json')
  const tmp = path + '.' + Date.now().toString(36) + '.qa-tmp'
  await writeFile(tmp, JSON.stringify(state, null, 2), 'utf8')
  const { rename } = await import('node:fs/promises')
  await rename(tmp, path)
  return path
}

/** 制造"写盘失败"：把 state.json 换成同名目录，rename 会失败；恢复时删掉目录即可。 */
export async function breakStateWrite(dataDir) {
  const path = join(dataDir, 'state.json')
  await rm(path, { force: true }).catch(() => {})
  await mkdir(path, { recursive: true })
  return path
}

export async function fixStateWrite(dataDir) {
  const path = join(dataDir, 'state.json')
  await rm(path, { recursive: true, force: true })
  return path
}

/**
 * 让 state.json 变成只读文件：Windows 上 rename 覆盖只读目标会 EPERM，
 * 因此可以在"旧磁盘内容完全保留"的前提下注入写失败；恢复写权限后下一次写应成功。
 */
export async function setStateFileReadOnly(dataDir, readOnly = true) {
  const path = join(dataDir, 'state.json')
  await chmod(path, readOnly ? 0o444 : 0o666)
  return path
}

export async function listDataDir(dataDir) {
  return readdir(dataDir).catch(() => [])
}

/* ─────────────────────────── 日志 ─────────────────────────── */

function makeLoggerFactory(logs) {
  const emit = (level, args) => {
    const message = args
      .map((arg) => {
        if (arg instanceof Error) return arg.stack || arg.message
        if (typeof arg === 'string') return arg
        try {
          return JSON.stringify(arg)
        } catch {
          return String(arg)
        }
      })
      .join(' ')
    logs.push({ level, message, at: new Date().toISOString() })
  }
  const make = (scope) => {
    const logger = (...args) => emit('info', args)
    for (const level of ['debug', 'info', 'warn', 'error']) {
      logger[level] = (...args) => emit(level, args)
    }
    logger.scope = scope
    return logger
  }
  return make
}

function safeCall(fn, onError) {
  try {
    return fn()
  } catch (error) {
    onError?.(error)
    return undefined
  }
}

/* ─────────────────────────── FakeContext ─────────────────────────── */

export class FakeContext {
  constructor({ host, services = {}, parent = null, depth = 0 } = {}) {
    this.host = host
    this.parent = parent
    this.depth = depth
    this.services = services instanceof Map ? new Map(services) : new Map(Object.entries(services))
    this.disposers = []
    this.children = []
    this.disposed = false
    this.logger = host.loggerFactory(this.host.__scopeName || 'loop-atlas')
    this.webServer = this.services.get('webServer')
    this.tools = this.services.get('tools')
    this.llm = this.services.get('llm')
    this.agentDefaultModel = this.services.get('agentDefaultModel')
    this._emitter = new EventEmitter()
  }

  get(serviceName) {
    return this.services.get(serviceName)
  }

  provide(serviceName, value) {
    this.services.set(serviceName, value)
    return () => this.services.delete(serviceName)
  }

  effect(callback) {
    if (this.disposed) throw new Error('[harness] ctx 已释放，不能再注册 effect')
    const scope = { disposed: false, disposers: [], owner: this }
    this.host.__effects.push(scope)
    const runCleanup = () => {
      for (const disposer of scope.disposers.splice(0).reverse()) {
        safeCall(disposer, (error) => this.host.__recordCleanupError(error))
      }
    }
    let result
    try {
      result = callback()
    } catch (error) {
      this.host.__recordError(error)
      runCleanup()
      throw error
    }
    if (typeof result === 'function') {
      scope.disposers.push(result)
    } else if (result && typeof result.then === 'function') {
      // async effect：等 Promise 结束后再登记其清理函数；释放时若未结束则立刻清理。
      result.then(
        (disposer) => {
          if (typeof disposer !== 'function') return
          if (scope.disposed || this.disposed) safeCall(disposer, (error) => this.host.__recordCleanupError(error))
          else scope.disposers.push(disposer)
        },
        (error) => this.host.__recordCleanupError(error),
      )
    }
    return () => {
      if (scope.disposed) return
      scope.disposed = true
      runCleanup()
    }
  }

  inject(dependencies, callback) {
    if (this.disposed) throw new Error('[harness] ctx 已释放，不能再 inject')
    const deps = Array.isArray(dependencies) ? dependencies : [dependencies]
    const child = new FakeContext({ host: this.host, services: this.services, parent: this, depth: this.depth + 1 })
    this.children.push(child)
    const disposeChild = () => child.dispose()
    const missing = deps.filter((name) => this.services.get(name) === undefined)
    if (missing.length) {
      // Cordis 的可选注入语义：服务缺失时回调不执行，插件本体仍可用。
      this.host.__recordInjectionSkipped(deps, missing)
      return disposeChild
    }
    try {
      const result = callback(child)
      if (result && typeof result.then === 'function') {
        result.catch((error) => this.host.__recordError(error))
      }
    } catch (error) {
      this.host.__recordError(error)
    }
    return disposeChild
  }

  on(event, listener) {
    this._emitter.on(event, listener)
    return () => this._emitter.off(event, listener)
  }

  off(event, listener) {
    this._emitter.off(event, listener)
  }

  emit(event, ...args) {
    this._emitter.emit(event, ...args)
  }

  setTimeout(callback, ms, ...args) {
    const handle = setTimeout(() => {
      if (!this.disposed) callback(...args)
    }, ms)
    this.host.__timers.add(handle)
    return () => clearTimeout(handle)
  }

  setInterval(callback, ms, ...args) {
    const handle = setInterval(() => {
      if (!this.disposed) callback(...args)
    }, ms)
    this.host.__timers.add(handle)
    return () => clearInterval(handle)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const child of this.children.splice(0).reverse()) child.dispose()
    for (const scope of this.host.__effectsFor(this)) {
      // 只清理属于当前 ctx 的 effect；父 ctx 释放时统一处理其余 scope。
      if (scope.owner !== this) continue
      if (scope.disposed) continue
      scope.disposed = true
      for (const disposer of scope.disposers.splice(0).reverse()) {
        safeCall(disposer, (error) => this.host.__recordCleanupError(error))
      }
    }
  }
}

/* ─────────────────────────── FakeHost ─────────────────────────── */

export class FakeHost {
  constructor({ root = PLUGIN_ROOT, entry = 'index.js', dataDir, config = {}, services = {}, llm, selection, logger } = {}) {
    this.root = resolve(root)
    this.indexFile = join(this.root, entry)
    this.dataDir = dataDir
    this.config = config
    this.logs = []
    this.errors = []
    this.cleanupErrors = []
    this.injectionSkips = []
    this.__effects = []
    this.__timers = new Set()
    this.__scopeName = 'loop-atlas'
    this.loggerFactory = makeLoggerFactory(this.logs)
    this.routeList = []
    this.toolMap = new Map()
    this.server = null
    this.port = 0
    this.baseUrl = null
    this.disposed = false
    this.pluginNamespace = ++hostSeq
    this.dialogStreams = []
    this.logger = logger || null

    this.llm = llm || createLlmFixture()
    this.selection = selection === undefined ? { ...DEFAULT_SELECTION } : selection

    const defaults = {
      webServer: true,
      tools: true,
      llm: true,
      agentDefaultModel: true,
    }
    const flags = { ...defaults, ...(services || {}) }
    const builtServices = {}
    if (flags.webServer) {
      builtServices.webServer = {
        register: (route) => this.registerRoute(route),
        get: (path) => this.routeList.find((entry) => entry.path === path) || null,
      }
    }
    if (flags.tools) {
      builtServices.tools = {
        register: (definition) => this.registerTool(definition),
      }
    }
    if (flags.llm) builtServices.llm = this.llm
    if (flags.agentDefaultModel) {
      builtServices.agentDefaultModel = {
        currentSelection: () => {
          if (typeof this.selection === 'function') return this.selection()
          return this.selection
        },
      }
    }
    for (const [name, value] of Object.entries(flags)) {
      if (value && typeof value === 'object' && value !== true) builtServices[name] = value
    }
    this.serviceFlags = flags
    this.ctx = new FakeContext({ host: this, services: builtServices })
    this.pluginExports = null
  }

  /* —— 注册面 —— */

  registerRoute(route) {
    if (!route || typeof route.path !== 'string' || typeof route.handler !== 'function') {
      throw new TypeError('[harness] webServer.register 需要 { path, handler }')
    }
    const kind = route.kind === 'exact' ? 'exact' : 'prefix'
    const entry = { kind, path: route.path, handler: route.handler, seq: ++hostSeq }
    this.routeList.push(entry)
    return () => {
      const index = this.routeList.indexOf(entry)
      if (index >= 0) this.routeList.splice(index, 1)
    }
  }

  registerTool(definition) {
    if (!definition || typeof definition.name !== 'string' || typeof definition.execute !== 'function') {
      throw new TypeError('[harness] tools.register 需要 { name, execute }')
    }
    const entry = { definition }
    this.toolMap.set(definition.name, entry)
    return () => {
      if (this.toolMap.get(definition.name) === entry) this.toolMap.delete(definition.name)
    }
  }

  listTools() {
    return [...this.toolMap.keys()]
  }

  tool(pluginToolName) {
    return this.toolMap.get(pluginToolName)?.definition || null
  }

  async callTool(pluginToolName, args) {
    const definition = this.tool(pluginToolName)
    if (!definition) throw new Error('没有注册工具：' + pluginToolName)
    return definition.execute(args)
  }

  /* —— 内部记录 —— */

  __recordError(error) {
    this.errors.push({ at: new Date().toISOString(), message: String((error && error.stack) || error) })
  }

  __recordCleanupError(error) {
    this.cleanupErrors.push({ at: new Date().toISOString(), message: String((error && error.message) || error) })
  }

  __recordInjectionSkipped(deps, missing) {
    this.injectionSkips.push({ deps: [...deps], missing: [...missing], at: new Date().toISOString() })
  }

  __effectsFor(context) {
    return this.__effects.filter((scope) => scope.owner === undefined || scope.owner === context)
  }

  /* —— 生命周期 —— */

  async start() {
    if (this.disposed) throw new Error('host 已释放')
    await this.startServer()
    const url = pathToFileURL(this.indexFile).href + (this.fresh ? `?qa=${this.pluginNamespace}` : '')
    const module = await import(url)
    this.pluginExports = module
    const applyFn = typeof module.apply === 'function' ? module.apply : typeof module.default === 'function' ? module.default : null
    if (!applyFn) throw new Error('index.js 没有导出 apply()')
    const config = { dataDir: this.dataDir, ...this.config }
    let applyResult
    try {
      applyResult = applyFn(this.ctx, config)
    } catch (error) {
      this.__recordError(error)
      throw error
    }
    if (applyResult && typeof applyResult.then === 'function') {
      await applyResult
    }
    // 插件可能把路由注册放在异步 mount 里：等路由出现再返回。
    if (this.routeList.length === 0) {
      try {
        await waitFor(() => this.routeList.length > 0, { timeoutMs: 5000, label: '插件注册路由' })
      } catch (error) {
        this.__recordError(error)
      }
    }
    return this
  }

  async startServer() {
    if (this.server) return this
    this.server = http.createServer((req, res) => {
      this.dispatch(req, res).catch((error) => {
        this.__recordError(error)
        if (!res.headersSent) {
          res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: false, code: 'INTERNAL', error: 'harness 分发失败：' + String(error?.message || error) }))
        } else if (!res.writableEnded) {
          res.end()
        }
      })
    })
    this.server.keepAliveTimeout = 1000
    await new Promise((resolvePromise, reject) => {
      this.server.once('error', reject)
      this.server.listen(0, '127.0.0.1', () => {
        this.server.off('error', reject)
        this.port = this.server.address().port
        this.baseUrl = `http://127.0.0.1:${this.port}`
        resolvePromise()
      })
    })
    return this
  }

  /** 路由匹配：exact 优先，其次最长 prefix；返回 null 表示未注册路径。 */
  matchRoute(pathname) {
    let best = null
    for (const route of this.routeList) {
      if (route.kind === 'exact') {
        if (pathname === route.path) return route
        continue
      }
      const hit = pathname === route.path || pathname.startsWith(route.path.endsWith('/') ? route.path : route.path + '/')
      if (hit && (!best || route.path.length > best.path.length)) best = route
    }
    return best
  }

  async dispatch(req, res) {
    let pathname = '/'
    try {
      pathname = new URL(req.url || '/', 'http://harness.local').pathname
    } catch {
      res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: false, code: 'VALIDATION', error: '请求路径不合法' }))
      return
    }
    const route = this.matchRoute(pathname)
    if (!route) {
      res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: false, code: 'NOT_FOUND', error: 'harness 没有匹配路由：' + pathname, routes: this.routeList.map((entry) => entry.path) }))
      return
    }
    await route.handler(req, res)
  }

  /* —— 请求辅助 —— */

  async request(pathname, { method = 'GET', body, headers = {}, signal, timeoutMs = 20000, rawBody = null } = {}) {
    if (!this.baseUrl) throw new Error('host 还没有 start()')
    const url = pathname.startsWith('http') ? pathname : this.baseUrl + (pathname.startsWith('/') ? pathname : '/' + pathname)
    const init = { method, headers: { ...headers }, signal }
    if (body !== undefined || rawBody !== null) {
      if (rawBody !== null) {
        init.body = rawBody
      } else if (typeof body === 'string') {
        init.body = body
        init.headers['content-type'] = init.headers['content-type'] || 'text/plain; charset=utf-8'
      } else {
        init.body = JSON.stringify(body)
        init.headers['content-type'] = init.headers['content-type'] || 'application/json; charset=utf-8'
      }
    }
    const controller = signal ? null : new AbortController()
    if (controller) {
      init.signal = controller.signal
      setTimeout(() => controller.abort(), timeoutMs).unref?.()
    }
    const response = await fetch(url, init)
    const text = await response.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }
    return { status: response.status, headers: Object.fromEntries(response.headers), text, body: json, ok: response.ok }
  }

  async get(pathname, options) {
    return this.request(pathname, { ...options, method: 'GET' })
  }

  async post(pathname, body, options) {
    return this.request(pathname, { ...options, method: 'POST', body })
  }

  async getState() {
    return this.get('/api/loop-atlas/state')
  }

  /** 调 ops；返回 { status, body }，body 就是 HTTP JSON。 */
  async op(opName, payload = {}, options = {}) {
    return this.post('/api/loop-atlas/ops', { op: opName, payload }, options)
  }

  async health() {
    return this.get('/api/loop-atlas/health')
  }

  /* —— 对话流 —— */

  /**
   * 打开 NDJSON 对话流。返回 NdjsonStream：
   *   status/headers、next(timeout)、readAll()、abort()（模拟客户端断开）、done。
   */
  async openDialogStream(body, { signal, path = '/api/loop-atlas/dialog/stream' } = {}) {
    if (!this.baseUrl) throw new Error('host 还没有 start()')
    const controller = new AbortController()
    if (signal) {
      if (signal.aborted) controller.abort()
      else signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    const response = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const stream = new NdjsonStream({ response, controller, host: this })
    this.dialogStreams.push(stream)
    return stream
  }

  /* —— 关闭 —— */

  async dispose({ cleanupData = false } = {}) {
    if (this.disposed) return
    this.disposed = true
    for (const stream of this.dialogStreams.splice(0)) {
      try {
        stream.abort()
      } catch {
        /* ignore */
      }
    }
    // 逆序执行 effect 清理（与 Cordis 卸载顺序一致）
    for (const scope of this.__effects.splice(0).reverse()) {
      if (scope.disposed) continue
      scope.disposed = true
      for (const disposer of scope.disposers.splice(0).reverse()) {
        safeCall(disposer, (error) => this.__recordCleanupError(error))
      }
    }
    for (const contextChildren of [this.ctx]) {
      for (const child of contextChildren.children.splice(0)) child.dispose()
    }
    for (const handle of this.__timers) {
      clearTimeout(handle)
      clearInterval(handle)
    }
    this.__timers.clear()
    if (this.server) {
      const server = this.server
      this.server = null
      await new Promise((resolvePromise) => {
        server.close(() => resolvePromise())
        try {
          server.closeAllConnections?.()
        } catch {
          /* ignore */
        }
        setTimeout(resolvePromise, 500).unref?.()
      })
    }
    // 等未决的写队列/微任务收束，避免清理临时目录时文件仍被占用
    await delay(20)
    if (cleanupData && this.dataDir) {
      await removeTempDir(this.dataDir).catch(() => {})
    }
  }
}

/* ─────────────────────────── NDJSON 流 ─────────────────────────── */

export class NdjsonStream {
  constructor({ response, controller, host }) {
    this.response = response
    this.status = response.status
    this.headers = Object.fromEntries(response.headers)
    this.controller = controller
    this.host = host
    this.events = []
    this.rawLines = []
    this.buffer = ''
    this.ended = false
    this.error = null
    this.waiters = []
    this.pumpPromise = this.__pump()
  }

  __notify() {
    for (const waiter of this.waiters.splice(0)) waiter()
  }

  async __pump() {
    const body = this.response.body
    if (!body) {
      this.ended = true
      this.__notify()
      return
    }
    const reader = body.getReader()
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        this.buffer += decoder.decode(value, { stream: true })
        let index
        while ((index = this.buffer.indexOf('\n')) >= 0) {
          const line = this.buffer.slice(0, index).trim()
          this.buffer = this.buffer.slice(index + 1)
          if (!line) continue
          this.rawLines.push(line)
          try {
            this.events.push(JSON.parse(line))
          } catch {
            this.events.push({ type: '__unparsed', line })
          }
          this.__notify()
        }
      }
      const tail = this.buffer.trim()
      if (tail) {
        this.rawLines.push(tail)
        try {
          this.events.push(JSON.parse(tail))
        } catch {
          this.events.push({ type: '__unparsed', line: tail })
        }
      }
    } catch (error) {
      this.error = error
    } finally {
      this.ended = true
      this.__notify()
    }
  }

  get done() {
    return this.pumpPromise
  }

  /** 等待下一个事件；超时抛错。 */
  async next({ timeoutMs = 8000 } = {}) {
    const started = Date.now()
    if (this.cursor === undefined) this.cursor = 0
    while (true) {
      if (this.cursor < this.events.length) return this.events[this.cursor++]
      if (this.ended) {
        if (this.error && !this.controller.signal.aborted) throw this.error
        return null
      }
      const remaining = timeoutMs - (Date.now() - started)
      if (remaining <= 0) throw new Error(`等待 NDJSON 事件超时（${timeoutMs}ms）；已收到 ${this.events.length} 个事件`)
      await new Promise((resolvePromise) => {
        const timer = setTimeout(resolvePromise, Math.min(remaining, 250))
        this.waiters.push(() => {
          clearTimeout(timer)
          resolvePromise()
        })
      })
    }
  }

  /** 读到流结束；返回全部事件。 */
  async readAll({ timeoutMs = 15000 } = {}) {
    let timer = null
    try {
      await Promise.race([
        this.done,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('等待 NDJSON 流结束超时')), timeoutMs)
        }),
      ])
    } finally {
      if (timer) clearTimeout(timer)
    }
    return this.events.slice()
  }

  /** 模拟浏览器关闭连接 / 取消：中止 fetch，服务端应收到 req/res close。 */
  abort() {
    try {
      this.controller.abort()
    } catch {
      /* ignore */
    }
  }
}

/* ─────────────────────────── 启动入口 ─────────────────────────── */

/**
 * 启动插件（真实 index.js apply）。
 * @param {object} options
 * @param {string} [options.root] 插件根目录
 * @param {string} [options.dataDir] 数据目录（默认新建临时目录）
 * @param {object} [options.config] 传给 apply 的 config（会覆盖 dataDir）
 * @param {object} [options.services] { webServer, tools, llm, agentDefaultModel } 传 false 表示服务缺失
 * @param {object} [options.llm] 假 llm fixture
 * @param {object|function} [options.selection] agentDefaultModel.currentSelection 返回值
 * @param {boolean} [options.fresh] import 时加 query 以绕过模块缓存
 */
export async function startPlugin(options = {}) {
  const dataDir = options.dataDir || (await makeTempDataDir())
  assertSafeDataDir(dataDir)
  const host = new FakeHost({ ...options, dataDir })
  host.fresh = !!options.fresh
  await host.start()
  return host
}
