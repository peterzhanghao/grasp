/**
 * 对话面板：消息流、流式输出、停止、失败原因 + 重试、重开恢复、AI 回复存为草案。
 * 回答归属发送时的 subject；面板只显示传入 subject 的历史。
 */

const { useState, useEffect, useRef } = React

import { Button, Tag, Notice } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { Collapsible, MetaLine, TimeLabel, useCopyText } from './shared.js'
import { formatTime } from '../util.js'

function roleLabel(t, message) {
  return message.role === 'assistant' ? t('loop.chat.ai') : t('loop.chat.you')
}

function messageStatusTag(t, message) {
  if (message.status === 'failed') return h(Tag, { tone: 'danger' }, t('loop.chat.failed'))
  if (message.status === 'cancelled') return h(Tag, { tone: 'warn' }, t('loop.chat.cancelled'))
  if (message.status === 'streaming') return h(Tag, { tone: 'warn' }, t('loop.chat.streaming'))
  return null
}

export function ChatPanel(props) {
  const t = props.t
  const subject = props.subject
  const dialog = props.dialog
  const stream = props.stream
  const messages = dialog ? dialog.messages : []
  const [draft, setDraft] = useState(props.draft || '')
  const [adoptingId, setAdoptingId] = useState('')
  const listRef = useRef(null)
  const copy = useCopyText(t, props.addReceipt)
  const modelAvailable = props.modelAvailable !== false
  const modelReason = props.modelReason || t('loop.chat.noModel')
  const streaming = !!stream && (stream.phase === 'streaming' || stream.phase === 'stopping' || stream.phase === 'finishing')
  const streamText = stream ? stream.text : ''
  const streamError = stream && stream.phase === 'error' ? stream.error : null

  useEffect(() => {
    setDraft(props.draft || '')
  }, [props.draft, props.subjectKey])

  useEffect(() => {
    const element = listRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [messages.length, streamText])

  const submit = async () => {
    const text = draft.trim()
    if (!text || streaming) return
    if (props.onDraftChange) props.onDraftChange('')
    setDraft('')
    await props.onSend(text)
  }

  const retryMessage = async (message) => {
    if (!message.requestId) return
    await props.onRetry(message.requestId)
  }

  const adopt = async (message) => {
    setAdoptingId(message.id)
    try {
      await props.onAdoptDraft(message)
    } finally {
      setAdoptingId('')
    }
  }

  const isAdopted = (message) => typeof props.isAdopted === 'function' && props.isAdopted(message)

  return h(
    'div',
    { className: 'la-chat' },
    !modelAvailable
      ? h(Notice, { tone: 'warn' }, t('loop.chat.modelUnavailable', { reason: modelReason }))
      : null,
    h(
      'div',
      { className: 'la-chat__list', ref: listRef, role: 'log', 'aria-label': t('loop.a11y.chat'), 'aria-live': 'polite' },
      !messages.length && !streaming
        ? h('p', { className: 'la-chat__empty' }, t('loop.chat.empty'))
        : null,
      messages.map((message) => {
        const isAssistant = message.role === 'assistant'
        const interrupted = message.status === 'streaming'
        const retryable = (message.status === 'failed' || message.status === 'cancelled' || interrupted) && message.requestId
        return h(
          'article',
          { key: message.id, className: `la-msg la-msg--${message.role}` },
          h(
            'div',
            { className: 'la-msg__head' },
            h('span', { className: 'la-msg__role' }, roleLabel(t, message)),
            messageStatusTag(t, message),
            h(TimeLabel, { at: message.at }),
            isAssistant && message.model && message.model.model
              ? h('span', { className: 'la-muted' }, `${message.model.provider || '?'}/${message.model.model}`)
              : null,
          ),
          h('div', { className: 'la-msg__text' }, message.text || (interrupted ? t('loop.chat.partial') : '')),
          message.error
            ? h(
                'div',
                { className: 'la-msg__error', role: 'alert' },
                h('p', null, `${message.error.code ? `[${message.error.code}] ` : ''}${message.error.message || t('loop.chat.failed')}`),
                retryable
                  ? h(Button, { size: 'sm', variant: 'secondary', icon: 'refresh', onClick: () => retryMessage(message) }, t('loop.chat.retry'))
                  : null,
              )
            : null,
          interrupted
            ? h(
                'div',
                { className: 'la-msg__error' },
                h('p', null, t('loop.chat.interrupted')),
                message.requestId
                  ? h(Button, { size: 'sm', variant: 'secondary', icon: 'refresh', onClick: () => retryMessage(message) }, t('loop.chat.retry'))
                  : null,
              )
            : null,
          isAssistant && message.text && message.status === 'completed'
            ? h(
                'div',
                { className: 'la-msg__actions' },
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: isAdopted(message) ? 'ghost' : 'secondary',
                    icon: isAdopted(message) ? 'check' : 'notes',
                    disabled: isAdopted(message) || adoptingId === message.id,
                    loading: adoptingId === message.id,
                    onClick: () => adopt(message),
                    title: t('loop.note.draftHint'),
                  },
                  isAdopted(message) ? t('loop.note.adoptedDraft') : t('loop.note.adoptDraft'),
                ),
                h(
                  'button',
                  { type: 'button', className: 'la-linkbtn', onClick: () => copy(message.text) },
                  t('loop.chat.copy'),
                ),
              )
            : null,
        )
      }),
      streaming
        ? h(
            'article',
            { className: 'la-msg la-msg--assistant is-streaming' },
            h(
              'div',
              { className: 'la-msg__head' },
              h('span', { className: 'la-msg__role' }, t('loop.chat.ai')),
              h(Tag, { tone: 'warn' }, stream.phase === 'stopping' ? t('loop.chat.stopping') : t('loop.chat.streaming')),
            ),
            h('div', { className: 'la-msg__text' }, streamText || '…'),
          )
        : null,
      streamError
        ? h(
            'article',
            { className: 'la-msg la-msg--assistant is-error', role: 'alert' },
            h(
              'div',
              { className: 'la-msg__head' },
              h('span', { className: 'la-msg__role' }, t('loop.chat.ai')),
              h(Tag, { tone: 'danger' }, t('loop.chat.failed')),
            ),
            h('div', { className: 'la-msg__error' }, h('p', null, `[${streamError.code}] ${streamError.message}`)),
            h(
              'div',
              { className: 'la-msg__actions' },
              stream.requestId
                ? h(Button, { size: 'sm', variant: 'secondary', icon: 'refresh', onClick: () => props.onRetry(stream.requestId) }, t('loop.chat.retry'))
                : stream.sentText
                  ? h(
                      Button,
                      {
                        size: 'sm',
                        variant: 'secondary',
                        icon: 'refresh',
                        onClick: () => props.onResend(stream.sentText),
                      },
                      t('loop.chat.retry'),
                    )
                  : null,
              h('button', { type: 'button', className: 'la-linkbtn', onClick: () => props.onDismissError() }, t('loop.common.dismiss')),
            ),
          )
        : null,
    ),
    subject
      ? h(
          'div',
          { className: 'la-chat__composer' },
          h('textarea', {
            className: 'la-textarea la-chat__input',
            rows: 3,
            value: draft,
            placeholder: t('loop.chat.placeholder'),
            'aria-label': t('loop.chat.placeholder'),
            disabled: !modelAvailable,
            onChange: (event) => {
              setDraft(event.target.value)
              if (props.onDraftChange) props.onDraftChange(event.target.value)
            },
            onKeyDown: (event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            },
          }),
          h(
            'div',
            { className: 'la-chat__actions' },
            h('span', { className: 'la-chat__hint la-muted' }, t('loop.chat.draftHint')),
            streaming
              ? h(
                  Button,
                  {
                    variant: 'danger',
                    size: 'sm',
                    icon: 'stop',
                    loading: stream.phase === 'stopping',
                    onClick: () => props.onStop(),
                  },
                  stream.phase === 'stopping' ? t('loop.chat.stopping') : t('loop.chat.stop'),
                )
              : h(
                  Button,
                  {
                    variant: 'primary',
                    size: 'sm',
                    icon: 'send',
                    disabled: !draft.trim() || !modelAvailable,
                    onClick: submit,
                  },
                  t('loop.chat.send'),
                ),
          ),
          h(
            'p',
            { className: 'la-chat__footnote' },
            t('loop.chat.subjectNote'),
          ),
        )
      : null,
  )
}
