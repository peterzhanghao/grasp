/**
 * 学习伙伴提示词与上下文装配。
 *
 * 原则：
 * - 模型看到的图谱内容必须来自内容包，且标注证据等级（formal / secondary / interpretation）。
 * - 用户自己的笔记只作为用户材料引用，不得被模型当成已证实事实。
 * - 每次回答都要给可执行的下一步，但不得自动替用户保存任何东西。
 */
import { relationsForNode, neighbors } from '../domain/graph.js'

export const SYSTEM_PROMPT = [
  '你是「掌控」（Grasp）里的学习伙伴，帮助用户研究一个控制论问题，并把理解迁移到编程智能体的任务设计上。',
  '',
  '回答规则：',
  '1. 严格区分四类信息：有前提与推导的形式结果；经验/历史解释；类比（不是同一机制）；作者判断。引用时必须点明属于哪一类。',
  '2. 不要宣布用户已经掌握某个概念。一次回答不是证据，仿真结果也不是稳定性证明。',
  '3. 主动给出可反驳点、适用条件与代价；如果用户的理解有问题，直接说清哪里不成立。',
  '4. 每次回答最后给一个用户可以马上做的下一步：写一个预测、跑一次实验、或改一处任务草案。',
  '5. 不替用户保存笔记、预测或任务；不声称你修改了任何数据。',
  '6. 用中文回答，Markdown 可用；不要编造来源、页码、引文或 DOI。来源未核验时明确说"未核验"。',
  '7. 不发起工具调用，不执行代码，不请求权限。',
].join('\n')

const MAX_CONTEXT_CHARS = 6000
const MAX_HISTORY_MESSAGES = 16
const MAX_MESSAGE_CHARS = 4000

function clip(text, max) {
  const value = String(text || '')
  if (value.length <= max) return value
  return value.slice(0, Math.max(0, max - 1)) + '…'
}

function sourceLine(source) {
  const parts = []
  if (source.author) parts.push(source.author)
  if (source.year) parts.push(String(source.year))
  if (source.ref) parts.push(source.ref)
  const label = source.verified === 'verified' ? '已核验' : source.verified === 'secondary' ? '二手来源' : '未核验'
  return `- ${source.title}（${parts.join(' · ') || '出处待补'}）[${label}]${source.url ? ' ' + source.url : ''}`
}

function subjectBlock(core, subject) {
  if (!subject) return ''
  if (subject.kind === 'node') {
    const node = (core.nodes || []).find((item) => item.id === subject.id)
    if (!node) return ''
    const group = (core.groups || []).find((item) => item.id === node.groupId)
    const lines = [
      `当前节点：${node.title}（${group ? group.title : '未分组'}）`,
      '定义：' + clip(node.def, 900),
      '机制：' + clip(node.mech, 700),
      '适用条件与边界：' + clip(node.limits, 700),
      '反例：' + clip(node.counter, 500),
    ]
    const relations = relationsForNode(core, node.id).slice(0, 8)
    if (relations.length) {
      lines.push('相关关系：')
      for (const relation of relations) {
        const other = relation.from === node.id ? relation.to : relation.from
        const otherNode = (core.nodes || []).find((item) => item.id === other)
        lines.push(`- [${relation.type}] ${relation.from} → ${relation.to}（另一端：${otherNode ? otherNode.title : other}）：${clip(relation.claim, 260)}`)
      }
    }
    const claims = (core.claims || []).filter((claim) => claim.subject && claim.subject.kind === 'node' && claim.subject.id === node.id).slice(0, 8)
    if (claims.length) {
      lines.push('主张与证据等级：')
      for (const claim of claims) lines.push(`- [${claim.kind}/${claim.verified}] ${clip(claim.text, 300)}`)
    }
    const sourceIds = new Set(node.sourceIds || [])
    for (const claim of claims) for (const id of claim.sourceIds || []) sourceIds.add(id)
    const sources = (core.sources || []).filter((source) => sourceIds.has(source.id)).slice(0, 8)
    if (sources.length) {
      lines.push('来源：')
      for (const source of sources) lines.push(sourceLine(source))
    }
    const neighbourIds = neighbors(core, node.id, 6).filter((id) => id !== node.id)
    if (neighbourIds.length) {
      lines.push('相邻节点：' + neighbourIds.map((id) => {
        const item = (core.nodes || []).find((entry) => entry.id === id)
        return item ? item.title : id
      }).join('、'))
    }
    return lines.join('\n')
  }
  if (subject.kind === 'relation') {
    const relation = (core.relations || []).find((item) => item.id === subject.id)
    if (!relation) return ''
    const from = (core.nodes || []).find((item) => item.id === relation.from)
    const to = (core.nodes || []).find((item) => item.id === relation.to)
    const lines = [
      `当前关系：${from ? from.title : relation.from} → ${to ? to.title : relation.to}`,
      `类型：${relation.type}`,
      '这条关系断言：' + clip(relation.claim, 1200),
      '成立条件：' + clip(relation.condition, 900),
      '代价/边界：' + clip(relation.cost, 900),
    ]
    const claims = (core.claims || []).filter((claim) => claim.subject && claim.subject.kind === 'relation' && claim.subject.id === relation.id)
    if (claims.length) {
      lines.push('主张与证据等级：')
      for (const claim of claims) lines.push(`- [${claim.kind}/${claim.verified}] ${clip(claim.text, 400)}`)
    }
    const sourceIds = new Set(relation.sourceIds || [])
    for (const claim of claims) for (const id of claim.sourceIds || []) sourceIds.add(id)
    const sources = (core.sources || []).filter((source) => sourceIds.has(source.id)).slice(0, 8)
    if (sources.length) {
      lines.push('来源：')
      for (const source of sources) lines.push(sourceLine(source))
    }
    return lines.join('\n')
  }
  if (subject.kind === 'investigation') {
    return '当前研究问题：' + subject.id
  }
  return ''
}

