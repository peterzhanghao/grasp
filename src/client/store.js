/**
 * 用户数据（store）的索引与归一化：state v2，同时容忍 v1 记录。
 *
 * 契约要点：
 * - 旧 v1 `origin:'user'` 不能直接追认为用户亲写 → legacyOriginUncertain=true，UI 必须提示。
 * - subject 统一成 {kind:'node'|'relation'|'investigation', id}；
 *   旧记录的 subjectId 视为 node。
 * - 只做展示归一化，不回写数据（回写是 Host 的职责）。
 */

import { subjectKey } from './util.js'

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const NOTE_KINDS = ['理解', '疑问', '证据', '反驳', '实践']

export function normalizeNote(raw, id) {
  if (!isObject(raw)) return null
  const noteId = raw.id || id
  if (!noteId) return null
  let subject = raw.subject
  if (!isObject(subject) || !subject.kind) {
    const legacyId = raw.subjectId
    subject = legacyId ? { kind: 'node', id: String(legacyId) } : null
  }
  const legacy = !isObject(raw.subject) && !!raw.subjectId
  const authorSource = raw.authorSource || (raw.origin === 'import' ? 'import' : raw.origin === 'user' ? 'user' : 'import')
  const savedBy = raw.savedBy || (raw.origin === 'user' ? 'ui' : 'agent')
  return {
    id: String(noteId),
    subject,
    subjectId: subject && subject.kind === 'node' ? subject.id : null,
    kind: NOTE_KINDS.includes(raw.kind) ? raw.kind : '理解',
    text: String(raw.text || ''),
    status: raw.status === 'archived' ? 'archived' : 'active',
    authorSource,
    savedBy,
    adopted: raw.adopted === true ? true : raw.adopted === false ? false : null,
    legacyOriginUncertain: raw.legacyOriginUncertain === true || legacy || (raw.origin === 'user' && raw.authorSource === undefined),
    encodingSuspected: raw.encodingSuspected === true,
    parentRevision: raw.parentRevision === undefined ? null : raw.parentRevision,
    createdAt: raw.createdAt || raw.updatedAt || null,
    updatedAt: raw.updatedAt || raw.createdAt || null,
    revision: Number(raw.revision) || 1,
    raw,
  }
}

function normalizeInvestigation(raw, id) {
  if (!isObject(raw)) return null
  const invId = raw.id || id
  if (!invId) return null
  let subject = raw.subject
  if (!isObject(subject) || !subject.kind) {
    subject = raw.subjectId ? { kind: 'node', id: String(raw.subjectId) } : null
  }
  return {
    id: String(invId),
    subject,
    title: String(raw.title || ''),
    claim: String(raw.claim || ''),
    counter: String(raw.counter || ''),
    nextTest: String(raw.nextTest || ''),
    status: ['open', 'testing', 'supported', 'revised', 'inconclusive'].includes(raw.status) ? raw.status : 'open',
    predictionIds: toArray(raw.predictionIds).map(String),
    experimentRunIds: toArray(raw.experimentRunIds).map(String),
    dialogSubjectKey: raw.dialogSubjectKey || (subject ? subjectKey(subject) : ''),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || raw.createdAt || null,
    raw,
  }
}

function normalizePrediction(raw, id) {
  if (!isObject(raw)) return null
  const predId = raw.id || id
  if (!predId) return null
  let subject = raw.subject
  if (!isObject(subject) || !subject.kind) {
    subject = raw.subjectId ? { kind: 'node', id: String(raw.subjectId) } : null
  }
  const legacy = raw.legacy === true || !('status' in raw)
  let status = raw.status
  if (!['open', 'supported', 'refuted', 'inconclusive'].includes(status)) {
    if (raw.resolved === true) status = 'inconclusive'
    else if (raw.resolved === false) status = 'open'
    else status = 'open'
  }
  return {
    id: String(predId),
    investigationId: raw.investigationId || null,
    subject,
    text: String(raw.text || ''),
    resolveBy: String(raw.resolveBy || ''),
    status,
    resolvedAt: raw.resolvedAt || null,
    resolvedByRunId: raw.resolvedByRunId || null,
    resolutionNote: raw.resolutionNote || null,
    legacy: legacy || raw.legacy === true,
    at: raw.at || raw.createdAt || null,
    raw,
  }
}

