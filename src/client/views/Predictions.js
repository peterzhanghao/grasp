/**
 * 预测：可判定条件、保存、记录判定（支持/反驳/不足以判断）、关联运行与研究问题。
 * 判定是用户自己的判断，不自动替用户下结论。
 */

const { useState } = React

import { Button, Tag, FieldLabel, EmptyState } from '../components/primitives.js'
import { Collapsible } from './shared.js'
import { TimeLabel } from './shared.js'
import { formatTime } from '../util.js'

const STATUSES = ['open', 'supported', 'refuted', 'inconclusive']
const RESOLVABLE = ['supported', 'refuted', 'inconclusive']

export function PredictionsSection(props) {
  const t = props.t
  const storeIndex = props.storeIndex
  const subject = props.subject
  const predictions = storeIndex.predictionsFor(subject)
  const runs = storeIndex.runsFor(subject)
  const investigations = storeIndex.investigationsFor(subject)
  const [creating, setCreating] = useState(false)
  return h(
    'section',
    { className: 'la-evsection', 'aria-label': t('loop.pred.title') },
    h(
      'div',
      { className: 'la-evsection__head' },
      h('h3', { className: 'la-evsection__title' }, `${t('loop.pred.title')} · ${predictions.length}`),
      h(
        Button,
        { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => setCreating((value) => !value) },
        t('loop.pred.new'),
      ),
    ),
    creating
      ? h(PredictionForm, {
          t,
          subject,
          investigations,
          onSubmit: async (payload) => {
            const result = await props.perform('prediction.save', payload, {
              successText: t('loop.pred.saved'),
            })
            setCreating(false)
            return result
          },
        })
      : null,
    !predictions.length
      ? h(EmptyState, { icon: 'target', title: t('loop.pred.empty') })
      : h(
          'ul',
          { className: 'la-predlist' },
          predictions.map((prediction) =>
            h(PredictionCard, {
              key: prediction.id,
              t,
              prediction,
              runs,
              investigations,
              perform: props.perform,
            }),
          ),
        ),
  )
}

function PredictionForm(props) {
  const t = props.t
  const [text, setText] = useState('')
  const [resolveBy, setResolveBy] = useState('')
  const [investigationId, setInvestigationId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const needsResolveBy = !resolveBy.trim()
  return h(
    'div',
    { className: 'la-formcard' },
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, null, t('loop.pred.text')),
      h('textarea', {
        className: 'la-textarea',
        rows: 2,
        value: text,
        placeholder: t('loop.pred.textPlaceholder'),
        onChange: (event) => setText(event.target.value),
      }),
    ),
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, { optional: t('loop.pred.resolveBy') }, t('loop.pred.resolveBy')),
      h('input', {
        className: 'la-input',
        value: resolveBy,
        placeholder: t('loop.pred.resolveByPlaceholder'),
        onChange: (event) => setResolveBy(event.target.value),
      }),
    ),
    props.investigations.length
      ? h(
          'label',
          { className: 'la-field' },
          h(FieldLabel, { optional: t('loop.common.optional') }, t('loop.pred.investigation')),
          h(
            'select',
            { className: 'la-select', value: investigationId, onChange: (event) => setInvestigationId(event.target.value) },
            h('option', { value: '' }, t('loop.pred.noneInvestigation')),
            props.investigations.map((item) => h('option', { key: item.id, value: item.id }, item.title || item.id)),
          ),
        )
      : null,
    h(
      'div',
      { className: 'la-formcard__actions' },
      h(
        Button,
        {
          variant: 'primary',
          size: 'sm',
          loading: busy,
          disabled: !text.trim(),
          onClick: async () => {
            setBusy(true)
            setError('')
            try {
              await props.onSubmit({
                subject: props.subject,
                text: text.trim(),
                resolveBy: resolveBy.trim(),
                investigationId: investigationId || null,
              })
              setText('')
              setResolveBy('')
            } catch (rawError) {
              setError(String((rawError && rawError.message) || rawError))
            } finally {
              setBusy(false)
            }
          },
        },
        t('loop.pred.save'),
      ),
      needsResolveBy ? h('span', { className: 'la-hintwarn' }, t('loop.pred.resolveByPlaceholder')) : null,
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
    ),
  )
}

