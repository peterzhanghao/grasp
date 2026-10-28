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

// ─────────────────────────── 教练包（T04，Issue #9） ───────────────────────────
// 契约：docs/v2-design.md §4（掌控六问）、§5（缺口 → 原理卡映射）、§10（四类系统模板），
// docs/v2-dev-plan.md §3 T04。数据在 data/core.json 的 coach；文案在 locale/{zh,en}.json 的 loop.coach.*。

const COACH_QUESTION_IDS = ['goal', 'measurement', 'action', 'disturbance', 'delay', 'hypothesis']
const COACH_GAP_IDS = [
  'unclear-goal',
  'unmeasured',
  'late-measurement',
  'authority-gap',
  'saturated',
  'proxy',
  'missing-counter-signal',
  'oscillating',
  'drift',
  'adaptation-failure',
]
const COACH_TEMPLATE_IDS = ['coding-agent', 'product', 'team', 'personal']
const COACH_LOCALE_PREFIX = 'loop.coach.'
const WIZARD_TOP_KEYS = [
  'titleKey',
  'introKey',
  'progressKey',
  'skipKey',
  'unknownHintKey',
  'draftSavedKey',
  'createCardKey',
  'createCardHintKey',
]
/** 教练包文案 key 的冻结数量：缺口 10×2 + 模板 4×13 + 向导（8 顶层 + 6×3）。 */
const COACH_KEY_COUNT = 10 * 2 + 4 * (1 + 6 * 2) + 8 + 6 * 3

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const readLocaleFile = (name) => JSON.parse(readFileSync(join(root, 'locale', name), 'utf8'))
const zhLoc = readLocaleFile('zh.json')
const enLoc = readLocaleFile('en.json')
const placeholdersOf = (text) => [...text.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((m) => m[1]).sort()

/** 收集 coach 元数据里引用的全部 loop.* 文案 key（递归）。 */
function collectCoachLocaleRefs(value, out = new Set()) {
  if (typeof value === 'string') {
    if (value.startsWith('loop.')) out.add(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectCoachLocaleRefs(item, out)
  } else if (isObj(value)) {
    for (const item of Object.values(value)) collectCoachLocaleRefs(item, out)
  }
  return out
}
const coachLocaleRefs = [...collectCoachLocaleRefs(core.coach)].sort()
const coachLocaleKeys = (loc) => Object.keys(loc.messages).filter((k) => k.startsWith(COACH_LOCALE_PREFIX)).sort()

/** 断言某文案 key 在 zh/en 都存在且是非空字符串，返回 {zh,en}。 */
function assertCopy(key, { minZh = 1, minEn = 1, where = '' } = {}) {
  const text = {}
  for (const [name, loc] of [
    ['zh', zhLoc],
    ['en', enLoc],
  ]) {
    assert.ok(key in loc.messages, `${where} 引用的文案 key 在 locale/${name}.json 中不存在：${key}`)
    const value = loc.messages[key]
    assert.ok(typeof value === 'string' && value.trim().length > 0, `locale/${name}.json 的 ${key} 文案为空`)
    text[name] = value
  }
  assert.ok(text.zh.length >= minZh, `${key} 的中文文案太短（${text.zh.length} 字），要具体可操作`)
  assert.ok(text.en.length >= minEn, `${key} 的英文文案太短（${text.en.length} 字符）`)
  return text
}

test('教练包：结构完整，六问顺序与四类系统模板齐全', async () => {
  const coach = core.coach
  assert.ok(isObj(coach), 'data/core.json 缺少 coach 元数据（T04 教练包）')
  assert.equal(coach.version, 1, 'coach.version 应为 1（后续变更才升版）')
  assert.deepEqual(coach.questionOrder, COACH_QUESTION_IDS, '六问顺序必须与设计 §4 一致：目标量/测量/动作权限/扰动/延迟/解释与推翻条件')

  // 与 domain 枚举对齐：缺口类型、系统类型是 T01/T02/T03 的共同契约
  const loopSchemaPath = join(root, 'src', 'domain', 'loop-schema.js')
  if (existsSync(loopSchemaPath)) {
    const schema = await import(pathToFileURL(loopSchemaPath).href)
    assert.deepEqual([...COACH_GAP_IDS].sort(), [...schema.GAP_TYPES].sort(), 'gapPlaybook 必须覆盖 domain 的全部 10 类缺口')
    const nonCustomTypes = schema.SYSTEM_TYPES.filter((t) => t !== 'custom')
    assert.deepEqual([...COACH_TEMPLATE_IDS].sort(), [...nonCustomTypes].sort(), '四类系统模板必须覆盖 domain 中除 custom 外的 SYSTEM_TYPES')
    // 掌控卡字段预填模板（dev-plan T04）：路径根必须在 LOOP_DEFAULTS 里存在
    assert.ok(isObj(coach.fieldMap), 'coach.fieldMap 缺失（六问 → 掌控卡字段预填）')
    assert.deepEqual(Object.keys(coach.fieldMap).sort(), [...COACH_QUESTION_IDS].sort(), 'fieldMap 必须覆盖六问')
    for (const [question, paths] of Object.entries(coach.fieldMap)) {
      assert.ok(Array.isArray(paths) && paths.length > 0, `fieldMap.${question} 必须是非空数组`)
      for (const path of paths) {
        assert.match(path, /^[a-zA-Z]+(?:\[\])?(?:\.[a-zA-Z]+)*$/, `fieldMap.${question} 的字段路径非法：${path}`)
        const rootField = path.split('.')[0].replace(/\[\]$/, '')
        assert.ok(rootField in schema.LOOP_DEFAULTS, `fieldMap.${question} 引用了掌控卡不存在的字段：${path}`)
      }
    }
  }

  // gapPlaybook：10 类缺口、每类 1—2 张已存在的原理卡 + 首个动作 key
  assert.ok(isObj(coach.gapPlaybook), 'coach.gapPlaybook 缺失')
  assert.deepEqual(Object.keys(coach.gapPlaybook).sort(), [...COACH_GAP_IDS].sort(), 'gapPlaybook 必须恰好包含 10 类缺口')
  for (const [gap, entry] of Object.entries(coach.gapPlaybook)) {
    assert.ok(isObj(entry), `gapPlaybook.${gap} 必须是对象`)
    assert.match(entry.labelKey, /^loop\.coach\.gap\.[a-z-]+\.label$/, `gapPlaybook.${gap}.labelKey 命名非法`)
    assert.match(entry.firstActionKey, /^loop\.coach\.gap\.[a-z-]+\.firstAction$/, `gapPlaybook.${gap}.firstActionKey 命名非法`)
    assert.ok(Array.isArray(entry.nodeIds), `gapPlaybook.${gap}.nodeIds 必须是数组`)
    assert.ok(entry.nodeIds.length >= 1 && entry.nodeIds.length <= 2, `gapPlaybook.${gap} 必须映射 1—2 张原理卡，实际 ${entry.nodeIds.length} 张`)
    assert.equal(new Set(entry.nodeIds).size, entry.nodeIds.length, `gapPlaybook.${gap}.nodeIds 不能重复`)
  }

  // systemTemplates：四类，各含 labelKey + 六问 questionHints + 六问 examples
  assert.ok(isObj(coach.systemTemplates), 'coach.systemTemplates 缺失')
  assert.deepEqual(Object.keys(coach.systemTemplates).sort(), [...COACH_TEMPLATE_IDS].sort(), '四类系统模板必须齐全')
  for (const [type, template] of Object.entries(coach.systemTemplates)) {
    assert.ok(isObj(template), `systemTemplates.${type} 必须是对象`)
    assert.match(template.labelKey, /^loop\.coach\.template\.[a-z-]+\.label$/, `systemTemplates.${type}.labelKey 命名非法`)
    assert.deepEqual(Object.keys(template.questionHints).sort(), [...COACH_QUESTION_IDS].sort(), `${type} 缺六问 questionHints`)
    assert.deepEqual(Object.keys(template.examples).sort(), [...COACH_QUESTION_IDS].sort(), `${type} 缺六问 examples`)
  }

  // wizardCopy：六问标题/提示/「我不知道」分支 + 进度 + 建卡按钮等 key 引用
  assert.ok(isObj(coach.wizardCopy), 'coach.wizardCopy 缺失')
  for (const field of WIZARD_TOP_KEYS) {
    assert.ok(typeof coach.wizardCopy[field] === 'string', `wizardCopy.${field} 必须是文案 key`)
    assert.match(coach.wizardCopy[field], /^loop\.coach\.wizard\./, `wizardCopy.${field} 命名必须以 loop.coach.wizard. 开头`)
  }
  assert.deepEqual(Object.keys(coach.wizardCopy.questions).sort(), [...COACH_QUESTION_IDS].sort(), 'wizardCopy.questions 必须覆盖六问')
  for (const question of COACH_QUESTION_IDS) {
    const entry = coach.wizardCopy.questions[question]
    for (const field of ['titleKey', 'hintKey', 'unknownKey']) {
      assert.ok(typeof entry[field] === 'string', `wizardCopy.questions.${question}.${field} 必须是文案 key`)
      assert.match(entry[field], /^loop\.coach\.question\./, `wizardCopy.questions.${question}.${field} 命名非法`)
    }
  }
})

test('教练包：缺口映射引用闭合（nodeId 存在、文案 key 存在且可操作）', () => {
  for (const gap of COACH_GAP_IDS) {
    const entry = core.coach.gapPlaybook[gap]
    for (const nodeId of entry.nodeIds) {
      assert.ok(nodeById.has(nodeId), `缺口 ${gap} 引用了不存在的原理卡节点：${nodeId}`)
    }
    assertCopy(entry.labelKey, { minZh: 2, minEn: 3, where: `缺口 ${gap} 的 labelKey` })
    const action = assertCopy(entry.firstActionKey, { minZh: 30, minEn: 60, where: `缺口 ${gap} 的 firstActionKey` })
    // 「第一个小动作」必须是一个动作，而不是口号/占位
    assert.ok(!/待补充|待定义|TODO|TBD|lorem/i.test(action.zh + action.en), `缺口 ${gap} 的首个动作文案像占位符：${entry.firstActionKey}`)
    assert.ok(/[。；]/u.test(action.zh), `缺口 ${gap} 的首个动作中文应是完整句子：${action.zh}`)
  }

  // 首个动作不能是同一句复制粘贴；缺口映射至少覆盖 10 张不同原理卡（29 张里挑得出推荐）
  const actions = COACH_GAP_IDS.map((gap) => core.coach.gapPlaybook[gap].firstActionKey)
  assert.equal(new Set(actions).size, actions.length, '不同缺口的 firstActionKey 不能重复')
  const referencedNodes = new Set(COACH_GAP_IDS.flatMap((gap) => core.coach.gapPlaybook[gap].nodeIds))
  assert.ok(referencedNodes.size >= 10, `缺口 → 原理卡映射覆盖的节点过少（${referencedNodes.size} 张）`)
  // 设计 §5 的映射以内容包现有卡片为准：不允许映射到 group 入口之外的编造 id
  for (const nodeId of referencedNodes) {
    const node = nodeById.get(nodeId)
    assert.ok(node.groupId, `缺口映射到的节点 ${nodeId} 缺 groupId，不是完整内容卡`)
  }
})

test('教练包：四类系统模板六问 hint/example 齐全且各自定制', () => {
  const templates = core.coach.systemTemplates
  for (const type of COACH_TEMPLATE_IDS) {
    const template = templates[type]
    assertCopy(template.labelKey, { minZh: 3, minEn: 5, where: `模板 ${type} 的 labelKey` })
    for (const question of COACH_QUESTION_IDS) {
      const hintKey = template.questionHints[question]
      const exampleKey = template.examples[question]
      assert.match(hintKey, /^loop\.coach\.template\./, `模板 ${type}.${question} 的 hintKey 命名非法`)
      assert.match(exampleKey, /^loop\.coach\.template\./, `模板 ${type}.${question} 的 exampleKey 命名非法`)
      const hint = assertCopy(hintKey, { minZh: 15, minEn: 30, where: `模板 ${type} 的 ${question} 提示` })
      const example = assertCopy(exampleKey, { minZh: 12, minEn: 25, where: `模板 ${type} 的 ${question} 示例` })
      assert.notEqual(hint.zh, hint.en, `模板 ${type}.${question} 的提示未翻译`)
      assert.notEqual(example.zh, example.en, `模板 ${type}.${question} 的示例未翻译`)
      // 示例是「一个答案」而不是再抛一个问题
      assert.ok(!example.zh.trim().endsWith('？'), `模板 ${type}.${question} 的 example 应是示例答案，不是问句：${example.zh}`)
    }
  }

  // 定制性：同一问在四类模板中的提示/示例必须互不相同（否则只是占位复制）
  for (const question of COACH_QUESTION_IDS) {
    for (const [name, loc] of [
      ['zh', zhLoc],
      ['en', enLoc],
    ]) {
      const hints = COACH_TEMPLATE_IDS.map((type) => loc.messages[templates[type].questionHints[question]])
      assert.equal(new Set(hints).size, COACH_TEMPLATE_IDS.length, `${name} 的四类模板在「${question}」上提示重复，未按系统类型定制`)
      const examples = COACH_TEMPLATE_IDS.map((type) => loc.messages[templates[type].examples[question]])
      assert.equal(new Set(examples).size, COACH_TEMPLATE_IDS.length, `${name} 的四类模板在「${question}」上示例重复，未按系统类型定制`)
    }
  }
  const labelsZh = COACH_TEMPLATE_IDS.map((type) => zhLoc.messages[templates[type].labelKey])
  assert.equal(new Set(labelsZh).size, COACH_TEMPLATE_IDS.length, '四类模板的中文标签必须互不相同')
})

test('教练包：向导六问标题/提示/「我不知道」分支/进度/建卡按钮文案齐全且具体', () => {
  const wizard = core.coach.wizardCopy
  for (const field of WIZARD_TOP_KEYS) {
    assertCopy(wizard[field], { minZh: 4, minEn: 8, where: `wizardCopy.${field}` })
  }
  // 进度文案必须是「第 N 问 / 共 M 问」这类可代入的模板
  assert.deepEqual(placeholdersOf(zhLoc.messages[wizard.progressKey]), ['current', 'total'], 'progressKey 中文必须含 {current} 与 {total}')
  assert.deepEqual(placeholdersOf(enLoc.messages[wizard.progressKey]), ['current', 'total'], 'progressKey 英文必须含 {current} 与 {total}')
  // 建卡门槛：设计 §4「Q1 与 Q6 有内容即可先建卡再补」
  assert.match(zhLoc.messages[wizard.createCardHintKey], /第 1 问.*第 6 问/, '建卡门槛文案应说明「第 1 问 + 第 6 问」即可建卡')
  assert.match(enLoc.messages[wizard.createCardHintKey], /Q1.*Q6/, '建卡门槛文案（en）应说明 Q1 + Q6 即可建卡')

  for (const question of COACH_QUESTION_IDS) {
    const entry = wizard.questions[question]
    const title = assertCopy(entry.titleKey, { minZh: 6, minEn: 15, where: `六问 ${question} 的标题` })
    assert.match(title.zh, /？$/, `六问 ${question} 的中文标题应是问句：${title.zh}`)
    assert.match(title.en, /\?$/, `六问 ${question} 的英文标题应是问句：${title.en}`)
    const hint = assertCopy(entry.hintKey, { minZh: 15, minEn: 30, where: `六问 ${question} 的提示` })
    const unknown = assertCopy(entry.unknownKey, { minZh: 20, minEn: 40, where: `六问 ${question} 的「我不知道」分支` })
    assert.notEqual(hint.zh, hint.en, `六问 ${question} 的提示未翻译`)
    assert.notEqual(unknown.zh, unknown.en, `六问 ${question} 的「我不知道」分支未翻译`)
  }

  // 占位符 zh/en 必须一致（{current}/{total} 等参数不会一边有一边没有）
  const wizardKeys = [...WIZARD_TOP_KEYS.map((field) => wizard[field])]
  for (const question of COACH_QUESTION_IDS) {
    wizardKeys.push(...Object.values(wizard.questions[question]))
  }
  for (const key of wizardKeys) {
    assert.deepEqual(
      placeholdersOf(zhLoc.messages[key]),
      placeholdersOf(enLoc.messages[key]),
      `文案 ${key} 的占位符在 zh/en 中不一致`,
    )
  }
})

test('教练包：locale 的 loop.coach.* 与 core 引用双向闭合、zh/en 集合一致、文案非空', () => {
  assert.ok(coachLocaleRefs.length > 0, 'coach 元数据没有引用任何 loop.* 文案 key')
  assert.equal(coachLocaleRefs.length, COACH_KEY_COUNT, `教练包文案 key 应为 ${COACH_KEY_COUNT} 个（缺口 20 + 模板 52 + 向导 26）`)
  assert.equal(new Set(coachLocaleRefs).size, coachLocaleRefs.length, 'coach 元数据里的文案 key 不能重复引用')

  const zhKeys = coachLocaleKeys(zhLoc)
  const enKeys = coachLocaleKeys(enLoc)
  assert.deepEqual(zhKeys, coachLocaleRefs, 'locale/zh.json 的 loop.coach.* 必须与 core.coach 引用完全一致（无缺失、无死文案）')
  assert.deepEqual(enKeys, coachLocaleRefs, 'locale/en.json 的 loop.coach.* 必须与 core.coach 引用完全一致（无缺失、无死文案）')
  assert.deepEqual(zhKeys, enKeys, 'zh/en 的 loop.coach.* key 集合必须一致')

  for (const key of coachLocaleRefs) {
    const zhText = zhLoc.messages[key]
    const enText = enLoc.messages[key]
    assert.ok(typeof zhText === 'string' && zhText.trim().length >= 2, `locale/zh.json 的 ${key} 文案为空`)
    assert.ok(typeof enText === 'string' && enText.trim().length >= 2, `locale/en.json 的 ${key} 文案为空`)
    assert.ok(!/\s{2,}/.test(zhText.trim()), `locale/zh.json 的 ${key} 含连续空格，疑似排版残留`)
    assert.notEqual(zhText, enText, `locale 的 ${key} 中英文相同，疑似未翻译`)
  }
})

test('教练包：新增元数据不破坏内容校验（validateContent 仍 ok）', async () => {
  const validatePath = join(root, 'src', 'domain', 'validate-content.js')
  assert.ok(existsSync(validatePath), '缺少 src/domain/validate-content.js')
  const { validateContent } = await import(pathToFileURL(validatePath).href)
  const result = validateContent(core)
  assert.equal(result.ok, true, `validateContent(core) 失败：${JSON.stringify(result.errors.slice(0, 5))}`)
  assert.equal(result.errors.length, 0, 'validateContent(core) 不能有错误')
  // 29 节点 / 55 关系 / 119 主张 / 21 来源的正文与来源不得被教练包改动
  assert.equal(core.nodes.length, 29, '节点数必须保持 29（教练包不改节点正文）')
  assert.equal(core.relations.length, 55, '关系数必须保持 55')
  assert.equal(core.claims.length, 119, '主张数必须保持 119')
  assert.equal(core.sources.length, 21, '来源数必须保持 21')
})
