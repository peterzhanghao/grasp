/**
 * 列表替代视图：图谱的无障碍替代（可搜索、键盘可选节点/关系）。
 */

const { useMemo, useState } = React

import { Tag } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { nodeEraLabel, nodeKindLabel, relationTypeLabel, relationsForNode, searchContent } from '../model.js'
import { classNames, truncate } from '../util.js'

export function SubjectList(props) {
  const t = props.t
  const ci = props.ci
  const center = props.center
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const nodeEntries = useMemo(() => {
    if (trimmed) return searchContent(ci, trimmed, 30).nodes.map((node) => ({ node, source: 'search' }))
    const seen = new Set()
    const out = []
    const push = (node, source) => {
      if (!node || seen.has(node.id)) return
      seen.add(node.id)
      out.push({ node, source })
    }
    push(center, 'center')
    for (const neighbor of props.neighbors || []) push(neighbor.node, 'neighbor')
    for (const node of (center && center.groupId && ci.nodesByGroup.get(center.groupId)) || []) push(node, 'group')
    for (const node of ci.nodes) push(node, 'all')
    return out
  }, [ci, center, props.neighbors, trimmed])

  const relationEntries = useMemo(() => {
    if (trimmed) {
      return searchContent(ci, trimmed, 30).relations.map((entry) => ({ relation: entry.relation, from: entry.from, to: entry.to }))
    }
    if (!center) return []
    const visible = new Set([center.id])
    for (const neighbor of props.neighbors || []) visible.add(neighbor.node.id)
    const seen = new Set()
    const out = []
    for (const relation of relationsForNode(ci, center.id)) {
      if (seen.has(relation.id)) continue
      seen.add(relation.id)
      out.push({ relation, from: ci.nodesById.get(relation.from), to: ci.nodesById.get(relation.to) })
    }
    for (const relation of ci.relations) {
      if (seen.has(relation.id)) continue
      if (visible.has(relation.from) && visible.has(relation.to)) {
        seen.add(relation.id)
        out.push({ relation, from: ci.nodesById.get(relation.from), to: ci.nodesById.get(relation.to) })
      }
    }
    return out
  }, [ci, center, props.neighbors, trimmed])

  return h(
    'div',
    { className: 'la-listview', 'aria-label': t('loop.a11y.list') },
    h(
      'div',
      { className: 'la-listview__filter' },
      h(Icon, { name: 'search', size: 16 }),
      h('input', {
        className: 'la-input',
        type: 'search',
        value: query,
        placeholder: t('loop.list.filter'),
        'aria-label': t('loop.list.filter'),
        onChange: (event) => setQuery(event.target.value),
      }),
    ),
    h(
      'div',
      { className: 'la-listview__columns' },
      h(
        'section',
        { className: 'la-listview__column', 'aria-label': t('loop.list.nodes') },
        h('h3', { className: 'la-listview__title' }, `${t('loop.list.nodes')} · ${nodeEntries.length}`),
        h(
          'ul',
          { className: 'la-listview__list' },
          nodeEntries.map(({ node, source }) => {
            const era = nodeEraLabel(node)
            return h(
              'li',
              { key: node.id },
              h(
                'button',
                {
                  type: 'button',
                  className: classNames(
                    'la-listrow',
                    props.selectedNodeId === node.id && center && node.id === center.id && 'is-current',
                  ),
                  onClick: () => props.onSelectNode(node.id),
                  'aria-current': center && node.id === center.id ? 'true' : undefined,
                },
                h(
                  'span',
                  { className: 'la-listrow__main' },
                  h('span', { className: 'la-listrow__title' }, node.title),
                  h('span', { className: 'la-listrow__sub' }, truncate(node.def || node.mech || '', 70)),
                ),
                h(
                  'span',
                  { className: 'la-listrow__side' },
                  source === 'neighbor' ? h(Tag, { tone: 'accent' }, t('loop.list.relations')) : null,
                  h('span', { className: 'la-listrow__kind' }, nodeKindLabel(t, node.kind)),
                  era.text ? h('span', { className: 'la-listrow__era' }, era.uncertain ? t('loop.subject.eraUnknown') : era.text) : null,
                ),
              ),
            )
          }),
        ),
      ),
      h(
        'section',
        { className: 'la-listview__column', 'aria-label': t('loop.list.relations') },
        h('h3', { className: 'la-listview__title' }, `${t('loop.list.relations')} · ${relationEntries.length}`),
        h(
          'ul',
          { className: 'la-listview__list' },
          relationEntries.map(({ relation, from, to }) =>
            h(
              'li',
              { key: relation.id },
              h(
                'button',
                {
                  type: 'button',
                  className: classNames('la-listrow', props.selectedRelationId === relation.id && 'is-selected'),
                  onClick: () => props.onSelectRelation(relation.id),
                  'aria-pressed': props.selectedRelationId === relation.id,
                },
                h(
                  'span',
                  { className: 'la-listrow__main' },
                  h(
                    'span',
                    { className: 'la-listrow__title' },
                    `${from ? from.title : relation.from} → ${to ? to.title : relation.to}`,
                  ),
                  h('span', { className: 'la-listrow__sub' }, truncate(relation.claim || relation.condition || '', 80)),
                ),
                h(
                  'span',
                  { className: 'la-listrow__side' },
                  h(Tag, { tone: 'neutral' }, relationTypeLabel(t, relation.type)),
                ),
              ),
            ),
          ),
          !relationEntries.length ? h('li', { className: 'la-muted' }, t('loop.list.empty')) : null,
        ),
      ),
    ),
    !nodeEntries.length ? h('p', { className: 'la-muted' }, t('loop.list.empty')) : null,
  )
}
