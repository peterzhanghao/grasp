import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const core = JSON.parse(readFileSync(join(root, 'data', 'core.json'), 'utf8'))

/** 旧 24 个节点 id：必须原样保留（旧用户笔记/预测/实验记录挂在这些 id 上）。 */
const LEGACY_NODE_IDS = [
  'boundary', 'goal', 'observer', 'feedback', 'positive', 'variety',
  'delay', 'stability', 'sampling', 'measurement', 'blackbox', 'homeostat',
  'actuator', 'adaptation', 'pi', 'model', 'robust', 'tradeoff',
  'vsm', 'cybersyn', 'indicator', 'secondorder', 'responsibility', 'agentloop',
]

/** 40 项基线（DeepSeek创造模式任务包/03-知识骨架.json）：completeness 逐项交代。 */
const BASELINE_IDS = [
  'boundary', 'goal', 'state', 'wiener', 'rwb',
  'negative', 'positive', 'disturbance', 'stock', 'maxwell',
  'delay', 'sampling', 'stability', 'gain', 'filter',
  'calibration', 'noise', 'shannon', 'observability', 'macy',
  'saturation', 'controllability', 'variety', 'homeostat', 'adaptation',
  'model', 'pid', 'prediction', 'robustness', 'tradeoff',
  'proxy', 'beer', 'cybersyn', 'coordination', 'governance',
  'observer', 'contract', 'evaluation', 'harness', 'revision',
]

const RELATION_TYPES = ['prerequisite', 'formal', 'constraint', 'parallel', 'historical', 'analogy', 'application']
const CLAIM_KINDS = ['formal', 'empirical', 'historical', 'interpretation']
const VERIFIED_LEVELS = ['verified', 'secondary', 'unverified']
const NODE_KINDS = ['concept', 'device', 'event']
const SOURCE_KINDS = ['paper', 'book', 'article', 'web', 'author-judgment']
const MIGRATE_TYPES = ['formal', 'application', 'analogy', 'heuristic']
const ERA_PRECISIONS = ['year', 'range', 'unknown']
const PRACTICE_STAGES = ['goal', 'measurement', 'action', 'observation', 'acceptance', 'revision']

/** 真正有前提与推导的形式结果：只允许这 4 条关系标 formal。 */
const FORMAL_RELATION_WHITELIST = [
  'e.feedback-stability',
  'e.feedback-model',
  'e.sampling-measurement',
  'e.variety-feedback',
]

const nodeById = new Map(core.nodes.map((n) => [n.id, n]))
const relationById = new Map(core.relations.map((r) => [r.id, r]))
const claimById = new Map(core.claims.map((c) => [c.id, c]))
const sourceById = new Map(core.sources.map((s) => [s.id, s]))
const isIso = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && v.includes('T')

test('内容包元数据与 8 个单元', () => {
  assert.equal(core.schemaVersion, 2)
  assert.equal(core.packId, 'loop-cybernetics-core')
  assert.equal(core.version, '1.0.0')
  assert.equal(core.language, 'zh-CN')
  assert.ok(typeof core.status === 'string' && core.status.length > 10)
  assert.ok(typeof core.definitionOfCore === 'string' && core.definitionOfCore.length > 20)

  assert.equal(core.groups.length, 8, 'groups 必须恰为 8 个')
  const ids = new Set(core.groups.map((g) => g.id))
  assert.equal(ids.size, 8, 'group id 必须唯一')
  assert.deepEqual(core.groups.map((g) => g.order).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8], 'order 必须为 1..8')
  for (const g of core.groups) {
    assert.ok(g.title && g.question && g.capability, `group ${g.id} 缺少 title/question/capability`)
    assert.ok(g.question.includes('？'), `group ${g.id} 的 question 应是问句`)
    assert.ok(nodeById.has(g.entryNodeId), `group ${g.id} entryNodeId 不存在：${g.entryNodeId}`)
    assert.equal(nodeById.get(g.entryNodeId).groupId, g.id, `group ${g.id} 的 entryNodeId 必须属于该单元`)
  }
})

