/**
 * 右侧学习伙伴：当前主题 + 来源摘要 + 真实模型状态 + 关系详情 + 对话/笔记 tab。
 * 宽度由外层 CSS 变量控制；窄屏时作为"对话"分段出现。
 */

const { useState, useMemo } = React

import { Tag, StatusDot, EmptyState, IconButton } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { subjectLabel, subjectTypeLabel, sourceSummary } from '../model.js'
import { subjectKey } from '../util.js'
import { ChatPanel } from './ChatPanel.js'
import { NotesSection } from './NotesSection.js'
import { RelationInspector } from './RelationInspector.js'

function TabButton(props) {
  return h(
    'button',
    {
      type: 'button',
      role: 'tab',
      id: props.id,
      'aria-selected': props.active,
      'aria-controls': props.controls,
      tabIndex: props.active ? 0 : -1,
      className: `la-partnertab ${props.active ? 'is-active' : ''}`.trim(),
      onClick: props.onClick,
      onKeyDown: props.onKeyDown,
    },
    props.icon ? h('span', { className: 'la-partnertab__icon' }, props.icon) : null,
    props.label,
    props.count !== undefined ? h('span', { className: 'la-partnertab__count' }, String(props.count)) : null,
  )
}

export function Partner(props) {
  const t = props.t
  const ci = props.ci
  const storeIndex = props.storeIndex
  const subject = props.subject
  const selectedRelation = props.selectedRelation
  const relationRecord = selectedRelation ? storeIndex.relationFor(selectedRelation.id) : null
  const notes = useMemo(() => (subject ? storeIndex.notesFor(subject) : []), [storeIndex, subject])
  const [internalTab, setInternalTab] = useState('chat')
  const tab = props.tab || internalTab
  const setTab = props.onTabChange || setInternalTab
  const summary = useMemo(() => (subject ? sourceSummary(ci, subject) : { sources: 0, unverified: 0 }), [ci, subject])
  const dialog = subject ? storeIndex.getDialog(subject) : null
  const chat = props.chat
  const modelAvailable = props.modelAvailable !== false
  const modelReason = props.modelReason || t('loop.chat.noModel')

  const relationNotes = selectedRelation
    ? storeIndex.notesFor({ kind: 'relation', id: selectedRelation.id })
    : []

  const onTabKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setTab((current) => (current === 'chat' ? 'notes' : 'chat'))
  }

  return h(
    'aside',
    { className: 'la-partner', 'aria-label': t('loop.partner.title') },
    h(
      'div',
      { className: 'la-partner__head' },
      h(
        'div',
        { className: 'la-partner__subject' },
        subject
          ? h(
              'div',
              { className: 'la-partner__subjectrow' },
              h(Tag, { tone: 'accent' }, subjectTypeLabel(t, subject)),
              h('h2', { className: 'la-partner__subjectname' }, subjectLabel(ci, subject, storeIndex.raw, t)),
            )
          : h('h2', { className: 'la-partner__subjectname' }, t('loop.partner.title')),
        subject
          ? h(
              'p',
              { className: 'la-partner__sources' },
              t('loop.chat.sourcesSummary', { sources: summary.sources, unverified: summary.unverified }),
            )
          : null,
        h(
          'p',
          { className: 'la-partner__model' },
          h(StatusDot, { tone: modelAvailable ? 'ok' : 'danger' }),
          props.model && props.model.model
            ? `${t('loop.partner.model')}：${props.model.provider || '?'} / ${props.model.model}`
            : t('loop.chat.noModel'),
          modelAvailable ? null : h(Tag, { tone: 'danger' }, t('loop.partner.model.unavailable')),
        ),
      ),
      h(IconButton, { icon: 'collapseRight', label: t('loop.partner.hide'), onClick: props.onCollapse }),
    ),
    !subject
      ? h(EmptyState, { icon: 'chat', title: t('loop.evidence.noSubject') })
      : h(
          'div',
          { className: 'la-partner__body' },
          selectedRelation
            ? h(
                'div',
                { className: 'la-partner__inspector' },
                h(RelationInspector, {
                  t,
                  ci,
                  relation: selectedRelation,
                  record: relationRecord,
                  notes: relationNotes,
                  onOpenSource: props.onOpenSource,
                  onClearRelation: props.onClearRelation,
                  onAsk: () => setTab('chat'),
                  onSaveAnnotation: (payload) =>
                    props.perform('relation.annotate', Object.assign({ edgeId: selectedRelation.id }, payload), {
                      successText: t('loop.relation.saved'),
                    }),
                }),
              )
            : null,
          h(
            'div',
            { className: 'la-partner__tabs', role: 'tablist', 'aria-label': t('loop.partner.title') },
            h(TabButton, {
              id: 'la-tab-chat',
              controls: 'la-panel-chat',
              active: tab === 'chat',
              label: t('loop.partner.tab.chat'),
              icon: h(Icon, { name: 'chat', size: 16 }),
              onClick: () => setTab('chat'),
              onKeyDown: onTabKeyDown,
            }),
            h(TabButton, {
              id: 'la-tab-notes',
              controls: 'la-panel-notes',
              active: tab === 'notes',
              label: t('loop.partner.tab.notes'),
              count: notes.length,
              icon: h(Icon, { name: 'notes', size: 16 }),
              onClick: () => setTab('notes'),
              onKeyDown: onTabKeyDown,
            }),
          ),
          tab === 'chat'
            ? h(
                'div',
                { className: 'la-partner__panel', role: 'tabpanel', id: 'la-panel-chat', 'aria-labelledby': 'la-tab-chat' },
                h(ChatPanel, {
                  t,
                  subject,
                  subjectKey: subjectKey(subject),
                  dialog,
                  stream: chat.streamFor(subject),
                  draft: chat.draftFor(subject),
                  addReceipt: props.addReceipt,
                  modelAvailable,
                  modelReason,
                  onDraftChange: (text) => chat.setDraft(subject, text),
                  onSend: (text) => chat.send(subject, text),
                  onRetry: (requestId) => chat.retry(subject, requestId),
                  onResend: (text) => chat.resend(subject, text),
                  onStop: () => chat.stop(subject),
                  onDismissError: () => chat.dismissError(subject),
                  onAdoptDraft: props.onAdoptDraft,
                  isAdopted: props.isAdopted,
                }),
              )
            : h(
                'div',
                { className: 'la-partner__panel', role: 'tabpanel', id: 'la-panel-notes', 'aria-labelledby': 'la-tab-notes' },
                h(NotesSection, {
                  t,
                  subject,
                  notes,
                  compact: true,
                  draft: props.noteDraft,
                  onDraftChange: props.onNoteDraftChange,
                  onSave: props.onSaveNote,
                  onSaveEdit: props.onSaveNoteEdit,
                  onArchive: props.onArchiveNote,
                  onDelete: props.onDeleteNote,
                }),
              ),
        ),
  )
}
