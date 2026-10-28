/**
 * 证据尺度内联实验面板：延迟回路 / 代理指标 / 全绿却错。
 * 结果、判定、判据、模型版本全部来自 Host 的 experiment.run 回执（前端不复算公式）。
 */

const { useState, useMemo } = React

import { Button, Tag, FieldLabel } from '../components/primitives.js'
import { Collapsible } from './shared.js'
import { experimentKind } from '../model.js'
import { formatTime } from '../util.js'

const VERDICTS = [
  'converged',
  'overshoot-settled',
  'oscillating',
  'oscillating-below',
  'drift',
  'diverging',
]

export function ExperimentCard(props) {
  const t = props.t
  const experiment = props.experiment
  const kind = experimentKind(experiment)
  const [open, setOpen] = useState(!!props.defaultOpen)
  const runs = props.runs || []
  return h(
    'article',
    { className: `la-expcard ${open ? 'is-open' : ''}`.trim() },
    h(
      'button',
      {
        type: 'button',
        className: 'la-expcard__head',
        onClick: () => setOpen((value) => !value),
        'aria-expanded': open,
      },
      h('span', { className: 'la-expcard__chevron', 'aria-hidden': 'true' }, open ? '▾' : '▸'),
      h(
        'span',
        { className: 'la-expcard__titles' },
        h('span', { className: 'la-expcard__title' }, experiment.title),
        experiment.subtitle ? h('span', { className: 'la-expcard__subtitle' }, experiment.subtitle) : null,
      ),
      h(Tag, { tone: 'neutral' }, experiment.modelId || t('loop.exp.teaching')),
      runs.length ? h(Tag, { tone: 'accent' }, `${runs.length}`) : null,
    ),
    open
      ? h(
          'div',
          { className: 'la-expcard__body' },
          experiment.question ? h('p', { className: 'la-expcard__question' }, experiment.question) : null,
          kind === 'delay'
            ? h(DelayExperiment, { t, experiment, onRun: props.onRun, runs, onPrefillObservation: props.onPrefillObservation })
            : kind === 'proxy'
              ? h(ProxyExperiment, { t, experiment, onRun: props.onRun, runs })
              : h(GreenExperiment, { t, experiment, onRun: props.onRun, runs }),
          experiment.note ? h('p', { className: 'la-expcard__note la-muted' }, experiment.note) : null,
        )
      : null,
  )
}

function useRunState(onRun) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [run, setRun] = useState(null)
  return { busy, setBusy, error, setError, result, setResult, run, setRun, onRun }
}

async function executeRun(options, params, prediction) {
  const { setBusy, setError, setResult, setRun, onRun } = options
  setBusy(true)
  setError('')
  try {
    const response = await onRun({ params, prediction })
    setRun(response.run || null)
    setResult(response.result || null)
    return response
  } catch (rawError) {
    setError(String((rawError && rawError.message) || rawError))
    return null
  } finally {
    setBusy(false)
  }
}

/* ───────────────────────── 延迟回路 ───────────────────────── */

