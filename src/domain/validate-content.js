/**
 * 掌控 · 领域层内容包校验（纯函数，无 IO、无第三方依赖）
 *
 * 契约：docs/refactor-spec.md 第 3 节（内容包 schema v2 与 7 条内容约束）。
 * 导出 validateContent(core) → { ok, errors, warnings }，供 host 加载 content 与
 * test/content 使用。错误 = 结构/引用/类型问题；警告 = 文本与质量启发式（不阻断加载）。
 */

import { EXPERIMENT_MODELS } from './experiments.js'

export const CONTENT_SCHEMA_VERSION = 2

/** v1 内容包的 24 个节点 id；v2 必须原样保留（旧笔记/预测/实验引用的闭合依赖它）。 */
export const LEGACY_NODE_IDS = Object.freeze([
  'boundary',
  'goal',
  'observer',
  'feedback',
  'positive',
  'variety',
  'delay',
  'stability',
  'sampling',
  'measurement',
  'blackbox',
  'homeostat',
  'actuator',
  'adaptation',
  'pi',
  'model',
  'robust',
  'tradeoff',
  'vsm',
  'cybersyn',
  'indicator',
  'secondorder',
  'responsibility',
  'agentloop',
])

export const RELATION_TYPES = Object.freeze([
  'prerequisite',
  'formal',
  'constraint',
  'parallel',
  'historical',
  'analogy',
  'application',
])

export const MIGRATE_TYPES = Object.freeze(['formal', 'application', 'analogy', 'heuristic'])
export const CLAIM_KINDS = Object.freeze(['formal', 'empirical', 'historical', 'interpretation'])
export const SOURCE_VERIFIED_LEVELS = Object.freeze(['verified', 'secondary', 'unverified'])
export const SOURCE_KINDS = Object.freeze(['paper', 'book', 'article', 'web', 'author-judgment'])
export const NODE_KINDS = Object.freeze(['concept', 'device', 'event'])
export const ERA_PRECISIONS = Object.freeze(['year', 'range', 'unknown'])

const asArray = (v) => (Array.isArray(v) ? v : [])
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isStr = (v) => typeof v === 'string'
const nonEmpty = (v) => isStr(v) && v.trim().length > 0
const isInt = (v) => typeof v === 'number' && Number.isInteger(v)
const isIso = (v) => {
  if (!isStr(v) || v.length < 20) return false
  return Number.isFinite(Date.parse(v)) && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)
}

const HISTORICAL_HINTS = ['历史影响', '不是同一机制', '不是同一', '并非同一', '类比', '不可直接迁移', '不等同于']

