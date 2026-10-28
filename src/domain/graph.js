/**
 * 掌控 · 领域层图谱查询（纯函数，无 IO、无 ctx、无第三方依赖）
 *
 * 契约：docs/refactor-spec.md 第 3 节（内容包 v2）与第 6 节（三尺度/三视角）。
 * host 与 client 用同一套语义；client 会复制编译，不直接 import 本文件。
 */

import { subjectKey } from './schema.js'

export const RELATION_TYPE_LABELS = Object.freeze({
  prerequisite: '依赖',
  formal: '形式结果',
  constraint: '限制',
  parallel: '并行',
  historical: '历史影响',
  analogy: '类比',
  application: '工程应用',
})

export const PRACTICE_STAGE_KEYS = Object.freeze(['goal', 'measurement', 'action', 'observation', 'acceptance', 'revision'])

export const PRACTICE_STAGE_LABELS = Object.freeze({
  goal: '目标',
  measurement: '测量',
  action: '行动',
  observation: '观测',
  acceptance: '验收',
  revision: '修订',
})

export const PROJECTIONS = Object.freeze(['theory', 'history', 'practice'])

export const PROJECTION_LABELS = Object.freeze({
  theory: '理论',
  history: '历史',
  practice: '实践',
})

export const SCALE_LABELS = Object.freeze({
  domain: '领域',
  subject: '问题',
  evidence: '证据',
})

const asArray = (value) => (Array.isArray(value) ? value : [])
const nodesOf = (core) => asArray(core && core.nodes)
const relationsOf = (core) => asArray(core && core.relations)
const claimsOf = (core) => asArray(core && core.claims)
const sourcesOf = (core) => asArray(core && core.sources)
const groupsOf = (core) => asArray(core && core.groups)

const byId = (list) => {
  const map = new Map()
  for (const item of list) {
    if (item && typeof item.id === 'string') map.set(item.id, item)
  }
  return map
}

/** 内容索引：node/relation/claim/source/group 的 Map（一次构建，供多次查询）。 */
export function contentIndex(core) {
  const nodes = nodesOf(core)
  return {
    core,
    nodes: byId(nodes),
    relations: byId(relationsOf(core)),
    claims: byId(claimsOf(core)),
    sources: byId(sourcesOf(core)),
    groups: byId(groupsOf(core)),
    nodeOrder: nodes.map((n) => n && n.id).filter((id) => typeof id === 'string'),
  }
}

function ensureIndex(core) {
  if (!core || typeof core !== 'object') return contentIndex({})
  if (core.nodes instanceof Map && core.relations instanceof Map) return core
  return contentIndex(core)
}

export function nodeById(core, id) {
  if (typeof id !== 'string') return null
  return ensureIndex(core).nodes.get(id) || null
}

export function edgeById(core, id) {
  if (typeof id !== 'string') return null
  return ensureIndex(core).relations.get(id) || null
}

export function claimById(core, id) {
  if (typeof id !== 'string') return null
  return ensureIndex(core).claims.get(id) || null
}

export function sourceById(core, id) {
  if (typeof id !== 'string') return null
  return ensureIndex(core).sources.get(id) || null
}

/** 旧 id → 现 id：node.compat.legacyIds 里登记的映射（24 个旧 id 本身保持原 id）。 */
export function resolveNodeId(core, id) {
  if (typeof id !== 'string') return null
  const index = ensureIndex(core)
  if (index.nodes.has(id)) return id
  for (const node of index.nodes.values()) {
    const legacy = asArray(node.compat && node.compat.legacyIds)
    if (legacy.includes(id)) return node.id
  }
  return null
}

export function relationTypeLabel(type) {
  return RELATION_TYPE_LABELS[type] || String(type || '')
}

export function practiceStageLabel(stage) {
  return PRACTICE_STAGE_LABELS[stage] || String(stage || '')
}

/** 关系展示标签，如「延迟 → 稳定性（依赖）」。 */
export function relationLabel(core, relation) {
  if (!relation || typeof relation !== 'object') return ''
  const from = nodeById(core, relation.from)
  const to = nodeById(core, relation.to)
  const fromTitle = (from && from.title) || relation.from || '?'
  const toTitle = (to && to.title) || relation.to || '?'
  return `${fromTitle} → ${toTitle}（${relationTypeLabel(relation.type)}）`
}

/** subject 的展示标题；未知 subject 返回 null。 */
export function subjectLabel(core, subject) {
  if (!subject || typeof subject !== 'object') return null
  if (subject.kind === 'node') {
    const node = nodeById(core, subject.id)
    return node ? node.title : null
  }
  if (subject.kind === 'relation') {
    const relation = edgeById(core, subject.id)
    return relation ? relationLabel(core, relation) : null
  }
  return subject.id || null
}