function DelayExperiment(props) {
  const t = props.t
  const experiment = props.experiment
  const [K, setK] = useState(1.2)
  const [D, setD] = useState(0.6)
  const [prediction, setPrediction] = useState('')
  const state = useRunState(props.onRun)
  const { busy, error, result, run } = state

  const runNow = () =>
    executeRun(state, { K: Number(K.toFixed(2)), D: Number(D.toFixed(2)) }, prediction ? t(`loop.exp.verdict.${prediction}`) : '')

  const verdict = result && result.verdict
  const verdictLabel = result && (result.verdictLabel || t(`loop.exp.verdict.${result.verdict}`))
  const matches = prediction && verdict ? prediction === verdict : null

  return h(
    'div',
    { className: 'la-exp' },
    h(
      'div',
      { className: 'la-exp__control' },
      h(
        'label',
        { className: 'la-slider' },
        h('span', { className: 'la-slider__label' }, `${t('loop.exp.delay.K')} = ${Number(K).toFixed(2)}`),
        h('input', {
          type: 'range',
          min: 0,
          max: 5,
          step: 0.05,
          value: K,
          onChange: (event) => {
            setK(Number(event.target.value))
            state.setResult(null)
          },
        }),
      ),
      h(
        'label',
        { className: 'la-slider' },
        h('span', { className: 'la-slider__label' }, `${t('loop.exp.delay.D')} = ${Number(D).toFixed(2)} s`),
        h('input', {
          type: 'range',
          min: 0,
          max: 2,
          step: 0.05,
          value: D,
          onChange: (event) => {
            setD(Number(event.target.value))
            state.setResult(null)
          },
        }),
      ),
      h('p', { className: 'la-exp__formula la-muted' }, t('loop.exp.delay.formula')),
    ),
    h(
      'div',
      { className: 'la-prediction' },
      h(FieldLabel, null, t('loop.exp.predict')),
      h(
        'div',
        { className: 'la-chips' },
        VERDICTS.map((id) =>
          h(
            'button',
            {
              key: id,
              type: 'button',
              className: `la-chip ${prediction === id ? 'is-on' : ''}`.trim(),
              onClick: () => setPrediction((value) => (value === id ? '' : id)),
              'aria-pressed': prediction === id,
            },
            t(`loop.exp.verdict.${id}`),
          ),
        ),
      ),
    ),
    h(
      'div',
      { className: 'la-exp__actions' },
      h(Button, { variant: 'primary', icon: 'flask', loading: busy, onClick: runNow }, busy ? t('loop.exp.running') : t('loop.exp.run')),
      h('span', { className: 'la-muted' }, t('loop.exp.reproducible')),
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, t('loop.exp.failed', { message: error })) : null,
    ),
    result
      ? h(
          'div',
          { className: 'la-expresult' },
          h(
            'div',
            { className: 'la-expresult__verdict' },
            h(FieldLabel, null, t('loop.exp.verdict')),
            h('p', { className: `la-expresult__label verdict-${result.verdict}` }, verdictLabel),
            matches === true
              ? h('p', { className: 'la-expresult__match is-match' }, t('loop.exp.match'))
              : matches === false
                ? h('p', { className: 'la-expresult__match is-miss' }, t('loop.exp.mismatch'))
                : null,
          ),
          result.trace && result.trace.length
            ? h(TraceChart, { t, trace: result.trace, target: result.target })
            : null,
          h(
            'dl',
            { className: 'la-metrics' },
            metric(t, 'final', result.metrics && result.metrics.final),
            metric(t, 'peak', result.metrics && result.metrics.peak),
            metric(t, 'overshoot', result.metrics && result.metrics.overshoot),
            metric(t, 'lastAmplitude', result.metrics && result.metrics.lastAmplitude),
            metric(t, 'drift', result.metrics && result.metrics.drift),
            metric(t, 'crossings', result.metrics && result.metrics.crossings),
          ),
          h(
            'p',
            { className: 'la-expresult__criterion' },
            h('strong', null, `${t('loop.exp.criterion')}：`),
            result.criterion || '—',
          ),
          h(
            'div',
            { className: 'la-expresult__meta' },
            h(
              'span',
              null,
              `${t('loop.exp.model')}：${result.modelId || experiment.modelId} v${result.modelVersion || '—'}`,
            ),
            h('span', null, `${t('loop.exp.params')}：K=${Number(result.params && result.params.K).toFixed(2)} · D=${Number(result.params && result.params.D).toFixed(2)} s`),
            run && run.at ? h('span', null, `${t('loop.exp.recordedAt')}：${formatTime(run.at)}`) : null,
            h('span', null, t('loop.exp.runSaved')),
          ),
          verdict
            ? h(
                'div',
                { className: 'la-expresult__actions' },
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'secondary',
                    icon: 'notes',
                    onClick: () =>
                      props.onPrefillObservation &&
                      props.onPrefillObservation(
                        `观察：K=${Number(result.params && result.params.K).toFixed(2)}，D=${Number(result.params && result.params.D).toFixed(
                          2,
                        )} s 时，判定为「${verdictLabel}」。判据：${result.criterion || '—'}。模型 ${result.modelId} v${result.modelVersion}。`,
                      ),
                  },
                  t('loop.exp.saveObs'),
                ),
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'ghost',
                    onClick: () => {
                      state.setResult(null)
                      setPrediction('')
                    },
                  },
                  t('loop.exp.rerun'),
                ),
              )
            : null,
        )
      : null,
    h(RunHistory, { t, runs: props.runs, experimentId: experiment.id }),
  )
}

