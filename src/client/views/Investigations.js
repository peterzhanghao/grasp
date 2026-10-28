/**
 * 研究问题（Investigation）：主张 / 相反解释 / 下一项检验 / 状态，可挂预测与运行。
 */

const { useState } = React

import { Button, Tag, FieldLabel, EmptyState } from '../components/primitives.js'
import { TimeLabel } from './shared.js'

const INV_STATUSES = ['open', 'testing', 'supported', 'revised', 'inconclusive']

function statusTone(status) {
  if (status === 'supported') return 'ok'
  if (status === 'revised') return 'accent'
  if (status === 'testing') return 'warn'
  if (status === 'inconclusive') return 'neutral'
  return 'neutral'
}

export function InvestigationsSection(props) {
  const t = props.t
  const storeIndex = props.storeIndex
  const subject = props.subject
  const investigations = storeIndex.investigationsFor(subject)
  const [creating, setCreating] = useState(false)
  return h(
    'section',
    { className: 'la-evsection', 'aria-label': t('loop.inv.title') },
    h(
      'div',
      { className: 'la-evsection__head' },
      h('h3', { className: 'la-evsection__title' }, `${t('loop.inv.title')} · ${investigations.length}`),
      h(
        Button,
        { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => setCreating((value) => !value) },
        t('loop.inv.new'),
      ),
    ),
    creating || !investigations.length
      ? h(InvestigationForm, {
          t,
          subject,
          investigations,
          submitLabel: t('loop.inv.save'),
          onSubmit: async (payload) => {
            const result = await props.perform('investigation.save', payload, {
              successText: t('loop.inv.saved'),
            })
            setCreating(false)
            return result
          },
        })
      : null,
    h(
      'ul',
      { className: 'la-invlist' },
      investigations.map((investigation) =>
        h(InvestigationCard, {
          key: investigation.id,
          t,
          investigation,
          storeIndex,
          perform: props.perform,
          onDiscuss: props.onDiscuss,
        }),
      ),
    ),
  )
}

function InvestigationForm(props) {
  const t = props.t
  const initial = props.initial || {}
  const [title, setTitle] = useState(initial.title || '')
  const [claim, setClaim] = useState(initial.claim || '')
  const [counter, setCounter] = useState(initial.counter || '')
  const [nextTest, setNextTest] = useState(initial.nextTest || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return h(
    'div',
    { className: 'la-formcard' },
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, null, t('loop.inv.titleLabel')),
      h('input', {
        className: 'la-input',
        value: title,
        placeholder: t('loop.inv.titlePlaceholder'),
        onChange: (event) => setTitle(event.target.value),
      }),
    ),
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, null, t('loop.inv.claim')),
      h('textarea', {
        className: 'la-textarea',
        rows: 2,
        value: claim,
        placeholder: t('loop.inv.claimPlaceholder'),
        onChange: (event) => setClaim(event.target.value),
      }),
    ),
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, null, t('loop.inv.counter')),
      h('textarea', {
        className: 'la-textarea',
        rows: 2,
        value: counter,
        placeholder: t('loop.inv.counterPlaceholder'),
        onChange: (event) => setCounter(event.target.value),
      }),
    ),
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, { optional: t('loop.common.optional') }, t('loop.inv.nextTest')),
      h('input', {
        className: 'la-input',
        value: nextTest,
        placeholder: t('loop.inv.nextTestPlaceholder'),
        onChange: (event) => setNextTest(event.target.value),
      }),
    ),
    h(
      'div',
      { className: 'la-formcard__actions' },
      h(
        Button,
        {
          variant: 'primary',
          size: 'sm',
          loading: busy,
          disabled: !title.trim(),
          onClick: async () => {
            setBusy(true)
            setError('')
            try {
              await props.onSubmit({
                id: initial.id,
                subject: props.subject,
                title: title.trim(),
                claim: claim.trim(),
                counter: counter.trim(),
                nextTest: nextTest.trim(),
              })
              if (!initial.id) {
                setTitle('')
                setClaim('')
                setCounter('')
                setNextTest('')
              }
            } catch (rawError) {
              setError(String((rawError && rawError.message) || rawError))
            } finally {
              setBusy(false)
            }
          },
        },
        props.submitLabel,
      ),
      h('span', { className: 'la-muted' }, t('loop.inv.nextTestPlaceholder')),
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
    ),
  )
}

