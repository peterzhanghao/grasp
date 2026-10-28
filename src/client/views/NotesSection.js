/**
 * 笔记：来源标识、编辑/归档/恢复/删除、按 subject 隔离的草稿输入。
 * 用户写的笔记 authorSource:'user'；从 AI 消息采纳的草案是 'ai-draft'/adopted:true。
 */

const { useState } = React

import { Button, Tag, FieldLabel, EmptyState } from '../components/primitives.js'
import { ConfirmDialog } from '../components/Dialog.js'
import { TimeLabel } from './shared.js'
import { formatTime } from '../util.js'

export const NOTE_KINDS = ['理解', '疑问', '证据', '反驳', '实践']

export function noteSourceKind(note) {
  if (!note) return 'import'
  if (note.authorSource === 'user') return note.legacyOriginUncertain ? 'legacy' : 'user'
  if (note.authorSource === 'ai-draft') return 'ai-draft'
  return 'import'
}

export function NoteSourceBadge(props) {
  const kind = noteSourceKind(props.note)
  const tone = kind === 'user' ? 'accent' : kind === 'ai-draft' ? 'warn' : kind === 'legacy' ? 'danger' : 'neutral'
  return h(Tag, { tone, title: kind === 'legacy' ? props.t('loop.note.legacyHint') : undefined }, props.t(`loop.note.source.${kind}`))
}

export function noteKindLabel(t, kind) {
  return NOTE_KINDS.includes(kind) ? t(`loop.note.kind.${kind}`) : String(kind || '')
}

