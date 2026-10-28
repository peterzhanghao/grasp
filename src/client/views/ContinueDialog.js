/**
 * "继续研究"：上次阅读、进行中的研究问题（含下一项检验）、待验证预测、最近运行。
 * 全部来自真实 state，不编造进度。
 */

import { Dialog } from '../components/Dialog.js'
import { Button, Tag, EmptyState, FieldLabel } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { TimeLabel } from './shared.js'
import { subjectFromView, subjectLabel } from '../model.js'
import { formatTime } from '../util.js'

export function ContinueDialog(props) {
  const t = props.t
  const ci = props.ci
  const storeIndex = props.storeIndex
  const view = props.view
  const lastSubject = subjectFromView(view)
  const investigations = storeIndex.openInvestigations().slice(0, 6)
  const predictions = storeIndex.openPredictions().slice(0, 6)
  const runs = storeIndex.runs.slice(0, 5)
  const empty = !lastSubject && !investigations.length && !predictions.length && !runs.length

  return h(
    Dialog,
    {
      open: props.open,
      onClose: props.onClose,
      title: t('loop.continue.title'),
      size: 'md',
      closeLabel: t('loop.common.close'),
      footer: h('div', { className: 'la-dialog__actions' }, h(Button, { variant: 'ghost', onClick: props.onClose }, t('loop.common.close'))),
    },
    h(
      'div',
      { className: 'la-continue' },
      empty ? h(EmptyState, { icon: 'clock', title: t('loop.continue.empty') }) : null,
      lastSubject
        ? h(
            'section',
            { className: 'la-continue__block' },
            h(FieldLabel, null, t('loop.continue.lastSubject')),
            h(
              'button',
              { type: 'button', className: 'la-continue__row', onClick: () => props.onGoSubject(lastSubject) },
              h(Icon, { name: 'target', size: 16 }),
              h(
                'span',
                { className: 'la-continue__main' },
                h('span', { className: 'la-continue__title' }, subjectLabel(ci, lastSubject, storeIndex.raw, t)),
                h('span', { className: 'la-muted' }, `${t('loop.scale.subject')} · ${view.scale}`),
              ),
              h(Tag, { tone: 'accent' }, t('loop.continue.open')),
            ),
          )
        : null,
      investigations.length
        ? h(
            'section',
            { className: 'la-continue__block' },
            h(FieldLabel, null, t('loop.continue.investigations')),
            investigations.map((investigation) =>
              h(
                'button',
                {
                  key: investigation.id,
                  type: 'button',
                  className: 'la-continue__row',
                  onClick: () => props.onGoInvestigation(investigation),
                },
                h(Icon, { name: 'flask', size: 16 }),
                h(
                  'span',
                  { className: 'la-continue__main' },
                  h('span', { className: 'la-continue__title' }, investigation.title || t('loop.inv.title')),
                  h(
                    'span',
                    { className: 'la-muted' },
                    `${t('loop.continue.nextTest')}：${investigation.nextTest || t('loop.continue.noNextTest')}`,
                  ),
                ),
                h(Tag, { tone: 'warn' }, t(`loop.inv.status.${investigation.status}`)),
              ),
            ),
          )
        : null,
      predictions.length
        ? h(
            'section',
            { className: 'la-continue__block' },
            h(FieldLabel, null, t('loop.continue.predictions')),
            predictions.map((prediction) =>
              h(
                'button',
                {
                  key: prediction.id,
                  type: 'button',
                  className: 'la-continue__row',
                  onClick: () => props.onGoSubject(prediction.subject, 'evidence'),
                },
                h(Icon, { name: 'target', size: 16 }),
                h(
                  'span',
                  { className: 'la-continue__main' },
                  h('span', { className: 'la-continue__title' }, prediction.text),
                  h('span', { className: 'la-muted' }, prediction.resolveBy ? `${t('loop.pred.resolveBy')}：${prediction.resolveBy}` : ''),
                ),
                h(Tag, { tone: 'warn' }, t('loop.pred.status.open')),
              ),
            ),
          )
        : null,
      runs.length
        ? h(
            'section',
            { className: 'la-continue__block' },
            h(FieldLabel, null, t('loop.continue.runs')),
            runs.map((run) =>
              h(
                'button',
                {
                  key: run.id,
                  type: 'button',
                  className: 'la-continue__row',
                  onClick: () => props.onGoRun(run),
                },
                h(Icon, { name: 'flask', size: 16 }),
                h(
                  'span',
                  { className: 'la-continue__main' },
                  h(
                    'span',
                    { className: 'la-continue__title' },
                    `${run.modelId || ''} ${JSON.stringify(run.params || {})} · ${
                      run.verdict ? t(`loop.exp.verdict.${run.verdict}`) : '—'
                    }`,
                  ),
                  h('span', { className: 'la-muted' }, `${formatTime(run.at)}${run.criterion ? ` · ${run.criterion}` : ''}`),
                ),
                h(Tag, { tone: 'neutral' }, run.subject ? `${run.subject.kind}:${run.subject.id}` : '—'),
              ),
            ),
          )
        : null,
    ),
  )
}
