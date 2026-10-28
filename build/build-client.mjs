/**
 * 掌控（Grasp）客户端构建器：把 src/client/** 打包为单文件 client.js。
 *
 * 约束（见 docs/refactor-spec.md 第 0/1 节）：
 * - 只用 node: 内置模块，不新增依赖；
 * - 产物外层是 window.__ModuleLoader__.load({ id, factory(require) {...} })；
 * - factory 内只 require('react')，不 require 任何 @deepseek-ai/* 包；
 * - 内部模块是受控的 ESM 子集：单行 static import、具名 export；
 *   不允许 default export / re-export / 动态 import / 裸包 import；
 * - locale/{zh,en}.json 的 messages 在构建期内联，覆盖 src/client/i18n.js 的 fallback；
 * - 幂等：相同输入产生逐字节相同的输出，内容未变时不重写文件。
 *
 * 用法：node build/build-client.mjs [--check]
 *   --check  只校验不写盘（CI/测试用），发现不一致时退出码 1。
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const SRC_DIR = join(ROOT, 'src', 'client')
const OUT_FILE = join(ROOT, 'client.js')
const LOCALE_DIR = join(ROOT, 'locale')
const ENTRY_ID = 'index.js'
const VIRTUAL_LOCALE_ID = '#locale'
const PLUGIN_ID = '@local/loop-atlas'

const errors = []
const warnings = []

function fail(message) {
  errors.push(message)
}

function warn(message) {
  warnings.push(message)
}

/* ─────────────────────────── 源码收集 ─────────────────────────── */

async function collectSources() {
  const files = new Map()
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
        continue
      }
      if (!entry.isFile() || !entry.name.endsWith('.js')) continue
      const id = relative(SRC_DIR, full).split(sep).join('/')
      if (id.startsWith('#')) {
        fail(`模块 id 不能以 # 开头（构建器保留）：${id}`)
        continue
      }
      files.set(id, full)
    }
  }
  await walk(SRC_DIR)
  return files
}

/* ─────────────────────────── 模块转换 ─────────────────────────── */