function InvestigationCard(props) {
  const t = props.t
  const investigation = props.investigation
  const [editing, setEditing] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [status, setStatus] = useState(investigation.status)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const predictions = props.storeIndex.predictionsByInvestigation.get(investigation.id) || []
  const runs = props.storeIndex.runs.filter((run) => run.investigationId === investigation.id)

  return h(
    'li',
    { className: `la-inv ${investigation.status === 'open' || investigation.status === 'testing' ? 'is-active' : ''}`.trim() },
    h(
      'div',
      { className: 'la-inv__head' },
      h(Tag, { tone: statusTone(investigation.status) }, t(`loop.inv.status.${investigation.status}`)),
      h('h4', { className: 'la-inv__title' }, investigation.title || t('loop.inv.title')),
      h('span', { className: 'la-inv__grow' }),
      investigation.updatedAt ? h(TimeLabel, { at: investigation.updatedAt }) : null,
    ),
    investigation.claim ? h('p', { className: 'la-inv__claim' }, h('strong', null, `${t('loop.inv.claim')}：`), investigation.claim) : null,
    investigation.counter
      ? h('p', { className: 'la-inv__counter' }, h('strong', null, `${t('loop.inv.counter')}：`), investigation.counter)
      : null,
    h(
      'p',
      { className: 'la-inv__next' },
      h('strong', null, `${t('loop.inv.nextTestLabel')}：`),
      investigation.nextTest || h('span', { className: 'la-muted' }, t('loop.continue.noNextTest')),
    ),
    h(
      'p',
      { className: 'la-inv__meta la-muted' },
      `${t('loop.inv.predCount', { count: predictions.length })} · ${t('loop.inv.runCount', { count: runs.length })}`,
    ),
    editing
      ? h(
          InvestigationForm,
          {
            t,
            subject: investigation.subject,
            initial: investigation,
            submitLabel: t('loop.inv.save'),
            onSubmit: async (payload) => {
              await props.perform('investigation.save', payload, { successText: t('loop.inv.saved') })
              setEditing(false)
            },
          },
        )
      : h(
          'div',
          { className: 'la-inv__actions' },
          h(
            Button,
            { size: 'sm', variant: 'secondary', icon: 'chat', onClick: () => props.onDiscuss && props.onDiscuss(investigation) },
            t('loop.inv.discuss'),
          ),
          h(Button, { size: 'sm', variant: 'ghost', icon: 'edit', onClick: () => setEditing(true) }, t('loop.common.edit')),
          h(
            Button,
            { size: 'sm', variant: 'ghost', onClick: () => setResolving((value) => !value) },
            t('loop.inv.resolve'),
          ),
          resolving
            ? h(
                'div',
                { className: 'la-inv__form' },
                h(
                  'select',
                  { className: 'la-select', value: status, onChange: (event) => setStatus(event.target.value), 'aria-label': t('loop.inv.statusLabel') },
                  INV_STATUSES.map((value) => h('option', { key: value, value }, t(`loop.inv.status.${value}`))),
                ),
                h('input', {
                  className: 'la-input',
                  value: note,
                  placeholder: t('loop.inv.resolveNote'),
                  'aria-label': t('loop.inv.resolveNote'),
                  onChange: (event) => setNote(event.target.value),
                }),
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'primary',
                    loading: busy,
                    onClick: async () => {
                      setBusy(true)
                      setError('')
                      try {
                        await props.perform(
                          'investigation.resolve',
                          { id: investigation.id, status, note: note.trim() || null },
                          { successText: t('loop.status.saveOk', { what: t('loop.inv.title') }) },
                        )
                        setResolving(false)
                      } catch (rawError) {
                        setError(String((rawError && rawError.message) || rawError))
                      } finally {
                        setBusy(false)
                      }
                    },
                  },
                  t('loop.inv.resolve'),
                ),
                error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
              )
            : null,
        ),
  )
}
