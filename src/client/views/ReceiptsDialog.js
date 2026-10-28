/**
 * 回执与提示：最近写操作的真实回执（含 code）与数据迁移提示。
 */

import { Dialog } from '../components/Dialog.js'
import { Button, EmptyState, FieldLabel } from '../components/primitives.js'
import { formatTime } from '../util.js'

export function ReceiptsDialog(props) {
  const t = props.t
  const receipts = props.receipts || []
  const notices = props.notices || []
  return h(
    Dialog,
    {
      open: props.open,
      onClose: props.onClose,
      title: t('loop.status.receipts'),
      description: t('loop.status.receiptFromHost'),
      size: 'md',
      closeLabel: t('loop.common.close'),
      footer: h(
        'div',
        { className: 'la-dialog__actions' },
        receipts.length ? h(Button, { variant: 'ghost', onClick: props.onClear }, t('loop.status.dismiss')) : null,
        h(Button, { variant: 'secondary', onClick: props.onClose }, t('loop.common.close')),
      ),
    },
    h(
      'div',
      { className: 'la-receipts' },
      notices.length
        ? h(
            'section',
            { className: 'la-receipts__block' },
            h(FieldLabel, null, t('loop.res.notices')),
            notices.map((notice, index) =>
              h(
                'p',
                { key: index, className: `la-receipt la-receipt--${notice.level === 'warn' ? 'warn' : 'info'}` },
                h('span', { className: 'la-receipt__kind' }, notice.level === 'warn' ? t('loop.status.warning') : t('loop.status.notice')),
                h('span', null, notice.text || JSON.stringify(notice)),
              ),
            ),
          )
        : null,
      !receipts.length && !notices.length ? h(EmptyState, { icon: 'info', title: t('loop.status.noReceipts') }) : null,
      receipts.length
        ? h(
            'ul',
            { className: 'la-receipts__list' },
            receipts.map((receipt) =>
              h(
                'li',
                { key: receipt.id, className: `la-receipt la-receipt--${receipt.kind}` },
                h(
                  'span',
                  { className: 'la-receipt__kind' },
                  receipt.kind === 'ok'
                    ? t('loop.status.ok')
                    : receipt.kind === 'error'
                      ? t('loop.status.error')
                      : t('loop.status.notice'),
                ),
                h('span', { className: 'la-receipt__text' }, receipt.text),
                receipt.code ? h('span', { className: 'la-receipt__code' }, receipt.code) : null,
                h('span', { className: 'la-receipt__time' }, formatTime(receipt.at)),
              ),
            ),
          )
        : null,
    ),
  )
}
