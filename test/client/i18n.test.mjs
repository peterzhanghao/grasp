/**
 * 文案 key 覆盖测试：源码里所有字面量 t('loop.xxx') 必须存在于 i18n fallback。
 * 动态拼接的 key（loop.relation.type.${type} 等）在此列出前缀白名单，另在 UI 契约里约定。
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FALLBACK_ZH } from '../../src/client/i18n.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const SRC = join(ROOT, 'src', 'client')

async function listFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await listFiles(full)))
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

async function collectLiteralKeys() {
  const keys = new Set()
  const dynamic = new Set()
  for (const file of await listFiles(SRC)) {
    const raw = await readFile(file, 'utf8')
    const source = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    for (const match of source.matchAll(/\bt\(\s*'([^']+)'/g)) {
      if (match[1].startsWith('loop.')) keys.add(match[1])
    }
    for (const match of source.matchAll(/\bt\(\s*`([^`]+)`/g)) {
      dynamic.add(match[1])
    }
  }
  return { keys, dynamic }
}

const DYNAMIC_PREFIXES = [
  'loop.relation.type.',
  'loop.relation.claimKind.',
  'loop.relation.verified.',
  'loop.relation.status.',
  'loop.exp.verdict.',
  'loop.note.source.',
  'loop.note.kind.',
  'loop.note.savedBy.',
  'loop.pred.status.',
  'loop.pred.resolve.',
  'loop.inv.status.',
  'loop.task.status.',
  'loop.res.mode.',
  'loop.error.',
  'loop.subject.kind.',
  'loop.subject.migrateType.',
  'loop.subject.',
  'loop.practice.',
  'loop.scale.',
  'loop.projection.',
  'loop.note.none.',
]

test('所有字面量 t(\'loop.*\') key 都在 fallback 字典里', async () => {
  const { keys } = await collectLiteralKeys()
  assert.ok(keys.size > 100, `字面量 key 数量异常：${keys.size}`)
  const missing = [...keys].filter((key) => !(key in FALLBACK_ZH)).sort()
  assert.deepEqual(missing, [], `以下 key 未在 i18n.js 定义：\n${missing.join('\n')}`)
})

test('动态拼接的 key 前缀都在白名单内，且模板前缀下的枚举 key 存在', async () => {
  const { dynamic } = await collectLiteralKeys()
  for (const template of dynamic) {
    const prefix = template.slice(0, template.indexOf('${'))
    assert.ok(
      DYNAMIC_PREFIXES.includes(prefix),
      `动态 key 前缀未登记：${template}（请补白名单或改成字面量）`,
    )
  }
  const enumerations = {
    'loop.relation.type.': ['prerequisite', 'formal', 'constraint', 'parallel', 'historical', 'analogy', 'application'],
    'loop.exp.verdict.': ['converged', 'overshoot-settled', 'oscillating', 'oscillating-below', 'drift', 'diverging', 'pass', 'fail', 'mixed'],
    'loop.note.source.': ['user', 'ai-draft', 'import', 'legacy'],
    'loop.note.kind.': ['理解', '疑问', '证据', '反驳', '实践'],
    'loop.note.savedBy.': ['ui', 'agent'],
    'loop.pred.status.': ['open', 'supported', 'refuted', 'inconclusive'],
    'loop.pred.resolve.': ['supported', 'refuted', 'inconclusive'],
    'loop.inv.status.': ['open', 'testing', 'supported', 'revised', 'inconclusive'],
    'loop.task.status.': ['draft', 'saved', 'archived'],
    'loop.res.mode.': ['merge', 'skip', 'replace'],
    'loop.relation.verified.': ['verified', 'secondary', 'unverified'],
    'loop.relation.status.': ['open', 'supported', 'challenged'],
    'loop.relation.claimKind.': ['formal', 'empirical', 'historical', 'interpretation'],
    'loop.subject.kind.': ['concept', 'device', 'event'],
    'loop.subject.migrateType.': ['formal', 'application', 'analogy', 'heuristic'],
    'loop.subject.': ['def', 'can', 'mech', 'limits', 'counter', 'check', 'hist', 'migrate'],
    'loop.practice.': ['goal', 'measurement', 'action', 'observation', 'acceptance', 'revision'],
    'loop.scale.': ['domain', 'subject', 'evidence'],
    'loop.projection.': ['theory', 'history', 'practice'],
    'loop.error.': ['VALIDATION', 'NOT_FOUND', 'CONFLICT', 'STORAGE_WRITE', 'LLM_UNAVAILABLE', 'LLM_AUTH', 'LLM_RATE_LIMIT', 'LLM_CONTEXT', 'BUSY', 'CANCELED', 'IMPORT_INVALID', 'PACKAGE_TOO_LARGE', 'READ_ONLY', 'NETWORK', 'PROTOCOL', 'HTTP', 'UNKNOWN'],
  }
  for (const [prefix, values] of Object.entries(enumerations)) {
    for (const value of values) {
      assert.ok(prefix + value in FALLBACK_ZH, `缺少枚举 key：${prefix}${value}`)
    }
  }
})
