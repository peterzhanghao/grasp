/**
 * R5 · 来源与内容诚实性抽查（契约 §3 内容约束、§7 R5、决策文档 §7 内容）
 *
 * 这是 QA 的独立结构抽查，不替代 content 组自己的 test/content：
 * - 24 个旧节点 id 原样保留（与 git 基线提交对比）；
 * - 关系/主张/来源引用闭合，relation 有 claim/condition/cost，claim 有 sourceIds；
 * - 类型词表：不允许 theorem/history，formal 仅用于形式结果（计数并输出分布）；
 * - 来源分档自洽：verified 必须有可打开 url/doi 与 verifiedAt；unverified 不冒充；
 * - historical/analogy 文本必须点明"历史影响/不是同一机制/类比"；
 * - experiments 元数据与 domain 模型 id/version 一致。
 *
 * 运行：node --test test/integration/r5-content.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateContent } from '../../src/domain/validate-content.js'
import { EXPERIMENT_MODELS } from '../../src/domain/experiments.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const CORE_FILE = join(ROOT, 'data', 'core.json')

const RELATION_TYPES = new Set(['prerequisite', 'formal', 'constraint', 'parallel', 'historical', 'analogy', 'application'])
const CLAIM_KINDS = new Set(['formal', 'empirical', 'historical', 'interpretation'])
const VERIFIED_LEVELS = new Set(['verified', 'secondary', 'unverified'])
const BRIEF_REF = /这不是同一机制|不是同一机制|历史影响|类比|工程应用|历史/;

async function loadCore() {
  return JSON.parse(await readFile(CORE_FILE, 'utf8'))
}

function legacyNodeIdsFromGit() {
  try {
    const firstCommit = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')[0]
    if (!firstCommit) return null
    const raw = execFileSync('git', ['show', firstCommit + ':data/core.json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    const baseline = JSON.parse(raw)
    const nodes = baseline.nodes || []
    if (!nodes.length) return null
    return new Set(nodes.map((node) => node.id))
  } catch (error) {
    return null
  }
}

test('R5 · 内容包通过领域校验（无悬空引用/类型错误）', async () => {
  const core = await loadCore()
  const result = validateContent(core)
  const hardErrors = result.errors.filter((error) => !['COMPLETENESS'].includes(error.code))
  assert.deepEqual(hardErrors, [], '内容包存在硬错误：' + JSON.stringify(hardErrors.slice(0, 8)))
  assert.deepEqual(result.warnings.filter((warning) => warning.code === 'DANGLING_REF'), [], '存在悬空引用警告')
  return { warnings: result.warnings.map((warning) => warning.code) }
})

test('R5 · 24 个旧节点 id 原样保留，新增不与旧 id 冲突', async (t) => {
  const core = await loadCore()
  const legacy = legacyNodeIdsFromGit()
  if (!legacy) {
    t.skip('当前环境无法读取 git 基线（git 不可用或历史被改写），跳过旧 id 对照')
    return
  }
  const currentIds = new Set((core.nodes || []).map((node) => node.id))
  const missing = [...legacy].filter((id) => !currentIds.has(id))
  assert.deepEqual(missing, [], '旧节点 id 丢失：' + missing.join(','))
  assert.ok(currentIds.size >= legacy.size, '节点数少于基线')
  const duplicates = (core.nodes || []).map((node) => node.id).filter((id, index, list) => list.indexOf(id) !== index)
  assert.deepEqual(duplicates, [], '节点 id 重复：' + duplicates.join(','))
  return { legacy: legacy.size, current: currentIds.size }
})

test('R5 · relation/claim/source 引用闭合且必填字段完整', async () => {
  const core = await loadCore()
  const nodeIds = new Set((core.nodes || []).map((node) => node.id))
  const claimIds = new Set((core.claims || []).map((claim) => claim.id))
  const sourceIds = new Set((core.sources || []).map((source) => source.id))
  const relationIds = new Set((core.relations || []).map((relation) => relation.id))
  assert.ok(relationIds.size >= 40, '关系数量过少：' + relationIds.size)

  for (const relation of core.relations || []) {
    for (const field of ['claim', 'condition', 'cost']) {
      assert.ok(String(relation[field] || '').trim().length > 0, `${relation.id} 缺少 ${field}`)
    }
    assert.ok(Array.isArray(relation.claimIds) && relation.claimIds.length >= 1, `${relation.id} 缺少 claimIds`)
    assert.ok(nodeIds.has(relation.from), `${relation.id} from 悬空：${relation.from}`)
    assert.ok(nodeIds.has(relation.to), `${relation.id} to 悬空：${relation.to}`)
    assert.ok(RELATION_TYPES.has(relation.type), `${relation.id} 非法 type：${relation.type}`)
    for (const claimId of relation.claimIds) assert.ok(claimIds.has(claimId), `${relation.id} claimId 悬空：${claimId}`)
  }
  for (const claim of core.claims || []) {
    assert.ok(CLAIM_KINDS.has(claim.kind), `${claim.id} 非法 claim.kind：${claim.kind}`)
    assert.ok(Array.isArray(claim.sourceIds) && claim.sourceIds.length >= 1, `${claim.id} 缺少 sourceIds`)
    for (const sourceId of claim.sourceIds) assert.ok(sourceIds.has(sourceId), `${claim.id} sourceId 悬空：${sourceId}`)
    if (claim.subject) {
      if (claim.subject.kind === 'node') assert.ok(nodeIds.has(claim.subject.id), `${claim.id} subject 节点悬空`)
      if (claim.subject.kind === 'relation') assert.ok(relationIds.has(claim.subject.id), `${claim.id} subject 关系悬空`)
    }
  }
  return { relations: relationIds.size, claims: claimIds.size, sources: sourceIds.size }
})

test('R5 · 类型词表：无 theorem/history 误标，formal 数量受控', async () => {
  const core = await loadCore()
  const types = {}
  for (const relation of core.relations || []) types[relation.type] = (types[relation.type] || 0) + 1
  assert.equal(types.theorem, undefined, '仍存在被误标的 theorem 关系')
  assert.equal(types.history, undefined, '仍存在非契约类型 history（应为 historical）')
  assert.ok(types.formal > 0, '没有 formal 关系')
  // 旧版 36 边中 17 条被误标 theorem；修正后 formal 必须是少数（真正有前提与推导）
  assert.ok(types.formal <= (core.relations || []).length * 0.5, 'formal 占比过高（疑似把一般联系当定理）：' + types.formal + '/' + core.relations.length)
  return types
})

test('R5 · historical/analogy 文本点明"不是同一机制/历史影响/类比"', async () => {
  const core = await loadCore()
  const offenders = []
  for (const relation of core.relations || []) {
    if (!['historical', 'analogy'].includes(relation.type)) continue
    const text = [relation.claim, relation.condition, relation.cost].join(' ')
    if (!BRIEF_REF.test(text)) offenders.push(relation.id)
  }
  assert.deepEqual(offenders, [], '以下 historical/analogy 关系没有点明边界：' + offenders.join(','))
})

test('R5 · 来源分档自洽：verified 有 url/doi，unverified 不冒充', async () => {
  const core = await loadCore()
  const counts = { verified: 0, secondary: 0, unverified: 0 }
  for (const source of core.sources || []) {
    assert.ok(VERIFIED_LEVELS.has(source.verified), `${source.id} 非法 verified：${source.verified}`)
    counts[source.verified] += 1
    if (source.verified === 'verified') {
      const locator = String(source.url || source.doi || '').trim()
      assert.ok(locator.length > 0, `${source.id} 标为 verified 但没有 url/doi`)
      assert.ok(source.verifiedAt, `${source.id} 标为 verified 但没有 verifiedAt`)
    }
    if (source.doi) {
      assert.match(String(source.doi), /^10\.\d{4,9}\/\S+$/, `${source.id} DOI 形态可疑：${source.doi}`)
    }
    if (source.verified !== 'verified') {
      assert.ok(source.note || source.ref, `${source.id} 未核验但没有说明检索路径/出处`)
    }
  }
  assert.ok(core.sources.length >= 20, '来源条目过少：' + core.sources.length)
  return counts
})

test('R5 · 实验元数据与 domain 模型 id/version 一致', async () => {
  const core = await loadCore()
  const experiments = core.experiments || []
  assert.deepEqual(experiments.map((item) => item.id).sort(), ['delay', 'green', 'proxy'], '实验清单不符')
  for (const experiment of experiments) {
    const model = EXPERIMENT_MODELS[experiment.id]
    assert.ok(model, '未知实验：' + experiment.id)
    assert.equal(experiment.modelId, model.id, `${experiment.id} modelId 不一致`)
    assert.equal(experiment.modelVersion, model.version, `${experiment.id} modelVersion 不一致`)
    assert.ok(Array.isArray(experiment.conceptNodeIds) && experiment.conceptNodeIds.length >= 1, `${experiment.id} 缺少概念关联`)
  }
})

test('R5 · 8 个单元齐全且 order 1..8，entryNodeId 可解析', async () => {
  const core = await loadCore()
  const groups = core.groups || []
  assert.equal(groups.length, 8, '单元数量应为 8')
  assert.deepEqual(groups.map((group) => group.order).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8], 'order 必须 1..8')
  const nodeIds = new Set((core.nodes || []).map((node) => node.id))
  for (const group of groups) {
    assert.ok(nodeIds.has(group.entryNodeId), `${group.id} entryNodeId 悬空：${group.entryNodeId}`)
    assert.ok(String(group.question || '').trim().length > 0, `${group.id} 缺少 question`)
    assert.ok(String(group.capability || '').trim().length > 0, `${group.id} 缺少 capability`)
  }
})
