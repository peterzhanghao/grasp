/**
 * 视图共享件：复制回执、可折叠区块、来源/主张列表、备注元信息。
 */

const { useState, useCallback } = React

import { copyText, formatTime } from '../util.js'

/** 复制文本并写真实回执（成功/失败都来自 clipboard 的真实结果）。 */
export function useCopyText(t, addReceipt) {
  return useCallback(
    async (text) => {
      const result = await copyText(text)
      if (addReceipt) {
        addReceipt({
          kind: result.ok ? 'info' : 'error',
          text: result.ok ? t('loop.common.copied') : `${t('loop.common.copyFailed')}：${result.reason}`,
        })
      }
      return result
    },
    [addReceipt, t],
  )
}

/** 可折叠区块（按钮 + aria-expanded；不是 <details>，样式可控）。 */
export function Collapsible(props) {
  const [open, setOpen] = useState(!!props.defaultOpen)
  const controlled = props.open !== undefined
  const isOpen = controlled ? !!props.open : open
  const toggle = () => {
    if (controlled) {
      if (props.onToggle) props.onToggle(!isOpen)
      return
    }
    setOpen((value) => !value)
  }
  return h(
    'div',
    { className: `la-collapsible ${props.className || ''}`.trim() },
    h(
      'button',
      {
        type: 'button',
        className: 'la-collapsible__head',
        onClick: toggle,
        'aria-expanded': isOpen,
      },
      h('span', { className: 'la-collapsible__chevron', 'aria-hidden': 'true' }, isOpen ? '▾' : '▸'),
      h('span', { className: 'la-collapsible__title' }, props.title),
      props.meta ? h('span', { className: 'la-collapsible__meta' }, props.meta) : null,
    ),
    isOpen ? h('div', { className: 'la-collapsible__body' }, props.children) : null,
  )
}

export function MetaLine(props) {
  const items = (props.items || []).filter((item) => item !== null && item !== undefined && String(item).length > 0)
  return h(
    'span',
    { className: `la-metaline ${props.className || ''}`.trim() },
    items.map((item, index) =>
      h('span', { key: index, className: 'la-metaline__item' }, index > 0 ? ' · ' : '', item),
    ),
  )
}

export function ModelBadge(props) {
  const model = props.model || {}
  if (!model.model && !model.provider) {
    return h('span', { className: 'la-modelbadge' }, props.t('loop.chat.noModel'))
  }
  return h(
    'span',
    { className: 'la-modelbadge', title: `${model.provider || '?'} / ${model.model || '?'}` },
    `${model.provider || '?'} / ${model.model || '?'}`,
  )
}

export function TimeLabel(props) {
  if (!props.at) return null
  return h('time', { className: props.className || 'la-time', dateTime: props.at }, formatTime(props.at))
}

export function sourceVerifiedTone(verified) {
  if (verified === 'verified') return 'ok'
  if (verified === 'secondary') return 'warn'
  return 'danger'
}

export function Paragraphs(props) {
  const text = String(props.text || '')
  if (!text) return null
  return h(
    'div',
    { className: `la-prose ${props.className || ''}`.trim() },
    text.split(/\n{2,}/).map((paragraph, index) => h('p', { key: index }, paragraph)),
  )
}

/** 在文本中渲染“缺口 + 检索路径”的诚实提示。 */
export function GapList(props) {
  const gaps = props.gaps || []
  if (!gaps.length) return null
  return h(
    'ul',
    { className: 'la-gaplist' },
    gaps.map((gap, index) =>
      h(
        'li',
        { key: index },
        h('span', { className: 'la-gaplist__item' }, props.t('loop.history.gap', { item: gap.item || gap.why || '' })),
        gap.searchPath
          ? h('span', { className: 'la-gaplist__path' }, props.t('loop.history.searchPath', { path: gap.searchPath }))
          : null,
      ),
    ),
  )
}
