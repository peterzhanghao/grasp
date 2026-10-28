/**
 * 任务草案：
 * 先问「要改变什么行为」→ ops task.draft（真实模型）→ 三栏可编辑（目标/验收/边界）
 * → 未知项以问题呈现 + 概念/证据关联 → task.save → 版本回看/对比/复制/导出。
 * 不自动发送到任何地方。
 */

const { useState, useMemo } = React

import { Button, Tag, FieldLabel, EmptyState, SectionHeader } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { TimeLabel, useCopyText } from './shared.js'
import { downloadJson, downloadText, formatTime, truncate } from '../util.js'

function emptyDraft() {
  return {
    title: '',
    request: '',
    goal: '',
    acceptance: [{ text: '', evidence: '' }],
    boundary: [''],
    unknowns: [{ question: '', answer: null }],
    conceptIds: [],
    evidenceRefs: [],
  }
}

function normalizeDraft(draft) {
  const base = emptyDraft()
  if (!draft || typeof draft !== 'object') return base
  return {
    title: String(draft.title || ''),
    request: String(draft.request || ''),
    goal: String(draft.goal || ''),
    acceptance: Array.isArray(draft.acceptance) && draft.acceptance.length
      ? draft.acceptance.map((item) =>
          typeof item === 'string' ? { text: item, evidence: '' } : { text: String(item.text || ''), evidence: String(item.evidence || '') },
        )
      : [{ text: '', evidence: '' }],
    boundary: Array.isArray(draft.boundary) && draft.boundary.length
      ? draft.boundary.map((item) => (typeof item === 'string' ? item : String(item.text || '')))
      : [''],
    unknowns: Array.isArray(draft.unknowns) && draft.unknowns.length
      ? draft.unknowns.map((item) =>
          typeof item === 'string' ? { question: item, answer: null } : { question: String(item.question || ''), answer: item.answer === undefined ? null : item.answer },
        )
      : [{ question: '', answer: null }],
    conceptIds: Array.isArray(draft.conceptIds) ? draft.conceptIds.map(String) : [],
    evidenceRefs: Array.isArray(draft.evidenceRefs) ? draft.evidenceRefs.filter((item) => item && item.kind && item.id) : [],
  }
}

function taskToMarkdown(t, ci, task) {
  const conceptTitles = (task.conceptIds || [])
    .map((id) => (ci.nodesById.get(id) || {}).title || id)
    .join('、')
  const lines = []
  lines.push(`# ${task.title || t('loop.task.title')}`)
  lines.push('')
  lines.push(`## ${t('loop.task.request')}`)
  lines.push(task.request || '—')
  lines.push('')
  lines.push(`## ${t('loop.task.goal')}`)
  lines.push(task.goal || '—')
  lines.push('')
  lines.push(`## ${t('loop.task.acceptance')}`)
  for (const item of task.acceptance || []) lines.push(`- ${item.text}${item.evidence ? `（${item.evidence}）` : ''}`)
  lines.push('')
  lines.push(`## ${t('loop.task.boundary')}`)
  for (const item of task.boundary || []) lines.push(`- ${item}`)
  lines.push('')
  lines.push(`## ${t('loop.task.unknowns')}`)
  for (const item of task.unknowns || []) lines.push(`- ${item.question}${item.answer ? ` → ${item.answer}` : ''}`)
  if (conceptTitles) {
    lines.push('')
    lines.push(`## ${t('loop.task.concepts')}`)
    lines.push(conceptTitles)
  }
  lines.push('')
  lines.push(t('loop.task.notSent'))
  return lines.join('\n')
}

/* ───────────────────────── 草案列表 ───────────────────────── */

function taskRelatedToSubject(task, subject, ci) {
  if (!subject) return false
  if (subject.kind === 'node' && (task.conceptIds || []).includes(subject.id)) return true
  return (task.evidenceRefs || []).some((ref) => {
    if (subject.kind === 'node' && ref.kind === 'note') return true
    return false
  })
}