const IMPORT_FROM_RE = /^import\s+(.+?)\s+from\s+(['"])([^'"]+)\2\s*;?\s*$/
const IMPORT_SIDE_RE = /^import\s+(['"])([^'"]+)\1\s*;?\s*$/
const EXPORT_DECL_RE = /^export\s+(async\s+function|function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/
const EXPORT_LIST_RE = /^export\s*\{([^}]*)\}\s*;?\s*$/

function resolveSpecifier(fromId, spec) {
  if (spec === VIRTUAL_LOCALE_ID) return { id: VIRTUAL_LOCALE_ID, virtual: true }
  if (spec.startsWith('#')) {
    fail(`${fromId}: 未知的虚拟模块 "${spec}"（只支持 ${VIRTUAL_LOCALE_ID}）`)
    return { id: spec, virtual: true }
  }
  if (!spec.startsWith('./') && !spec.startsWith('../')) {
    fail(
      `${fromId}: 禁止 import 外部包 "${spec}"。只允许相对路径模块与 ${VIRTUAL_LOCALE_ID}；react 由 factory 提供（用 React / h）。`,
    )
    return { id: spec, virtual: false }
  }
  const base = fromId.split('/').slice(0, -1).join('/')
  const joined = base ? `${base}/${spec}` : spec
  const parts = []
  for (const part of joined.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (parts.length === 0) {
        fail(`${fromId}: 模块路径越出 src/client："${spec}"`)
        return { id: joined, virtual: false }
      }
      parts.pop()
      continue
    }
    parts.push(part)
  }
  const id = parts.join('/')
  if (!id.endsWith('.js')) fail(`${fromId}: 相对 import 必须带 .js 后缀："${spec}"`)
  return { id, virtual: false }
}

function parseImportClause(fromId, clause, targetId) {
  const trimmed = clause.trim()
  const requireCall = `__req(${JSON.stringify(targetId)})`
  if (trimmed.startsWith('*')) {
    const match = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(trimmed)
    if (!match) {
      fail(`${fromId}: 不支持的 import 形式：import ${clause}`)
      return null
    }
    return `const ${match[1]} = ${requireCall}`
  }
  if (trimmed.startsWith('{')) {
    const body = trimmed.slice(1, trimmed.lastIndexOf('}'))
    const names = []
    for (const rawPart of body.split(',')) {
      const part = rawPart.trim()
      if (!part) continue
      const alias = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(part)
      if (!alias) {
        fail(`${fromId}: 不支持的 import 名称 "${part}"`)
        continue
      }
      names.push(alias[2] ? `${alias[1]}: ${alias[2]}` : alias[1])
    }
    return `const { ${names.join(', ')} } = ${requireCall}`
  }
  fail(`${fromId}: 不支持 default/命名空间以外的 import：import ${clause}`)
  return null
}

function transformModule(id, source, fileMap) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const output = []
  const depIds = new Set()
  const exportNames = []
  let touched = false

  for (const line of lines) {
    const fromMatch = IMPORT_FROM_RE.exec(line)
    if (fromMatch) {
      touched = true
      const target = resolveSpecifier(id, fromMatch[3])
      depIds.add(target.id)
      if (!target.virtual && !fileMap.has(target.id)) {
        fail(`${id}: import 的模块不存在：${fromMatch[3]}（解析为 ${target.id}）`)
        continue
      }
      const code = parseImportClause(id, fromMatch[1], target.id)
      if (code) output.push(code)
      continue
    }
    const sideMatch = IMPORT_SIDE_RE.exec(line)
    if (sideMatch) {
      touched = true
      const target = resolveSpecifier(id, sideMatch[2])
      depIds.add(target.id)
      if (!target.virtual && !fileMap.has(target.id)) {
        fail(`${id}: import 的模块不存在：${sideMatch[2]}（解析为 ${target.id}）`)
        continue
      }
      output.push(`__req(${JSON.stringify(target.id)})`)
      continue
    }
    const declMatch = EXPORT_DECL_RE.exec(line)
    if (declMatch) {
      touched = true
      exportNames.push(declMatch[2])
      output.push(line.replace(/^export\s+/, ''))
      continue
    }
    const listMatch = EXPORT_LIST_RE.exec(line.trim())
    if (listMatch) {
      touched = true
      for (const rawPart of listMatch[1].split(',')) {
        const part = rawPart.trim()
        if (!part) continue
        const alias = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(part)
        if (!alias) {
          fail(`${id}: 不支持的 export 名称 "${part}"`)
          continue
        }
        if (alias[2] && alias[1] !== alias[2]) {
          fail(`${id}: 不支持 export 重命名 "${part}"（请导出后再赋值）`)
          continue
        }
        exportNames.push(alias[1])
      }
      output.push('')
      continue
    }
    if (/^export\b/.test(line)) {
      fail(`${id}: 不支持的 export 形式（只允许 export function/const/let/var/class 与单行 export {…}）：${line.slice(0, 80)}`)
      output.push(line)
      continue
    }
    if (/^import\b/.test(line)) {
      fail(`${id}: 不支持的 import 形式（必须单行静态 import）：${line.slice(0, 80)}`)
      output.push(line)
      continue
    }
    output.push(line)
  }

  if (touched && exportNames.length === 0 && id !== ENTRY_ID) {
    warn(`${id}: 没有任何 export（构建后无法被别处使用）`)
  }

  const body = output.join('\n').replace(/\s+$/, '')
  const unique = [...new Set(exportNames)]
  return { id, body, deps: [...depIds], exportNames: unique }
}

/* ─────────────────────────── 拓扑排序 ─────────────────────────── */

function topoOrder(modules) {
  const order = []
  const state = new Map() // 0=visiting 1=done
  const stack = []
  function visit(id) {
    const phase = state.get(id)
    if (phase === 1) return
    if (phase === 0) {
      const cycle = [...stack.slice(stack.indexOf(id)), id].join(' → ')
      fail(`模块循环依赖：${cycle}`)
      return
    }
    state.set(id, 0)
    stack.push(id)
    for (const dep of modules.get(id)?.deps || []) {
      if (modules.has(dep)) visit(dep)
    }
    stack.pop()
    state.set(id, 1)
    order.push(id)
  }
  visit(ENTRY_ID)
  // 未被 entry 引用的模块也带上（保持构建确定性），但给出提示。
  for (const id of [...modules.keys()].sort()) {
    if (!state.has(id)) {
      warn(`${id}: 没有被入口引用，仍会打包（可删除的孤立模块）`)
      visit(id)
    }
  }
  return order
}

/* ─────────────────────────── locale ─────────────────────────── */

function flattenMessages(value, prefix, out) {
  if (typeof value === 'string') {
    if (prefix.startsWith('loop.')) out[prefix] = value
    return
  }
  if (Array.isArray(value) || value === null || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    flattenMessages(child, prefix ? `${prefix}.${key}` : key, out)
  }
}

async function readLocaleMessages(locale) {
  const file = join(LOCALE_DIR, `${locale}.json`)
  let raw
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      warn(`locale/${locale}.json 不存在，使用 src/client/i18n.js 的内置 fallback`)
      return {}
    }
    throw error
  }
  let json
  try {
    json = JSON.parse(raw)
  } catch (error) {
    fail(`locale/${locale}.json 不是合法 JSON：${error.message}`)
    return {}
  }
  const out = {}
  if (json && typeof json.messages === 'object' && json.messages !== null) {
    flattenMessages(json.messages, '', out)
  }
  // 兼容顶层平铺的 loop.* 字符串
  for (const [key, value] of Object.entries(json || {})) {
    if (typeof value === 'string' && key.startsWith('loop.')) out[key] = value
  }
  return out
}