export function validateContent(core) {
  const errors = []
  const warnings = []
  const err = (path, code, message) => errors.push({ path, code, message })
  const warn = (path, code, message) => warnings.push({ path, code, message })

  if (!isObj(core)) {
    err('', 'TYPE', '内容包必须是对象')
    return { ok: false, errors, warnings }
  }

  // ── 0. 包外壳 ──────────────────────────────────────────────
  if (core.schemaVersion !== CONTENT_SCHEMA_VERSION) {
    err('schemaVersion', 'SCHEMA_VERSION', `内容包 schemaVersion 必须是 ${CONTENT_SCHEMA_VERSION}，实际为 ${JSON.stringify(core.schemaVersion)}`)
  }
  if (!nonEmpty(core.packId)) err('packId', 'REQUIRED', 'packId 不能为空')
  if (!nonEmpty(core.version)) err('version', 'REQUIRED', 'version 不能为空')
  if (!nonEmpty(core.language)) err('language', 'REQUIRED', 'language 不能为空')
  if (!nonEmpty(core.definitionOfCore)) warn('definitionOfCore', 'QUALITY', 'definitionOfCore 为空')

  const groups = asArray(core.groups)
  const nodes = asArray(core.nodes)
  const relations = asArray(core.relations)
  const claims = asArray(core.claims)
  const sources = asArray(core.sources)
  const experiments = asArray(core.experiments)

  // ── 1. 拓扑与 id 唯一性 / 24 个旧节点 id ───────────────────
  if (groups.length !== 8) err('groups', 'GROUP_COUNT', `groups 必须恰为 8 个，实际 ${groups.length}`)
  const groupIds = new Set()
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]
    const at = `groups[${i}]`
    if (!isObj(g)) { err(at, 'TYPE', 'group 必须是对象'); continue }
    if (!nonEmpty(g.id)) err(`${at}.id`, 'REQUIRED', 'group.id 不能为空')
    else if (groupIds.has(g.id)) err(`${at}.id`, 'DUPLICATE_ID', `group id 重复：${g.id}`)
    else groupIds.add(g.id)
    if (!isInt(g.order)) err(`${at}.order`, 'TYPE', 'group.order 必须是整数')
    if (!nonEmpty(g.title)) err(`${at}.title`, 'REQUIRED', 'group.title 不能为空')
    if (!nonEmpty(g.question)) warn(`${at}.question`, 'QUALITY', 'group.question 为空（领域尺度要显示「解决什么问题」）')
    if (!nonEmpty(g.capability)) warn(`${at}.capability`, 'QUALITY', 'group.capability 为空')
  }
  const orders = groups.filter(isObj).map((g) => g.order).sort((a, b) => a - b)
  for (let i = 0; i < 8; i++) {
    if (orders[i] !== i + 1) { err('groups', 'GROUP_ORDER', `group.order 必须恰为 1..8，实际为 ${JSON.stringify(orders)}`); break }
  }

  const nodeById = new Map()
  const nodeIds = new Set()
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const at = `nodes[${i}]`
    if (!isObj(node)) { err(at, 'TYPE', 'node 必须是对象'); continue }
    if (!nonEmpty(node.id)) { err(`${at}.id`, 'REQUIRED', 'node.id 不能为空'); continue }
    if (nodeIds.has(node.id)) err(`${at}.id`, 'DUPLICATE_ID', `node id 重复：${node.id}`)
    nodeIds.add(node.id)
    nodeById.set(node.id, node)
    if (!NODE_KINDS.includes(node.kind)) err(`${at}.kind`, 'ENUM', `node.kind 必须是 ${NODE_KINDS.join('|')} 之一`)
    if (!nonEmpty(node.title)) err(`${at}.title`, 'REQUIRED', 'node.title 不能为空')
    if (!nonEmpty(node.def)) err(`${at}.def`, 'REQUIRED', 'node.def 不能为空')
    if (node.groupId !== undefined && !groupIds.has(node.groupId)) err(`${at}.groupId`, 'DANGLING_REF', `node.groupId 引用了不存在的分组：${node.groupId}`)
    if (!MIGRATE_TYPES.includes(node.migrateType)) err(`${at}.migrateType`, 'ENUM', `node.migrateType 必须是 ${MIGRATE_TYPES.join('|')} 之一（不得沿用旧的 theorem）`)
    for (const field of ['can', 'mech', 'limits', 'counter', 'check']) {
      if (!nonEmpty(node[field])) warn(`${at}.${field}`, 'QUALITY', `node.${field} 为空`)
    }
    if (node.aliases !== undefined && !Array.isArray(node.aliases)) err(`${at}.aliases`, 'TYPE', 'aliases 必须是数组')
    if (node.practiceStages !== undefined) {
      if (!Array.isArray(node.practiceStages)) err(`${at}.practiceStages`, 'TYPE', 'practiceStages 必须是数组')
      else if (!node.practiceStages.length) warn(`${at}.practiceStages`, 'QUALITY', 'practiceStages 为空')
    }
    for (const field of ['claimIds', 'sourceIds']) {
      if (node[field] !== undefined && !Array.isArray(node[field])) err(`${at}.${field}`, 'TYPE', `${field} 必须是数组`)
    }
    if (node.compat !== undefined && !isObj(node.compat)) err(`${at}.compat`, 'TYPE', 'compat 必须是对象')
    validateEra(node, at, err, warn)
  }

  const missingLegacy = LEGACY_NODE_IDS.filter((id) => !nodeIds.has(id))
  if (missingLegacy.length) {
    err('nodes', 'LEGACY_IDS', `必须保留 24 个旧节点 id，缺少：${missingLegacy.join(', ')}`)
  }

  // ── 2. 引用闭合 ────────────────────────────────────────────
  const relationIds = new Set()
  for (let i = 0; i < relations.length; i++) {
    const relation = relations[i]
    const at = `relations[${i}]`
    if (!isObj(relation)) { err(at, 'TYPE', 'relation 必须是对象'); continue }
    if (!nonEmpty(relation.id)) err(`${at}.id`, 'REQUIRED', 'relation.id 不能为空（稳定 id，不用数组下标）')
    else if (relationIds.has(relation.id)) err(`${at}.id`, 'DUPLICATE_ID', `relation id 重复：${relation.id}`)
    else relationIds.add(relation.id)
    if (!nodeIds.has(relation.from)) err(`${at}.from`, 'DANGLING_REF', `relation.from 引用了不存在的节点：${relation.from}`)
    if (!nodeIds.has(relation.to)) err(`${at}.to`, 'DANGLING_REF', `relation.to 引用了不存在的节点：${relation.to}`)
    if (!RELATION_TYPES.includes(relation.type)) err(`${at}.type`, 'ENUM', `relation.type 必须是 ${RELATION_TYPES.join('|')} 之一（theorem/history 等旧值不允许）`)
    for (const field of ['claim', 'condition', 'cost']) {
      if (!nonEmpty(relation[field])) err(`${at}.${field}`, 'REQUIRED', `relation.${field} 不能为空`)
    }
    if (!Array.isArray(relation.claimIds) || relation.claimIds.length < 1) {
      err(`${at}.claimIds`, 'REQUIRED', 'relation.claimIds 至少要有 1 个主张')
    }
    if (relation.version !== undefined && (!isInt(relation.version) || relation.version < 1)) {
      err(`${at}.version`, 'RANGE', 'relation.version 必须是 ≥1 的整数')
    }
  }

  const claimIds = new Set()
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i]
    const at = `claims[${i}]`
    if (!isObj(claim)) { err(at, 'TYPE', 'claim 必须是对象'); continue }
    if (!nonEmpty(claim.id)) err(`${at}.id`, 'REQUIRED', 'claim.id 不能为空')
    else if (claimIds.has(claim.id)) err(`${at}.id`, 'DUPLICATE_ID', `claim id 重复：${claim.id}`)
    else claimIds.add(claim.id)
    if (!isObj(claim.subject)) err(`${at}.subject`, 'TYPE', 'claim.subject 必须是 {kind,id}')
    else if (claim.subject.kind === 'node') {
      if (!nodeIds.has(claim.subject.id)) err(`${at}.subject.id`, 'DANGLING_REF', `claim.subject 引用了不存在的节点：${claim.subject.id}`)
    } else if (claim.subject.kind === 'relation') {
      if (!relationIds.has(claim.subject.id)) err(`${at}.subject.id`, 'DANGLING_REF', `claim.subject 引用了不存在的关系：${claim.subject.id}`)
    } else {
      err(`${at}.subject.kind`, 'ENUM', 'claim.subject.kind 必须是 node|relation')
    }
    if (!nonEmpty(claim.text)) err(`${at}.text`, 'REQUIRED', 'claim.text 不能为空')
    if (!CLAIM_KINDS.includes(claim.kind)) err(`${at}.kind`, 'ENUM', `claim.kind 必须是 ${CLAIM_KINDS.join('|')} 之一`)
    if (!Array.isArray(claim.sourceIds) || claim.sourceIds.length < 1) {
      err(`${at}.sourceIds`, 'REQUIRED', 'claim 至少要有 1 个来源')
    }
    if (!SOURCE_VERIFIED_LEVELS.includes(claim.verified)) err(`${at}.verified`, 'ENUM', `claim.verified 必须是 ${SOURCE_VERIFIED_LEVELS.join('|')} 之一`)
    if (claim.verifiedAt !== null && claim.verifiedAt !== undefined && !isIso(claim.verifiedAt)) {
      err(`${at}.verifiedAt`, 'ISO', 'claim.verifiedAt 必须是 ISO 8601 时间戳或 null')
    }
  }

  const sourceIds = new Set()
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i]
    const at = `sources[${i}]`
    if (!isObj(source)) { err(at, 'TYPE', 'source 必须是对象'); continue }
    if (!nonEmpty(source.id)) err(`${at}.id`, 'REQUIRED', 'source.id 不能为空')
    else if (sourceIds.has(source.id)) err(`${at}.id`, 'DUPLICATE_ID', `source id 重复：${source.id}`)
    else sourceIds.add(source.id)
    if (!nonEmpty(source.title)) err(`${at}.title`, 'REQUIRED', 'source.title 不能为空')
    if (!SOURCE_KINDS.includes(source.kind)) err(`${at}.kind`, 'ENUM', `source.kind 必须是 ${SOURCE_KINDS.join('|')} 之一`)
    if (!SOURCE_VERIFIED_LEVELS.includes(source.verified)) err(`${at}.verified`, 'ENUM', `source.verified 必须是 ${SOURCE_VERIFIED_LEVELS.join('|')} 之一`)
    const hasUrlOrDoi = nonEmpty(source.url) || nonEmpty(source.doi)
    if (source.verified === 'verified' && !hasUrlOrDoi) {
      err(`${at}.url`, 'SOURCE_UNVERIFIED_LINK', 'verified 来源必须附可打开的 url 或 doi')
    }
    if (source.verified === 'secondary' && !hasUrlOrDoi) {
      err(`${at}.url`, 'SOURCE_UNVERIFIED_LINK', 'secondary 来源必须附 url 或 doi')
    }
    if (source.verified === 'verified' && !isIso(source.verifiedAt)) {
      err(`${at}.verifiedAt`, 'ISO', 'verified 来源必须带 ISO 8601 的 verifiedAt')
    }
    if (source.verified === 'unverified' && !nonEmpty(source.note)) {
      warn(`${at}.note`, 'SOURCE_NOTE', 'unverified 来源应写 note 说明检索路径')
    }
    if (source.verified !== 'unverified' && !nonEmpty(source.note)) {
      warn(`${at}.note`, 'QUALITY', '来源应写 note 说明核验到什么程度')
    }
    if (source.year !== null && source.year !== undefined && !isInt(source.year)) err(`${at}.year`, 'TYPE', 'source.year 必须是整数或 null')
    if (source.url !== null && source.url !== undefined && !isStr(source.url)) err(`${at}.url`, 'TYPE', 'source.url 必须是字符串或 null')
    if (source.doi !== null && source.doi !== undefined && !isStr(source.doi)) err(`${at}.doi`, 'TYPE', 'source.doi 必须是字符串或 null')
  }

  // 交叉引用：node / relation 的 claimIds、sourceIds
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (!isObj(node)) continue
    for (const [field, pool, poolName] of [
      ['claimIds', claimIds, '主张'],
      ['sourceIds', sourceIds, '来源'],
    ]) {
      for (const ref of asArray(node[field])) {
        if (!pool.has(ref)) err(`nodes[${i}].${field}`, 'DANGLING_REF', `引用了不存在的${poolName}：${ref}`)
      }
    }
  }
  for (let i = 0; i < relations.length; i++) {
    const relation = relations[i]
    if (!isObj(relation)) continue
    for (const ref of asArray(relation.claimIds)) {
      if (!claimIds.has(ref)) err(`relations[${i}].claimIds`, 'DANGLING_REF', `引用了不存在的主张：${ref}`)
    }
  }
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i]
    if (!isObj(claim)) continue
    for (const ref of asArray(claim.sourceIds)) {
      if (!sourceIds.has(ref)) err(`claims[${i}].sourceIds`, 'DANGLING_REF', `引用了不存在的来源：${ref}`)
    }
  }

  // ── 4. formal 语义白名单：形式结果只能挂 form 类主张 ────────
  const claimById = new Map(claims.filter(isObj).map((c) => [c.id, c]))
  for (let i = 0; i < relations.length; i++) {
    const relation = relations[i]
    if (!isObj(relation) || relation.type !== 'formal') continue
    const linked = asArray(relation.claimIds).map((id) => claimById.get(id)).filter(Boolean)
    if (linked.length && !linked.some((claim) => claim.kind === 'formal')) {
      err(`relations[${i}]`, 'FORMAL_MISLABEL', 'type=formal 的关系必须挂 formal 类主张；历史解释/类比/一般联系不得标为定理')
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (!isObj(node) || node.migrateType !== 'formal') continue
    const linked = asArray(node.claimIds).map((id) => claimById.get(id)).filter(Boolean)
    if (linked.length && !linked.some((claim) => claim.kind === 'formal')) {
      warn(`nodes[${i}].migrateType`, 'FORMAL_MISLABEL', 'node.migrateType=formal 但没有 formal 类主张')
    }
  }

  // ── 7. 历史/类比关系必须点明「不是同一机制 / 历史影响」 ─────
  for (let i = 0; i < relations.length; i++) {
    const relation = relations[i]
    if (!isObj(relation) || !['historical', 'analogy'].includes(relation.type)) continue
    const text = [relation.claim, relation.condition, relation.cost].filter(isStr).join(' ')
    if (!HISTORICAL_HINTS.some((hint) => text.includes(hint))) {
      warn(`relations[${i}]`, 'SEMANTIC_HINT', `type=${relation.type} 的文本应点明「这不是同一机制 / 这是历史影响」`)
    }
  }

  // ── group.entryNodeId 与 experiments ───────────────────────
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    if (!isObj(group) || group.entryNodeId === undefined) continue
    if (!nodeIds.has(group.entryNodeId)) err(`groups[${i}].entryNodeId`, 'DANGLING_REF', `group.entryNodeId 引用了不存在的节点：${group.entryNodeId}`)
    else if (nodeById.get(group.entryNodeId) && nodeById.get(group.entryNodeId).groupId !== group.id) {
      warn(`groups[${i}].entryNodeId`, 'GROUP_ENTRY', `入口节点 ${group.entryNodeId} 不属于该分组`)
    }
  }

  const experimentIds = new Set()
  for (let i = 0; i < experiments.length; i++) {
    const exp = experiments[i]
    const at = `experiments[${i}]`
    if (!isObj(exp)) { err(at, 'TYPE', 'experiment 必须是对象'); continue }
    if (!nonEmpty(exp.id)) err(`${at}.id`, 'REQUIRED', 'experiment.id 不能为空')
    else if (experimentIds.has(exp.id)) err(`${at}.id`, 'DUPLICATE_ID', `experiment id 重复：${exp.id}`)
    else experimentIds.add(exp.id)
    if (!isInt(exp.order)) err(`${at}.order`, 'TYPE', 'experiment.order 必须是整数')
    for (const field of ['title', 'question', 'modelId']) {
      if (!nonEmpty(exp[field])) err(`${at}.${field}`, 'REQUIRED', `experiment.${field} 不能为空`)
    }
    for (const ref of asArray(exp.conceptNodeIds)) {
      if (!nodeIds.has(ref)) err(`${at}.conceptNodeIds`, 'DANGLING_REF', `引用了不存在的节点：${ref}`)
    }
    const model = EXPERIMENT_MODELS[exp.id]
    if (model) {
      if (exp.modelId !== model.id) err(`${at}.modelId`, 'MODEL_MISMATCH', `experiment.${exp.id}.modelId 必须是 ${model.id}（与 src/domain/experiments.js 一致）`)
      if (exp.modelVersion !== model.version) err(`${at}.modelVersion`, 'MODEL_MISMATCH', `experiment.${exp.id}.modelVersion 必须是 ${model.version}`)
    } else if (['delay', 'proxy', 'green'].includes(exp.id)) {
      err(`${at}.id`, 'MODEL_MISMATCH', `实验 ${exp.id} 缺少对应的 domain 模型`)
    }
    if (!nonEmpty(exp.subtitle)) warn(`${at}.subtitle`, 'QUALITY', 'experiment.subtitle 为空')
    if (!nonEmpty(exp.note)) warn(`${at}.note`, 'QUALITY', 'experiment.note 为空（应说明这是教学模型）')
  }
  for (const required of ['delay', 'proxy', 'green']) {
    if (!experimentIds.has(required)) err('experiments', 'MISSING_EXPERIMENT', `缺少实验 ${required}`)
  }

  // ── completeness 逐项交代 ──────────────────────────────────
  validateCompleteness(core.completeness, nodeIds, err, warn)

  return { ok: errors.length === 0, errors, warnings }
}