function PredictionCard(props) {
  const t = props.t
  const prediction = props.prediction
  const [resolving, setResolving] = useState(false)
  const [status, setStatus] = useState('supported')
  const [note, setNote] = useState('')
  const [runId, setRunId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const investigation = prediction.investigationId
    ? props.investigations.find((item) => item.id === prediction.investigationId)
    : null
  const statusTone =
    prediction.status === 'supported' ? 'ok' : prediction.status === 'refuted' ? 'danger' : prediction.status === 'open' ? 'warn' : 'neutral'
  const run = prediction.resolvedByRunId ? props.runs.find((item) => item.id === prediction.resolvedByRunId) : null
  return h(
    'li',
    { className: `la-pred ${prediction.status === 'open' ? 'is-open' : ''}`.trim() },
    h(
      'div',
      { className: 'la-pred__head' },
      h(Tag, { tone: statusTone }, t(`loop.pred.status.${prediction.status}`)),
      prediction.legacy ? h(Tag, { tone: 'neutral', title: t('loop.pred.legacyHint') }, t('loop.pred.legacy')) : null,
      h('span', { className: 'la-pred__grow' }),
      prediction.at ? h(TimeLabel, { at: prediction.at }) : null,
    ),
    h('p', { className: 'la-pred__text' }, prediction.text),
    prediction.resolveBy ? h('p', { className: 'la-pred__resolveby' }, `${t('loop.pred.resolveBy')}：${prediction.resolveBy}`) : null,
    investigation ? h('p', { className: 'la-pred__investigation la-muted' }, `${t('loop.pred.investigation')}：${investigation.title}`) : null,
    run
      ? h(
          'p',
          { className: 'la-pred__run la-muted' },
          `${t('loop.evidence.runs')}：${run.modelId || ''} ${JSON.stringify(run.params || {})} · ${formatTime(run.at)}`,
        )
      : null,
    prediction.resolvedAt ? h('p', { className: 'la-pred__resolved' }, t('loop.pred.resolvedAt', { at: formatTime(prediction.resolvedAt) })) : null,
    prediction.resolutionNote ? h('p', { className: 'la-pred__note' }, prediction.resolutionNote) : null,
    prediction.status === 'open'
      ? h(
          'div',
          { className: 'la-pred__actions' },
          h(
            Button,
            { size: 'sm', variant: 'secondary', icon: 'check', onClick: () => setResolving((value) => !value) },
            t('loop.pred.resolve'),
          ),
          resolving
            ? h(
                'div',
                { className: 'la-pred__form' },
                h(
                  'div',
                  { className: 'la-chips' },
                  RESOLVABLE.map((value) =>
                    h(
                      'button',
                      {
                        key: value,
                        type: 'button',
                        className: `la-chip ${status === value ? 'is-on' : ''}`.trim(),
                        onClick: () => setStatus(value),
                        'aria-pressed': status === value,
                      },
                      t(`loop.pred.resolve.${value}`),
                    ),
                  ),
                ),
                h('input', {
                  className: 'la-input',
                  value: note,
                  placeholder: t('loop.pred.resolutionNotePlaceholder'),
                  'aria-label': t('loop.pred.resolutionNote'),
                  onChange: (event) => setNote(event.target.value),
                }),
                props.runs.length
                  ? h(
                      'select',
                      { className: 'la-select', value: runId, onChange: (event) => setRunId(event.target.value), 'aria-label': t('loop.pred.linkRun') },
                      h('option', { value: '' }, t('loop.pred.noRun')),
                      props.runs.map((item) =>
                        h('option', { key: item.id, value: item.id }, `${item.modelId || ''} ${JSON.stringify(item.params || {})} · ${formatTime(item.at)}`),
                      ),
                    )
                  : null,
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
                          'prediction.resolve',
                          { id: prediction.id, status, note: note.trim() || null, runId: runId || null },
                          { successText: t('loop.status.saveOk', { what: t('loop.pred.title') }) },
                        )
                        setResolving(false)
                      } catch (rawError) {
                        setError(String((rawError && rawError.message) || rawError))
                      } finally {
                        setBusy(false)
                      }
                    },
                  },
                  t('loop.pred.resolve'),
                ),
                error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
              )
            : null,
        )
      : null,
  )
}