export function TasksSection(props) {
  const t = props.t
  const storeIndex = props.storeIndex
  const subject = props.subject
  const tasks = storeIndex.tasks
  const related = tasks.filter((task) => taskRelatedToSubject(task, subject, props.ci))
  const list = related.length ? related : tasks
  return h(
    'section',
    { className: 'la-evsection', 'aria-label': t('loop.task.title') },
    h(
      'div',
      { className: 'la-evsection__head' },
      h('h3', { className: 'la-evsection__title' }, `${t('loop.task.title')} · ${list.length}`),
      h(Button, { size: 'sm', variant: 'ghost', icon: 'plus', onClick: props.onNewTask }, t('loop.evidence.newTask')),
    ),
    !list.length
      ? h(EmptyState, { icon: 'notes', title: t('loop.evidence.taskEmpty') })
      : h(
          'ul',
          { className: 'la-tasklist' },
          list.map((task) =>
            h(
              'li',
              { key: task.id, className: 'la-tasklist__item' },
              h(
                'button',
                { type: 'button', className: 'la-tasklist__open', onClick: () => props.onOpenTask(task.id) },
                h(
                  'span',
                  { className: 'la-tasklist__main' },
                  h('span', { className: 'la-tasklist__title' }, task.title || t('loop.task.title')),
                  h('span', { className: 'la-tasklist__sub' }, truncate(task.request || task.goal || '', 90)),
                ),
                h(
                  'span',
                  { className: 'la-tasklist__side' },
                  h(Tag, { tone: task.status === 'archived' ? 'neutral' : task.status === 'draft' ? 'warn' : 'accent' }, t(`loop.task.status.${task.status}`)),
                  h('span', { className: 'la-muted' }, `${t('loop.task.version', { n: task.revision })} · ${formatTime(task.updatedAt)}`),
                ),
              ),
            ),
          ),
        ),
  )
}

/* ───────────────────────── 编辑器 ───────────────────────── */

