/**
 * 领域尺度：8 个单元卡片，显示 title + question + 能力目标（不是节点数为主）。
 */

import { Tag } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { groupStats } from '../model.js'

export function DomainScale(props) {
  const t = props.t
  const ci = props.ci
  const store = props.store
  const recommendedGroupId = props.recommendedGroupId
  if (!ci.groups.length) {
    return h('div', { className: 'la-scale la-scale--domain' }, h('p', { className: 'la-muted' }, t('loop.subject.empty')))
  }
  return h(
    'section',
    { className: 'la-scale la-scale--domain', 'aria-label': t('loop.scale.domain') },
    h(
      'div',
      { className: 'la-scalehead' },
      h('h2', { className: 'la-scalehead__title' }, t('loop.scale.domain')),
      h('p', { className: 'la-scalehead__hint' }, t('loop.domain.intro')),
    ),
    h(
      'div',
      { className: 'la-domaingrid' },
      ci.groups.map((group, index) => {
        const stats = groupStats(ci, group.id, store)
        const entry = group.entryNodeId ? ci.nodesById.get(group.entryNodeId) : null
        const recommended = group.id === recommendedGroupId
        return h(
          'button',
          {
            key: group.id,
            type: 'button',
            className: `la-domaincard ${recommended ? 'is-recommended' : ''}`.trim(),
            onClick: () => props.onEnterGroup(group),
            'aria-label': t('loop.domain.openUnit', { title: group.title }),
          },
          h(
            'span',
            { className: 'la-domaincard__top' },
            h('span', { className: 'la-domaincard__index' }, String(group.order || index + 1).padStart(2, '0')),
            recommended ? h(Tag, { tone: 'accent' }, t('loop.domain.recommended')) : null,
          ),
          h('span', { className: 'la-domaincard__title' }, group.title),
          group.question
            ? h(
                'span',
                { className: 'la-domaincard__row' },
                h('span', { className: 'la-domaincard__label' }, t('loop.domain.question')),
                h('span', { className: 'la-domaincard__question' }, group.question),
              )
            : null,
          group.capability
            ? h(
                'span',
                { className: 'la-domaincard__row' },
                h('span', { className: 'la-domaincard__label' }, t('loop.domain.capability')),
                h('span', { className: 'la-domaincard__capability' }, group.capability),
              )
            : null,
          h(
            'span',
            { className: 'la-domaincard__foot' },
            h(
              'span',
              { className: 'la-domaincard__entry' },
              h(Icon, { name: 'arrowRight', size: 14 }),
              entry ? `${t('loop.dir.entry')}：${entry.title}` : t('loop.dir.overview'),
            ),
            h(
              'span',
              { className: 'la-domaincard__stats' },
              t('loop.domain.concepts', { count: stats.nodes }),
              stats.notes ? ` · ${t('loop.dir.notes', { count: stats.notes })}` : '',
            ),
          ),
        )
      }),
    ),
  )
}
