/**
 * 业务操作：UI 与 agent 工具共用同一份实现（契约第 4 节 ops 表）。
 * 所有写操作都经 storage.commit 的候选状态 + 校验 + 原子写；
 * 所有 read 操作返回快照副本，调用方不得依赖内部引用。
 */
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { AppError, fromLlmFailure } from './errors.js'
import { subjectKey } from './dialog.js'
import { SCHEMA_VERSION } from '../domain/schema.js'
import { runDelay, runProxy, runGreen, EXPERIMENT_MODELS } from '../domain/experiments.js'
import { PACK_KIND, validatePack, applyPack } from '../domain/pack.js'
import { buildSystemText, SYSTEM_PROMPT } from './prompt.js'

const nowIso = () => new Date().toISOString()
const token = (prefix) => prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)

const NOTE_KINDS = new Set(['理解', '疑问', '证据', '反驳', '实践'])
const NOTE_SOURCES = new Set(['user', 'ai-draft', 'import'])
const VIEW_SCALES = new Set(['domain', 'subject', 'evidence'])
const VIEW_PROJECTIONS = new Set(['theory', 'history', 'practice'])

function assertString(value, name, { min = 0, max = 20000 } = {}) {
  if (typeof value !== 'string') throw new AppError('VALIDATION', `${name} 必须是字符串`)
  const text = value.trim()
  if (text.length < min) throw new AppError('VALIDATION', `${name} 不能为空`)
  if (text.length > max) throw new AppError('VALIDATION', `${name} 太长（上限 ${max} 字）`)
  return text
}

function normalizeSubject(state, core, subject, { allowInvestigation = true } = {}) {
  if (!subject || typeof subject !== 'object') throw new AppError('VALIDATION', '缺少 subject {kind,id}')
  const key = subjectKey(subject)
  if (!key) throw new AppError('VALIDATION', 'subject 不合法：kind 只能是 node/relation/investigation，且需要 id')
  if (subject.kind === 'node') {
    if (!(core.nodes || []).some((node) => node.id === subject.id)) throw new AppError('NOT_FOUND', '没有这个节点：' + subject.id)
  } else if (subject.kind === 'relation') {
    if (!(core.relations || []).some((relation) => relation.id === subject.id)) throw new AppError('NOT_FOUND', '没有这条关系：' + subject.id)
  } else if (subject.kind === 'investigation') {
    if (!allowInvestigation) throw new AppError('VALIDATION', '这个操作不接受 investigation 作为 subject')
    if (!state.investigations?.[subject.id]) throw new AppError('NOT_FOUND', '没有这个研究问题：' + subject.id)
  }
  return { kind: subject.kind, id: subject.id }
}

function ensureNoteState(state) {
  for (const table of ['notes', 'revisions', 'relations', 'investigations', 'predictions', 'experiments', 'tasks', 'dialogs']) {
    if (!state[table] || typeof state[table] !== 'object') state[table] = {}
  }
  if (!Array.isArray(state.importLog)) state.importLog = []
}

function experimentModel(id) {
  const model = EXPERIMENT_MODELS[id]
  if (!model) throw new AppError('NOT_FOUND', '没有这个实验：' + id)
  return model
}

function runExperiment(experimentId, params) {
  if (experimentId === 'delay') return runDelay({ K: params?.K, D: params?.D })
  if (experimentId === 'proxy') return runProxy({ e: params?.e })
  if (experimentId === 'green') return runGreen({ enabled: params?.enabled })
  throw new AppError('NOT_FOUND', '没有这个实验：' + experimentId)
}

function summarizeRun(experimentId, result) {
  if (experimentId === 'delay') {
    return { verdict: result.verdict, metrics: result.metrics, params: result.params, modelId: result.modelId, modelVersion: result.modelVersion }
  }
  if (experimentId === 'proxy') {
    return { verdict: result.verdict, visible: result.visible, hidden: result.hidden, params: result.params, modelId: result.modelId, modelVersion: result.modelVersion }
  }
  return {
    verdict: result.allGreen ? 'pass' : 'fail',
    allGreen: !!result.allGreen,
    cases: result.cases,
    caveat: result.caveat,
    params: result.params,
    modelId: result.modelId,
    modelVersion: result.modelVersion,
  }
}

