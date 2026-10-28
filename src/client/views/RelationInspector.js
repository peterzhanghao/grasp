/**
 * 关系详情（右侧）：类型、主张、条件、代价、主张级来源、个人批注与状态、相关证据。
 * 批注是用户自己的判断；保存回执只来自 Host。
 */

const { useState, useMemo, useEffect } = React

import { Button, Tag, FieldLabel, EmptyState } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { ClaimList } from './Claims.js'
import { Collapsible, TimeLabel } from './shared.js'
import { claimsForIds, relationTypeLabel } from '../model.js'

export function RelationInspector(props) {
  const t = props.t
  const ci = props.ci
  const relation = props.relation
  const record = props.record
  const notes = props.notes || []
  const [annotation, setAnnotation] = useState(record ? record.annotation : '')
  const [status, setStatus] = useState(record ? record.status : 'open')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setAnnotation(record ? record.annotation : '')
    setStatus(record ? record.status : 'open')
    setError('')
  }, [relation && relation.id, record && record.version, record && record.annotation, record && record.status])

  const claims = useMemo(() => (relation ? claimsForIds(ci, relation.claimIds) : []), [ci, relation])
  const evidenceIds = new Set(record ? record.evidenceNoteIds : [])
  if (!relation) {
    return h(EmptyState, { icon: 'graph', title: t('loop.relation.selectHint') })
  }
  const from = ci.nodesById.get(relation.from)
  const to = ci.nodesById.get(relation.to)

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await props.onSaveAnnotation({ annotation, status })
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  const toggleEvidence = async (note) => {
    const next = evidenceIds.has(note.id)
      ? (record ? record.evidenceNoteIds : []).filter((id) => id !== note.id)
      : [...(record ? record.evidenceNoteIds : []), note.id]
    try {
      await props.onSaveAnnotation({
        annotation: record ? record.annotation : annotation,
        status: record ? record.status : status,
        evidenceNoteIds: next,
      })
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    }
  }

  return h(
    'section',
    { className: 'la-inspector', 'aria-label': t('loop.relation.detail') },
    h(
      'div',
      { className: 'la-inspector__head' },
      h(Tag, { tone: 'accent' }, relationTypeLabel(t, relation.type)),
      record && record.version ? h('span', { className: 'la-muted' }, `${t('loop.common.revision')} ${record.version}`) : null,
      h('span', { className: 'la-inspector__grow' }),
      h(
        'button',
        { type: 'button', className: 'la-linkbtn', onClick: props.onClearRelation, title: t('loop.subject.clearRelation') },
        t('loop.subject.clearRelation'),
      ),
    ),
    h('h3', { className: 'la-inspector__route' }, `${from ? from.title : relation.from} → ${to ? to.title : relation.to}`),
    h(
      'div',
      { className: 'la-inspector__block' },
      h(FieldLabel, null, t('loop.relation.claim')),
      h('p', { className: 'la-inspector__text' }, relation.claim || h('span', { className: 'la-muted' }, t('loop.relation.noClaim') || '—')),
      h(FieldLabel, null, t('loop.relation.condition')),
      h(
        'p',
        { className: 'la-inspector__text' },
        relation.condition || h('span', { className: 'la-warnText' }, t('loop.relation.noCondition')),
      ),
      h(FieldLabel, null, t('loop.relation.cost')),
      h('p', { className: 'la-inspector__text' }, relation.cost || h('span', { className: 'la-warnText' }, t('loop.relation.noCost'))),
    ),
    claims.length
      ? h(Collapsible, { title: t('loop.relation.claims'), defaultOpen: true },
          h(ClaimList, { t, claims, ci, onOpenSource: props.onOpenSource }),
        )
      : h(Collapsible, { title: t('loop.relation.claims') }, h('p', { className: 'la-muted' }, t('loop.relation.noClaims'))),
    h(
      'div',
      { className: 'la-annotation' },
      h(FieldLabel, null, t('loop.relation.annotation')),
      h('textarea', {
        className: 'la-textarea',
        rows: 3,
        value: annotation,
        placeholder: t('loop.relation.annotationPlaceholder'),
        onChange: (event) => setAnnotation(event.target.value),
        'aria-label': t('loop.relation.annotation'),
      }),
      h(
        'div',
        { className: 'la-annotation__row' },
        h(
          'label',
          { className: 'la-notekind' },
          h('span', { className: 'la-notekind__label' }, t('loop.relation.status')),
          h(
            'select',
            {
              className: 'la-select la-select--sm',
              value: status,
              onChange: (event) => setStatus(event.target.value),
            },
            ['open', 'supported', 'challenged'].map((value) =>
              h('option', { key: value, value }, t(`loop.relation.status.${value}`)),
            ),
          ),
        ),
        h(Button, { variant: 'primary', size: 'sm', loading: busy, onClick: save }, t('loop.relation.saveAnnotation')),
      ),
      error ? h('p', { className: 'la-inlineerror', role: 'alert' }, error) : null,
      record && record.updatedAt
        ? h('p', { className: 'la-muted la-inspector__savedat' }, `${t('loop.status.ok')}：`, h(TimeLabel, { at: record.updatedAt }))
        : null,
    ),
    h(
      'div',
      { className: 'la-evidence' },
      h(FieldLabel, null, t('loop.relation.evidence', { count: notes.length })),
      notes.length
        ? h(
            'ul',
            { className: 'la-evidence__list' },
            notes.map((note) =>
              h(
                'li',
                { key: note.id, className: 'la-evidence__item' },
                h('p', { className: 'la-evidence__text' }, note.text),
                h(
                  'div',
                  { className: 'la-evidence__meta' },
                  h('span', { className: 'la-muted' }, `${t(`loop.note.source.${note.authorSource === 'user' ? 'user' : 'ai-draft'}`)}`),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: `la-chip ${evidenceIds.has(note.id) ? 'is-on' : ''}`,
                      onClick: () => toggleEvidence(note),
                      'aria-pressed': evidenceIds.has(note.id),
                    },
                    evidenceIds.has(note.id) ? t('loop.relation.detach') : t('loop.relation.attach'),
                  ),
                ),
              ),
            ),
          )
        : h('p', { className: 'la-muted' }, t('loop.relation.evidenceEmpty')),
    ),
    h(
      'div',
      { className: 'la-inspector__actions' },
      h(Button, { variant: 'secondary', icon: 'chat', onClick: props.onAsk }, t('loop.relation.ask')),
    ),
  )
}