/** 与某节点相连的全部关系（出边与入边）。 */
export function relationsForNode(core, nodeId) {
  if (typeof nodeId !== 'string') return []
  return relationsOf(core).filter((relation) => relation && (relation.from === nodeId || relation.to === nodeId))
}

const RELATION_WEIGHT = Object.freeze({
  prerequisite: 1,
  formal: 1,
  constraint: 0.9,
  parallel: 0.7,
  application: 0.6,
  historical: 0.5,
  analogy: 0.4,
})

/**
 * 当前节点的邻居 id（不含自身），按相关度排序。
 * 相关度：共同关系数量为主，关系类型权重为辅；同分按 core.nodes 原始顺序稳定排序。
 * 契约要求问题尺度默认 3—7 个邻居。
 */
export function neighbors(core, nodeId, limit = 7) {
  if (typeof nodeId !== 'string' || !nodeId) return []
  const index = ensureIndex(core)
  const scores = new Map()
  for (const relation of index.relations.values()) {
    if (!relation) continue
    let other = null
    if (relation.from === nodeId && typeof relation.to === 'string') other = relation.to
    else if (relation.to === nodeId && typeof relation.from === 'string') other = relation.from
    else continue
    if (other === nodeId) continue
    const weight = RELATION_WEIGHT[relation.type] ?? 0.5
    const prev = scores.get(other) || { score: 0, count: 0, weight: 0 }
    prev.score += 1 + weight
    prev.count += 1
    prev.weight = Math.max(prev.weight, weight)
    scores.set(other, prev)
  }
  const order = new Map(index.nodeOrder.map((id, i) => [id, i]))
  const ids = [...scores.keys()]
    .filter((id) => index.nodes.has(id))
    .sort((a, b) => {
      const sa = scores.get(a)
      const sb = scores.get(b)
      if (sb.count !== sa.count) return sb.count - sa.count
      if (sb.score !== sa.score) return sb.score - sa.score
      return (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER)
    })
  const max = Number.isInteger(limit) && limit > 0 ? limit : 7
  return ids.slice(0, max)
}

function relationItem(core, relation) {
  const from = nodeById(core, relation.from)
  const to = nodeById(core, relation.to)
  return {
    id: relation.id,
    from: relation.from,
    to: relation.to,
    fromTitle: (from && from.title) || relation.from,
    toTitle: (to && to.title) || relation.to,
    type: relation.type,
    typeLabel: relationTypeLabel(relation.type),
    claim: relation.claim || '',
    condition: relation.condition || '',
    cost: relation.cost || '',
    claimIds: asArray(relation.claimIds),
    version: relation.version ?? 1,
  }
}

const THEORY_LAYERS = [
  { key: 'prerequisite', label: '依赖/先修', types: ['prerequisite'] },
  { key: 'formal', label: '形式结果', types: ['formal'] },
  { key: 'constraint', label: '限制与代价', types: ['constraint'] },
  { key: 'parallel', label: '并行取舍', types: ['parallel'] },
  { key: 'application', label: '工程应用', types: ['application'] },
  { key: 'context', label: '历史与类比（不是同一机制）', types: ['historical', 'analogy'] },
]

function theoryLayers(core) {
  const relations = relationsOf(core)
  return THEORY_LAYERS.map((layer) => ({
    key: layer.key,
    label: layer.label,
    items: relations.filter((r) => r && layer.types.includes(r.type)).map((r) => relationItem(core, r)),
  }))
}

function nodeEra(node) {
  const precision = node && node.eraPrecision ? node.eraPrecision : 'unknown'
  if (precision === 'unknown' || node.eraStart === null || node.eraStart === undefined) return { unknown: true, start: null, end: null }
  const start = Number(node.eraStart)
  const end = node.eraEnd === null || node.eraEnd === undefined ? start : Number(node.eraEnd)
  return { unknown: !Number.isFinite(start), start, end: Number.isFinite(end) ? end : start }
}

function timelineEntry(core, node) {
  const era = nodeEra(node)
  const group = node.groupId ? ensureIndex(core).groups.get(node.groupId) : null
  return {
    id: node.id,
    title: node.title || node.id,
    kind: node.kind || 'concept',
    groupId: node.groupId || null,
    groupTitle: (group && group.title) || null,
    era: node.era || '',
    eraStart: era.start,
    eraEnd: era.end,
    eraPrecision: node.eraPrecision || 'unknown',
    uncertain: era.unknown,
  }
}

