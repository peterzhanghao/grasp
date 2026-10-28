/**
 * 模态弹层：dialog 语义、焦点陷阱、Escape 关闭并把焦点还给触发者。
 * 覆盖层只盖住插件自己的面板区域（不遮挡 Harness 外壳）。
 */

const { useRef, useEffect, useMemo } = React

import { classNames } from '../util.js'
import { nextLocalId } from '../state/hooks.js'
import { IconButton, Button } from './primitives.js'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * 焦点陷阱 + Escape 关闭 + 关闭后焦点归还。
 * @param {object} options
 * @param {boolean} options.active
 * @param {{current: HTMLElement|null}} options.containerRef
 * @param {() => void} options.onClose
 */
export function useFocusTrap(options) {
  const active = !!(options && options.active)
  const containerRef = options && options.containerRef
  const onClose = options && options.onClose
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!active) return undefined
    const container = containerRef && containerRef.current
    if (!container || typeof document === 'undefined') return undefined
    const previous = document.activeElement
    const listFocusable = () =>
      Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
      )
    const items = listFocusable()
    const target = items[0] || container
    try {
      target.focus({ preventScroll: false })
    } catch {
      try {
        target.focus()
      } catch {
        /* 焦点失败不影响弹层可用 */
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (closeRef.current) closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = listFocusable()
      if (!focusable.length) {
        event.preventDefault()
        container.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement
      const inside = container.contains(activeElement)
      if (event.shiftKey) {
        if (!inside || activeElement === first) {
          event.preventDefault()
          last.focus()
        }
        return
      }
      if (!inside || activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      if (previous && typeof previous.focus === 'function') {
        try {
          previous.focus({ preventScroll: true })
        } catch {
          /* 触发者已经卸载 */
        }
      }
    }
  }, [active, containerRef])
}

/**
 * 受控模态弹层。
 * props: open, onClose, title, description, children, footer, size('sm'|'md'|'lg'),
 *        closeLabel, initialFocusRef
 */
export function Dialog(props) {
  const containerRef = useRef(null)
  const titleId = useMemo(() => nextLocalId('la-dialog-title'), [])
  const descriptionId = useMemo(() => nextLocalId('la-dialog-desc'), [])
  useFocusTrap({ active: !!props.open, containerRef, onClose: props.onClose })
  if (!props.open) return null
  return h(
    'div',
    {
      className: 'la-overlay',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget && props.onClose) props.onClose()
      },
    },
    h(
      'div',
      {
        className: classNames('la-dialog', props.size && `la-dialog--${props.size}`, props.className),
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        'aria-describedby': props.description ? descriptionId : undefined,
        ref: containerRef,
        tabIndex: -1,
      },
      h(
        'div',
        { className: 'la-dialog__head' },
        h(
          'div',
          { className: 'la-dialog__heading' },
          h('h2', { className: 'la-dialog__title', id: titleId }, props.title),
          props.description ? h('p', { className: 'la-dialog__desc', id: descriptionId }, props.description) : null,
        ),
        h(IconButton, { icon: 'close', label: props.closeLabel || '关闭', onClick: props.onClose }),
      ),
      h('div', { className: 'la-dialog__body' }, props.children),
      props.footer ? h('div', { className: 'la-dialog__foot' }, props.footer) : null,
    ),
  )
}

/** 确认弹层：危险操作用 danger 样式，取消/确认按钮都有明确文案。 */
export function ConfirmDialog(props) {
  return h(
    Dialog,
    {
      open: !!props.open,
      onClose: props.onCancel,
      title: props.title,
      description: props.description,
      size: 'sm',
      closeLabel: props.cancelLabel,
    },
    h('div', { className: 'la-confirm' }, h('p', { className: 'la-confirm__text' }, props.message)),
    {
      footer: h(
        'div',
        { className: 'la-dialog__actions' },
        h(Button, { variant: 'ghost', onClick: props.onCancel }, props.cancelLabel),
        h(Button, { variant: props.danger ? 'danger' : 'primary', onClick: props.onConfirm }, props.confirmLabel),
      ),
    },
  )
}
