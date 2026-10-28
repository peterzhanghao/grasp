/**
 * Agent 工具 loop_atlas：与 UI 共用 ops 实现。
 *
 * 读取类动作直接读快照；写入类动作走同一个 ops.run，caller:'agent'
 * 保证 agent 写入的笔记不会被冒充成"用户原文"。
 */
import { AppError } from './errors.js'

const ACTIONS = [
  'read_node',
  'read_relation',
  'search',
  'list_notes',
  'list_evidence',
  'list_investigations',
  'list_tasks',
  'read_loops',
  'read_today',
  'save_note',
  'save_prediction',
  'save_observation',
]

/** agent 永远不能替用户写观察判定；这些字段出现在任何动作里都直接拒绝。 */
const FORBIDDEN_ERROR = {
  ok: false,
  code: 'FORBIDDEN',
  error: '观察判定（compare.verdict）只能由用户本人在界面上填写。agent 可以读取掌控卡与今天这一步，但不能替用户判断观察是支持还是反驳。',
}

function hasUserOnlyVerdict(args) {
  if (!args || typeof args !== 'object') return false
  if (args.verdict !== undefined) return true
  if (args.compare && typeof args.compare === 'object' && args.compare.verdict !== undefined) return true
  return false
}

function nodeById(core, id) {
  return (core.nodes || []).find((node) => node.id === id) || null
}

function relationById(core, id) {
  return (core.relations || []).find((relation) => relation.id === id) || null
}

function claimsFor(core, kind, id) {
  return (core.claims || []).filter((claim) => claim.subject && claim.subject.kind === kind && claim.subject.id === id)
}

function sourcesFor(core, claims, extraIds) {
  const ids = new Set(extraIds || [])
  for (const claim of claims) for (const id of claim.sourceIds || []) ids.add(id)
  return (core.sources || []).filter((source) => ids.has(source.id))
}

function notesFor(state, kind, id) {
  return Object.values(state.notes || {}).filter((note) => note.subject && note.subject.kind === kind && note.subject.id === id)
}

function subjectFromArgs(args) {
  if (args.subject && typeof args.subject === 'object' && args.subject.kind && args.subject.id) return args.subject
  if (typeof args.subjectId === 'string' && args.subjectId) {
    if (relationById(args.__core, args.subjectId)) return { kind: 'relation', id: args.subjectId }
    return { kind: 'node', id: args.subjectId }
  }
  return null
}

