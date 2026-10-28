/**
 * 左侧单元目录（200—224px，可折叠）。点单元进入其入口节点。
 */

import { IconButton, Tag } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { groupStats } from '../model.js'
import { classNames } from '../util.js'

export function Directory(props) {
  const t = props.t
  const ci = props.ci
  const store = props.store
  const activeGroupId = props.activeGroupId
  return h(
    'nav',
    { className: classNames('la-dir', props.className), 'aria-label': t('loop.dir.title') },
    h(
      'div',
      { className: 'la-dir__head' },
      h('h2', { className: 'la-dir__title' }, t('loop.dir.title')),
      h(IconButton, {
        icon: props.narrow ? 'close' : 'collapseLeft',
        label: t('loop.dir.collapse'),
        onClick: props.onCollapse,
      }),
    ),
    h(
      'button',
      {
        type: 'button',
        className: classNames('la-dir__overview', props.view.scale === 'domain' && 'is-active'),
        onClick: props.onOpenDomain,
        'aria-pressed': props.view.scale === 'domain',
      },
      h(Icon, { name: 'target', size: 16 }),
      h('span', null, t('loop.dir.overview')),
    ),
    h(
      'ul',
      { className: 'la-dir__list' },
      ci.groups.map((group, index) => {
        const stats = groupStats(ci, group.id, store)
        const active = group.id === activeGroupId
        const entry = group.entryNodeId ? ci.nodesById.get(group.entryNodeId) : null
        return h(
          'li',
          { key: group.id },
          h(
            'button',
            {
              type: 'button',
              className: classNames('la-dir__item', active && 'is-active'),
              onClick: () => props.onSelectGroup(group),
              'aria-current': active ? 'true' : undefined,
              title: `${group.title} · ${t('loop.domain.question')}：${group.question}`,
            },
            h('span', { className: 'la-dir__index' }, String(group.order || index + 1).padStart(2, '0')),
            h(
              'span',
              { className: 'la-dir__text' },
              h('span', { className: 'la-dir__name' }, group.title),
              group.question ? h('span', { className: 'la-dir__question' }, group.question) : null,
              h(
                'span',
                { className: 'la-dir__meta' },
                t('loop.domain.concepts', { count: stats.nodes }),
                stats.notes ? ` · ${t('loop.dir.notes', { count: stats.notes })}` : '',
              ),
            ),
            active ? h(Tag, { tone: 'accent' }, t('loop.dir.current')) : null,
          ),
        )
      }),
    ),
    h(
      'div',
      { className: 'la-dir__foot' },
      h(
        'p',
        { className: 'la-dir__footline' },
        `v${ci.version || '—'} · ${ci.nodes.length} ${t('loop.search.node')} · ${ci.relations.length} ${t('loop.search.relation')}`,
      ),
    ),
  )
}
