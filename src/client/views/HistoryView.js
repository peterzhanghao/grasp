/**
 * 历史视角：按 eraStart/eraEnd 排列；时间不确定单列一条带；没有资料就显示缺口与检索路径。
 * 不编年表：只展示内容包里有 era 依据的节点与带年份的来源。
 */

import { Tag } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { EmptyState } from '../components/primitives.js'
import { nodeEraLabel, nodeKindLabel, historyForSubject } from '../model.js'
import { GapList } from './shared.js'
import { truncate } from '../util.js'

function yearText(entry) {
  const { node } = entry
  const era = nodeEraLabel(node)
  return era.text || ''
}

export function HistoryView(props) {
  const t = props.t
  const ci = props.ci
  const subject = props.subject
  const data = historyForSubject(ci, subject, 16)
  const hasAny = data.known.length || data.unknown.length || data.sources.length
  return h(
    'section',
    { className: 'la-projection la-projection--history', 'aria-label': t('loop.projection.history') },
    h(
      'div',
      { className: 'la-projection__head' },
      h('h2', { className: 'la-projection__title' }, t('loop.history.title')),
      h('p', { className: 'la-projection__hint' }, t('loop.history.unknownHint')),
    ),
    !hasAny
      ? h(EmptyState, { icon: 'clock', title: t('loop.history.empty') })
      : h(
          'div',
          { className: 'la-timeline' },
          data.known.length
            ? h(
                'ol',
                { className: 'la-timeline__list' },
                data.known.map((entry) => {
                  const era = nodeEraLabel(entry.node)
                  return h(
                    'li',
                    { key: entry.node.id, className: 'la-timeline__item' },
                    h('span', { className: 'la-timeline__year' }, yearText(entry)),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'la-timeline__node',
                        onClick: () => props.onSelectNode(entry.node.id),
                        'aria-label': `${entry.node.title} · ${era.text}`,
                      },
                      h('span', { className: 'la-timeline__nodetitle' }, entry.node.title),
                      h(
                        'span',
                        { className: 'la-timeline__nodemeta' },
                        nodeKindLabel(t, entry.node.kind),
                        ' · ',
                        truncate(entry.node.def || entry.node.hist || '', 80),
                      ),
                    ),
                  )
                }),
              )
            : null,
          data.sources.length
            ? h(
                'div',
                { className: 'la-works' },
                h('h3', { className: 'la-works__title' }, t('loop.history.work')),
                h(
                  'ul',
                  { className: 'la-works__list' },
                  data.sources.map((entry) =>
                    h(
                      'li',
                      { key: entry.source.id },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'la-works__item',
                          onClick: () => props.onOpenSource(entry.source),
                          title: entry.source.title,
                        },
                        h('span', { className: 'la-works__year' }, entry.source.year || t('loop.history.yearUnknown')),
                        h('span', { className: 'la-works__main' }, entry.source.title),
                        h('span', { className: 'la-works__node' }, entry.node ? entry.node.title : ''),
                      ),
                    ),
                  ),
                ),
              )
            : null,
          data.unknown.length
            ? h(
                'div',
                { className: 'la-unknownband' },
                h(
                  'div',
                  { className: 'la-unknownband__head' },
                  h(Tag, { tone: 'warn' }, t('loop.history.unknown')),
                  h('span', { className: 'la-muted' }, t('loop.history.unknownHint')),
                ),
                h(
                  'ul',
                  { className: 'la-unknownband__list' },
                  data.unknown.map((entry) =>
                    h(
                      'li',
                      { key: entry.node.id },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'la-unknownband__node',
                          onClick: () => props.onSelectNode(entry.node.id),
                        },
                        h(Icon, { name: 'clock', size: 14 }),
                        h('span', null, entry.node.title),
                        h('span', { className: 'la-muted' }, entry.node.era || t('loop.subject.eraUnknown')),
                      ),
                    ),
                  ),
                ),
              )
            : null,
          h(GapList, { t, gaps: data.gaps }),
        ),
  )
}