export function TaskEditor(props) {
  const t = props.t
  const ci = props.ci
  const storeIndex = props.storeIndex
  const copy = useCopyText(t, props.addReceipt)
  const initialTask = props.initialTaskId ? storeIndex.tasksById.get(props.initialTaskId) : null
  const [phase, setPhase] = useState(initialTask ? 'saved' : 'request')
  const [requestText, setRequestText] = useState(initialTask ? initialTask.request : '')
  const [draft, setDraft] = useState(initialTask ? taskToDraft(initialTask) : emptyDraft())
  const [draftMeta, setDraftMeta] = useState(initialTask ? { model: initialTask.model } : null)
  const [savedTask, setSavedTask] = useState(initialTask)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [compareRevision, setCompareRevision] = useState('')

  const subject = props.subject
  const evidenceOptions = useMemo(() => {
    const options = []
    if (!subject) return options
    for (const note of storeIndex.notesFor(subject).slice(0, 6)) {
      options.push({ kind: 'note', id: note.id, label: `${t('loop.common.notes')}：${truncate(note.text, 48)}` })
    }
    for (const run of storeIndex.runsFor(subject).slice(0, 4)) {
      options.push({ kind: 'experiment', id: run.id, label: `${t('loop.evidence.runs')}：${run.modelId} ${JSON.stringify(run.params || {})}` })
    }
    for (const prediction of storeIndex.predictionsFor(subject).slice(0, 4)) {
      options.push({ kind: 'prediction', id: prediction.id, label: `${t('loop.pred.title')}：${truncate(prediction.text, 48)}` })
    }
    return options
  }, [storeIndex, subject, t])

  if (phase === 'saved' && savedTask) {
    return h(SavedTaskView, {
      t,
      ci,
      storeIndex,
      task: savedTask,
      copy,
      onBack: props.onBack,
      onEdit: () => {
        setDraft(taskToDraft(savedTask))
        setPhase('edit')
        setSavedTask(null)
        setError('')
      },
      onArchive: async () => {
        setBusy(true)
        setError('')
        try {
          await props.perform('task.archive', { id: savedTask.id, status: 'archived' }, {
            successText: t('loop.status.saveOk', { what: t('loop.task.title') }),
          })
        } catch (rawError) {
          setError(String((rawError && rawError.message) || rawError))
        } finally {
          setBusy(false)
        }
      },
      busy,
      error,
    })
  }

  const updateDraft = (patch) => setDraft((previous) => Object.assign({}, previous, patch))

  const generate = async () => {
    const text = requestText.trim()
    if (!text) {
      setError(t('loop.task.needRequest'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await props.perform(
        'task.draft',
        { requestText: text, subject: subject || null, evidenceRefs: evidenceOptions.slice(0, 4).map((option) => ({ kind: option.kind, id: option.id })) },
        { receipt: false, reload: false },
      )
      setDraft(normalizeDraft(response.draft))
      setDraftMeta({ model: response.model, usage: response.usage })
      setPhase('edit')
      if (props.addReceipt) props.addReceipt({ kind: 'info', text: t('loop.task.draftReady') })
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const payload = Object.assign({}, draft, {
        id: savedTask && savedTask.id ? savedTask.id : undefined,
        request: requestText.trim() || draft.request,
        status: 'saved',
      })
      const response = await props.perform('task.save', payload, {
        successText: t('loop.task.saved'),
      })
      setSavedTask(response.task || null)
      setPhase('saved')
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  const exportTask = () => {
    const markdown = taskToMarkdown(t, ci, Object.assign({}, draft, { request: requestText }))
    const result = downloadText(`loop-task-${new Date().toISOString().slice(0, 10)}.md`, markdown, 'text/markdown')
    if (props.addReceipt) {
      props.addReceipt(
        result.ok
          ? { kind: 'info', text: t('loop.task.exportDone') }
          : { kind: 'error', text: `${t('loop.common.copyFailed')}：${result.reason}` },
      )
    }
  }

  const currentConcepts = (draft.conceptIds || []).map((id) => ci.nodesById.get(id) || { id, title: id })
  const availableConcepts = ci.nodes.filter((node) => !(draft.conceptIds || []).includes(node.id))

  return h(
    'div',
    { className: 'la-taskeditor' },
    h(
      'div',
      { className: 'la-taskeditor__head' },
      h(Button, { size: 'sm', variant: 'ghost', icon: 'chevronLeft', onClick: props.onBack }, t('loop.task.back')),
      h('h2', { className: 'la-taskeditor__title' }, t('loop.task.editorTitle')),
      h('span', { className: 'la-muted' }, t('loop.task.notSent')),
    ),
    h(
      'p',
      { className: 'la-taskeditor__notsent' },
      h(Icon, { name: 'info', size: 16 }),
      t('loop.task.notSent'),
    ),
    phase === 'request'
      ? h(
          'div',
          { className: 'la-taskstart' },
          h('h3', { className: 'la-taskstart__title' }, t('loop.task.startTitle')),
          h(
            'label',
            { className: 'la-field' },
            h(FieldLabel, null, t('loop.task.request')),
            h('textarea', {
              className: 'la-textarea',
              rows: 4,
              value: requestText,
              placeholder: t('loop.task.requestPlaceholder'),
              onChange: (event) => setRequestText(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'la-taskstart__actions' },
            h(Button, { variant: 'primary', icon: 'flask', loading: busy, disabled: !requestText.trim(), onClick: generate }, busy ? t('loop.task.generating') : t('loop.task.generate')),
            h(
              Button,
              {
                variant: 'ghost',
                onClick: () => {
                  setDraft(emptyDraft())
                  setDraftMeta(null)
                  setPhase('edit')
                },
              },
              t('loop.common.edit'),
            ),
            error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
          ),
        )
      : h(
          'div',
          { className: 'la-taskform' },
          h(
            'label',
            { className: 'la-field' },
            h(FieldLabel, null, t('loop.task.request')),
            h('textarea', {
              className: 'la-textarea',
              rows: 3,
              value: requestText,
              placeholder: t('loop.task.requestPlaceholder'),
              onChange: (event) => setRequestText(event.target.value),
            }),
          ),
          h(
            'label',
            { className: 'la-field' },
            h(FieldLabel, null, t('loop.task.title')),
            h('input', {
              className: 'la-input',
              value: draft.title,
              onChange: (event) => updateDraft({ title: event.target.value }),
            }),
          ),
          h(
            'div',
            { className: 'la-taskcolumns' },
            h(
              'section',
              { className: 'la-taskcol', 'aria-label': t('loop.task.goal') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.goal')),
              h('textarea', {
                className: 'la-textarea',
                rows: 4,
                value: draft.goal,
                onChange: (event) => updateDraft({ goal: event.target.value }),
                'aria-label': t('loop.task.goal'),
              }),
            ),
            h(
              'section',
              { className: 'la-taskcol', 'aria-label': t('loop.task.acceptance') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.acceptance')),
              draft.acceptance.map((item, index) =>
                h(
                  'div',
                  { key: index, className: 'la-taskitem' },
                  h('input', {
                    className: 'la-input',
                    value: item.text,
                    placeholder: t('loop.task.acceptance'),
                    'aria-label': `${t('loop.task.acceptance')} ${index + 1}`,
                    onChange: (event) => {
                      const next = draft.acceptance.slice()
                      next[index] = Object.assign({}, next[index], { text: event.target.value })
                      updateDraft({ acceptance: next })
                    },
                  }),
                  h('input', {
                    className: 'la-input la-input--sm',
                    value: item.evidence,
                    placeholder: t('loop.task.evidence'),
                    'aria-label': `${t('loop.task.evidence')} ${index + 1}`,
                    onChange: (event) => {
                      const next = draft.acceptance.slice()
                      next[index] = Object.assign({}, next[index], { evidence: event.target.value })
                      updateDraft({ acceptance: next })
                    },
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'la-iconbtn la-iconbtn--sm',
                      label: t('loop.task.remove'),
                      'aria-label': t('loop.task.remove'),
                      onClick: () => updateDraft({ acceptance: draft.acceptance.filter((_, position) => position !== index) }),
                    },
                    h(Icon, { name: 'close', size: 14 }),
                  ),
                ),
              ),
              h(
                Button,
                { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => updateDraft({ acceptance: draft.acceptance.concat([{ text: '', evidence: '' }]) }) },
                t('loop.task.addAcceptance'),
              ),
              !draft.acceptance.some((item) => item.text.trim())
                ? h('p', { className: 'la-hintwarn' }, t('loop.task.acceptanceEmpty'))
                : null,
            ),
            h(
              'section',
              { className: 'la-taskcol', 'aria-label': t('loop.task.boundary') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.boundary')),
              draft.boundary.map((item, index) =>
                h(
                  'div',
                  { key: index, className: 'la-taskitem' },
                  h('input', {
                    className: 'la-input',
                    value: item,
                    placeholder: t('loop.task.boundary'),
                    'aria-label': `${t('loop.task.boundary')} ${index + 1}`,
                    onChange: (event) => {
                      const next = draft.boundary.slice()
                      next[index] = event.target.value
                      updateDraft({ boundary: next })
                    },
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'la-iconbtn la-iconbtn--sm',
                      'aria-label': t('loop.task.remove'),
                      onClick: () => updateDraft({ boundary: draft.boundary.filter((_, position) => position !== index) }),
                    },
                    h(Icon, { name: 'close', size: 14 }),
                  ),
                ),
              ),
              h(Button, { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => updateDraft({ boundary: draft.boundary.concat(['']) }) }, t('loop.task.addBoundary')),
            ),
          ),
          h(
            'section',
            { className: 'la-taskblock', 'aria-label': t('loop.task.unknowns') },
            h('h3', { className: 'la-taskcol__title' }, t('loop.task.unknowns')),
            draft.unknowns.map((item, index) =>
              h(
                'div',
                { key: index, className: 'la-taskitem' },
                h('input', {
                  className: 'la-input',
                  value: item.question,
                  placeholder: t('loop.task.unknowns'),
                  'aria-label': `${t('loop.task.unknowns')} ${index + 1}`,
                  onChange: (event) => {
                    const next = draft.unknowns.slice()
                    next[index] = Object.assign({}, next[index], { question: event.target.value })
                    updateDraft({ unknowns: next })
                  },
                }),
                h('input', {
                  className: 'la-input la-input--sm',
                  value: item.answer || '',
                  placeholder: t('loop.task.answerPlaceholder'),
                  onChange: (event) => {
                    const next = draft.unknowns.slice()
                    next[index] = Object.assign({}, next[index], { answer: event.target.value || null })
                    updateDraft({ unknowns: next })
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'la-iconbtn la-iconbtn--sm',
                    'aria-label': t('loop.task.remove'),
                    onClick: () => updateDraft({ unknowns: draft.unknowns.filter((_, position) => position !== index) }),
                  },
                  h(Icon, { name: 'close', size: 14 }),
                ),
              ),
            ),
            h(
              Button,
              { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => updateDraft({ unknowns: draft.unknowns.concat([{ question: '', answer: null }]) }) },
              t('loop.task.addUnknown'),
            ),
          ),
          h(
            'div',
            { className: 'la-taskmeta' },
            h(
              'section',
              { className: 'la-taskblock', 'aria-label': t('loop.task.concepts') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.concepts')),
              h(
                'div',
                { className: 'la-chips' },
                currentConcepts.map((node) =>
                  h(
                    'button',
                    {
                      key: node.id,
                      type: 'button',
                      className: 'la-chip is-on',
                      title: t('loop.task.remove'),
                      onClick: () => updateDraft({ conceptIds: draft.conceptIds.filter((id) => id !== node.id) }),
                    },
                    node.title,
                  ),
                ),
              ),
              h(
                'select',
                {
                  className: 'la-select',
                  value: '',
                  'aria-label': t('loop.task.concepts'),
                  onChange: (event) => {
                    if (!event.target.value) return
                    updateDraft({ conceptIds: draft.conceptIds.concat([event.target.value]) })
                  },
                },
                h('option', { value: '' }, `+ ${t('loop.task.concepts')}`),
                availableConcepts.map((node) => h('option', { key: node.id, value: node.id }, node.title)),
              ),
            ),
            h(
              'section',
              { className: 'la-taskblock', 'aria-label': t('loop.task.evidence') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.evidence')),
              h(
                'ul',
                { className: 'la-taskevidence' },
                draft.evidenceRefs.map((ref) =>
                  h(
                    'li',
                    { key: `${ref.kind}:${ref.id}` },
                    h('span', null, evidenceLabel(t, storeIndex, ref)),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'la-iconbtn la-iconbtn--sm',
                        'aria-label': t('loop.task.remove'),
                        onClick: () =>
                          updateDraft({
                            evidenceRefs: draft.evidenceRefs.filter((item) => !(item.kind === ref.kind && item.id === ref.id)),
                          }),
                      },
                      h(Icon, { name: 'close', size: 14 }),
                    ),
                  ),
                ),
              ),
              h(
                'select',
                {
                  className: 'la-select',
                  value: '',
                  'aria-label': t('loop.task.evidence'),
                  onChange: (event) => {
                    const value = event.target.value
                    if (!value) return
                    const [kind, id] = value.split('::')
                    updateDraft({ evidenceRefs: draft.evidenceRefs.concat([{ kind, id }]) })
                  },
                },
                h('option', { value: '' }, `+ ${t('loop.task.evidence')}`),
                evidenceOptions
                  .filter((option) => !draft.evidenceRefs.some((ref) => ref.kind === option.kind && ref.id === option.id))
                  .map((option) => h('option', { key: `${option.kind}::${option.id}`, value: `${option.kind}::${option.id}` }, option.label)),
              ),
              !evidenceOptions.length ? h('p', { className: 'la-muted' }, t('loop.task.evidenceEmpty')) : null,
            ),
          ),
          draftMeta && draftMeta.model
            ? h(
                'p',
                { className: 'la-muted' },
                `${t('loop.task.model')}：${draftMeta.model.provider || '?'} / ${draftMeta.model.model || '?'}${
                  draftMeta.model.reasoningEffort ? `（${draftMeta.model.reasoningEffort}）` : ''
                }`,
              )
            : null,
          h(
            'div',
            { className: 'la-taskform__actions' },
            h(Button, { variant: 'primary', icon: 'check', loading: busy, onClick: save }, t('loop.task.save')),
            h(Button, { variant: 'ghost', icon: 'copy', onClick: () => copy(taskToMarkdown(t, ci, Object.assign({}, draft, { request: requestText }))) }, t('loop.task.copy')),
            h(Button, { variant: 'ghost', icon: 'external', onClick: exportTask }, t('loop.task.export')),
            error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
          ),
        ),
  )
}

function taskToDraft(task) {
  return normalizeDraft({
    title: task.title,
    request: task.request,
    goal: task.goal,
    acceptance: task.acceptance,
    boundary: task.boundary,
    unknowns: task.unknowns,
    conceptIds: task.conceptIds,
    evidenceRefs: task.evidenceRefs,
  })
}

function evidenceLabel(t, storeIndex, ref) {
  if (ref.kind === 'note') {
    const note = storeIndex.notesById.get(ref.id)
    return `${t('loop.common.notes')}：${note ? truncate(note.text, 60) : ref.id}`
  }
  if (ref.kind === 'experiment') {
    const run = storeIndex.runs.find((item) => item.id === ref.id)
    return `${t('loop.evidence.runs')}：${run ? `${run.modelId} ${JSON.stringify(run.params || {})}` : ref.id}`
  }
  if (ref.kind === 'prediction') {
    const prediction = storeIndex.predictions.find((item) => item.id === ref.id)
    return `${t('loop.pred.title')}：${prediction ? truncate(prediction.text, 60) : ref.id}`
  }
  return `${ref.kind}:${ref.id}`
}

/* ───────────────────────── 已保存视图 ───────────────────────── */

function SavedTaskView(props) {
  const t = props.t
  const ci = props.ci
  const task = props.task
  const revisions = task.revisions || []
  const [compareRevision, setCompareRevision] = useState('')
  const compareSnapshot = useMemo(() => {
    if (!compareRevision) return null
    const revision = revisions.find((item) => String(item.revision) === String(compareRevision))
    return revision ? revision.snapshot : null
  }, [compareRevision, revisions])
  const taskText = taskToMarkdown(t, ci, task)
  return h(
    'div',
    { className: 'la-taskeditor la-taskeditor--saved' },
    h(
      'div',
      { className: 'la-taskeditor__head' },
      h(Button, { size: 'sm', variant: 'ghost', icon: 'chevronLeft', onClick: props.onBack }, t('loop.task.back')),
      h('h2', { className: 'la-taskeditor__title' }, task.title || t('loop.task.title')),
      h(Tag, { tone: 'accent' }, t(`loop.task.status.${task.status}`)),
      h('span', { className: 'la-muted' }, t('loop.task.version', { n: task.revision })),
      h('span', { className: 'la-muted' }, formatTime(task.updatedAt)),
    ),
    h(
      'div',
      { className: 'la-taskeditor__actions' },
      h(Button, { size: 'sm', variant: 'secondary', icon: 'edit', onClick: props.onEdit }, t('loop.common.edit')),
      h(Button, { size: 'sm', variant: 'ghost', icon: 'archive', loading: props.busy, onClick: props.onArchive }, t('loop.task.archive')),
      h(Button, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => props.copy(taskText) }, t('loop.task.copy')),
      h(
        Button,
        {
          size: 'sm',
          variant: 'ghost',
          icon: 'external',
          onClick: () => downloadText(`loop-task-${task.id}.md`, taskText, 'text/markdown'),
        },
        t('loop.task.export'),
      ),
      revisions.length
        ? h(
            'label',
            { className: 'la-taskversions' },
            h('span', { className: 'la-muted' }, t('loop.task.versions')),
            h(
              'select',
              {
                className: 'la-select la-select--sm',
                value: compareRevision,
                onChange: (event) => setCompareRevision(event.target.value),
                'aria-label': t('loop.task.compare'),
              },
              h('option', { value: '' }, t('loop.task.compare')),
              revisions.map((item) =>
                h('option', { key: item.revision, value: String(item.revision) }, `${t('loop.task.version', { n: item.revision })} · ${formatTime(item.at)}`),
              ),
            ),
          )
        : null,
      props.error ? h('span', { className: 'la-inlineerror', role: 'alert' }, props.error) : null,
    ),
    compareSnapshot
      ? h(
          'div',
          { className: 'la-taskcompare' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.compareTitle')),
          h(CompareColumns, { t, left: compareSnapshot, right: task, leftLabel: `${t('loop.task.version', { n: compareRevision })}`, rightLabel: t('loop.task.version', { n: task.revision }) }),
        )
      : null,
    h(
      'div',
      { className: 'la-tasksaved' },
      h(
        'section',
        { className: 'la-tasksaved__block' },
        h('h3', { className: 'la-taskcol__title' }, t('loop.task.request')),
        h('p', { className: 'la-tasksaved__text' }, task.request || '—'),
      ),
      h(
        'section',
        { className: 'la-tasksaved__block' },
        h('h3', { className: 'la-taskcol__title' }, t('loop.task.goal')),
        h('p', { className: 'la-tasksaved__text' }, task.goal || '—'),
      ),
      h(
        'div',
        { className: 'la-taskcolumns' },
        h(
          'section',
          { className: 'la-taskcol' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.acceptance')),
          (task.acceptance || []).length
            ? h(
                'ul',
                { className: 'la-tasksaved__list' },
                task.acceptance.map((item, index) =>
                  h('li', { key: index }, h('span', null, item.text), item.evidence ? h('span', { className: 'la-muted' }, `（${item.evidence}）`) : null),
                ),
              )
            : h('p', { className: 'la-hintwarn' }, t('loop.task.acceptanceEmpty')),
        ),
        h(
          'section',
          { className: 'la-taskcol' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.boundary')),
          h(
            'ul',
            { className: 'la-tasksaved__list' },
            (task.boundary || []).map((item, index) => h('li', { key: index }, item)),
          ),
        ),
        h(
          'section',
          { className: 'la-taskcol' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.unknowns')),
          h(
            'ul',
            { className: 'la-tasksaved__list' },
            (task.unknowns || []).map((item, index) =>
              h('li', { key: index }, h('strong', null, `${item.question}`), item.answer ? ` → ${item.answer}` : h('span', { className: 'la-muted' }, ' · —')),
            ),
          ),
        ),
      ),
      h(
        'div',
        { className: 'la-taskmeta' },
        h(
          'section',
          { className: 'la-taskblock' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.concepts')),
          h(
            'div',
            { className: 'la-chips' },
            (task.conceptIds || []).map((id) =>
              h(Tag, { key: id, tone: 'neutral' }, (ci.nodesById.get(id) || {}).title || id),
            ),
          ),
        ),
        h(
          'section',
          { className: 'la-taskblock' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.evidence')),
          h(
            'ul',
            { className: 'la-tasksaved__list' },
            (task.evidenceRefs || []).map((ref) => h('li', { key: `${ref.kind}:${ref.id}` }, evidenceLabel(t, props.storeIndex, ref))),
          ),
        ),
        task.model && task.model.model
          ? h('p', { className: 'la-muted' }, `${t('loop.task.model')}：${task.model.provider || '?'} / ${task.model.model}`)
          : null,
      ),
      h('p', { className: 'la-taskeditor__notsent' }, taskText.split('\n').filter(Boolean).slice(-1)[0]),
    ),
  )
}

function CompareColumns(props) {
  const t = props.t
  const fields = [
    ['goal', t('loop.task.goal')],
    ['acceptance', t('loop.task.acceptance')],
    ['boundary', t('loop.task.boundary')],
    ['unknowns', t('loop.task.unknowns')],
  ]
  const renderValue = (value) => {
    if (Array.isArray(value)) {
      return h(
        'ul',
        null,
        value.map((item, index) => h('li', { key: index }, typeof item === 'string' ? item : item.text || item.question || '')),
      )
    }
    return String(value || '—')
  }
  return h(
    'div',
    { className: 'la-taskcompare__cols' },
    h('span', { className: 'la-muted' }, props.leftLabel),
    h('span', { className: 'la-muted' }, props.rightLabel),
    fields.map(([field, label]) => {
      const leftValue = JSON.stringify(props.left[field] || '')
      const rightValue = JSON.stringify(props.right[field] || '')
      const changed = leftValue !== rightValue
      return h(
        'div',
        { key: field, className: `la-taskcompare__row ${changed ? 'is-changed' : ''}`.trim() },
        h('span', { className: 'la-taskcompare__label' }, label),
        h('span', { className: 'la-taskcompare__cell' }, renderValue(props.left[field])),
        h('span', { className: 'la-taskcompare__cell' }, renderValue(props.right[field])),
      )
    }),
  )
}