/** 一条笔记：可编辑正文、归档/恢复、删除。 */
export function NoteCard(props) {
  const note = props.note
  const t = props.t
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const saveEdit = async () => {
    const text = draft.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await props.onSaveEdit({ noteId: note.id, kind: note.kind, text, parentRevision: note.revision })
      setEditing(false)
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  const archived = note.status === 'archived'
  return h(
    'article',
    { className: `la-note ${archived ? 'is-archived' : ''}`.trim() },
    h(
      'div',
      { className: 'la-note__head' },
      h(Tag, { tone: 'neutral' }, noteKindLabel(t, note.kind)),
      h(NoteSourceBadge, { note, t }),
      archived ? h(Tag, { tone: 'neutral' }, t('loop.note.archivedLabel')) : null,
      h('span', { className: 'la-note__grow' }),
      h(TimeLabel, { at: note.updatedAt || note.createdAt }),
    ),
    h(
      'div',
      { className: 'la-note__meta' },
      h(
        'span',
        null,
        `${t('loop.note.revision', { n: note.revision })} · ${t('loop.note.savedBy')} ${t(
          `loop.note.savedBy.${note.savedBy === 'agent' ? 'agent' : 'ui'}`,
        )}`,
      ),
      note.adopted ? h(Tag, { tone: 'accent' }, t('loop.note.adopted')) : null,
    ),
    note.legacyOriginUncertain
      ? h('p', { className: 'la-note__warning', role: 'note' }, t('loop.note.legacyHint'))
      : null,
    note.encodingSuspected
      ? h('p', { className: 'la-note__warning', role: 'note' }, t('loop.note.encodingHint'))
      : null,
    editing
      ? h(
          'div',
          { className: 'la-note__editor' },
          h('textarea', {
            className: 'la-textarea',
            value: draft,
            rows: 3,
            onChange: (event) => setDraft(event.target.value),
            'aria-label': t('loop.note.edit'),
          }),
          h(
            'div',
            { className: 'la-inlineactions' },
            h(Button, { size: 'sm', variant: 'primary', loading: busy, disabled: !draft.trim(), onClick: saveEdit }, t('loop.note.saveEdit')),
            h(Button, { size: 'sm', variant: 'ghost', onClick: () => { setEditing(false); setDraft(note.text); setError('') } }, t('loop.note.cancel')),
            error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
          ),
        )
      : h('p', { className: 'la-note__text' }, note.text),
    !editing
      ? h(
          'div',
          { className: 'la-note__actions' },
          h(Button, { size: 'sm', variant: 'ghost', onClick: () => { setEditing(true); setDraft(note.text) } }, t('loop.note.edit')),
          h(
            Button,
            {
              size: 'sm',
              variant: 'ghost',
              onClick: () => props.onArchive(note),
              disabled: props.busyNoteId === note.id,
            },
            archived ? t('loop.note.restore') : t('loop.note.archive'),
          ),
          h(Button, { size: 'sm', variant: 'ghost', onClick: () => setConfirming(true) }, t('loop.note.delete')),
        )
      : null,
    h(ConfirmDialog, {
      open: confirming,
      title: t('loop.note.delete'),
      message: t('loop.note.deleteConfirm'),
      confirmLabel: t('loop.note.delete'),
      cancelLabel: t('loop.common.cancel'),
      danger: true,
      onCancel: () => setConfirming(false),
      onConfirm: async () => {
        setConfirming(false)
        try {
          await props.onDelete(note)
        } catch (rawError) {
          setError(String((rawError && rawError.message) || rawError))
        }
      },
    }),
  )
}

/**
 * 笔记面板（学习伙伴的笔记 tab 与证据尺度复用）。
 * props: t, subject, notes, draft, onDraftChange, onSave, onSaveEdit, onArchive, onDelete
 */
export function NotesSection(props) {
  const t = props.t
  const [kind, setKind] = useState('理解')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const notes = props.notes || []
  const active = notes.filter((note) => note.status !== 'archived')
  const archived = notes.filter((note) => note.status === 'archived')
  const draft = props.draft || ''

  const submit = async () => {
    const text = draft.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await props.onSave({
        subject: props.subject,
        kind,
        text,
        authorSource: 'user',
        savedBy: 'ui',
      })
      if (props.onDraftChange) props.onDraftChange('')
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  return h(
    'div',
    { className: `la-notes ${props.className || ''}`.trim() },
    props.showComposer === false
      ? null
      : h(
          'div',
          { className: 'la-notecomposer' },
          h(
            'label',
            { className: 'la-notecomposer__field' },
            h(FieldLabel, null, t('loop.note.title')),
            h('textarea', {
              className: 'la-textarea',
              rows: props.compact ? 2 : 3,
              value: draft,
              placeholder: t('loop.note.placeholder'),
              onChange: (event) => props.onDraftChange && props.onDraftChange(event.target.value),
              onKeyDown: (event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                  event.preventDefault()
                  submit()
                }
              },
            }),
          ),
          h(
            'div',
            { className: 'la-notecomposer__row' },
            h(
              'label',
              { className: 'la-notekind' },
              h('span', { className: 'la-notekind__label' }, t('loop.note.kind')),
              h(
                'select',
                {
                  className: 'la-select la-select--sm',
                  value: kind,
                  onChange: (event) => setKind(event.target.value),
                },
                NOTE_KINDS.map((item) => h('option', { key: item, value: item }, noteKindLabel(t, item))),
              ),
            ),
            h(
              Button,
              { variant: 'primary', size: 'sm', loading: busy, disabled: !draft.trim(), onClick: submit },
              busy ? t('loop.note.saving') : t('loop.note.save'),
            ),
            error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
          ),
        ),
    !notes.length
      ? h(EmptyState, { title: t('loop.note.empty'), icon: 'notes' })
      : h(
          'div',
          { className: 'la-notelist', role: 'list', 'aria-label': t('loop.a11y.notes') },
          active.map((note) =>
            h(NoteCard, {
              key: note.id,
              note,
              t,
              onSaveEdit: props.onSaveEdit,
              onArchive: props.onArchive,
              onDelete: props.onDelete,
              busyNoteId: props.busyNoteId,
            }),
          ),
          archived.length
            ? h(
                'details',
                { className: 'la-archived' },
                h('summary', { className: 'la-archived__summary' }, `${t('loop.note.archivedLabel')} · ${archived.length}`),
                archived.map((note) =>
                  h(NoteCard, {
                    key: note.id,
                    note,
                    t,
                    onSaveEdit: props.onSaveEdit,
                    onArchive: props.onArchive,
                    onDelete: props.onDelete,
                  }),
                ),
              )
            : null,
        ),
  )
}