function normalizeRun(raw, id) {
  if (!isObject(raw)) return null
  const runId = raw.id || id
  if (!runId) return null
  let subject = raw.subject
  if (!isObject(subject) || !subject.kind) {
    subject = isObject(raw.subjectRef) ? raw.subjectRef : null
  }
  return {
    id: String(runId),
    experimentId: raw.experimentId || '',
    modelId: raw.modelId || '',
    modelVersion: raw.modelVersion === undefined ? null : raw.modelVersion,
    params: isObject(raw.params) ? raw.params : {},
    initial: isObject(raw.initial) ? raw.initial : null,
    prediction: raw.prediction === undefined ? null : raw.prediction,
    observation: isObject(raw.observation) ? raw.observation : null,
    criterion: raw.criterion || '',
    verdict: raw.verdict || '',
    subject,
    investigationId: raw.investigationId || null,
    legacy: raw.legacy === true,
    at: raw.at || raw.createdAt || null,
    result: isObject(raw.result) ? raw.result : null,
    raw,
  }
}

function normalizeTask(raw, id) {
  if (!isObject(raw)) return null
  const taskId = raw.id || id
  if (!taskId) return null
  // v1 契约记录：{ id, title, text, nodeIds, revision, updatedAt }
  const legacy = !Array.isArray(raw.acceptance) && typeof raw.text === 'string'
  const acceptance = legacy
    ? []
    : toArray(raw.acceptance).map((item) =>
        typeof item === 'string' ? { text: item, evidence: '' } : { text: String(item.text || ''), evidence: String(item.evidence || '') },
      )
  return {
    id: String(taskId),
    title: String(raw.title || ''),
    request: String(raw.request || raw.text || ''),
    goal: String(raw.goal || ''),
    acceptance,
    boundary: toArray(raw.boundary).map((item) => (typeof item === 'string' ? item : String(item.text || ''))),
    unknowns: toArray(raw.unknowns).map((item) =>
      typeof item === 'string' ? { question: item, answer: null } : { question: String(item.question || ''), answer: item.answer === undefined ? null : item.answer },
    ),
    conceptIds: toArray(raw.conceptIds).map(String),
    evidenceRefs: toArray(raw.evidenceRefs).filter(isObject),
    status: ['draft', 'saved', 'archived'].includes(raw.status) ? raw.status : 'saved',
    revision: Number(raw.revision) || 1,
    revisions: toArray(raw.revisions),
    model: isObject(raw.model) ? raw.model : null,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || raw.createdAt || null,
    legacy,
    raw,
  }
}

export function normalizeMessage(raw, index) {
  if (!isObject(raw)) return null
  const messageId = raw.id || `m_${index}`
  const role = raw.role === 'assistant' ? 'assistant' : 'user'
  let error = null
  if (isObject(raw.error)) error = { code: String(raw.error.code || ''), message: String(raw.error.message || raw.error.error || '') }
  const status = ['completed', 'failed', 'cancelled', 'streaming'].includes(raw.status) ? raw.status : 'completed'
  return {
    id: String(messageId),
    role,
    text: String(raw.text || ''),
    at: raw.at || null,
    requestId: raw.requestId || null,
    contextVersion: raw.contextVersion || '',
    model: isObject(raw.model) ? raw.model : null,
    status,
    error,
    partial: raw.partial === true,
    raw,
  }
}

function normalizeDialog(raw, key) {
  if (!isObject(raw)) return null
  const messages = toArray(raw.messages)
    .map((message, index) => normalizeMessage(message, index))
    .filter(Boolean)
  return {
    key,
    subject: isObject(raw.subject) ? raw.subject : null,
    messages,
    lastRequestId: raw.lastRequestId || null,
    pending: raw.pending || null,
    updatedAt: raw.updatedAt || null,
    raw,
  }
}

/**
 * 构建用户数据索引。
 * @param {object|null} store
 */
