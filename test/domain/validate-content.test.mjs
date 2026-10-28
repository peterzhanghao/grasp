import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { validateContent, LEGACY_NODE_IDS, RELATION_TYPES } from '../../src/domain/validate-content.js'
import { makeMiniCore } from './fixtures/mini-core.mjs'

const clone = (v) => JSON.parse(JSON.stringify(v))

test('最小 v2 内容包 fixture 通过校验', () => {
  const result = validateContent(makeMiniCore())
  assert.equal(result.ok, true, JSON.stringify(result.errors))
  assert.equal(result.errors.length, 0)
  assert.ok(Array.isArray(result.warnings))
})

test('24 个旧节点 id 与契约一致', () => {
  assert.equal(LEGACY_NODE_IDS.length, 24)
  assert.equal(new Set(LEGACY_NODE_IDS).size, 24)
  assert.ok(LEGACY_NODE_IDS.includes('feedback'))
  assert.ok(LEGACY_NODE_IDS.includes('agentloop'))
  assert.deepEqual(RELATION_TYPES, ['prerequisite', 'formal', 'constraint', 'parallel', 'historical', 'analogy', 'application'])
})

test('约束 1：缺少旧节点 id / 分组数量不对 / id 重复都是错误', () => {
  const missingLegacy = makeMiniCore()
  missingLegacy.nodes = missingLegacy.nodes.filter((n) => n.id !== 'pi')
  const r1 = validateContent(missingLegacy)
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'LEGACY_IDS'))

  const sevenGroups = makeMiniCore()
  sevenGroups.groups = sevenGroups.groups.slice(0, 7)
  const r2 = validateContent(sevenGroups)
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.code === 'GROUP_COUNT'))

  const dup = makeMiniCore()
  dup.nodes.push(clone(dup.nodes[0]))
  const r3 = validateContent(dup)
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'DUPLICATE_ID'))

  const badOrder = makeMiniCore()
  badOrder.groups[0].order = 2
  const r4 = validateContent(badOrder)
  assert.equal(r4.ok, false)
  assert.ok(r4.errors.some((e) => e.code === 'GROUP_ORDER'))
})

test('约束 2：引用闭合（from/to、subject、sourceIds、claimIds、entryNodeId）', () => {
  const danglingRelation = makeMiniCore()
  danglingRelation.relations[0].from = 'ghost'
  const r1 = validateContent(danglingRelation)
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'DANGLING_REF' && e.path === 'relations[0].from'))

  const danglingClaimSource = makeMiniCore()
  danglingClaimSource.claims[0].sourceIds = ['s.ghost']
  const r2 = validateContent(danglingClaimSource)
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.code === 'DANGLING_REF' && e.path === 'claims[0].sourceIds'))

  const danglingEntry = makeMiniCore()
  danglingEntry.groups[0].entryNodeId = 'ghost'
  const r3 = validateContent(danglingEntry)
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'DANGLING_REF' && e.path === 'groups[0].entryNodeId'))

  const danglingConcept = makeMiniCore()
  danglingConcept.experiments[0].conceptNodeIds = ['ghost']
  const r4 = validateContent(danglingConcept)
  assert.equal(r4.ok, false)
})

test('约束 3：relation 必须有 claim/condition/cost/claimIds，claim 必须有 sourceIds', () => {
  const missingCost = makeMiniCore()
  delete missingCost.relations[0].cost
  const r1 = validateContent(missingCost)
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'REQUIRED' && e.path.includes('.cost')))

  const emptyClaimIds = makeMiniCore()
  emptyClaimIds.relations[1].claimIds = []
  const r2 = validateContent(emptyClaimIds)
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.path.includes('claimIds')))

  const claimNoSource = makeMiniCore()
  claimNoSource.claims[2].sourceIds = []
  const r3 = validateContent(claimNoSource)
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'REQUIRED' && e.path.includes('claims[2].sourceIds')))
})

test('约束 4：formal 语义白名单，历史解释/类比不得叫定理', () => {
  const mislabeled = makeMiniCore()
  // 把 formal 关系挂到 empirical 主张上
  mislabeled.relations[1].claimIds = ['c.goal.1']
  const r1 = validateContent(mislabeled)
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'FORMAL_MISLABEL'))

  const oldTheorem = makeMiniCore()
  oldTheorem.relations[0].type = 'theorem'
  const r2 = validateContent(oldTheorem)
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.code === 'ENUM' && e.path === 'relations[0].type'))

  const theoremMigrate = makeMiniCore()
  theoremMigrate.nodes[0].migrateType = 'theorem'
  const r3 = validateContent(theoremMigrate)
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'ENUM' && e.path.includes('migrateType')))
})

