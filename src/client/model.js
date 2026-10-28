/**
 * 内容模型：core.json v2 的索引与派生视图。
 *
 * 纯函数（不依赖 React / DOM），node --test 可直接 import。
 * 输入允许是尚未升级的 v1 core（edges/src 字段），这里做良性归一化，
 * 保证 Host 升级与内容包升级之间页面仍然可读。
 */

const RELATION_TYPES = [
  'prerequisite',
  'formal',
  'constraint',
  'application',
  'analogy',
  'parallel',
  'historical',
]

const TYPE_PRIORITY = {
  formal: 0,
  prerequisite: 1,
  constraint: 2,
  application: 3,
  analogy: 4,
  parallel: 5,
  historical: 6,
}

const V1_TYPE_MAP = {
  theorem: 'formal',
  application: 'application',
  history: 'historical',
  parallel: 'parallel',
  analogy: 'analogy',
  constraint: 'constraint',
  prerequisite: 'prerequisite',
  heuristic: 'analogy',
}

export function normalizeRelationType(type) {
  if (RELATION_TYPES.includes(type)) return type
  if (V1_TYPE_MAP[type]) return V1_TYPE_MAP[type]
  return 'constraint'
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

/** 从 v1 的 "1868" / "1868—1947" / "" 推测 era 字段（不编造，解析不出就 unknown）。 */
function legacyEra(node) {
  if (typeof node.eraStart === 'number') {
    return {
      eraStart: node.eraStart,
      eraEnd: typeof node.eraEnd === 'number' ? node.eraEnd : node.eraStart,
      eraPrecision: node.eraPrecision || (node.eraEnd === node.eraStart ? 'year' : 'range'),
    }
  }
  const text = String(node.era || '')
  const years = text.match(/-?\d{3,4}/g)
  if (!years || years.length === 0) {
    return { eraStart: null, eraEnd: null, eraPrecision: 'unknown' }
  }
  if (years.length === 1) {
    const year = Number(years[0])
    return { eraStart: year, eraEnd: year, eraPrecision: 'year' }
  }
  return { eraStart: Number(years[0]), eraEnd: Number(years[years.length - 1]), eraPrecision: 'range' }
}

function legacySources(node) {
  const out = []
  for (const [index, source] of toArray(node.src).entries()) {
    if (!source || typeof source !== 'object') continue
    const verifiedText = String(source.status || '')
    const verified =
      verifiedText.includes('已核验') || verifiedText === 'verified'
        ? 'verified'
        : verifiedText.includes('二手') || verifiedText === 'secondary'
          ? 'secondary'
          : 'unverified'
    out.push({
      id: `legacy:${node.id}:${index}`,
      title: source.title || '(未命名来源)',
      author: source.author || '',
      year: source.year === undefined ? null : source.year,
      kind: source.kind || 'book',
      ref: source.ref || '',
      url: source.url || null,
      doi: source.doi || null,
      verified,
      verifiedAt: source.verifiedAt || null,
      note: source.note || '旧版本内联来源，未做主张级核验。',
      legacy: true,
    })
  }
  return out
}

function legacyExperiments(core) {
  return toArray(core.experiments).map((experiment, index) => {
    const conceptText = String(experiment.concept || '')
    const conceptNodeIds = toArray(experiment.conceptNodeIds).length
      ? toArray(experiment.conceptNodeIds)
      : conceptText
          .split(/[/,，、\s]+/)
          .map((part) => part.trim())
          .filter(Boolean)
    return {
      id: experiment.id || `experiment-${index}`,
      order: experiment.order || index + 1,
      title: experiment.title || `实验 ${index + 1}`,
      subtitle: experiment.subtitle || '',
      question: experiment.question || '',
      modelId: experiment.modelId || '',
      modelVersion: experiment.modelVersion || null,
      conceptNodeIds,
      note: experiment.note || '',
    }
  })
}

/**
 * 构建内容索引。
 * @param {object|null} core
 * @returns {object} 索引对象；所有 list 都是稳定顺序。
 */
export function indexCore(core) {
  const source = core && typeof core === 'object' ? core : {}

  const groups = toArray(source.groups)
    .map((group, index) => ({
      id: group.id || `group-${index}`,
      order: Number.isFinite(group.order) ? group.order : index + 1,
      title: group.title || group.id || `单元 ${index + 1}`,
      question: group.question || '',
      capability: group.capability || '',
      entryNodeId: group.entryNodeId || null,
    }))
    .sort((a, b) => a.order - b.order)

  const rawRelations = toArray(source.relations).length ? toArray(source.relations) : toArray(source.edges)
  const relations = rawRelations.map((relation, index) => ({
    id: relation.id || `e.${relation.from || '?'}-${relation.to || '?'}-${index}`,
    from: relation.from,
    to: relation.to,
    type: normalizeRelationType(relation.type),
    claim: relation.claim || relation.title || '',
    condition: relation.condition || '',
    cost: relation.cost || '',
    claimIds: toArray(relation.claimIds),
    version: relation.version || 1,
  }))

  const legacySourceList = []
  const nodes = toArray(source.nodes).map((node) => {
    const era = legacyEra(node)
    const nodeSources = legacySources(node)
    legacySourceList.push(...nodeSources)
    return {
      id: node.id,
      groupId: node.groupId || null,
      kind: node.kind || 'concept',
      title: node.title || node.id,
      aliases: toArray(node.aliases),
      era: node.era || '',
      eraStart: era.eraStart,
      eraEnd: era.eraEnd,
      eraPrecision: era.eraPrecision,
      def: node.def || '',
      can: node.can || '',
      mech: node.mech || '',
      limits: node.limits || '',
      counter: node.counter || '',
      check: node.check || '',
      hist: node.hist || '',
      migrate: node.migrate || '',
      migrateType: node.migrateType || 'analogy',
      practiceStages: toArray(node.practiceStages),
      claimIds: toArray(node.claimIds),
      sourceIds: toArray(node.sourceIds),
      legacySources: nodeSources,
    }
  })

  const claims = toArray(source.claims).map((claim, index) => ({
    id: claim.id || `claim-${index}`,
    subject: claim.subject || null,
    text: claim.text || '',
    kind: claim.kind || 'interpretation',
    sourceIds: toArray(claim.sourceIds),
    verified: claim.verified || 'unverified',
    verifiedAt: claim.verifiedAt || null,
  }))

  const declaredSources = toArray(source.sources).map((entry, index) => ({
    id: entry.id || `source-${index}`,
    title: entry.title || '(未命名来源)',
    author: entry.author || '',
    year: entry.year === undefined ? null : entry.year,
    kind: entry.kind || 'book',
    ref: entry.ref || '',
    url: entry.url || null,
    doi: entry.doi || null,
    verified: entry.verified || 'unverified',
    verifiedAt: entry.verifiedAt || null,
    verifiedBy: entry.verifiedBy || '',
    note: entry.note || '',
  }))
  const sources = declaredSources.concat(legacySourceList)

  const experiments = legacyExperiments(source).sort((a, b) => (a.order || 0) - (b.order || 0))

  const nodesById = new Map()
  for (const node of nodes) nodesById.set(node.id, node)
  const relationsById = new Map()
  for (const relation of relations) relationsById.set(relation.id, relation)
  const claimsById = new Map()
  for (const claim of claims) claimsById.set(claim.id, claim)
  const sourcesById = new Map()
  for (const entry of sources) sourcesById.set(entry.id, entry)
  const groupsById = new Map()
  for (const group of groups) groupsById.set(group.id, group)
  const experimentsById = new Map()
  for (const experiment of experiments) experimentsById.set(experiment.id, experiment)

  const nodesByGroup = new Map()
  for (const group of groups) nodesByGroup.set(group.id, [])
  for (const node of nodes) {
    if (!node.groupId) continue
    if (!nodesByGroup.has(node.groupId)) nodesByGroup.set(node.groupId, [])
    nodesByGroup.get(node.groupId).push(node)
  }

  const relationsByNode = new Map()
  const outgoing = new Map()
  const incoming = new Map()
  for (const node of nodes) {
    relationsByNode.set(node.id, [])
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  }
  for (const relation of relations) {
    if (relationsByNode.has(relation.from)) relationsByNode.get(relation.from).push(relation)
    if (relationsByNode.has(relation.to)) relationsByNode.get(relation.to).push(relation)
    if (outgoing.has(relation.from)) outgoing.get(relation.from).push(relation)
    if (incoming.has(relation.to)) incoming.get(relation.to).push(relation)
  }

  return {
    raw: source,
    packId: source.packId || '',
    version: source.version || '',
    language: source.language || '',
    completeness: source.completeness || null,
    groups,
    nodes,
    relations,
    claims,
    sources,
    experiments,
    nodesById,
    relationsById,
    claimsById,
    sourcesById,
    groupsById,
    experimentsById,
    nodesByGroup,
    relationsByNode,
    outgoing,
    incoming,
    hasContent: nodes.length > 0,
  }
}

export function emptyCoreIndex() {
  return indexCore({ groups: [], nodes: [], relations: [], claims: [], sources: [], experiments: [] })
}

/* ─────────────────────────── 标签 ─────────────────────────── */

export function relationTypeLabel(t, type) {
  const known = RELATION_TYPES.includes(type) ? type : 'unknown'
  return t(`loop.relation.type.${known}`)
}

export function nodeKindLabel(t, kind) {
  const known = ['concept', 'device', 'event'].includes(kind) ? kind : 'concept'
  return t(`loop.subject.kind.${known}`)
}

export function verifiedLabel(t, verified) {
  const known = ['verified', 'secondary', 'unverified'].includes(verified) ? verified : 'unverified'
  return t(`loop.relation.verified.${known}`)
}

export function claimKindLabel(t, kind) {
  const known = ['formal', 'empirical', 'historical', 'interpretation'].includes(kind) ? kind : 'interpretation'
  return t(`loop.relation.claimKind.${known}`)
}

export function migrateTypeLabel(t, migrateType) {
  const known = ['formal', 'application', 'analogy', 'heuristic'].includes(migrateType) ? migrateType : 'analogy'
  return t(`loop.subject.migrateType.${known}`)
}

/** 节点年代标签：{ text, uncertain }；优先 eraStart/eraEnd，回退旧 era 字符串。 */
export function nodeEraLabel(node) {
  if (!node) return { text: '', uncertain: true }
  const { eraStart, eraEnd, eraPrecision } = node
  if (eraPrecision === 'unknown' || eraStart === null || eraStart === undefined) {
    return { text: node.era ? String(node.era) : '', uncertain: true }
  }
  if (eraPrecision === 'range' || (eraEnd !== null && eraEnd !== undefined && eraEnd !== eraStart)) {
    return { text: `${eraStart}—${eraEnd}`, uncertain: false }
  }
  return { text: String(eraStart), uncertain: false }
}

/* ─────────────────────────── subject ─────────────────────────── */

/** 由 view 恢复的选区推出当前 subject；优先选中关系。 */
export function subjectFromView(view) {
  if (!view) return null
  if (view.selectedRelationId) return { kind: 'relation', id: view.selectedRelationId }
  if (view.selectedNodeId) return { kind: 'node', id: view.selectedNodeId }
  if (view.activeInvestigationId) return { kind: 'investigation', id: view.activeInvestigationId }
  return null
}

export function subjectLabel(ci, subject, store, t) {
  if (!subject || !subject.id) return ''
  if (subject.kind === 'node') return (ci.nodesById.get(subject.id) || {}).title || subject.id
  if (subject.kind === 'relation') {
    const relation = ci.relationsById.get(subject.id)
    if (!relation) return subject.id
    const from = ci.nodesById.get(relation.from)
    const to = ci.nodesById.get(relation.to)
    return `${from ? from.title : relation.from} → ${to ? to.title : relation.to}`
  }
  if (subject.kind === 'investigation') {
    const investigation = store && store.investigations ? store.investigations[subject.id] : null
    return (investigation && investigation.title) || subject.id
  }
  return subject.id
}

export function subjectTypeLabel(t, subject) {
  if (!subject) return ''
  if (subject.kind === 'relation') return t('loop.relation.detail')
  if (subject.kind === 'investigation') return t('loop.inv.title')
  return t('loop.subject.current')
}

/* ─────────────────────────── 关系 / 邻居 ─────────────────────────── */

/** 某个节点的全部关系（按类型优先级 + 对端标题排序）。 */
export function relationsForNode(ci, nodeId) {
  const list = ci.relationsByNode.get(nodeId) || []
  return list.slice().sort((a, b) => {
    const priority = (TYPE_PRIORITY[a.type] ?? 9) - (TYPE_PRIORITY[b.type] ?? 9)
    if (priority !== 0) return priority
    return a.id < b.id ? -1 : 1
  })
}

/**
 * 当前节点的问题尺度邻居（3—7 个）：按关系类型优先级挑选，
 * 返回每个邻居与"连接它的关系"。同一邻居只出现一次。
 */
export function neighborsOf(ci, nodeId, limit) {
  const max = Number.isFinite(limit) ? limit : 7
  const relations = relationsForNode(ci, nodeId)
  const seen = new Set([nodeId])
  const result = []
  for (const relation of relations) {
    const otherId = relation.from === nodeId ? relation.to : relation.from
    if (seen.has(otherId)) continue
    const other = ci.nodesById.get(otherId)
    if (!other) continue
    seen.add(otherId)
    result.push({
      node: other,
      relation,
      direction: relation.from === nodeId ? 'out' : 'in',
    })
    if (result.length >= max) break
  }
  const total = new Set()
  for (const relation of relations) {
    total.add(relation.from === nodeId ? relation.to : relation.from)
  }
  total.delete(nodeId)
  return { neighbors: result, total: total.size }
}

/** 一个可视集合内的全部关系（当前节点 + 邻居），带 focus 标记。 */
export function relationsWithin(ci, nodeId, visibleNodeIds) {
  const visible = visibleNodeIds instanceof Set ? visibleNodeIds : new Set(visibleNodeIds)
  const out = []
  for (const relation of ci.relations) {
    if (!visible.has(relation.from) || !visible.has(relation.to)) continue
    out.push({ relation, focus: relation.from === nodeId || relation.to === nodeId })
  }
  return out.sort((a, b) => (TYPE_PRIORITY[a.relation.type] ?? 9) - (TYPE_PRIORITY[b.relation.type] ?? 9))
}

/** 关系两端的节点对象。 */
export function relationEndpoints(ci, relation) {
  return {
    from: ci.nodesById.get(relation.from) || null,
    to: ci.nodesById.get(relation.to) || null,
  }
}

/* ─────────────────────────── 主张 / 来源 ─────────────────────────── */

export function claimsForIds(ci, claimIds) {
  return toArray(claimIds)
    .map((id) => ci.claimsById.get(id))
    .filter(Boolean)
}

export function claimsForSubject(ci, subject) {
  if (!subject) return []
  if (subject.kind === 'node') {
    const node = ci.nodesById.get(subject.id)
    return node ? claimsForIds(ci, node.claimIds) : []
  }
  if (subject.kind === 'relation') {
    const relation = ci.relationsById.get(subject.id)
    return relation ? claimsForIds(ci, relation.claimIds) : []
  }
  return []
}

/** 节点自身的旧式来源（v1 src 或 v2 sourceIds → sources）。 */
export function sourcesForNode(ci, node) {
  if (!node) return []
  const out = []
  for (const id of toArray(node.sourceIds)) {
    const entry = ci.sourcesById.get(id)
    if (entry) out.push(entry)
  }
  for (const entry of toArray(node.legacySources)) out.push(entry)
  return dedupeSources(out)
}

export function sourcesForClaims(ci, claims) {
  const out = []
  for (const claim of toArray(claims)) {
    for (const id of toArray(claim.sourceIds)) {
      const entry = ci.sourcesById.get(id)
      if (entry) out.push(entry)
    }
  }
  return dedupeSources(out)
}

function dedupeSources(list) {
  const seen = new Set()
  const out = []
  for (const entry of list) {
    if (!entry || seen.has(entry.id)) continue
    seen.add(entry.id)
    out.push(entry)
  }
  return out
}

export function sourcesForSubject(ci, subject) {
  if (!subject) return []
  if (subject.kind === 'relation') {
    return sourcesForClaims(ci, claimsForSubject(ci, subject))
  }
  const node = subject.kind === 'node' ? ci.nodesById.get(subject.id) : null
  const claims = claimsForSubject(ci, subject)
  const fromClaims = sourcesForClaims(ci, claims)
  const direct = sourcesForNode(ci, node)
  const merged = dedupeSources(fromClaims.concat(direct))
  // relation 的 subject 不直接挂 node.sourceIds；其余仍返回 claim 级来源。
  return merged
}

export function sourceSummary(ci, subject) {
  const list = sourcesForSubject(ci, subject)
  const unverified = list.filter((entry) => entry.verified === 'unverified').length
  return { sources: list.length, unverified, list }
}

/* ─────────────────────────── 实验 ─────────────────────────── */

/** 与当前 subject 相关的实验：节点看 conceptNodeIds；关系看两端节点。 */
export function experimentsForSubject(ci, subject) {
  if (!subject) return []
  const nodeIds = new Set()
  if (subject.kind === 'node') nodeIds.add(subject.id)
  if (subject.kind === 'relation') {
    const relation = ci.relationsById.get(subject.id)
    if (relation) {
      nodeIds.add(relation.from)
      nodeIds.add(relation.to)
    }
  }
  if (subject.kind === 'investigation') return ci.experiments.slice()
  const matched = ci.experiments.filter((experiment) =>
    toArray(experiment.conceptNodeIds).some((id) => nodeIds.has(id)),
  )
  return matched.length ? matched : ci.experiments.slice()
}

/** 实验面板类型：按 id / modelId 前缀选择；未知返回 'green' 兜底但由调用方显示。 */
export function experimentKind(experiment) {
  const id = String((experiment && experiment.id) || '')
  const modelId = String((experiment && experiment.modelId) || '')
  const probe = `${id} ${modelId}`.toLowerCase()
  if (probe.includes('delay')) return 'delay'
  if (probe.includes('proxy')) return 'proxy'
  if (probe.includes('green')) return 'green'
  return 'green'
}

/* ─────────────────────────── 历史时间轴 ─────────────────────────── */

/**
 * 历史投影：当前节点 + 邻居 + 同单元节点，按 eraStart 排列；
 * 时间不确定的单列。返回 { known:[{node}], unknown:[{node}], gaps:[], sources:[] }。
 */
export function historyForSubject(ci, subject, limit) {
  if (!subject || subject.kind === 'investigation') {
    return { known: [], unknown: [], gaps: [], sources: [] }
  }
  const centerId = subject.kind === 'node' ? subject.id : null
  const nodeId = centerId || (subject.kind === 'relation' ? ci.relationsById.get(subject.id)?.from : null)
  if (!nodeId || !ci.nodesById.has(nodeId)) return { known: [], unknown: [], gaps: [], sources: [] }
  const center = ci.nodesById.get(nodeId)
  const related = new Set([nodeId])
  for (const relation of ci.relationsByNode.get(nodeId) || []) {
    related.add(relation.from)
    related.add(relation.to)
  }
  if (center.groupId) {
    for (const node of ci.nodesByGroup.get(center.groupId) || []) related.add(node.id)
  }
  const known = []
  const unknown = []
  const seenSources = new Set()
  const sources = []
  for (const id of related) {
    const node = ci.nodesById.get(id)
    if (!node) continue
    const era = nodeEraLabel(node)
    if (era.uncertain || node.eraStart === null || node.eraStart === undefined) {
      unknown.push({ node, era })
    } else {
      known.push({
        node,
        era,
        start: node.eraStart,
        end: node.eraEnd === null || node.eraEnd === undefined ? node.eraStart : node.eraEnd,
      })
    }
    for (const entry of sourcesForSubject(ci, { kind: 'node', id: node.id })) {
      if (seenSources.has(entry.id)) continue
      seenSources.add(entry.id)
      if (entry.year === null || entry.year === undefined) continue
      sources.push({ source: entry, node })
    }
  }
  known.sort((a, b) => a.start - b.start || (a.end - b.end) || (a.node.title < b.node.title ? -1 : 1))
  unknown.sort((a, b) => (a.node.title < b.node.title ? -1 : 1))
  sources.sort((a, b) => Number(a.source.year) - Number(b.source.year))
  const max = Number.isFinite(limit) ? limit : 14
  return {
    known: known.slice(0, max),
    unknown: unknown.slice(0, Math.max(4, Math.floor(max / 2))),
    gaps: gapsOf(ci),
    sources: sources.slice(0, max),
  }
}

function gapsOf(ci) {
  const completeness = ci.completeness
  if (!completeness || !Array.isArray(completeness.gaps)) return []
  return completeness.gaps.slice(0, 3)
}

/* ─────────────────────────── 实践回路 ─────────────────────────── */

const PRACTICE_STAGES = ['goal', 'measurement', 'action', 'observation', 'acceptance', 'revision']

/** 实践投影：相关节点按 practiceStages 分栏（可见 6 个阶段）。 */
export function practiceForSubject(ci, subject) {
  if (!subject || subject.kind === 'investigation') return { stages: [], unmapped: [], caveat: true }
  const nodeId = subject.kind === 'node' ? subject.id : ci.relationsById.get(subject.id)?.from
  const center = nodeId ? ci.nodesById.get(nodeId) : null
  if (!center) return { stages: [], unmapped: [], caveat: true }
  const related = new Set([center.id])
  for (const relation of ci.relationsByNode.get(center.id) || []) {
    related.add(relation.from)
    related.add(relation.to)
  }
  if (center.groupId) for (const node of ci.nodesByGroup.get(center.groupId) || []) related.add(node.id)
  const buckets = new Map(PRACTICE_STAGES.map((stage) => [stage, []]))
  const unmapped = []
  for (const id of related) {
    const node = ci.nodesById.get(id)
    if (!node) continue
    const stages = toArray(node.practiceStages).filter((stage) => PRACTICE_STAGES.includes(stage))
    if (!stages.length) {
      unmapped.push(node)
      continue
    }
    for (const stage of stages) buckets.get(stage).push(node)
  }
  return {
    stages: PRACTICE_STAGES.map((stage) => ({ stage, nodes: buckets.get(stage) })),
    unmapped,
    centerId: center.id,
    caveat: true,
  }
}

export { PRACTICE_STAGES, RELATION_TYPES }

/* ─────────────────────────── 搜索 ─────────────────────────── */

/** 跨节点/关系搜索；返回 { nodes, relations }。 */
export function searchContent(ci, query, limit) {
  const max = Number.isFinite(limit) ? limit : 12
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return { nodes: [], relations: [] }
  const nodes = []
  for (const node of ci.nodes) {
    const haystack = `${node.title} ${(node.aliases || []).join(' ')} ${node.def} ${node.mech} ${node.can}`.toLowerCase()
    if (haystack.includes(needle)) nodes.push(node)
    if (nodes.length >= max) break
  }
  const relations = []
  for (const relation of ci.relations) {
    const from = ci.nodesById.get(relation.from)
    const to = ci.nodesById.get(relation.to)
    const haystack = `${relation.id} ${relation.type} ${relation.claim} ${relation.condition} ${relation.cost} ${
      from ? from.title : ''
    } ${to ? to.title : ''}`.toLowerCase()
    if (haystack.includes(needle)) relations.push({ relation, from, to })
    if (relations.length >= max) break
  }
  return { nodes, relations }
}

/** 单元统计：节点数、当前用户笔记数（按 subjectId 节点）。 */
export function groupStats(ci, groupId, store) {
  const nodes = ci.nodesByGroup.get(groupId) || []
  const nodeIds = new Set(nodes.map((node) => node.id))
  let notes = 0
  for (const note of Object.values((store && store.notes) || {})) {
    if (note && note.subject && note.subject.kind === 'node' && nodeIds.has(note.subject.id)) notes += 1
    else if (note && typeof note.subjectId === 'string' && nodeIds.has(note.subjectId)) notes += 1
  }
  return { nodes: nodes.length, notes }
}