function metric(t, key, value) {
  if (value === undefined || value === null) return null
  const labelText = {
    final: '终值',
    peak: '峰值',
    overshoot: '过冲',
    lastAmplitude: '末段振幅',
    drift: '漂移',
    crossings: '穿越目标次数',
  }[key]
  const display = typeof value === 'number' ? (Math.abs(value) < 10 ? value.toFixed(3) : value.toFixed(1)) : String(value)
  return h('div', { className: 'la-metrics__item' }, h('dt', null, labelText), h('dd', null, display))
}

function TraceChart(props) {
  const trace = props.trace || []
  const target = Number.isFinite(props.target) ? props.target : 1
  const width = 620
  const height = 180
  const pad = { left: 36, right: 12, top: 12, bottom: 22 }
  const ys = trace.map((point) => Number(point.y))
  const minY = Math.min(0, target, ...ys)
  const maxY = Math.max(target, ...ys, 0.1)
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const x = (index) => pad.left + (innerW * index) / Math.max(1, trace.length - 1)
  const y = (value) => pad.top + innerH - ((value - minY) / Math.max(0.0001, maxY - minY)) * innerH
  const points = trace.map((point, index) => `${x(index).toFixed(1)},${y(Number(point.y)).toFixed(1)}`).join(' ')
  const targetY = y(target)
  return h(
    'figure',
    { className: 'la-trace' },
    h(
      'svg',
      { viewBox: `0 0 ${width} ${height}`, className: 'la-trace__svg', role: 'img', 'aria-label': props.t('loop.exp.trace') },
      h('line', { className: 'la-trace__axis', x1: pad.left, y1: pad.top, x2: pad.left, y2: height - pad.bottom }),
      h('line', { className: 'la-trace__axis', x1: pad.left, y1: height - pad.bottom, x2: width - pad.right, y2: height - pad.bottom }),
      h('line', { className: 'la-trace__target', x1: pad.left, y1: targetY, x2: width - pad.right, y2: targetY }),
      h('text', { className: 'la-trace__label', x: pad.left + 4, y: targetY - 5 }, props.t('loop.exp.target')),
      h('polyline', { className: 'la-trace__line', points }),
      h('text', { className: 'la-trace__label', x: 2, y: pad.top + 10 }, maxY.toFixed(1)),
      h('text', { className: 'la-trace__label', x: 2, y: height - pad.bottom }, minY.toFixed(1)),
    ),
    h('figcaption', { className: 'la-trace__caption la-muted' }, `${props.t('loop.exp.trace')} · ${trace.length} pts`),
  )
}

/* ───────────────────────── 代理指标 ───────────────────────── */