test('约束 5：来源三档；verified/secondary 必须附 url/doi 与 verifiedAt', () => {
  const verifiedNoUrl = makeMiniCore()
  verifiedNoUrl.sources[0].verified = 'verified'
  verifiedNoUrl.sources[0].verifiedAt = '2026-10-28T00:00:00.000Z'
  const r1 = validateContent(verifiedNoUrl)
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'SOURCE_UNVERIFIED_LINK'))

  const verifiedNoAt = makeMiniCore()
  verifiedNoAt.sources[0].verified = 'verified'
  verifiedNoAt.sources[0].url = 'https://example.org/paper'
  const r2 = validateContent(verifiedNoAt)
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.code === 'ISO' && e.path.includes('verifiedAt')))

  const secondaryNoUrl = makeMiniCore()
  secondaryNoUrl.sources[0].verified = 'secondary'
  const r3 = validateContent(secondaryNoUrl)
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'SOURCE_UNVERIFIED_LINK'))

  const okSource = makeMiniCore()
  okSource.sources[0] = { ...okSource.sources[0], verified: 'verified', url: 'https://example.org/x', verifiedAt: '2026-10-28T00:00:00.000Z', note: '打开过原文摘要' }
  const r4 = validateContent(okSource)
  assert.equal(r4.ok, true, JSON.stringify(r4.errors))
})

test('约束 6：era 精度与 eraStart/eraEnd 一致', () => {
  const unknownWithStart = makeMiniCore()
  unknownWithStart.nodes[0].eraPrecision = 'unknown'
  unknownWithStart.nodes[0].eraStart = 1900
  const r1 = validateContent(unknownWithStart)
  assert.equal(r1.ok, false)
  assert.ok(r1.errors.some((e) => e.code === 'ERA' && e.path.includes('eraStart')))

  const rangeBackwards = makeMiniCore()
  rangeBackwards.nodes[0].eraPrecision = 'range'
  rangeBackwards.nodes[0].eraStart = 1970
  rangeBackwards.nodes[0].eraEnd = 1950
  const r2 = validateContent(rangeBackwards)
  assert.equal(r2.ok, false)

  const yearOk = makeMiniCore()
  yearOk.nodes[0].eraPrecision = 'year'
  yearOk.nodes[0].eraStart = 1868
  yearOk.nodes[0].eraEnd = 1868
  const r3 = validateContent(yearOk)
  assert.equal(r3.ok, true, JSON.stringify(r3.errors))
})

test('约束 7 / 实验 / completeness：历史与类比提示是 warning，模型 id 必须一致', () => {
  const noHint = makeMiniCore()
  noHint.relations[2].claim = '指标优化形成放大环'
  noHint.relations[2].condition = '优化代理目标时'
  noHint.relations[2].cost = '代价'
  const r1 = validateContent(noHint)
  assert.equal(r1.ok, true, '缺提示只应是 warning，不阻断加载')
  assert.ok(r1.warnings.some((w) => w.code === 'SEMANTIC_HINT'))

  const wrongModel = makeMiniCore()
  wrongModel.experiments[0].modelId = 'delay-v1'
  const r2 = validateContent(wrongModel)
  assert.equal(r2.ok, false)
  assert.ok(r2.errors.some((e) => e.code === 'MODEL_MISMATCH'))

  const missingExperiment = makeMiniCore()
  missingExperiment.experiments = missingExperiment.experiments.filter((e) => e.id !== 'green')
  const r3 = validateContent(missingExperiment)
  assert.equal(r3.ok, false)
  assert.ok(r3.errors.some((e) => e.code === 'MISSING_EXPERIMENT'))

  const noCompleteness = makeMiniCore()
  delete noCompleteness.completeness
  const r4 = validateContent(noCompleteness)
  assert.equal(r4.ok, false)
  assert.ok(r4.errors.some((e) => e.path === 'completeness'))

  const badGap = makeMiniCore()
  badGap.completeness.gaps = [{ item: '缺一项', why: '内容缺口' }]
  const r5 = validateContent(badGap)
  assert.equal(r5.ok, true)
  assert.ok(r5.warnings.some((w) => w.code === 'GAP_PATH'))
})

test('validateContent 对非法输入不抛异常', () => {
  for (const bad of [null, undefined, 42, 'core', [], {}]) {
    const r = validateContent(bad)
    assert.equal(r.ok, false)
    assert.ok(Array.isArray(r.errors) && Array.isArray(r.warnings))
  }
})

test('当前 data/core.json 通过 validateContent（内容组 v2 交付后自动生效）', (t) => {
  const corePath = fileURLToPath(new URL('../../data/core.json', import.meta.url))
  if (!existsSync(corePath)) return t.skip('data/core.json 不存在')
  let core
  try {
    core = JSON.parse(readFileSync(corePath, 'utf8'))
  } catch (err) {
    return t.skip(`data/core.json 无法解析：${err.message}`)
  }
  if (core.schemaVersion !== 2) {
    return t.skip('内容组尚未交付 v2 core.json；届时用真实文件重跑本用例')
  }
  const result = validateContent(core)
  assert.equal(result.ok, true, `当前 data/core.json 校验失败：${JSON.stringify(result.errors.slice(0, 5))}`)
  console.log(
    `[content] data/core.json v2 通过：nodes=${core.nodes.length} relations=${core.relations.length} claims=${core.claims.length} sources=${core.sources.length} warnings=${result.warnings.length}`,
  )
})