test('节点：旧 24 id 原样保留、字段完整、era 精度一致', () => {
  assert.equal(nodeById.size, core.nodes.length, 'node id 必须唯一')
  for (const id of LEGACY_NODE_IDS) assert.ok(nodeById.has(id), `旧节点 id 丢失：${id}`)

  for (const n of core.nodes) {
    assert.ok(['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'].includes(n.groupId), `node ${n.id} groupId 非法`)
    assert.ok(NODE_KINDS.includes(n.kind), `node ${n.id} kind 非法：${n.kind}`)
    assert.ok(typeof n.title === 'string' && n.title.length > 0, `node ${n.id} 缺 title`)
    assert.ok(Array.isArray(n.aliases) && n.aliases.length > 0, `node ${n.id} 缺 aliases`)
    for (const f of ['def', 'can', 'mech', 'limits', 'counter', 'check', 'hist', 'migrate']) {
      assert.ok(typeof n[f] === 'string' && n[f].length >= 10, `node ${n.id} 字段 ${f} 过短`)
    }
    assert.ok(MIGRATE_TYPES.includes(n.migrateType), `node ${n.id} migrateType 非法：${n.migrateType}`)
    assert.ok(Array.isArray(n.practiceStages) && n.practiceStages.length > 0, `node ${n.id} 缺 practiceStages`)
    assert.equal(new Set(n.practiceStages).size, n.practiceStages.length, `node ${n.id} practiceStages 重复`)
    for (const s of n.practiceStages) assert.ok(PRACTICE_STAGES.includes(s), `node ${n.id} practiceStages 非法：${s}`)
    assert.ok(Array.isArray(n.claimIds) && n.claimIds.length > 0, `node ${n.id} 缺 claimIds`)
    assert.ok(Array.isArray(n.sourceIds) && n.sourceIds.length > 0, `node ${n.id} 缺 sourceIds`)
    for (const cid of n.claimIds) assert.ok(claimById.has(cid), `node ${n.id} 引用不存在的 claim：${cid}`)
    for (const sid of n.sourceIds) assert.ok(sourceById.has(sid), `node ${n.id} 引用不存在的 source：${sid}`)
    assert.ok(n.compat && Array.isArray(n.compat.legacyIds), `node ${n.id} 缺 compat.legacyIds`)

    // era 精度与取值必须一致；不确定就 null，不编年份。
    assert.ok(ERA_PRECISIONS.includes(n.eraPrecision), `node ${n.id} eraPrecision 非法`)
    if (n.eraPrecision === 'year') {
      assert.ok(Number.isInteger(n.eraStart), `node ${n.id} year 精度需要 eraStart`)
      assert.equal(n.eraEnd, n.eraStart, `node ${n.id} year 精度 eraEnd 应等于 eraStart`)
    } else if (n.eraPrecision === 'range') {
      assert.ok(Number.isInteger(n.eraStart) && Number.isInteger(n.eraEnd), `node ${n.id} range 精度需要 eraStart/eraEnd`)
      assert.ok(n.eraStart <= n.eraEnd, `node ${n.id} eraStart 必须 <= eraEnd`)
    } else {
      assert.equal(n.eraStart, null, `node ${n.id} unknown 精度必须 eraStart:null`)
      assert.equal(n.eraEnd, null, `node ${n.id} unknown 精度必须 eraEnd:null`)
    }
    assert.ok(n.era && n.era.length > 0, `node ${n.id} 缺 era 展示串`)
  }

  // 诚实性：存在时间不确定的节点，且没有任何节点用假年份填补
  const unknown = core.nodes.filter((n) => n.eraPrecision === 'unknown')
  assert.ok(unknown.length >= 5, '应有至少 5 个 eraPrecision:unknown 的节点（不编年份）')
})