/* ─────────────────────────── 校验 ─────────────────────────── */

function validateOutput(output) {
  try {
    // 只编译不执行：function body 里可以引用 window，语法检查足够。
    // eslint-disable-next-line no-new-func
    new Function(output)
  } catch (error) {
    fail(`产物语法检查失败：${error.message}`)
  }
  if (!output.startsWith('/*!')) fail('产物缺少生成声明头')
  if ((output.match(/window\.__ModuleLoader__\.load\(/g) || []).length !== 1) {
    fail('产物必须且只能出现一次 window.__ModuleLoader__.load(')
  }
  if (!output.includes(`id: '${PLUGIN_ID}'`)) fail(`产物 id 必须是 '${PLUGIN_ID}'`)
  if (!/factory\(require\)\s*\{/.test(output)) fail('产物必须保留 factory(require) 形参')
  if (!/const React = require\('react'\)/.test(output)) fail("factory 内必须 const React = require('react')")
  const requireCalls = output.match(/\brequire\s*\(/g) || []
  if (requireCalls.length !== 1) {
    fail(`factory 内只允许一次 require('react')，实际出现 ${requireCalls.length} 次 require(`)
  }
  if (output.includes('@deepseek-ai/')) fail('产物不得引用 @deepseek-ai/* 包')
  if (/\bfrom\s+['"]/.test(output)) fail('产物不应残留 import from 语句')
}

/* ─────────────────────────── 主流程 ─────────────────────────── */

async function build() {
  const checkOnly = process.argv.includes('--check')
  const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'))
  if (pkg.name !== PLUGIN_ID) fail(`package.json name 必须是 ${PLUGIN_ID}，实际是 ${pkg.name}`)
  try {
    await stat(SRC_DIR)
  } catch {
    fail(`找不到源码目录 ${SRC_DIR}`)
  }
  if (errors.length) return finish(checkOnly)

  const fileMap = await collectSources()
  if (!fileMap.has(ENTRY_ID)) fail(`缺少入口模块 src/client/${ENTRY_ID}`)

  const modules = new Map()
  for (const [id, file] of [...fileMap.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const source = await readFile(file, 'utf8')
    if (source.includes('@deepseek-ai/')) fail(`${id}: 源码不得引用 @deepseek-ai/*`)
    const transformed = transformModule(id, source, fileMap)
    modules.set(id, transformed)
  }
  if (errors.length) return finish(checkOnly)

  // 依赖存在性（虚拟模块除外）
  for (const mod of modules.values()) {
    for (const dep of mod.deps) {
      if (dep !== VIRTUAL_LOCALE_ID && !modules.has(dep)) fail(`${mod.id}: 依赖不存在 ${dep}`)
    }
  }

  // locale 合并
  const i18nModule = await import(pathToFileURL(join(SRC_DIR, 'i18n.js')).href + '?t=' + Date.now())
  const fallbackZh = i18nModule.FALLBACK_ZH || {}
  const fallbackEn = i18nModule.FALLBACK_EN || {}
  const diff = i18nModule.dictionaryKeyDiff ? i18nModule.dictionaryKeyDiff() : { missingEn: [], missingZh: [] }
  if (diff.missingEn.length) fail(`i18n fallback 的 en 缺少 key：${diff.missingEn.slice(0, 10).join(', ')}${diff.missingEn.length > 10 ? ' …' : ''}`)
  if (diff.missingZh.length) fail(`i18n fallback 的 zh 缺少 key：${diff.missingZh.slice(0, 10).join(', ')}${diff.missingZh.length > 10 ? ' …' : ''}`)

  const localeZh = await readLocaleMessages('zh')
  const localeEn = await readLocaleMessages('en')
  const mergedZh = Object.assign({}, fallbackZh, localeZh)
  const mergedEn = Object.assign({}, fallbackEn, localeEn)
  const overriddenZh = Object.keys(localeZh).filter((key) => key in fallbackZh).length
  const unknownZh = Object.keys(localeZh).filter((key) => !(key in fallbackZh))

  const order = topoOrder(modules)
  if (errors.length) return finish(checkOnly)

  const moduleChunks = []
  for (const id of order) {
    const mod = modules.get(id)
    const exportLine = mod.exportNames.length
      ? `\n  return { ${mod.exportNames.join(', ')} }`
      : '\n  return {}'
    moduleChunks.push(
      `__def(${JSON.stringify(id)}, function (__req) {\n${mod.body}${exportLine}\n})`,
    )
  }
  moduleChunks.push(
    `__def(${JSON.stringify(VIRTUAL_LOCALE_ID)}, function () {\n  return { LOCALE: ${escapeJsonForJs(
      JSON.stringify({ zh: mergedZh, en: mergedEn }),
    )} }\n})`,
  )

  const output = [
    '/*!',
    ' * 掌控 (Grasp) 客户端单文件产物 — 由 build/build-client.mjs 从 src/client/** 生成，请勿手改。',
    ` * 模块：${order.length} 个 · zh key：${Object.keys(mergedZh).length} · en key：${Object.keys(mergedEn).length}`,
    ' * 运行形态：__ModuleLoader__.load({ id: \'@local/loop-atlas\', factory(require) {…} })',
    ' */',
    'window.__ModuleLoader__.load({',
    `  id: ${JSON.stringify(PLUGIN_ID)},`,
    '  factory(require) {',
    "    const React = require('react')",
    '    const h = React.createElement',
    '    const __defs = Object.create(null)',
    '    const __cache = Object.create(null)',
    '    const __def = (id, fn) => { __defs[id] = fn }',
    '    const __req = (id) => {',
    '      const cached = __cache[id]',
    '      if (cached) return cached',
    '      const fn = __defs[id]',
    '      if (!fn) throw new Error(\'未打包模块: \' + id)',
    '      const exported = fn(__req)',
    '      __cache[id] = exported',
    '      return exported',
    '    }',
    ...moduleChunks,
    `    return __req(${JSON.stringify(ENTRY_ID)}).plugin`,
    '  },',
    '})',
    '',
  ].join('\n')

  validateOutput(output)

  const bytes = Buffer.byteLength(output, 'utf8')
  if (warnings.length) {
    process.stdout.write(`构建提示：\n${warnings.map((w) => '  - ' + w).join('\n')}\n`)
  }
  if (errors.length) return finish(checkOnly)

  let previous = null
  try {
    previous = await readFile(OUT_FILE, 'utf8')
  } catch (error) {
    if (!error || error.code !== 'ENOENT') throw error
  }

  if (previous === output) {
    process.stdout.write(`client.js 已是最新（${bytes} B，${order.length} 个模块，幂等未写盘）\n`)
    process.stdout.write(
      `locale：zh 覆盖 ${overriddenZh}/${Object.keys(fallbackZh).length} key，en 覆盖 ${
        Object.keys(localeEn).filter((key) => key in fallbackEn).length
      }/${Object.keys(fallbackEn).length}${
        unknownZh.length ? `；locale 多出 ${unknownZh.length} 个 fallback 不认识的 key（不影响运行）` : ''
      }\n`,
    )
    return 0
  }

  if (checkOnly) {
    fail('client.js 与 src/client/** 当前源码不一致（--check 模式不写盘）')
    return finish(checkOnly)
  }

  await writeFile(OUT_FILE, output, 'utf8')
  process.stdout.write(
    `已生成 client.js：${bytes} B，${order.length} 个模块，${Object.keys(mergedZh).length} 个 zh key / ${
      Object.keys(mergedEn).length
    } 个 en key\n`,
  )
  process.stdout.write(`模块顺序：${order.join(' → ')}\n`)
  process.stdout.write(
    `locale：zh 覆盖 ${overriddenZh}/${Object.keys(fallbackZh).length} key，en 覆盖 ${
      Object.keys(localeEn).filter((key) => key in fallbackEn).length
    }/${Object.keys(fallbackEn).length}\n`,
  )
  return 0
}

function escapeJsonForJs(json) {
  // U+2028/U+2029 在极老的解析器里会破坏字符串字面量；统一转义，保持产物稳健。
  return json.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

function finish(checkOnly) {
  if (errors.length) {
    process.stderr.write(`构建失败（${errors.length} 个错误）：\n${errors.map((e) => '  - ' + e).join('\n')}\n`)
    return 1
  }
  return 0
}

const exitCode = await build().catch((error) => {
  process.stderr.write(`构建异常：${error && error.stack ? error.stack : error}\n`)
  return 2
})
process.exitCode = exitCode