function validateEra(node, at, err, warn) {
  const precision = node.eraPrecision
  if (precision === undefined) {
    warn(`${at}.eraPrecision`, 'ERA', '缺少 eraPrecision（应为 year|range|unknown）')
    return
  }
  if (!ERA_PRECISIONS.includes(precision)) {
    err(`${at}.eraPrecision`, 'ENUM', `eraPrecision 必须是 ${ERA_PRECISIONS.join('|')} 之一`)
    return
  }
  if (precision === 'unknown') {
    if (node.eraStart !== null && node.eraStart !== undefined) err(`${at}.eraStart`, 'ERA', "eraPrecision=unknown 时 eraStart 必须为 null（历史视图显示「时间不确定」）")
    if (node.eraEnd !== null && node.eraEnd !== undefined) err(`${at}.eraEnd`, 'ERA', 'eraPrecision=unknown 时 eraEnd 必须为 null')
    return
  }
  if (!isInt(node.eraStart)) {
    err(`${at}.eraStart`, 'ERA', '已知时代时 eraStart 必须是整数年份')
    return
  }
  if (precision === 'year') {
    if (node.eraEnd !== undefined && node.eraEnd !== null && node.eraEnd !== node.eraStart) {
      err(`${at}.eraEnd`, 'ERA', 'eraPrecision=year 时 eraEnd 必须等于 eraStart（或用 range）')
    }
  } else if (precision === 'range') {
    if (!isInt(node.eraEnd)) err(`${at}.eraEnd`, 'ERA', 'eraPrecision=range 时 eraEnd 必须是整数年份')
    else if (node.eraEnd < node.eraStart) err(`${at}.eraEnd`, 'ERA', 'eraEnd 不能早于 eraStart')
  }
}