function ProxyExperiment(props) {
  const t = props.t
  const experiment = props.experiment
  const [e, setE] = useState(1)
  const state = useRunState(props.onRun)
  const { busy, error, result } = state
  const visible = result ? Number(result.visible) : null
  const hidden = result ? Number(result.hidden) : null
  const ratio = result ? Number(result.ratioHiddenToVisible) : null

  return h(
    'div',
    { className: 'la-exp' },
    h(
      'label',
      { className: 'la-slider' },
      h('span', { className: 'la-slider__label' }, `${t('loop.exp.proxy.e')} = ${Number(e).toFixed(2)}`),
      h('input', {
        type: 'range',
        min: 0,
        max: 2.6,
        step: 0.02,
        value: e,
        onChange: (event) => {
          setE(Number(event.target.value))
          state.setResult(null)
        },
      }),
    ),
    h(
      'div',
      { className: 'la-exp__actions' },
      h(Button, { variant: 'primary', icon: 'flask', loading: busy, onClick: () => executeRun(state, { e: Number(e.toFixed(2)) }, '') }, busy ? t('loop.exp.running') : t('loop.exp.run')),
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, t('loop.exp.failed', { message: error })) : null,
    ),
    result
      ? h(
          'div',
          { className: 'la-expresult' },
          h(
            'div',
            { className: 'la-bars' },
            bar(t('loop.exp.proxy.visible'), visible, 'visible'),
            bar(t('loop.exp.proxy.hidden'), hidden, 'hidden'),
          ),
          h(
            'dl',
            { className: 'la-metrics' },
            h('div', { className: 'la-metrics__item' }, h('dt', null, t('loop.exp.proxy.ratio')), h('dd', null, ratio === null ? '—' : ratio.toFixed(2))),
            result.peakHidden
              ? h(
                  'div',
                  { className: 'la-metrics__item' },
                  h('dt', null, t('loop.exp.proxy.peak', { e: Number(result.peakHidden.e).toFixed(2), value: Number(result.peakHidden.value).toFixed(2) })),
                  h('dd', null, ''),
                )
              : null,
            h('div', { className: 'la-metrics__item' }, h('dt', null, t('loop.exp.verdict')), h('dd', null, result.verdictLabel || result.verdict)),
          ),
          h('p', { className: 'la-expresult__criterion' }, h('strong', null, `${t('loop.exp.criterion')}：`), result.criterion || '—'),
          h(
            'div',
            { className: 'la-expresult__meta' },
            h('span', null, `${t('loop.exp.model')}：${result.modelId} v${result.modelVersion}`),
            h('span', null, `${t('loop.exp.params')}：e=${Number(result.params && result.params.e).toFixed(2)}`),
            h('span', null, t('loop.exp.runSaved')),
          ),
          h(
            'div',
            { className: 'la-expresult__actions' },
            h(
              Button,
              {
                size: 'sm',
                variant: 'secondary',
                icon: 'notes',
                onClick: () =>
                  props.onPrefillObservation &&
                  props.onPrefillObservation(
                    `观察：优化力度 e=${Number(result.params && result.params.e).toFixed(2)} 时，可见指标 ${visible.toFixed(
                      1,
                    )}、隐藏指标 ${hidden.toFixed(1)}，隐藏/可见=${ratio.toFixed(2)}，判定「${result.verdictLabel || result.verdict}」。判据：${
                      result.criterion || '—'
                    }。`,
                  ),
              },
              t('loop.exp.saveObs'),
            ),
          ),
        )
      : null,
    h(RunHistory, { t, runs: props.runs, experimentId: experiment.id }),
  )
}

function bar(label, value, tone) {
  const width = Math.max(0, Math.min(100, Number(value) || 0))
  return h(
    'div',
    { className: 'la-bar' },
    h('span', { className: 'la-bar__label' }, `${label} ${Number(value || 0).toFixed(1)}`),
    h('span', { className: 'la-bar__track' }, h('span', { className: `la-bar__fill la-bar__fill--${tone}`, style: { width: `${width}%` } })),
  )
}

/* ───────────────────────── 全绿却错 ───────────────────────── */