export function createOps({ storage, dialog, resolveModel, getLlm, logger }) {
  const logWarn = (message, error) => {
    try {
      logger?.warn?.(message + (error ? '：' + String((error && error.message) || error) : ''))
    } catch {
      /* ignore */
    }
  }

  async function snapshotForRead() {
    const snap = await storage.ensure()
    if (snap.fatal) throw new AppError('READ_ONLY', snap.fatal.message, snap.fatal)
    return snap
  }

  async function commit(op, build) {
    const { snapshot, wroteAt } = await storage.commit(build, { op })
    return { snapshot, wroteAt }
  }

  /* ───────────── 笔记 ───────────── */

  async function noteSave(payload, context) {
    let saved = null
    const { snapshot } = await commit('note.save', (state, meta) => {
      ensureNoteState(state)
      const subject = normalizeSubject(state, meta.core, payload.subject, { allowInvestigation: true })
      const kind = NOTE_KINDS.has(payload.kind) ? payload.kind : '理解'
      const text = assertString(payload.text, '笔记正文', { min: 1, max: 20000 })
      const authorSource = NOTE_SOURCES.has(payload.authorSource) ? payload.authorSource : context.caller === 'agent' ? 'ai-draft' : 'user'
      const savedBy = payload.savedBy === 'agent' || payload.savedBy === 'ui' ? payload.savedBy : context.caller === 'agent' ? 'agent' : 'ui'
      const existing = payload.noteId ? state.notes[payload.noteId] : null
      if (payload.noteId && !existing) throw new AppError('NOT_FOUND', '没有这条笔记：' + payload.noteId)
      const revision = existing ? (existing.revision || 1) + 1 : 1
      const id = existing ? existing.id : payload.noteId || token('n')
      const record = {
        id,
        subject,
        kind,
        text,
        status: 'active',
        authorSource,
        savedBy,
        adopted: typeof payload.adopted === 'boolean' ? payload.adopted : authorSource === 'user' ? null : existing?.adopted ?? null,
        legacyOriginUncertain: existing?.legacyOriginUncertain ?? false,
        encodingSuspected: existing?.encodingSuspected ?? false,
        parentRevision: existing ? existing.revision || 1 : (payload.parentRevision ?? null),
        createdAt: existing ? existing.createdAt : nowIso(),
        updatedAt: nowIso(),
        revision,
      }
      state.notes[id] = record
      const revisions = state.revisions[id] || []
      revisions.push({ revision, text, at: record.updatedAt, savedBy })
      state.revisions[id] = revisions
      saved = structuredClone(record)
    })
    return { ok: true, note: saved, wroteAt: snapshot.lastWrite?.at || null }
  }

  async function noteArchive(payload) {
    const noteId = assertString(payload.noteId, 'noteId', { min: 1, max: 200 })
    const { snapshot } = await commit('note.archive', (state) => {
      ensureNoteState(state)
      const note = state.notes[noteId]
      if (!note) throw new AppError('NOT_FOUND', '没有这条笔记：' + noteId)
      note.status = note.status === 'active' ? 'archived' : 'active'
      note.updatedAt = nowIso()
    })
    return { ok: true, note: snapshot.store.notes[noteId] }
  }

  async function noteDelete(payload) {
    const noteId = assertString(payload.noteId, 'noteId', { min: 1, max: 200 })
    const { snapshot } = await commit('note.delete', (state) => {
      ensureNoteState(state)
      if (!state.notes[noteId]) throw new AppError('NOT_FOUND', '没有这条笔记：' + noteId)
      delete state.notes[noteId]
      delete state.revisions[noteId]
      for (const relation of Object.values(state.relations)) {
        if (!relation) continue
        relation.evidenceNoteIds = (relation.evidenceNoteIds || []).filter((id) => id !== noteId)
      }
    })
    return { ok: true, notes: snapshot.store.notes }
  }

  /* ───────────── 关系批注 ───────────── */

  async function relationAnnotate(payload) {
    const edgeId = assertString(payload.edgeId, 'edgeId', { min: 1, max: 200 })
    const { snapshot, wroteAt } = await commit('relation.annotate', (state, meta) => {
      ensureNoteState(state)
      const relation = (meta.core.relations || []).find((item) => item.id === edgeId)
      if (!relation) throw new AppError('NOT_FOUND', '没有这条关系：' + edgeId)
      const current = state.relations[edgeId] || {
        edgeId,
        annotation: '',
        status: 'open',
        evidenceNoteIds: [],
        version: 1,
        updatedAt: nowIso(),
      }
      if (payload.annotation !== undefined) current.annotation = assertString(payload.annotation, '个人批注', { min: 0, max: 20000 })
      if (payload.status !== undefined) {
        if (!['open', 'supported', 'challenged'].includes(payload.status)) throw new AppError('VALIDATION', '关系状态不合法')
        current.status = payload.status
      }
      if (payload.evidenceNoteIds !== undefined) {
        if (!Array.isArray(payload.evidenceNoteIds)) throw new AppError('VALIDATION', 'evidenceNoteIds 必须是数组')
        for (const id of payload.evidenceNoteIds) {
          if (!state.notes[id]) throw new AppError('NOT_FOUND', '证据笔记不存在：' + id)
        }
        current.evidenceNoteIds = payload.evidenceNoteIds.map(String)
      }
      current.version = (current.version || 1) + 1
      current.updatedAt = nowIso()
      state.relations[edgeId] = current
    })
    return { ok: true, relation: snapshot.store.relations[edgeId], wroteAt }
  }

  /* ───────────── 研究问题 / 预测 ───────────── */

  async function investigationSave(payload) {
    let savedId = null
    const { snapshot } = await commit('investigation.save', (state, meta) => {
      ensureNoteState(state)
      const subject = normalizeSubject(state, meta.core, payload.subject, { allowInvestigation: false })
      const id = payload.id || token('inv')
      const existing = state.investigations[id]
      if (payload.id && !existing) throw new AppError('NOT_FOUND', '没有这个研究问题：' + payload.id)
      const record = {
        id,
        subject,
        title: payload.title !== undefined ? assertString(payload.title, '标题', { min: 0, max: 200 }) : existing?.title || '',
        claim: payload.claim !== undefined ? assertString(payload.claim, '当前主张', { min: 0, max: 4000 }) : existing?.claim || '',
        counter: payload.counter !== undefined ? assertString(payload.counter, '相反解释', { min: 0, max: 4000 }) : existing?.counter || '',
        nextTest: payload.nextTest !== undefined ? assertString(payload.nextTest, '下一项检验', { min: 0, max: 1000 }) : existing?.nextTest || '',
        status: existing?.status || 'open',
        predictionIds: existing?.predictionIds || [],
        experimentRunIds: existing?.experimentRunIds || [],
        dialogSubjectKey: `${subject.kind}:${subject.id}`,
        createdAt: existing?.createdAt || nowIso(),
        updatedAt: nowIso(),
      }
      state.investigations[id] = record
      savedId = id
    })
    return { ok: true, investigation: snapshot.store.investigations[savedId] }
  }

  async function investigationResolve(payload) {
    const id = assertString(payload.id, 'id', { min: 1, max: 200 })
    if (!['open', 'testing', 'supported', 'revised', 'inconclusive'].includes(payload.status)) {
      throw new AppError('VALIDATION', '研究问题状态不合法')
    }
    const { snapshot } = await commit('investigation.resolve', (state) => {
      ensureNoteState(state)
      const investigation = state.investigations[id]
      if (!investigation) throw new AppError('NOT_FOUND', '没有这个研究问题：' + id)
      investigation.status = payload.status
      investigation.updatedAt = nowIso()
    })
    return { ok: true, investigation: snapshot.store.investigations[id] }
  }

  async function predictionSave(payload) {
    let savedId = null
    const { snapshot } = await commit('prediction.save', (state, meta) => {
      ensureNoteState(state)
      const subject = normalizeSubject(state, meta.core, payload.subject, { allowInvestigation: true })
      const text = assertString(payload.text, '预测', { min: 1, max: 2000 })
      const resolveBy = payload.resolveBy !== undefined ? assertString(payload.resolveBy, '判定条件', { min: 0, max: 1000 }) : ''
      const id = token('p')
      const record = {
        id,
        investigationId: payload.investigationId || null,
        subject,
        text,
        resolveBy,
        status: 'open',
        resolvedAt: null,
        resolvedByRunId: null,
        resolutionNote: null,
        legacy: false,
        at: nowIso(),
      }
      if (record.investigationId && !state.investigations[record.investigationId]) {
        throw new AppError('NOT_FOUND', '没有这个研究问题：' + record.investigationId)
      }
      state.predictions[id] = record
      if (record.investigationId) {
        const investigation = state.investigations[record.investigationId]
        investigation.predictionIds = [...(investigation.predictionIds || []), id]
        investigation.updatedAt = nowIso()
      }
      savedId = id
    })
    return { ok: true, prediction: snapshot.store.predictions[savedId] }
  }

  async function predictionResolve(payload) {
    const id = assertString(payload.id, 'id', { min: 1, max: 200 })
    if (!['open', 'supported', 'refuted', 'inconclusive'].includes(payload.status)) {
      throw new AppError('VALIDATION', '预测状态只能是 open/supported/refuted/inconclusive')
    }
    const { snapshot } = await commit('prediction.resolve', (state) => {
      ensureNoteState(state)
      const prediction = state.predictions[id]
      if (!prediction) throw new AppError('NOT_FOUND', '没有这个预测：' + id)
      if (payload.runId && !state.experiments[payload.runId]) throw new AppError('NOT_FOUND', '没有这条实验记录：' + payload.runId)
      prediction.status = payload.status
      prediction.resolvedAt = nowIso()
      prediction.resolvedByRunId = payload.runId || null
      prediction.resolutionNote = payload.note !== undefined ? assertString(payload.note, '说明', { min: 0, max: 2000 }) : null
    })
    return { ok: true, prediction: snapshot.store.predictions[id] }
  }

  /* ───────────── 实验 ───────────── */

  async function experimentRun(payload) {
    const experimentId = payload.experimentId
    const model = experimentModel(experimentId)
    const result = runExperiment(experimentId, payload.params || {})
    let subject = null
    let runId = null
    const { snapshot } = await commit('experiment.run', (state, meta) => {
      ensureNoteState(state)
      if (payload.subject) subject = normalizeSubject(state, meta.core, payload.subject, { allowInvestigation: true })
      if (payload.predictionId && !state.predictions[payload.predictionId]) throw new AppError('NOT_FOUND', '没有这个预测')
      if (payload.investigationId && !state.investigations[payload.investigationId]) {
        throw new AppError('NOT_FOUND', '没有这个研究问题：' + payload.investigationId)
      }
      const id = token('e')
      const summary = summarizeRun(experimentId, result)
      const run = {
        id,
        experimentId,
        modelId: model.id,
        modelVersion: model.version,
        params: result.params,
        initial: experimentId === 'delay' ? { y: result.initial } : {},
        prediction: typeof payload.prediction === 'string' ? payload.prediction.slice(0, 2000) : '',
        observation: summary,
        criterion: String(result.criterion || result.caveat || '按返回的判据比较预测与观察；一次仿真不构成稳定性证明'),
        verdict: summary.verdict,
        subject,
        investigationId: payload.investigationId || null,
        legacy: false,
        at: nowIso(),
      }
      state.experiments[id] = run
      if (payload.investigationId) {
        const investigation = state.investigations[payload.investigationId]
        investigation.experimentRunIds = [...(investigation.experimentRunIds || []), id]
        investigation.updatedAt = nowIso()
      }
      runId = id
    })
    return { ok: true, run: snapshot.store.experiments[runId], result }
  }

  async function experimentList(payload) {
    const snap = await snapshotForRead()
    let runs = Object.values(snap.store.experiments || {})
    if (payload?.subject) {
      const subject = normalizeSubject(snap.store, snap.core, payload.subject, { allowInvestigation: true })
      runs = runs.filter((run) => run.subject && run.subject.kind === subject.kind && run.subject.id === subject.id)
    }
    runs.sort((a, b) => String(b.at).localeCompare(String(a.at)))
    return { ok: true, runs }
  }

  /* ───────────── 任务草案 ───────────── */

  async function completeOnce({ systemText, messages, timeoutMs = 120000 }) {
    const info = await resolveModel()
    const llm = getLlm()
    if (!llm) throw new AppError('LLM_UNAVAILABLE', '宿主没有加载 llm 服务')
    if (!info.available || !info.provider || !info.model) {
      throw new AppError('LLM_UNAVAILABLE', info.reason || '宿主没有配置可用的默认模型')
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    let text = ''
    let finishChunk = null
    try {
      for await (const chunk of llm.stream({
        provider: info.provider,
        model: info.model,
        reasoningEffort: info.reasoningEffort ?? undefined,
        messages: [{ role: 'system', content: [{ type: 'text', text: systemText }] }, ...messages],
        signal: controller.signal,
      })) {
        if (!chunk) continue
        if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
        else if (chunk.type === 'finish') {
          finishChunk = chunk
          break
        }
      }
    } finally {
      clearTimeout(timeout)
    }
    if (finishChunk && finishChunk.reason === 'error') {
      throw fromLlmFailure(finishChunk.failure)
    }
    if (controller.signal.aborted && !finishChunk) throw new AppError('LLM_UNAVAILABLE', '模型调用超时或被取消')
    return { text, model: { provider: info.provider, model: info.model, reasoningEffort: info.reasoningEffort ?? null }, usage: finishChunk?.usage || null, finishReason: finishChunk?.reason || null }
  }

  function parseDraftJson(text) {
    const raw = String(text || '').trim()
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try {
      return JSON.parse(raw.slice(start, end + 1))
    } catch {
      return null
    }
  }

  async function taskDraft(payload, context) {
    const requestText = assertString(payload.requestText, '真实期望行为', { min: 4, max: 4000 })
    const snap = await snapshotForRead()
    const subject = payload.subject ? normalizeSubject(snap.store, snap.core, payload.subject, { allowInvestigation: true }) : null
    const systemText = [
      SYSTEM_PROMPT,
      '',
      '本次任务：把用户"要改变的行为"整理成一份可编辑的编程任务草案。',
      '只输出严格 JSON（不要 Markdown 代码块、不要解释），结构如下：',
      '{',
      '  "title": "一句话标题",',
      '  "goal": "可判定的期望行为（能被观测、能失败）",',
      '  "acceptance": [{"text": "验收条件", "evidence": "什么证据算够"}],',
      '  "boundary": ["非目标或不允许发生的行为"],',
      '  "unknowns": [{"question": "需要用户回答的问题"}],',
      '  "conceptIds": ["与任务相关的节点或关系 id"]',
      '}',
      '要求：acceptance 至少 1 条且每条都有可观测证据；boundary 至少 2 条；unknowns 至少 2 条，用问题而不是空白字段；',
      'conceptIds 只能取下面上下文里出现过的 id，不确定就留空。不要把历史类比当成机制保证。',
      subject ? '\n' + buildSystemText({ core: snap.core, state: snap.store, subject, investigationId: payload.investigationId || null }) : '',
    ].join('\n')
    const evidence = Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs.slice(0, 8) : []
    const userBlocks = ['我要改变的行为：' + requestText]
    if (evidence.length) userBlocks.push('可引用的证据：' + JSON.stringify(evidence))
    const result = await completeOnce({
      systemText,
      messages: [{ role: 'user', content: [{ type: 'text', text: userBlocks.join('\n') }] }],
    })
    const parsed = parseDraftJson(result.text)
    if (!parsed || typeof parsed !== 'object') {
      throw new AppError('LLM_OUTPUT', '模型没有返回可解析的 JSON 草案，可以重试，或直接用下面的原文手工编辑', { raw: String(result.text || '').slice(0, 4000) })
    }
    const nodeIds = new Set((snap.core.nodes || []).map((node) => node.id))
    const conceptIds = (Array.isArray(parsed.conceptIds) ? parsed.conceptIds : [])
      .filter((id) => typeof id === 'string' && nodeIds.has(id))
      .slice(0, 8)
    const draft = {
      title: typeof parsed.title === 'string' ? parsed.title.slice(0, 200) : requestText.slice(0, 40),
      request: requestText,
      goal: typeof parsed.goal === 'string' ? parsed.goal.slice(0, 2000) : '',
      acceptance: (Array.isArray(parsed.acceptance) ? parsed.acceptance : [])
        .map((item) => (typeof item === 'string' ? { text: item, evidence: '' } : { text: String(item?.text || ''), evidence: String(item?.evidence || '') }))
        .filter((item) => item.text)
        .slice(0, 8),
      boundary: (Array.isArray(parsed.boundary) ? parsed.boundary : []).map((item) => String(item)).filter(Boolean).slice(0, 8),
      unknowns: (Array.isArray(parsed.unknowns) ? parsed.unknowns : [])
        .map((item) => ({ question: typeof item === 'string' ? item : String(item?.question || ''), answer: null }))
        .filter((item) => item.question)
        .slice(0, 8),
      conceptIds,
      evidenceRefs: evidence,
    }
    if (!draft.acceptance.length || draft.boundary.length < 1) {
      throw new AppError('LLM_OUTPUT', '模型草案缺少数码可编辑的目标/验收/边界字段', { raw: String(result.text || '').slice(0, 4000), draft })
    }
    return { ok: true, draft, model: result.model, usage: result.usage }
  }

  async function taskSave(payload) {
    let savedId = null
    const request = assertString(payload.request, '真实期望行为', { min: 4, max: 4000 })
    const title = payload.title !== undefined ? assertString(payload.title, '标题', { min: 0, max: 200 }) : request.slice(0, 40)
    const goal = payload.goal !== undefined ? assertString(payload.goal, '目标', { min: 0, max: 4000 }) : ''
    const acceptance = Array.isArray(payload.acceptance) ? payload.acceptance.map((item) => ({ text: assertString(item?.text, '验收条件', { min: 1, max: 2000 }), evidence: String(item?.evidence || '') })) : []
    const boundary = Array.isArray(payload.boundary) ? payload.boundary.map((item) => assertString(item, '边界', { min: 1, max: 2000 })) : []
    const unknowns = Array.isArray(payload.unknowns)
      ? payload.unknowns.map((item) => ({ question: assertString(item?.question, '未知项问题', { min: 1, max: 1000 }), answer: item?.answer == null ? null : String(item.answer) }))
      : []
    const conceptIds = Array.isArray(payload.conceptIds) ? payload.conceptIds.map(String) : []
    const evidenceRefs = Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs.slice(0, 20) : []
    const normalizedModel = {
      provider: String(payload.model?.provider || ''),
      model: String(payload.model?.model || ''),
      reasoningEffort: typeof payload.model?.reasoningEffort === 'string' ? payload.model.reasoningEffort : null,
    }
    const { snapshot } = await commit('task.save', (state, meta) => {
      ensureNoteState(state)
      for (const id of conceptIds) {
        const isNode = (meta.core.nodes || []).some((node) => node.id === id)
        if (!isNode) throw new AppError('NOT_FOUND', '概念引用不存在（只接受节点 id）：' + id)
      }
      for (const ref of evidenceRefs) {
        const okKind = ref && (ref.kind === 'note' || ref.kind === 'experiment' || ref.kind === 'prediction')
        if (!okKind) throw new AppError('VALIDATION', '证据引用必须是 {kind:"note"|"experiment"|"prediction", id}')
        const exists =
          (ref.kind === 'note' && state.notes[ref.id]) ||
          (ref.kind === 'experiment' && state.experiments[ref.id]) ||
          (ref.kind === 'prediction' && state.predictions[ref.id])
        if (!exists) throw new AppError('NOT_FOUND', '证据引用不存在：' + ref.kind + '/' + ref.id)
      }
      const existing = payload.id ? state.tasks[payload.id] : null
      if (payload.id && !existing) throw new AppError('NOT_FOUND', '没有这个任务草案：' + payload.id)
      const revision = existing ? (existing.revision || 1) + 1 : 1
      const id = existing ? existing.id : token('t')
      const record = {
        id,
        title,
        request,
        goal,
        acceptance,
        boundary,
        unknowns,
        conceptIds,
        evidenceRefs,
        status: payload.status && ['draft', 'saved', 'archived'].includes(payload.status) ? payload.status : existing?.status || 'saved',
        revision,
        revisions: existing?.revisions ? [...existing.revisions] : [],
        model: existing?.model || normalizedModel,
        createdAt: existing?.createdAt || nowIso(),
        updatedAt: nowIso(),
        legacy: existing?.legacy || false,
      }
      record.revisions.push({
        revision,
        at: record.updatedAt,
        snapshot: { title, goal, acceptance, boundary, unknowns, conceptIds, evidenceRefs },
        model: record.model,
      })
      state.tasks[id] = record
      savedId = id
    })
    return { ok: true, task: snapshot.store.tasks[savedId] }
  }

  async function taskArchive(payload) {
    const id = assertString(payload.id, 'id', { min: 1, max: 200 })
    if (!['draft', 'saved', 'archived'].includes(payload.status)) throw new AppError('VALIDATION', '任务状态不合法')
    const { snapshot } = await commit('task.archive', (state) => {
      ensureNoteState(state)
      const task = state.tasks[id]
      if (!task) throw new AppError('NOT_FOUND', '没有这个任务草案：' + id)
      task.status = payload.status
      task.updatedAt = nowIso()
    })
    return { ok: true, task: snapshot.store.tasks[id] }
  }

  /* ───────────── 视图状态 ───────────── */

  async function viewSave(payload) {
    const { snapshot } = await commit('view.save', (state, meta) => {
      ensureNoteState(state)
      if (!state.view) state.view = {}
      const view = state.view
      if (payload.scale !== undefined) {
        if (!VIEW_SCALES.has(payload.scale)) throw new AppError('VALIDATION', 'scale 不合法')
        view.scale = payload.scale
      }
      if (payload.projection !== undefined) {
        if (!VIEW_PROJECTIONS.has(payload.projection)) throw new AppError('VALIDATION', 'projection 不合法')
        view.projection = payload.projection
      }
      if (payload.selectedNodeId !== undefined) {
        if (payload.selectedNodeId !== null && !(meta.core.nodes || []).some((node) => node.id === payload.selectedNodeId)) {
          throw new AppError('NOT_FOUND', '没有这个节点：' + payload.selectedNodeId)
        }
        view.selectedNodeId = payload.selectedNodeId
        if (payload.selectedNodeId) view.selectedRelationId = null
      }
      if (payload.selectedRelationId !== undefined) {
        if (payload.selectedRelationId !== null && !(meta.core.relations || []).some((relation) => relation.id === payload.selectedRelationId)) {
          throw new AppError('NOT_FOUND', '没有这条关系：' + payload.selectedRelationId)
        }
        view.selectedRelationId = payload.selectedRelationId
      }
      if (payload.activeInvestigationId !== undefined) {
        if (payload.activeInvestigationId !== null && !state.investigations[payload.activeInvestigationId]) {
          throw new AppError('NOT_FOUND', '没有这个研究问题：' + payload.activeInvestigationId)
        }
        view.activeInvestigationId = payload.activeInvestigationId
      }
      if (payload.directoryOpen !== undefined) view.directoryOpen = !!payload.directoryOpen
      if (payload.rightOpen !== undefined) view.rightOpen = !!payload.rightOpen
    })
    return { ok: true, view: snapshot.store.view }
  }

  /* ───────────── 内容包 ───────────── */

  function buildExportPack(snap) {
    const store = snap.store
    return {
      kind: PACK_KIND,
      schemaVersion: SCHEMA_VERSION,
      contentVersion: snap.core.version,
      pluginVersion: '1.0.0',
      exportedAt: nowIso(),
      tables: {
        notes: store.notes || {},
        revisions: store.revisions || {},
        relations: store.relations || {},
        investigations: store.investigations || {},
        predictions: store.predictions || {},
        experiments: store.experiments || {},
        tasks: store.tasks || {},
        dialogs: store.dialogs || {},
      },
    }
  }

  async function packageExport() {
    const snap = await snapshotForRead()
    return { ok: true, pack: buildExportPack(snap) }
  }

  async function packagePreview(payload) {
    const snap = await snapshotForRead()
    const preview = validatePack(payload?.pack, {
      core: snap.core,
      state: snap.store,
      schemaVersion: SCHEMA_VERSION,
    })
    return { ok: preview.ok, preview }
  }

  async function packageImport(payload) {
    const snap = await snapshotForRead()
    const mode = payload?.mode === 'skip' || payload?.mode === 'replace' ? payload.mode : 'merge'
    if (mode === 'replace' && payload?.confirm !== true) {
      throw new AppError('VALIDATION', '覆盖导入需要 confirm:true')
    }
    const preview = validatePack(payload?.pack, { core: snap.core, state: snap.store, schemaVersion: SCHEMA_VERSION })
    if (!preview.ok) {
      const tooLarge = (preview.errors || []).some((error) => error && error.code === 'PACKAGE_TOO_LARGE')
      if (tooLarge) {
        throw new AppError('PACKAGE_TOO_LARGE', '内容包超过 8 MiB 上限，未写入任何数据', { errors: (preview.errors || []).slice(0, 5) })
      }
      throw new AppError('IMPORT_INVALID', '内容包校验失败：' + preview.errors.slice(0, 3).map((error) => error.message).join('；'), {
        errors: preview.errors.slice(0, 40),
      })
    }
    if (preview.conflicts.length && mode === 'merge') {
      throw new AppError('CONFLICT', `导入与现有数据有 ${preview.conflicts.length} 处冲突，未写入任何数据`, { conflicts: preview.conflicts })
    }
    if (mode === 'replace') await storage.manualBackup()
    const { snapshot } = await commit('package.import', (state, meta) => {
      ensureNoteState(state)
      applyPack(state, preview.normalized, { mode, confirm: true, core: meta.core })
      state.importLog.push({
        id: token('imp'),
        at: nowIso(),
        mode,
        counts: preview.counts,
        conflicts: 0,
        sourceHash: typeof preview.sourceHash === 'string' ? preview.sourceHash : '',
      })
    })
    return { ok: true, applied: preview.counts, conflicts: [], snapshot: { view: snapshot.store.view } }
  }

  /* ───────────── 备份 / 迁移 ───────────── */

  async function backupCreate() {
    const path = await storage.manualBackup()
    return { ok: true, path }
  }

  async function migrationReport() {
    const snap = await snapshotForRead()
    let backups = []
    try {
      const names = (await readdir(storage.backupDir)).filter((name) => /^state\..*\.json$/.test(name))
      for (const name of names) {
        const info = await stat(join(storage.backupDir, name))
        backups.push({ name, size: info.size, at: new Date(info.mtimeMs).toISOString() })
      }
      backups.sort((a, b) => b.at.localeCompare(a.at))
    } catch {
      backups = []
    }
    return { ok: true, report: snap.migrationReport, backups: backups.slice(0, 20), dataPath: snap.dataPath }
  }

  /* ───────────── 分发 ───────────── */

  const handlers = {
    'note.save': noteSave,
    'note.archive': noteArchive,
    'note.delete': noteDelete,
    'relation.annotate': relationAnnotate,
    'investigation.save': investigationSave,
    'investigation.resolve': investigationResolve,
    'prediction.save': predictionSave,
    'prediction.resolve': predictionResolve,
    'experiment.run': experimentRun,
    'experiment.list': experimentList,
    'task.draft': taskDraft,
    'task.save': taskSave,
    'task.archive': taskArchive,
    'view.save': viewSave,
    'dialog.get': async (payload) => {
      const result = await dialog.get({ subject: payload?.subject })
      return { ok: true, ...result }
    },
    'dialog.cancel': async (payload) => {
      const requestId = assertString(payload?.requestId, 'requestId', { min: 4, max: 200 })
      const result = dialog.cancel(requestId)
      if (!result.ok) throw new AppError('NOT_FOUND', result.message)
      return { ok: true }
    },
    'package.export': packageExport,
    'package.preview': packagePreview,
    'package.import': packageImport,
    'backup.create': backupCreate,
    'migration.report': migrationReport,
  }

  async function run(op, payload, context = { caller: 'ui' }) {
    const handler = handlers[op]
    if (!handler) throw new AppError('NOT_FOUND', '未知操作：' + String(op))
    const normalizedContext = { caller: context.caller === 'agent' ? 'agent' : 'ui' }
    return handler(payload || {}, normalizedContext)
  }

  return { run, buildExportPack }
}