export function createToolDefinition({ storage, ops }) {
  return {
    name: 'loop_atlas',
    description:
      '读取「掌控」知识图谱里的节点、关系、主张与来源，读取掌控卡与「今天这一步」，或在用户个人证据层保存笔记／预测。所有写操作与插件界面共用同一份实现；agent 写入的内容会标记为 ai-draft，不会被当作你的用户原文。观察判定（verdict）只能由用户本人填写，agent 只能读、不能写。',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ACTIONS, description: '要执行的动作' },
        nodeId: { type: 'string', description: 'read_node 的节点 id，例如 feedback / delay' },
        relationId: { type: 'string', description: 'read_relation 的关系稳定 id，例如 e.goal-to-feedback' },
        query: { type: 'string', description: 'search 的关键词' },
        loopId: { type: 'string', description: 'read_today 可选：指定要读的掌控卡 id（缺省用当前激活的卡）' },
        subject: {
          type: 'object',
          description: '挂靠主题 {kind:"node"|"relation", id}',
          properties: { kind: { type: 'string' }, id: { type: 'string' } },
        },
        subjectId: { type: 'string', description: '兼容旧参数：节点 id（关系 id 会自动识别）' },
        kind: { type: 'string', description: '笔记类型：理解 / 疑问 / 证据 / 反驳 / 实践' },
        text: { type: 'string', description: '笔记或预测正文' },
        resolveBy: { type: 'string', description: '预测的判定条件' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute(args) {
      const action = args?.action
      // 权限边界：观察 verdict 是用户自己的判断，工具层在任何动作下都拒绝代写。
      if (action === 'save_observation' || action === 'observation.create' || hasUserOnlyVerdict(args)) {
        return { ...FORBIDDEN_ERROR }
      }
      const snap = await storage.ensure()
      if (snap.fatal) return { ok: false, code: 'READ_ONLY', error: snap.fatal.message }
      const core = snap.core
      const state = snap.store
      const withCore = Object.assign({ __core: core }, args || {})

      if (action === 'read_node') {
        const node = nodeById(core, args?.nodeId)
        if (!node) return { ok: false, code: 'NOT_FOUND', error: '没有这个节点：' + String(args?.nodeId) }
        const claims = claimsFor(core, 'node', node.id)
        const relations = (core.relations || []).filter((relation) => relation.from === node.id || relation.to === node.id)
        return {
          ok: true,
          node,
          group: (core.groups || []).find((group) => group.id === node.groupId) || null,
          relations,
          claims,
          sources: sourcesFor(core, claims, node.sourceIds),
          notes: notesFor(state, 'node', node.id),
        }
      }

      if (action === 'read_relation') {
        const relation = relationById(core, args?.relationId)
        if (!relation) return { ok: false, code: 'NOT_FOUND', error: '没有这条关系：' + String(args?.relationId) }
        const claims = claimsFor(core, 'relation', relation.id)
        return {
          ok: true,
          relation,
          from: nodeById(core, relation.from),
          to: nodeById(core, relation.to),
          claims,
          sources: sourcesFor(core, claims, relation.sourceIds),
          annotation: state.relations?.[relation.id] || null,
          notes: Object.values(state.notes || {}).filter((note) =>
            (state.relations?.[relation.id]?.evidenceNoteIds || []).includes(note.id),
          ),
        }
      }

      if (action === 'search') {
        const query = String(args?.query || '').trim()
        if (!query) return { ok: false, code: 'VALIDATION', error: '缺少关键词' }
        const nodes = (core.nodes || [])
          .filter((node) => (node.title + node.def + node.can + node.mech + (node.aliases || []).join('')).includes(query))
          .map((node) => ({ id: node.id, title: node.title, def: node.def }))
        const relations = (core.relations || [])
          .filter((relation) => (relation.claim + relation.condition + relation.id).includes(query))
          .map((relation) => ({ id: relation.id, from: relation.from, to: relation.to, claim: relation.claim }))
        const claims = (core.claims || [])
          .filter((claim) => claim.text.includes(query))
          .map((claim) => ({ id: claim.id, subject: claim.subject, text: claim.text, verified: claim.verified }))
        return { ok: true, nodes: nodes.slice(0, 20), relations: relations.slice(0, 20), claims: claims.slice(0, 20) }
      }

      if (action === 'list_notes') {
        let notes = Object.values(state.notes || {})
        const subject = subjectFromArgs(withCore)
        if (subject) notes = notes.filter((note) => note.subject && note.subject.kind === subject.kind && note.subject.id === subject.id)
        notes.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        return { ok: true, notes }
      }

      if (action === 'list_evidence') {
        const subject = subjectFromArgs(withCore)
        if (!subject) return { ok: false, code: 'VALIDATION', error: '需要 subject 或 subjectId' }
        return {
          ok: true,
          subject,
          notes: notesFor(state, subject.kind, subject.id),
          predictions: Object.values(state.predictions || {}).filter(
            (prediction) => prediction.subject && prediction.subject.kind === subject.kind && prediction.subject.id === subject.id,
          ),
          experiments: Object.values(state.experiments || {}).filter(
            (run) => run.subject && run.subject.kind === subject.kind && run.subject.id === subject.id,
          ),
        }
      }

      if (action === 'list_investigations') {
        let investigations = Object.values(state.investigations || {})
        const subject = subjectFromArgs(withCore)
        if (subject) {
          investigations = investigations.filter(
            (investigation) => investigation.subject && investigation.subject.kind === subject.kind && investigation.subject.id === subject.id,
          )
        }
        investigations.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        return { ok: true, investigations }
      }

      if (action === 'list_tasks') {
        const tasks = Object.values(state.tasks || {}).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        return { ok: true, tasks }
      }

      // 只读：掌控卡列表（按最近更新排序，附带当前激活卡）。
      if (action === 'read_loops') {
        const loops = Object.values(state.loops || {}).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
        return {
          ok: true,
          readOnly: true,
          activeLoopId: state.view?.activeLoopId || null,
          count: loops.length,
          loops,
        }
      }

      // 只读：「今天这一步」视图——当前卡 / 缺口 / 下一步 / 最近观察，不写任何数据。
      if (action === 'read_today') {
        const activeLoopId = (typeof args?.loopId === 'string' && args.loopId) || state.view?.activeLoopId || null
        const screen = state.view?.screen || 'home'
        if (!activeLoopId) {
          return {
            ok: true,
            readOnly: true,
            screen,
            activeLoopId: null,
            loop: null,
            gaps: [],
            nextAction: null,
            nextCheck: null,
            observations: [],
            hint: '还没有打开的掌控卡：先在六问向导里建一张卡（Q1 + Q6 有内容即可先建卡再补）。',
          }
        }
        const loop = state.loops?.[activeLoopId] || null
        if (!loop) return { ok: false, code: 'NOT_FOUND', error: '没有这张掌控卡：' + activeLoopId }
        const observations = Object.values(state.observations || {})
          .filter((observation) => observation.loopId === loop.id)
          .sort((a, b) => String(b.at).localeCompare(String(a.at)))
          .slice(0, 10)
        const interventions = Object.values(state.interventions || {})
          .filter((intervention) => intervention.loopId === loop.id)
          .sort((a, b) => String(b.at).localeCompare(String(a.at)))
          .slice(0, 5)
        return {
          ok: true,
          readOnly: true,
          screen,
          activeLoopId: loop.id,
          loop,
          gaps: loop.gaps || [],
          nextAction: loop.nextAction || null,
          nextCheck: loop.nextCheck || null,
          observations,
          interventions,
        }
      }

      if (action === 'save_note') {
        const subject = subjectFromArgs(withCore)
        if (!subject) return { ok: false, code: 'VALIDATION', error: '需要 subject 或 subjectId' }
        return ops.run(
          'note.save',
          {
            subject,
            kind: args?.kind || '理解',
            text: args?.text,
            authorSource: 'ai-draft',
            savedBy: 'agent',
            adopted: null,
          },
          { caller: 'agent' },
        )
      }

      if (action === 'save_prediction') {
        const subject = subjectFromArgs(withCore)
        if (!subject) return { ok: false, code: 'VALIDATION', error: '需要 subject 或 subjectId' }
        return ops.run('prediction.save', { subject, text: args?.text, resolveBy: args?.resolveBy }, { caller: 'agent' })
      }

      return { ok: false, code: 'VALIDATION', error: '未知动作：' + String(action) }
    },
  }
}

/** 工具执行失败时的兜底：把 AppError 变成可读结果，不让宿主工具层报异常。 */
export function asToolError(error) {
  if (error instanceof AppError) return { ok: false, code: error.code, error: error.message, details: error.details }
  return { ok: false, code: 'INTERNAL', error: String((error && error.message) || error) }
}
