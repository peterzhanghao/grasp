/**
 * 来源详情：标题/作者/年份/出处/URL/DOI/核验程度/检索路径。
 * 不能打开原文就保留 unverified，不编造页码与引文。
 */

import { Dialog } from '../components/Dialog.js'
import { Button, Tag, FieldLabel } from '../components/primitives.js'
import { verifiedLabel } from '../model.js'
import { sourceVerifiedTone } from './shared.js'

export function SourceDialog(props) {
  const t = props.t
  const source = props.source
  if (!source) return null
  const copyCitation = () => {
    const citation = [source.author, source.title, source.ref || '', source.year || '', source.url || source.doi || '']
      .filter(Boolean)
      .join(' · ')
    if (props.onCopy) props.onCopy(citation)
  }
  return h(
    Dialog,
    {
      open: props.open,
      onClose: props.onClose,
      title: source.title,
      description: [source.author, source.year, source.kind].filter(Boolean).join(' · '),
      size: 'sm',
      closeLabel: t('loop.common.close'),
      footer: h(
        'div',
        { className: 'la-dialog__actions' },
        h(Button, { variant: 'ghost', icon: 'copy', onClick: copyCitation }, t('loop.common.copy')),
        h(Button, { variant: 'secondary', onClick: props.onClose }, t('loop.common.close')),
      ),
    },
    h(
      'dl',
      { className: 'la-sourcedetail' },
      h('div', { className: 'la-sourcedetail__row' }, h('dt', null, t('loop.relation.verified.verified')), h('dd', null, h(Tag, { tone: sourceVerifiedTone(source.verified) }, verifiedLabel(t, source.verified)))),
      source.ref ? h('div', { className: 'la-sourcedetail__row' }, h('dt', null, t('loop.subject.sources')), h('dd', null, source.ref)) : null,
      source.url
        ? h(
            'div',
            { className: 'la-sourcedetail__row' },
            h('dt', null, 'URL'),
            h(
              'dd',
              null,
              h('a', { className: 'la-link', href: source.url, target: '_blank', rel: 'noreferrer noopener' }, source.url),
            ),
          )
        : null,
      source.doi ? h('div', { className: 'la-sourcedetail__row' }, h('dt', null, 'DOI'), h('dd', null, source.doi)) : null,
      source.verifiedAt ? h('div', { className: 'la-sourcedetail__row' }, h('dt', null, t('loop.exp.recordedAt')), h('dd', null, source.verifiedAt)) : null,
      source.note ? h('div', { className: 'la-sourcedetail__row' }, h('dt', null, t('loop.res.notices')), h('dd', null, source.note)) : null,
      source.legacy ? h('p', { className: 'la-hintwarn' }, t('loop.note.legacyHint')) : null,
    ),
  )
}