export function indexStore(store) {
  const source = isObject(store) ? store : {}

  const notes = []
  for (const [id, raw] of Object.entries(isObject(source.notes) ? source.notes : {})) {
    const note = normalizeNote(raw, id)
    if (note) notes.push(note)
  }
  notes.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  const notesById = new Map(notes.map((note) => [note.id, note]))
  const notesBySubject = new Map()
  for (const note of notes) {
    const key = note.subject ? subjectKey(note.subject) : ''
    if (!key) continue
    if (!notesBySubject.has(key)) notesBySubject.set(key, [])
    notesBySubject.get(key).push(note)
  }

  const relations = new Map()
  for (const [edgeId, raw] of Object.entries(isObject(source.relations) ? source.relations : {})) {
    if (!isObject(raw)) continue
    relations.set(edgeId, {
      edgeId,
      annotation: String(raw.annotation || ''),
      status: ['open', 'supported', 'challenged'].includes(raw.status) ? raw.status : 'open',
      evidenceNoteIds: toArray(raw.evidenceNoteIds).map(String),
      version: Number(raw.version) || 1,
      updatedAt: raw.updatedAt || null,
      raw,
    })
  }

  const investigations = []
  for (const [id, raw] of Object.entries(isObject(source.investigations) ? source.investigations : {})) {
    const item = normalizeInvestigation(raw, id)
    if (item) investigations.push(item)
  }
  investigations.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  const investigationsBySubject = new Map()
  for (const item of investigations) {
    const key = item.subject ? subjectKey(item.subject) : ''
    if (!key) continue
    if (!investigationsBySubject.has(key)) investigationsBySubject.set(key, [])
    investigationsBySubject.get(key).push(item)
  }

  const predictions = []
  for (const [id, raw] of Object.entries(isObject(source.predictions) ? source.predictions : {})) {
    const item = normalizePrediction(raw, id)
    if (item) predictions.push(item)
  }
  predictions.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
  const predictionsBySubject = new Map()
  const predictionsByInvestigation = new Map()
  for (const item of predictions) {
    const key = item.subject ? subjectKey(item.subject) : ''
    if (key) {
      if (!predictionsBySubject.has(key)) predictionsBySubject.set(key, [])
      predictionsBySubject.get(key).push(item)
    }
    if (item.investigationId) {
      if (!predictionsByInvestigation.has(item.investigationId)) predictionsByInvestigation.set(item.investigationId, [])
      predictionsByInvestigation.get(item.investigationId).push(item)
    }
  }

  const runs = []
  for (const [id, raw] of Object.entries(isObject(source.experiments) ? source.experiments : {})) {
    const item = normalizeRun(raw, id)
    if (item) runs.push(item)
  }
  /** 兼容旧结构：{ experiments: { [id]: record } } 与契约 v2 的 runs 同表。 */
  runs.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
  const runsBySubject = new Map()
  const runsByExperiment = new Map()
  for (const run of runs) {
    const key = run.subject ? subjectKey(run.subject) : ''
    if (key) {
      if (!runsBySubject.has(key)) runsBySubject.set(key, [])
      runsBySubject.get(key).push(run)
    }
    if (!runsByExperiment.has(run.experimentId)) runsByExperiment.set(run.experimentId, [])
    runsByExperiment.get(run.experimentId).push(run)
  }

  const tasks = []
  for (const [id, raw] of Object.entries(isObject(source.tasks) ? source.tasks : {})) {
    const item = normalizeTask(raw, id)
    if (item) tasks.push(item)
  }
  // v1 contracts 兼容
  for (const [id, raw] of Object.entries(isObject(source.contracts) ? source.contracts : {})) {
    if (tasks.some((task) => task.id === id)) continue
    const item = normalizeTask(raw, id)
    if (item) {
      item.legacy = true
      tasks.push(item)
    }
  }
  tasks.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  const tasksById = new Map(tasks.map((task) => [task.id, task]))

  const dialogsRaw = isObject(source.dialogs) ? source.dialogs : {}
  const dialogs = new Map()
  for (const [key, raw] of Object.entries(dialogsRaw)) {
    const dialog = normalizeDialog(raw, key)
    if (dialog) dialogs.set(key, dialog)
  }

  const importLog = toArray(source.importLog)
  const view = isObject(source.view) ? source.view : {}
  const meta = isObject(source.meta) ? source.meta : {}

  return {
    raw: source,
    schemaVersion: source.schemaVersion || null,
    notes,
    notesById,
    notesBySubject,
    relations,
    investigations,
    investigationsBySubject,
    predictions,
    predictionsBySubject,
    predictionsByInvestigation,
    runs,
    runsBySubject,
    runsByExperiment,
    tasks,
    tasksById,
    dialogs,
    importLog,
    view,
    meta,
    getDialog(subject) {
      const key = subjectKey(subject)
      return key ? dialogs.get(key) || null : null
    },
    notesFor(subject) {
      const key = subjectKey(subject)
      return key ? notesBySubject.get(key) || [] : []
    },
    relationFor(edgeId) {
      return relations.get(edgeId) || null
    },
    investigationsFor(subject) {
      const key = subjectKey(subject)
      return key ? investigationsBySubject.get(key) || [] : []
    },
    predictionsFor(subject) {
      const key = subjectKey(subject)
      return key ? predictionsBySubject.get(key) || [] : []
    },
    runsFor(subject) {
      const key = subjectKey(subject)
      return key ? runsBySubject.get(key) || [] : []
    },
    openInvestigations() {
      return investigations.filter((item) => item.status === 'open' || item.status === 'testing')
    },
    openPredictions() {
      return predictions.filter((item) => item.status === 'open')
    },
  }
}

export function emptyStoreIndex() {
  return indexStore({})
}
