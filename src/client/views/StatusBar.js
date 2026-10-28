/**
 * 底部状态条：数据路径、模型状态、最近的真实保存回执 / 错误。
 * 所有成功文案只来自 Host 回执；错误显示 code + 原因。
 */

import { IconButton, StatusDot, Tag, Notice } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { truncate } from '../util.js'

export function StatusBar(props) {
  const t = props.t
  const data = props.data || {}
  const latest = (props.receipts || [])[0] || null
  const modelName = data.model && data.model.model ? `${data.model.provider || '?'} / ${data.model.model}` : t('loop.chat.noModel')
  const modelAvailable = data.modelAvailable !== false && !(data.model && data.model.available === false)
  const readOnly = data.readOnly === true || data.fatal === true
  return h(
    'footer',
    { className: 'la-statusbar', role: 'contentinfo', 'aria-label': t('loop.a11y.status') },
    h(
      'button',
      {
        type: 'button',
        className: 'la-statusbar__path',
        title: `${t('loop.res.dataPath')}：${data.dataPath || '—'}`,
        onClick: props.onCopyPath,
      },
      h(Icon, { name: 'folder', size: 14 }),
      h('span', { className: 'la-statusbar__pathtext' }, data.dataPath || '—'),
    ),
    h(
      'span',
      { className: 'la-statusbar__model' },
      h(StatusDot, { tone: modelAvailable ? 'ok' : 'danger' }),
      h('span', null, `${t('loop.status.model', { model: modelName })}`),
      modelAvailable ? null : h(Tag, { tone: 'danger' }, t('loop.status.modelUnavailable')),
    ),
    readOnly
      ? h(
          'span',
          { className: 'la-statusbar__alert' },
          h(Notice, { tone: 'warn' }, data.fatal ? String(data.fatal) : t('loop.error.READ_ONLY')),
        )
      : null,
    h(
      'button',
      {
        type: 'button',
        className: `la-statusbar__receipt ${latest ? `is-${latest.kind}` : ''}`.trim(),
        onClick: props.onOpenReceipts,
        'aria-live': 'polite',
        title: t('loop.status.receipts'),
      },
      latest
        ? h(
            'span',
            { className: 'la-statusbar__receipttext' },
            latest.kind === 'ok' ? '✓ ' : latest.kind === 'error' ? '✕ ' : '· ',
            truncate(latest.text, 120),
            latest.code ? h('span', { className: 'la-statusbar__code' }, ` [${latest.code}]`) : null,
          )
        : h('span', { className: 'la-statusbar__receipttext la-muted' }, t('loop.status.noReceipts')),
      (props.receipts || []).length > 1 ? h('span', { className: 'la-statusbar__receiptcount' }, String(props.receipts.length)) : null,
    ),
    h(
      'span',
      { className: 'la-statusbar__right' },
      (props.notices || []).length
        ? h(
            'button',
            { type: 'button', className: 'la-statusbar__notices', onClick: props.onOpenReceipts },
            h(Icon, { name: 'info', size: 14 }),
            t('loop.status.noticesCount', { count: props.notices.length }),
          )
        : null,
      props.refreshing ? h('span', { className: 'la-statusbar__refreshing' }, t('loop.common.loading')) : null,
      h(IconButton, { icon: 'refresh', label: t('loop.common.refresh'), onClick: props.onRefresh, disabled: props.refreshing }),
    ),
  )
}
