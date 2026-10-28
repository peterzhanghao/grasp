/**
 * 证据尺度：当前 subject 的实验 / 预测 / 研究问题 / 证据笔记 / 任务草案入口。
 * 实验内联展开，不用全屏模态；地图与返回路径保留在顶栏（尺度切换）。
 */

const { useState } = React

import { Button, Tag, EmptyState, SectionHeader } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { Collapsible, TimeLabel } from './shared.js'
import { experimentsForSubject, sourceSummary, subjectLabel } from '../model.js'
import { ExperimentCard } from './Experiments.js'
import { PredictionsSection } from './Predictions.js'
import { InvestigationsSection } from './Investigations.js'
import { NotesSection } from './NotesSection.js'
import { TasksSection, TaskEditor } from './TaskEditor.js'
import { formatTime } from '../util.js'

export function EvidenceScale(props) {
  const t = props.t
  const ci = props.ci
  const storeIndex = props.storeIndex
  const subject = props.subject
  const [taskMode, setTaskMode] = useState(null) // null | { id?: string }
  const experiments = subject ? experimentsForSubject(ci, subject) : []
  const runs = subject ? storeIndex.runsFor(subject) : []
  const sources = subject ? sourceSummary(ci, subject) : { sources: 0, unverified: 0 }
  const investigations = subject ? storeIndex.investigationsFor(subject) : []
  const activeInvestigation = investigations.find((item) => item.status === 'open' || item.status === 'testing') || investigations[0] || null

  if (taskMode) {
    return h(TaskEditor, {
      t,
      ci,
      storeIndex,
      subject,
      perform: props.perform,
      addReceipt: props.addReceipt,
      initialTaskId: taskMode.id,
      onBack: () => setTaskMode(null),
    })
  }

  if (!subject) {
    return h(
      'section',
      { className: 'la-scale la-scale--evidence' },
      h(EmptyState, {
        icon: 'flask',
        title: t('loop.evidence.noSubject'),
        action: h(Button, { variant: 'primary', onClick: props.onGoSubject }, t('loop.evidence.pickSubject')),
      }),
    )
  }

  return h(
    'section',
    { className: 'la-scale la-scale--evidence', 'aria-label': t('loop.evidence.title') },
    h(
      'div',
      { className: 'la-scalehead' },
      h('h2', { className: 'la-scalehead__title' }, t('loop.evidence.title')),
      h(
        'p',
        { className: 'la-scalehead__hint' },
        `${subjectLabel(ci, subject, storeIndex.raw, t)} · ${t('loop.evidence.subjectSources', {
          sources: sources.sources,
          unverified: sources.unverified,
        })}`,
      ),
    ),
    activeInvestigation && activeInvestigation.nextTest
      ? h(
          'div',
          { className: 'la-nexttest' },
          h(Icon, { name: 'target', size: 18 }),
          h(
            'div',
            { className: 'la-nexttest__body' },
            h('span', { className: 'la-nexttest__label' }, t('loop.continue.nextTest')),
            h('p', { className: 'la-nexttest__text' }, activeInvestigation.nextTest),
          ),
          h(Tag, { tone: 'warn' }, t(`loop.inv.status.${activeInvestigation.status}`)),
        )
      : null,
    h(
      'div',
      { className: 'la-evidencegrid' },
      h(
        'section',
        { className: 'la-evpanel la-evpanel--experiments', 'aria-label': t('loop.evidence.experiments') },
        h(
          'div',
          { className: 'la-evsection__head' },
          h('h3', { className: 'la-evsection__title' }, t('loop.evidence.experiments')),
          h('span', { className: 'la-muted' }, t('loop.evidence.experimentHint')),
        ),
        experiments.length
          ? experiments.map((experiment) =>
              h(ExperimentCard, {
                key: experiment.id,
                t,
                experiment,
                runs,
                defaultOpen: experiments.length === 1,
                onPrefillObservation: (text) => props.onPrefillNote(text),
                onRun: (payload) =>
                  props.perform(
                    'experiment.run',
                    {
                      experimentId: experiment.id,
                      params: payload.params,
                      prediction: payload.prediction || null,
                      subject,
                    },
                    { successText: t('loop.exp.runSaved'), receipt: false },
                  ),
              }),
            )
          : h('p', { className: 'la-muted' }, t('loop.evidence.noExperiments')),
      ),
      h(
        'section',
        { className: 'la-evpanel', 'aria-label': t('loop.evidence.notes') },
        h(NotesSection, {
          t,
          subject,
          notes: storeIndex.notesFor(subject),
          draft: props.noteDraft,
          onDraftChange: props.onNoteDraftChange,
          onSave: props.onSaveNote,
          onSaveEdit: props.onSaveNoteEdit,
          onArchive: props.onArchiveNote,
          onDelete: props.onDeleteNote,
          className: 'la-notes--evidence',
        }),
      ),
      h(PredictionsSection, {
        t,
        storeIndex,
        subject,
        perform: props.perform,
      }),
      h(InvestigationsSection, {
        t,
        storeIndex,
        subject,
        perform: props.perform,
        onDiscuss: props.onDiscussInvestigation,
      }),
      h(TasksSection, {
        t,
        ci,
        storeIndex,
        subject,
        onNewTask: () => setTaskMode({}),
        onOpenTask: (id) => setTaskMode({ id }),
      }),
      h(
        'section',
        { className: 'la-evpanel', 'aria-label': t('loop.evidence.runs') },
        h(
          'div',
          { className: 'la-evsection__head' },
          h('h3', { className: 'la-evsection__title' }, `${t('loop.evidence.runs')} · ${runs.length}`),
        ),
        runs.length
          ? h(
              'ul',
              { className: 'la-runlist' },
              runs
                .slice(0, 12)
                .map((run) =>
                  h(
                    'li',
                    { key: run.id, className: 'la-runlist__item' },
                    h(
                      'span',
                      { className: 'la-runlist__verdict' },
                      run.verdict ? t(`loop.exp.verdict.${run.verdict}`) : '—',
                    ),
                    h('span', { className: 'la-runlist__params' }, JSON.stringify(run.params || {})),
                    h('span', { className: 'la-runlist__at' }, formatTime(run.at)),
                    h(
                      'span',
                      { className: 'la-runlist__model' },
                      `${run.modelId || ''}${run.modelVersion === null ? '' : ` v${run.modelVersion}`}`,
                    ),
                    run.criterion ? h('span', { className: 'la-runlist__criterion' }, run.criterion) : null,
                  ),
                ),
            )
          : h('p', { className: 'la-muted' }, t('loop.evidence.noRuns')),
      ),
    ),
  )
}