function validateCompleteness(completeness, nodeIds, err, warn) {
  if (!isObj(completeness)) {
    err('completeness', 'REQUIRED', 'content.completeness 必须逐项交代 baselineCount/included/added/merged/excluded/gaps')
    return
  }
  if (!isInt(completeness.baselineCount)) err('completeness.baselineCount', 'TYPE', 'baselineCount 必须是整数')
  const arrays = ['included', 'added', 'merged', 'excluded', 'gaps']
  for (const field of arrays) {
    if (!Array.isArray(completeness[field])) err(`completeness.${field}`, 'TYPE', `completeness.${field} 必须是数组`)
  }
  asArray(completeness.added).forEach((item, i) => {
    if (!isObj(item) || !nonEmpty(item.id) || !nonEmpty(item.why)) err(`completeness.added[${i}]`, 'SHAPE', 'added 项必须是 {id, why}')
    else if (!nodeIds.has(item.id)) warn(`completeness.added[${i}].id`, 'DANGLING_REF', `新增节点 id 不在 nodes 中：${item.id}`)
  })
  asArray(completeness.merged).forEach((item, i) => {
    if (!isObj(item) || !Array.isArray(item.from) || !nonEmpty(item.to) || !nonEmpty(item.reason)) {
      err(`completeness.merged[${i}]`, 'SHAPE', 'merged 项必须是 {from:[], to, reason}')
    } else if (!nodeIds.has(item.to)) {
      warn(`completeness.merged[${i}].to`, 'DANGLING_REF', `合并去向不在 nodes 中：${item.to}`)
    }
  })
  asArray(completeness.excluded).forEach((item, i) => {
    if (!isObj(item) || !nonEmpty(item.item) || !nonEmpty(item.reason)) err(`completeness.excluded[${i}]`, 'SHAPE', 'excluded 项必须是 {item, reason}')
  })
  asArray(completeness.gaps).forEach((item, i) => {
    if (!isObj(item) || !nonEmpty(item.item) || !nonEmpty(item.why)) err(`completeness.gaps[${i}]`, 'SHAPE', 'gaps 项必须是 {item, why, searchPath}')
    else if (!nonEmpty(item.searchPath)) warn(`completeness.gaps[${i}].searchPath`, 'GAP_PATH', '缺口应给检索路径（不编年表、不编来源）')
  })
  if (Array.isArray(completeness.included) && isInt(completeness.baselineCount) && completeness.included.length + asArray(completeness.merged).length < completeness.baselineCount) {
    warn('completeness.included', 'COMPLETENESS', 'included + merged 数量少于 baselineCount，逐项交代可能不完整')
  }
}