/** 历史视角：按时代区间排序的节点/事件 + 不确定带 + 著作/来源。 */
export function timeline(core) {
  const nodes = nodesOf(core).filter((n) => n && typeof n.id === 'string')
  const entries = nodes.map((node) => timelineEntry(core, node))
  const dated = entries
    .filter((entry) => !entry.uncertain)
    .sort((a, b) => (a.eraStart - b.eraStart) || String(a.title).localeCompare(String(b.title), 'zh-Hans-CN'))
  const uncertain = entries
    .filter((entry) => entry.uncertain)
    .sort((a, b) => String(a.title).localeCompare(String(b.title), 'zh-Hans-CN'))
  const sources = sourcesOf(core)
    .filter((s) => s && typeof s.id === 'string')
    .map((s) => ({
      id: s.id,
      title: s.title || s.id,
      author: s.author || '',
      year: Number.isFinite(Number(s.year)) ? Number(s.year) : null,
      kind: s.kind || 'book',
      verified: s.verified || 'unverified',
      url: s.url || null,
    }))
    .sort((a, b) => (a.year ?? Number.MAX_SAFE_INTEGER) - (b.year ?? Number.MAX_SAFE_INTEGER))
  return {
    projection: 'history',
    items: dated.concat(uncertain),
    groups: [
      { key: 'timeline', label: '按时间区间', items: dated },
      { key: 'unknown', label: '时间不确定', items: uncertain },
      { key: 'sources', label: '著作与文献', items: sources },
    ],
  }
}

/** 实践视角：目标 → 测量 → 行动 → 观测 → 验收 → 修订 的工作回路。 */
export function practiceLoop(core) {
  const nodes = nodesOf(core).filter((n) => n && typeof n.id === 'string')
  const stages = PRACTICE_STAGE_KEYS.map((key) => {
    const stageNodes = nodes
      .filter((node) => asArray(node.practiceStages).includes(key))
      .map((node) => ({
        id: node.id,
        title: node.title || node.id,
        groupId: node.groupId || null,
        migrate: node.migrate || '',
        migrateType: node.migrateType || 'application',
      }))
    return { key, label: PRACTICE_STAGE_LABELS[key], nodeIds: stageNodes.map((n) => n.id), nodes: stageNodes }
  })
  return { projection: 'practice', stages, groups: stages.map((s) => ({ key: s.key, label: s.label, items: s.nodes })) }
}

/**
 * 视角投影：同一份内容的不同布局。
 * @param {object} core 内容包 v2
 * @param {'theory'|'history'|'practice'} projection
 */
export function projectionLayers(core, projection = 'theory') {
  if (projection === 'history') return timeline(core)
  if (projection === 'practice') return practiceLoop(core)
  return { projection: 'theory', label: PROJECTION_LABELS.theory, groups: theoryLayers(core) }
}

/** 领域尺度：8 个单元（解决什么问题，而不是节点数量）。 */
export function domainGroups(core) {
  const groups = groupsOf(core)
  const index = ensureIndex(core)
  return groups
    .filter((g) => g && typeof g.id === 'string')
    .slice()
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((group) => {
      const entry = group.entryNodeId ? index.nodes.get(group.entryNodeId) : null
      return {
        id: group.id,
        order: group.order,
        title: group.title || group.id,
        question: group.question || '',
        capability: group.capability || '',
        entryNodeId: group.entryNodeId || null,
        entryNodeTitle: (entry && entry.title) || null,
      }
    })
}

/** 证据尺度：某个 subject 上已挂载的笔记/实验/预测/任务入口（store 由 host 传入）。 */
export function evidenceForSubject(core, store, subject) {
  const key = typeof subject === 'string' ? subject : subjectKey(subject)
  const colon = key ? key.indexOf(':') : -1
  const subjectId = colon > 0 ? key.slice(colon + 1) : null
  const notes = []
  const runs = []
  const predictions = []
  const tasks = []
  if (store && typeof store === 'object') {
    const matches = (candidate) => candidate && typeof candidate === 'object' && subjectKey(candidate.subject) === key
    for (const note of Object.values(store.notes || {})) if (matches(note)) notes.push(note)
    for (const run of Object.values(store.experiments || {})) if (matches(run)) runs.push(run)
    for (const prediction of Object.values(store.predictions || {})) if (matches(prediction)) predictions.push(prediction)
    const evidenceIds = new Set([
      ...notes.map((n) => n.id),
      ...runs.map((r) => r.id),
      ...predictions.map((p) => p.id),
    ])
    for (const task of Object.values(store.tasks || {})) {
      if (!task || typeof task !== 'object') continue
      const concepts = asArray(task.conceptIds)
      const refs = asArray(task.evidenceRefs)
      if ((subjectId && concepts.includes(subjectId)) || refs.some((ref) => ref && evidenceIds.has(ref.id))) {
        tasks.push(task)
      }
    }
  }
  return { subject: key, notes, runs, predictions, tasks }
}