test('节点 claim/source 引用闭合且主语一致', () => {
  for (const n of core.nodes) {
    for (const cid of n.claimIds) {
      const c = claimById.get(cid)
      assert.equal(c.subject.kind, 'node', `claim ${cid} 应挂在 node 上`)
      assert.equal(c.subject.id, n.id, `claim ${cid} 的主语应为 ${n.id}，实际 ${c.subject.id}`)
      assert.ok(c.sourceIds.length > 0, `claim ${cid} 至少要有一个 source`)
    }
  }
  // 每个节点至少有一条自己的主张
  for (const n of core.nodes) assert.ok(n.claimIds.length >= 1, `node ${n.id} 没有 claim`)
})

test('关系：稳定 id、引用闭合、必须有 claim/condition/cost/claimIds', () => {
  const ids = new Set(core.relations.map((r) => r.id))
  assert.equal(ids.size, core.relations.length, 'relation id 必须唯一')
  const pairs = new Set()
  for (const r of core.relations) {
    assert.match(r.id, /^e\.[a-z0-9-]+$/, `relation id 必须 e.* 且可读：${r.id}`)
    assert.ok(nodeById.has(r.from), `relation ${r.id} from 不存在：${r.from}`)
    assert.ok(nodeById.has(r.to), `relation ${r.id} to 不存在：${r.to}`)
    assert.notEqual(r.from, r.to, `relation ${r.id} 不应自环`)
    assert.ok(RELATION_TYPES.includes(r.type), `relation ${r.id} type 非法：${r.type}`)
    assert.ok(!pairs.has(`${r.from}->${r.to}`), `重复关系：${r.from}->${r.to}`)
    pairs.add(`${r.from}->${r.to}`)
    assert.ok(typeof r.claim === 'string' && r.claim.length >= 10, `relation ${r.id} 缺 claim`)
    assert.ok(typeof r.condition === 'string' && r.condition.length >= 6, `relation ${r.id} 缺 condition`)
    assert.ok(typeof r.cost === 'string' && r.cost.length >= 6, `relation ${r.id} 缺 cost`)
    assert.ok(Array.isArray(r.claimIds) && r.claimIds.length >= 1, `relation ${r.id} 缺 claimIds`)
    assert.equal(r.version, 1, `relation ${r.id} version 应为 1`)
    for (const cid of r.claimIds) {
      const c = claimById.get(cid)
      assert.ok(c, `relation ${r.id} 引用不存在的 claim：${cid}`)
      assert.equal(c.subject.kind, 'relation', `relation claim ${cid} 应挂在 relation 上`)
      assert.equal(c.subject.id, r.id, `relation claim ${cid} 的主语应为 ${r.id}`)
    }
  }
  // 连通性：每个节点至少有一条关系
  for (const n of core.nodes) {
    const degree = core.relations.filter((r) => r.from === n.id || r.to === n.id).length
    assert.ok(degree >= 1, `node ${n.id} 在关系图中是孤立的`)
  }
})

