/**
 * 主张与来源的只读列表：所有来源都可点开（弹层展示核验程度、URL/DOI、检索路径）。
 */

const { useState } = React

import { Tag } from '../components/primitives.js'
import { claimKindLabel, verifiedLabel } from '../model.js'
import { sourceVerifiedTone, MetaLine } from './shared.js'

export function SourceRow(props) {
  const source = props.source
  if (!source) return null
  return h(
    'li',
    { className: 'la-sourcelist__item' },
    h(
      'button',
      {
        type: 'button',
        className: 'la-sourcerow',
        onClick: () => props.onOpenSource && props.onOpenSource(source),
        title: source.title,
      },
      h(
        'span',
        { className: 'la-sourcerow__main' },
        h('span', { className: 'la-sourcerow__title' }, source.title),
        h(MetaLine, {
          className: 'la-sourcerow__meta',
          items: [source.author, source.year, source.ref || source.kind],
        }),
      ),
      h(Tag, { tone: sourceVerifiedTone(source.verified) }, verifiedLabel(props.t, source.verified)),
    ),
  )
}

export function SourceList(props) {
  const sources = props.sources || []
  if (!sources.length) {
    return props.emptyText ? h('p', { className: 'la-muted' }, props.emptyText) : null
  }
  return h(
    'ul',
    { className: `la-sourcelist ${props.className || ''}`.trim() },
    sources.map((source) => h(SourceRow, { key: source.id, source, t: props.t, onOpenSource: props.onOpenSource })),
  )
}

export function ClaimList(props) {
  const claims = props.claims || []
  const ci = props.ci
  if (!claims.length) {
    return h('p', { className: 'la-muted' }, props.emptyText || props.t('loop.relation.noClaims'))
  }
  return h(
    'div',
    { className: `la-claims ${props.className || ''}`.trim() },
    claims.map((claim) => {
      const sources = (claim.sourceIds || [])
        .map((id) => (ci && ci.sourcesById ? ci.sourcesById.get(id) : null))
        .filter(Boolean)
      return h(
        'div',
        { key: claim.id, className: 'la-claim' },
        h(
          'div',
          { className: 'la-claim__head' },
          h(Tag, { tone: 'neutral' }, claimKindLabel(props.t, claim.kind)),
          h(Tag, { tone: sourceVerifiedTone(claim.verified) }, verifiedLabel(props.t, claim.verified)),
        ),
        h('p', { className: 'la-claim__text' }, claim.text),
        h(SourceList, { t: props.t, sources, onOpenSource: props.onOpenSource }),
      )
    }),
  )
}
