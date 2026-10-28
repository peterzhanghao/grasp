/**
 * 构建产物测试：单文件形态、语法、无平台模块依赖、幂等、locale 注入。
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FALLBACK_ZH, FALLBACK_EN } from '../../src/client/i18n.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const CLIENT_FILE = join(ROOT, 'client.js')
const BUILD_SCRIPT = join(ROOT, 'build', 'build-client.mjs')
const SRC_DIR = join(ROOT, 'src', 'client')

function runNode(args, options) {
  return execFileSync(process.execPath, args, Object.assign({ cwd: ROOT, encoding: 'utf8' }, options || {}))
}

async function listSourceFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await listSourceFiles(full)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.js')) out.push(full)
  }
  return out.sort()
}

function flattenMessages(value, prefix, out) {
  if (typeof value === 'string') {
    if (prefix.startsWith('loop.')) out[prefix] = value
    return
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  for (const [key, child] of Object.entries(value)) flattenMessages(child, prefix ? `${prefix}.${key}` : key, out)
}

async function readLocaleMessages(locale) {
  const raw = await readFile(join(ROOT, 'locale', `${locale}.json`), 'utf8')
  const json = JSON.parse(raw)
  const out = {}
  flattenMessages(json.messages || {}, '', out)
  for (const [key, value] of Object.entries(json)) {
    if (typeof value === 'string' && key.startsWith('loop.')) out[key] = value
  }
  return out
}

test('client.js 存在，node --check 通过', async () => {
  const source = await readFile(CLIENT_FILE, 'utf8')
  assert.ok(source.length > 20000, 'client.js 应包含完整实现')
  runNode(['--check', CLIENT_FILE])
  assert.ok(source.startsWith('/*!'), '产物应以生成声明开头')
})

test('产物外层保持 __ModuleLoader__.load + factory(require) 形态，只 require(react)', async () => {
  const source = await readFile(CLIENT_FILE, 'utf8')
  assert.equal((source.match(/window\.__ModuleLoader__\.load\(/g) || []).length, 1)
  assert.match(source, /id: "@local\/loop-atlas"/)
  assert.match(source, /factory\(require\)\s*\{/)
  assert.match(source, /const React = require\('react'\)/)
  const requireCalls = source.match(/\brequire\s*\(/g) || []
  assert.equal(requireCalls.length, 1, `只允许一次 require('react')，实际 ${requireCalls.length}`)
  assert.equal(source.includes('@deepseek-ai/'), false, '不得引用平台私有包')
  assert.equal(/^\s*(import|export)\b/m.test(source), false, '产物不应残留 ESM import/export')
})

test('src/client 是受控模块子集：无 require、无外部包、无动态 import', async () => {
  const files = await listSourceFiles(SRC_DIR)
  assert.ok(files.length >= 20, `源码模块数应 ≥20，实际 ${files.length}`)
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const relative = file.slice(SRC_DIR.length + 1)
    assert.equal(source.includes('@deepseek-ai/'), false, `${relative} 引用了 @deepseek-ai/*`)
    assert.equal(/(^|[^.\w])require\s*\(/m.test(source), false, `${relative} 直接使用了 require(`)
    assert.equal(/\bimport\s*\(/.test(source), false, `${relative} 使用了动态 import()`)
    assert.equal(/^import\s+[\w*{]/.test(source) || source.includes("from 'react'"), false, `${relative} 不应 import react（由 factory 提供）`)
  }
})

test('构建幂等且 --check 通过（产物与源码同步）', async () => {
  const before = await readFile(CLIENT_FILE, 'utf8')
  runNode([BUILD_SCRIPT, '--check'])
  runNode([BUILD_SCRIPT])
  const after = await readFile(CLIENT_FILE, 'utf8')
  assert.equal(after, before, '重复构建必须产生逐字节相同的结果')
  runNode([BUILD_SCRIPT, '--check'])
})

test('构建输出报告 locale 覆盖：zh/en key 一致且覆盖 fallback', async () => {
  const zh = await readLocaleMessages('zh')
  const en = await readLocaleMessages('en')
  const zhKeys = Object.keys(FALLBACK_ZH).sort()
  const enKeys = Object.keys(FALLBACK_EN).sort()
  assert.deepEqual(enKeys, zhKeys, 'i18n fallback 的 zh/en key 集合必须一致')
  for (const key of zhKeys) {
    assert.ok(key in zh, `locale/zh.json 缺少 ${key}`)
    assert.ok(key in en, `locale/en.json 缺少 ${key}`)
  }
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort(), 'locale zh/en key 集合必须一致')
  assert.ok(zhKeys.length > 300, `文案 key 数量应覆盖完整 UI，实际 ${zhKeys.length}`)
})

test('构建脚本只用 node: 内置模块', async () => {
  const source = await readFile(BUILD_SCRIPT, 'utf8')
  const imports = [...source.matchAll(/^import\s+.*?from\s+['"]([^'"]+)['"]/gm)].map((match) => match[1])
  assert.ok(imports.length > 0)
  for (const spec of imports) {
    assert.ok(
      spec.startsWith('node:') || spec.startsWith('./') || spec.startsWith('../'),
      `构建脚本不得依赖第三方包：${spec}`,
    )
  }
})