function GreenExperiment(props) {
  const t = props.t
  const experiment = props.experiment
  const [enabled, setEnabled] = useState({ p1: true, p2: true, empty: false, beyond: false })
  const state = useRunState(props.onRun)
  const { busy, error, result } = state
  const cases = (result && result.cases) || []

  return h(
    'div',
    { className: 'la-exp' },
    h(
      'div',
      { className: 'la-checks' },
      Object.keys(enabled).map((id) =>
        h(
          'label',
          { key: id, className: 'la-check' },
          h('input', {
            type: 'checkbox',
            checked: !!enabled[id],
            onChange: () => {
              setEnabled((previous) => Object.assign({}, previous, { [id]: !previous[id] }))
              state.setResult(null)
            },
          }),
          h('span', { className: 'la-check__label' }, caseLabel(t, id)),
          h(Tag, { tone: enabled[id] ? 'accent' : 'neutral' }, enabled[id] ? t('loop.exp.green.pass') : t('loop.exp.green.off')),
        ),
      ),
    ),
    h(
      'p',
      { className: 'la-expcard__note' },
      t('loop.exp.green.caveat'),
    ),
    h(
      'div',
      { className: 'la-exp__actions' },
      h(Button, { variant: 'primary', icon: 'flask', loading: busy, onClick: () => executeRun(state, { enabled }, '') }, busy ? t('loop.exp.running') : t('loop.exp.run')),
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, t('loop.exp.failed', { message: error })) : null,
    ),
    result
      ? h(
          'div',
          { className: 'la-expresult' },
          h(
            'p',
            { className: `la-expresult__allgreen ${result.allGreen ? 'is-green' : 'is-red'}` },
            result.allGreen ? t('loop.exp.green.allGreen') : t('loop.exp.verdict.fail'),
          ),
          h(
            'ul',
            { className: 'la-caselist' },
            cases.map((item) =>
              h(
                'li',
                { key: item.id, className: `la-caselist__item is-${item.state}` },
                h('span', { className: 'la-caselist__label' }, item.label || caseLabel(t, item.id)),
                h(
                  'span',
                  null,
                  item.state === 'pass'
                    ? h(Tag, { tone: 'ok' }, t('loop.exp.green.pass'))
                    : item.state === 'fail'
                      ? h(Tag, { tone: 'danger' }, t('loop.exp.green.fail'))
                      : h(Tag, { tone: 'neutral' }, t('loop.exp.green.off')),
                ),
                item.state === 'fail'
                  ? h(
                      'span',
                      { className: 'la-caselist__detail' },
                      `${t('loop.exp.green.actual', { actual: item.detail || '—' })} · ${t('loop.exp.green.expect', {
                        expect: item.expect || '—',
                      })}`,
                    )
                  : h('span', { className: 'la-caselist__detail la-muted' }, t('loop.exp.green.expect', { expect: item.expect || '—' })),
              ),
            ),
          ),
          h('p', { className: 'la-expresult__criterion' }, h('strong', null, `${t('loop.exp.criterion')}：`), result.criterion || t('loop.exp.green.notCorrect')),
          result.caveat ? h('p', { className: 'la-expresult__criterion la-muted' }, result.caveat) : null,
          h(
            'div',
            { className: 'la-expresult__meta' },
            h('span', null, `${t('loop.exp.model')}：${result.modelId} v${result.modelVersion}`),
            h('span', null, t('loop.exp.runSaved')),
          ),
        )
      : null,
    h(RunHistory, { t, runs: props.runs, experimentId: experiment.id }),
  )
}

function caseLabel(t, id) {
  const labels = {
    p1: '第 1 页，每页 10 条',
    p2: '第 2 页，每页 10 条',
    empty: '空集合，第 1 页',
    beyond: '第 99 页（超出范围）',
  }
  return labels[id] || id
}

/* ───────────────────────── 运行记录 ───────────────────────── */

function RunHistory(props) {
  const runs = (props.runs || []).filter((run) => !props.experimentId || run.experimentId === props.experimentId).slice(0, 8)
  if (!runs.length) return null
  return h(
    Collapsible,
    { title: props.t('loop.evidence.runs'), meta: String(runs.length) },
    h(
      'ul',
      { className: 'la-runlist' },
      runs.map((run) =>
        h(
          'li',
          { key: run.id, className: 'la-runlist__item' },
          h('span', { className: 'la-runlist__verdict' }, run.verdict ? props.t(`loop.exp.verdict.${run.verdict}`) : '—'),
          h('span', { className: 'la-runlist__params' }, JSON.stringify(run.params || {})),
          h('span', { className: 'la-runlist__at' }, formatTime(run.at)),
          h(
            'span',
            { className: 'la-runlist__model' },
            `${run.modelId || ''}${run.modelVersion === null ? '' : ` v${run.modelVersion}`}${
              run.subject && run.subject.kind ? ` · ${run.subject.kind}:${run.subject.id}` : ''
            }`,
          ),
          run.result && run.result.metrics
            ? h('span', { className: 'la-runlist__metrics' }, JSON.stringify(run.result.metrics))
            : null,
        ),
      ),
    ),
  )
}
