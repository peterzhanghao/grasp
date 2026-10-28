/**
 * 基础控件：按钮、图标按钮、分段切换、标签、提示、空状态。
 * 尺寸与热区遵循 contract §6：主操作 40—44px，图标按钮 40px，文字 ≥12px。
 */

import { classNames } from '../util.js'
import { Icon } from './Icons.js'

export function Button(props) {
  const variant = props.variant || 'secondary'
  const size = props.size || 'md'
  const className = classNames('la-btn', `la-btn--${variant}`, `la-btn--${size}`, props.block && 'la-btn--block', props.className)
  return h(
    'button',
    {
      type: props.type || 'button',
      className,
      disabled: props.disabled || props.loading || false,
      onClick: props.onClick,
      title: props.title,
      'aria-label': props['aria-label'],
      'aria-pressed': props.pressed === undefined ? undefined : props.pressed,
      'aria-busy': props.loading ? 'true' : undefined,
      style: props.style,
    },
    props.loading ? h('span', { className: 'la-spinner', 'aria-hidden': 'true' }) : props.icon ? h(Icon, { name: props.icon, size: 16 }) : null,
    props.children ? h('span', { className: 'la-btn__label' }, props.children) : null,
  )
}

export function IconButton(props) {
  return h(
    'button',
    {
      type: 'button',
      className: classNames('la-iconbtn', props.className),
      onClick: props.onClick,
      title: props.title || props.label,
      'aria-label': props.label,
      'aria-pressed': props.pressed === undefined ? undefined : props.pressed,
      'aria-expanded': props.expanded === undefined ? undefined : props.expanded,
      disabled: props.disabled || false,
      style: props.style,
    },
    h(Icon, { name: props.icon, size: props.size || 18 }),
  )
}

/**
 * 分段切换（尺度 / 视角 / 笔记 tab 等）。
 * options: [{ id, label, hint?, disabled? }]
 */
export function Segmented(props) {
  const options = props.options || []
  return h(
    'div',
    {
      className: classNames('la-seg', props.className),
      role: 'group',
      'aria-label': props.label,
    },
    options.map((option) =>
      h(
        'button',
        {
          key: option.id,
          type: 'button',
          className: classNames('la-seg__item', props.value === option.id && 'is-active'),
          onClick: option.disabled ? undefined : () => props.onChange && props.onChange(option.id),
          disabled: !!option.disabled,
          title: option.hint || option.label,
          'aria-pressed': props.value === option.id,
        },
        option.label,
      ),
    ),
  )
}

export function Tag(props) {
  const tone = props.tone || 'neutral'
  return h(
    'span',
    { className: classNames('la-tag', `la-tag--${tone}`, props.className), title: props.title },
    props.children,
  )
}

export function StatusDot(props) {
  const tone = props.tone || 'idle'
  return h('span', { className: classNames('la-dot', `la-dot--${tone}`), 'aria-hidden': 'true' })
}

export function FieldLabel(props) {
  return h(
    'span',
    { className: classNames('la-fieldlabel', props.className) },
    props.children,
    props.optional ? h('span', { className: 'la-fieldlabel__optional' }, ' · ' + props.optional) : null,
  )
}

export function Spinner(props) {
  return h('span', { className: classNames('la-spinner', props && props.className), 'aria-hidden': 'true' })
}

export function EmptyState(props) {
  return h(
    'div',
    { className: classNames('la-empty', props.className) },
    props.icon ? h(Icon, { name: props.icon, size: 22 }) : null,
    props.title ? h('p', { className: 'la-empty__title' }, props.title) : null,
    props.hint ? h('p', { className: 'la-empty__hint' }, props.hint) : null,
    props.action || null,
  )
}

export function Notice(props) {
  const tone = props.tone || 'info'
  return h(
    'div',
    { className: classNames('la-notice', `la-notice--${tone}`, props.className), role: tone === 'error' ? 'alert' : 'status' },
    h(Icon, { name: tone === 'error' ? 'error' : tone === 'warn' ? 'warning' : 'info', size: 16 }),
    h('div', { className: 'la-notice__body' }, props.children),
    props.action || null,
  )
}

export function CountBadge(props) {
  return h('span', { className: 'la-count', 'aria-label': props.label }, props.children)
}

export function SectionHeader(props) {
  return h(
    'div',
    { className: classNames('la-sectionhead', props.className) },
    h(
      'div',
      { className: 'la-sectionhead__text' },
      h('h3', { className: 'la-sectionhead__title' }, props.title),
      props.hint ? h('p', { className: 'la-sectionhead__hint' }, props.hint) : null,
    ),
    props.action || null,
  )
}

export function Divider(props) {
  return h('hr', { className: classNames('la-divider', props && props.className) })
}