test('17 条 theorem 误标已修正；formal 只给真正有前提与推导的结果', () => {
  for (const r of core.relations) assert.notEqual(r.type, 'theorem', `relation ${r.id} 仍使用旧类型 theorem`)
  for (const c of core.claims) assert.notEqual(c.kind, 'theorem', `claim ${c.id} 仍使用旧类型 theorem`)
  assert.ok(core.relations.some((r) => r.type === 'constraint'), '应存在 constraint 关系')
  assert.ok(core.relations.some((r) => r.type === 'historical'), '应存在 historical 关系')
  assert.ok(core.relations.some((r) => r.type === 'analogy'), '应存在 analogy 关系')
  assert.ok(core.relations.some((r) => r.type === 'application'), '应存在 application 关系')

  const formalRelations = core.relations.filter((r) => r.type === 'formal').map((r) => r.id).sort()
  assert.deepEqual(formalRelations, [...FORMAL_RELATION_WHITELIST].sort(), 'formal 关系必须与白名单一致（只有真正有前提与推导的结果）')
  for (const r of core.relations.filter((x) => x.type === 'formal')) {
    assert.ok(/前提/.test(r.condition), `formal relation ${r.id} 的 condition 必须写明前提`)
    for (const cid of r.claimIds) {
      assert.equal(claimById.get(cid).kind, 'formal', `formal relation ${r.id} 的 claim 必须是 formal`)
    }
    const fullText = `${r.claim} ${r.condition}`
    assert.ok(/前提|带限|有限|线性|定义/.test(fullText), `formal relation ${r.id} 必须写出成立条件，不能无条件宣称`)
  }

  // historical / analogy 文本必须点明性质，不能把历史解释或类比当定理
  for (const r of core.relations) {
    if (r.type === 'historical') {
      assert.match(r.claim, /历史/, `historical relation ${r.id} 文本必须点明「历史」`)
    }
    if (r.type === 'analogy') {
      assert.match(r.claim, /类比|不是同一机制/, `analogy relation ${r.id} 文本必须点明「类比/不是同一机制」`)
    }
    if (r.type === 'parallel') {
      assert.match(r.claim, /不是同一(件事|机制)|同一回路|两类/, `parallel relation ${r.id} 文本应说明比较关系而非等价`)
    }
  }
})