function notesBlock(state, subject) {
  if (!subject) return ''
  const notes = Object.values(state.notes || {})
    .filter((note) => note.subject && note.subject.kind === subject.kind && note.subject.id === subject.id && note.status === 'active')
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 10)
  if (!notes.length) return ''
  const lines = ['用户自己保存的材料（用户原文或用户采纳的 AI 草案，不等于已证实事实）：']
  for (const note of notes) {
    const origin = note.authorSource === 'user' ? '用户原文' : note.authorSource === 'ai-draft' ? '用户采纳的 AI 草案' : '导入材料'
    lines.push(`- [${origin}/${note.kind}] ${clip(note.text, 500)}`)
  }
  return lines.join('\n')
}

function investigationBlock(state, investigationId) {
  if (!investigationId) return ''
  const investigation = state.investigations?.[investigationId]
  if (!investigation) return ''
  const lines = [
    '当前研究问题：',
    '- 主张：' + clip(investigation.claim, 500),
    '- 相反解释：' + clip(investigation.counter, 500),
    '- 下一项检验：' + clip(investigation.nextTest, 400),
    '- 状态：' + investigation.status,
  ]
  const predictions = Object.values(state.predictions || {}).filter(
    (prediction) => prediction.investigationId === investigationId && prediction.status === 'open',
  )
  if (predictions.length) {
    lines.push('待验证预测：')
    for (const prediction of predictions.slice(0, 5)) lines.push(`- ${clip(prediction.text, 300)}（判据：${clip(prediction.resolveBy, 200)}）`)
  }
  return lines.join('\n')
}

/** 组装 system 文本：固定规则 + 当前 subject + 用户材料 + 研究问题。 */
export function buildSystemText({ core, state, subject, investigationId }) {
  const blocks = [SYSTEM_PROMPT, '', '==== 当前图谱上下文 ====']
  const subjectText = subjectBlock(core, subject)
  if (subjectText) blocks.push(subjectText)
  const noteText = notesBlock(state, subject)
  if (noteText) blocks.push('', noteText)
  const investigationText = investigationBlock(state, investigationId)
  if (investigationText) blocks.push('', investigationText)
  return clip(blocks.join('\n'), MAX_CONTEXT_CHARS)
}

/** 把已保存对话转成宿主 llm 需要的 messages，并截断到最近 N 条。 */
export function buildMessages({ core, state, dialog, subject, text, investigationId }) {
  const messages = [{ role: 'system', content: [{ type: 'text', text: buildSystemText({ core, state, subject, investigationId }) }] }]
  const history = (dialog?.messages || []).filter((message) => message.status !== 'failed' || message.text)
  const sliced = history.slice(-MAX_HISTORY_MESSAGES)
  for (const message of sliced) {
    const body = clip(message.text, MAX_MESSAGE_CHARS)
    if (!body) continue
    messages.push({ role: message.role === 'assistant' ? 'assistant' : 'user', content: [{ type: 'text', text: body }] })
  }
  messages.push({ role: 'user', content: [{ type: 'text', text: clip(text, MAX_MESSAGE_CHARS) }] })
  return messages
}

export function contextVersion(core, subject) {
  const base = String(core?.version || '0')
  if (!subject) return base
  if (subject.kind === 'relation') {
    const relation = (core.relations || []).find((item) => item.id === subject.id)
    return `${base}+relation:${subject.id}@${relation?.version ?? 1}`
  }
  return `${base}+${subject.kind}:${subject.id}`
}