test('主张与来源：三档核验、引用闭合、不编页码/引文/DOI', () => {
  assert.equal(claimById.size, core.claims.length, 'claim id 必须唯一')
  const forbidden = ['page', 'pages', 'pageNumber', 'quote', 'quotation', 'citation']
  for (const c of core.claims) {
    assert.ok(['node', 'relation'].includes(c.subject.kind), `claim ${c.id} subject.kind 非法`)
    const target = c.subject.kind === 'node' ? nodeById : relationById
    assert.ok(target.has(c.subject.id), `claim ${c.id} 主语不存在：${c.subject.id}`)
    assert.ok(typeof c.text === 'string' && c.text.length >= 8, `claim ${c.id} text 过短`)
    assert.ok(CLAIM_KINDS.includes(c.kind), `claim ${c.id} kind 非法：${c.kind}`)
    assert.ok(VERIFIED_LEVELS.includes(c.verified), `claim ${c.id} verified 非法`)
    assert.ok(Array.isArray(c.sourceIds) && c.sourceIds.length > 0, `claim ${c.id} 缺 sourceIds`)
    for (const sid of c.sourceIds) assert.ok(sourceById.has(sid), `claim ${c.id} 引用不存在的 source：${sid}`)
    for (const f of forbidden) assert.ok(!(f in c), `claim ${c.id} 不应有 ${f} 字段（禁止编造页码/引文）`)
    if (c.verified === 'unverified') assert.equal(c.verifiedAt, null, `unverified claim ${c.id} verifiedAt 应为 null`)
    else assert.ok(isIso(c.verifiedAt), `claim ${c.id} 核验时间应为 ISO`)

    // 核验档位不能高于它引用的最好来源
    const best = Math.min(...c.sourceIds.map((sid) => VERIFIED_LEVELS.indexOf(sourceById.get(sid).verified)))
    assert.ok(VERIFIED_LEVELS.indexOf(c.verified) >= best, `claim ${c.id} 的核验档位高于其来源`)
  }

  assert.equal(sourceById.size, core.sources.length, 'source id 必须唯一')
  for (const s of core.sources) {
    assert.ok(SOURCE_KINDS.includes(s.kind), `source ${s.id} kind 非法：${s.kind}`)
    assert.ok(VERIFIED_LEVELS.includes(s.verified), `source ${s.id} verified 非法`)
    assert.ok(Number.isInteger(s.year), `source ${s.id} 缺年份`)
    assert.ok(typeof s.title === 'string' && s.title.length > 0, `source ${s.id} 缺 title`)
    for (const f of forbidden) assert.ok(!(f in s), `source ${s.id} 不应有 ${f} 字段（禁止编造页码/引文）`)
    if (s.doi !== null) assert.match(s.doi, /^10\.\d{4,9}\//, `source ${s.id} DOI 格式非法：${s.doi}`)
    if (s.url !== null) assert.match(s.url, /^https?:\/\//, `source ${s.id} url 非法`)
    if (s.verified === 'unverified') {
      assert.equal(s.verifiedAt, null, `unverified source ${s.id} verifiedAt 应为 null`)
      assert.ok(typeof s.note === 'string' && s.note.length > 20, `unverified source ${s.id} 必须写明检索路径/说明`)
    } else {
      assert.ok(s.url || s.doi, `source ${s.id} 标记 ${s.verified} 必须有可打开 url/doi`)
      assert.ok(isIso(s.verifiedAt), `source ${s.id} 核验时间应为 ISO`)
      assert.ok(typeof s.note === 'string' && s.note.length > 20, `source ${s.id} 必须写明核验程度`)
    }
    if (s.kind === 'author-judgment') {
      assert.equal(s.verified, 'unverified', `author-judgment source ${s.id} 不应标为已核验`)
      assert.match(s.note, /作者判断/, `author-judgment source ${s.id} note 应说明是作者判断`)
    }
  }

  // 诚实性：至少有一个 verified 来源与一个未核验来源/主张，不得全员“已核验”
  assert.ok(core.sources.filter((s) => s.verified === 'verified').length >= 5, 'verified 来源数量异常少')
  assert.ok(core.sources.some((s) => s.verified === 'unverified'), '应保留未核验来源')
  assert.ok(core.claims.some((c) => c.verified === 'unverified'), '应保留未核验主张（作者判断）')
})

test('实验元数据与 domain 模型 id/version 一致', () => {
  assert.equal(core.experiments.length, 3)
  assert.deepEqual(core.experiments.map((e) => e.id).sort(), ['delay', 'green', 'proxy'])
  assert.deepEqual(core.experiments.map((e) => e.order).sort((a, b) => a - b), [1, 2, 3])
  for (const e of core.experiments) {
    assert.equal(e.modelId, `${e.id}-v2`, `experiment ${e.id} modelId 应为 ${e.id}-v2`)
    assert.equal(e.modelVersion, 2, `experiment ${e.id} modelVersion 应为 2`)
    for (const f of ['title', 'subtitle', 'question', 'note']) assert.ok(typeof e[f] === 'string' && e[f].length > 0, `experiment ${e.id} 缺 ${f}`)
    assert.ok(Array.isArray(e.conceptNodeIds) && e.conceptNodeIds.length > 0, `experiment ${e.id} 缺 conceptNodeIds`)
    for (const nid of e.conceptNodeIds) assert.ok(nodeById.has(nid), `experiment ${e.id} 引用不存在节点：${nid}`)
  }

  const domainPath = join(root, 'src', 'domain', 'experiments.js')
  if (existsSync(domainPath)) {
    return import(pathToFileURL(domainPath).href).then((m) => {
      for (const e of core.experiments) {
        const model = m.EXPERIMENT_MODELS?.[e.id]
        assert.ok(model, `domain EXPERIMENT_MODELS 缺 ${e.id}`)
        assert.equal(model.id, e.modelId, `domain 与 core 的 ${e.id} modelId 不一致`)
        assert.equal(model.version, e.modelVersion, `domain 与 core 的 ${e.id} version 不一致`)
      }
    })
  }
})

test('completeness：40 项基线逐项交代、节点全部有归属', () => {
  const c = core.completeness
  assert.equal(c.baselineCount, 40)
  assert.ok(typeof c.baselineSource === 'string' && c.baselineSource.length > 20)
  assert.deepEqual([...c.baselineIds].sort(), [...BASELINE_IDS].sort(), 'baselineIds 必须是 40 项种子原清单')

  const covered = new Map()
  const mark = (id, where) => {
    assert.ok(c.baselineIds.includes(id), `completeness.${where} 里的 ${id} 不在 40 项基线中`)
    assert.ok(!covered.has(id), `40 项基线 ${id} 被重复交代：${covered.get(id)} 与 ${where}`)
    covered.set(id, where)
  }
  for (const id of c.included) mark(id, 'included')
  for (const m of c.merged) {
    assert.ok(m.to && nodeById.has(m.to), `merged.to 节点不存在：${m.to}`)
    assert.ok(typeof m.reason === 'string' && m.reason.length > 10, 'merged 必须写 reason')
    for (const from of m.from) mark(from, 'merged')
  }
  for (const e of c.excluded) mark(e.item, 'excluded')
  assert.equal(covered.size, 40, '必须逐项交代全部 40 项基线')
  for (const id of c.baselineIds) assert.ok(covered.has(id), `40 项基线未交代：${id}`)

  for (const a of c.added) {
    assert.ok(nodeById.has(a.id), `added 节点不存在：${a.id}`)
    assert.ok(typeof a.why === 'string' && a.why.length > 10, 'added 必须写 why')
  }
  for (const g of c.gaps) {
    assert.ok(g.item && g.why && g.searchPath, 'gap 必须写 item/why/searchPath')
  }
  assert.ok(c.gaps.length >= 6, '应如实列出内容缺口与检索路径')

  // 每个节点都要么是基线 included、要么是合并去向、要么是 added
  const accounted = new Set([
    ...c.included,
    ...c.merged.map((m) => m.to),
    ...c.added.map((a) => a.id),
  ])
  for (const n of core.nodes) assert.ok(accounted.has(n.id), `node ${n.id} 在 completeness 里没有归属`)
})

test('locale：zh/en 完整对照、key 与 client 实际使用的 key 不缺失', () => {
  const zhPath = join(root, 'locale', 'zh.json')
  const enPath = join(root, 'locale', 'en.json')
  assert.ok(existsSync(zhPath) && existsSync(enPath), '缺少 locale/{zh,en}.json')
  const zh = JSON.parse(readFileSync(zhPath, 'utf8'))
  const en = JSON.parse(readFileSync(enPath, 'utf8'))

  for (const [name, loc, expectTitle] of [['zh', zh, '掌控'], ['en', en, 'Grasp']]) {
    assert.equal(loc.meta?.title, expectTitle, `${name} meta.title 应为 ${expectTitle}`)
    assert.ok(typeof loc.meta.description === 'string' && loc.meta.description.length > 20, `${name} 缺 meta.description`)
    assert.ok(loc.messages && typeof loc.messages === 'object', `${name} 缺 messages`)
    for (const key of Object.keys(loc.messages)) {
      assert.match(key, /^loop\./, `${name} 文案 key 必须以 loop. 开头：${key}`)
      assert.ok(typeof loc.messages[key] === 'string' && loc.messages[key].length > 0, `${name} 文案 ${key} 为空`)
    }
  }
  const zhKeys = Object.keys(zh.messages).sort()
  const enKeys = Object.keys(en.messages).sort()
  assert.deepEqual(zhKeys, enKeys, 'zh/en 的 key 集合必须完全一致')

  // 与 client 的权威 key 清单对齐（client 会读这些 key）
  const i18nPath = join(root, 'src', 'client', 'i18n.js')
  if (existsSync(i18nPath)) {
    return import(pathToFileURL(i18nPath).href).then((m) => {
      const required = new Set([...Object.keys(m.FALLBACK_ZH), ...Object.keys(m.FALLBACK_EN)])
      const missingZh = [...required].filter((k) => !(k in zh.messages))
      const missingEn = [...required].filter((k) => !(k in en.messages))
      assert.deepEqual(missingZh, [], `locale/zh.json 缺 client 使用的 key：${missingZh.join(', ')}`)
      assert.deepEqual(missingEn, [], `locale/en.json 缺 client 使用的 key：${missingEn.join(', ')}`)
    })
  }
})
