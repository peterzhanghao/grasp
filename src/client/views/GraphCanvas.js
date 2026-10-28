/**
 * 问题尺度图谱画布：HTML 节点（屏幕 px 绝对定位）+ SVG 连线（同 px 坐标，不缩放整图）。
 * 关系标签是可点击、可 Tab 的按钮；连线同样可点。
 */

const { useMemo } = React

import { layoutSubjectGraph, relationZone } from '../layout/graph.js'
import { relationTypeLabel, nodeKindLabel, nodeEraLabel } from '../model.js'
import { nextLocalId } from '../state/hooks.js'
import { classNames, truncate } from '../util.js'

const DASHED_TYPES = new Set(['historical', 'analogy', 'parallel'])

export function GraphCanvas(props) {
  const t = props.t
  const center = props.center
  const neighbors = props.neighbors || []
  const width = props.width || 820
  const height = props.height || 540
  const markerId = useMemo(() => nextLocalId('la-arrow'), [])
  const layout = useMemo(
    () => layoutSubjectGraph({ center, neighbors, width, height }),
    [center, neighbors, width, height],
  )
  const zones = useMemo(() => {
    const set = new Set()
    for (const neighbor of neighbors) set.add(relationZone(neighbor))
    return set
  }, [neighbors])

  if (!center) return null

  return h(
    'div',
    {
      className: classNames('la-canvas', layout.stacked && 'is-stacked'),
      role: 'group',
      'aria-label': t('loop.a11y.graph'),
      style: layout.stacked ? { height: `${layout.height}px`, minHeight: `${layout.height}px` } : undefined,
    },
    h(
      'svg',
      {
        className: 'la-canvas__svg',
        width: layout.width,
        height: layout.height,
        viewBox: `0 0 ${layout.width} ${layout.height}`,
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h(
        'defs',
        null,
        h(
          'marker',
          {
            id: markerId,
            viewBox: '0 0 10 10',
            refX: 9,
            refY: 5,
            markerWidth: 7,
            markerHeight: 7,
            orient: 'auto-start-reverse',
          },
          h('path', { d: 'M 0 1 L 9 5 L 0 9 z', className: 'la-canvas__arrow' }),
        ),
      ),
      layout.edges.map((edge) => {
        const selected = props.selectedRelationId === edge.relation.id
        const dashed = DASHED_TYPES.has(edge.relation.type)
        return h(
          'g',
          { key: edge.relation.id, className: classNames('la-edgegroup', selected && 'is-selected') },
          h('path', {
            className: 'la-edge__hit',
            d: edge.path,
            onClick: (event) => {
              event.stopPropagation()
              props.onSelectRelation(edge.relation.id)
            },
          }),
          h('path', {
            className: classNames('la-edge', `la-edge--${edge.relation.type}`, selected && 'is-selected'),
            d: edge.path,
            strokeDasharray: dashed ? (edge.relation.type === 'historical' ? '2 7' : '6 5') : undefined,
            markerEnd: edge.direction === 'out' ? `url(#${markerId})` : undefined,
            markerStart: edge.direction === 'in' ? `url(#${markerId})` : undefined,
          }),
        )
      }),
      zones.has('prereq')
        ? h('text', { className: 'la-zone__label', x: 14, y: 20 }, t('loop.theory.prereq'))
        : null,
      zones.has('downstream')
        ? h('text', { className: 'la-zone__label', x: layout.width - 14, y: 20, textAnchor: 'end' }, t('loop.theory.tradeoff'))
        : null,
      zones.has('context')
        ? h('text', { className: 'la-zone__label', x: 14, y: layout.height - 52 }, t('loop.theory.historical'))
        : null,
    ),
    layout.nodes.map((entry) => {
      const node = entry.node
      const era = nodeEraLabel(node)
      const isCenter = entry.isCenter
      const kind = nodeKindLabel(t, node.kind)
      const relationsCount = props.relationCountFor ? props.relationCountFor(node.id) : 0
      return h(
        'button',
        {
          key: node.id,
          type: 'button',
          className: classNames(
            'la-gnode',
            isCenter ? 'la-gnode--center' : 'la-gnode--neighbor',
            props.selectedNodeId === node.id && 'is-selected',
          ),
          style: {
            left: `${entry.x}px`,
            top: `${entry.y}px`,
            width: `${entry.size.width}px`,
            height: `${entry.size.height}px`,
            transform: 'translate(-50%, -50%)',
          },
          onClick: () => props.onSelectNode(node.id),
          'aria-current': isCenter ? 'true' : undefined,
          'aria-label': `${isCenter ? t('loop.a11y.current') + '：' : ''}${node.title}${era.text ? ` · ${era.text}` : ''} · ${kind}`,
          title: node.def || node.title,
        },
        h(
          'span',
          { className: 'la-gnode__top' },
          h('span', { className: 'la-gnode__kind' }, kind),
          isCenter ? null : h('span', { className: 'la-gnode__era' }, era.uncertain ? t('loop.subject.eraUnknown') : era.text),
          relationshipsBadge(h, relationsCount),
        ),
        h('span', { className: 'la-gnode__title' }, node.title),
        isCenter
          ? h('span', { className: 'la-gnode__def' }, truncate(node.def || node.mech || node.can || '', 54))
          : null,
      )
    }),
    layout.labelNodes.map((label) => {
      const selected = props.selectedRelationId === label.relation.id
      const arrow = label.direction === 'out' ? '→' : '←'
      return h(
        'button',
        {
          key: `label:${label.relation.id}`,
          type: 'button',
          className: classNames('la-relchip', `la-relchip--${label.relation.type}`, selected && 'is-selected'),
          style: { left: `${label.x}px`, top: `${label.y}px`, transform: 'translate(-50%, -50%)' },
          onClick: (event) => {
            event.stopPropagation()
            props.onSelectRelation(label.relation.id)
          },
          'aria-pressed': selected,
          'aria-label': t('loop.a11y.relation', {
            type: relationTypeLabel(t, label.relation.type),
            from: props.nodeTitle(label.relation.from),
            to: props.nodeTitle(label.relation.to),
          }),
          title: label.relation.claim || relationTypeLabel(t, label.relation.type),
        },
        h('span', { className: 'la-relchip__type' }, relationTypeLabel(t, label.relation.type)),
        h('span', { className: 'la-relchip__arrow', 'aria-hidden': 'true' }, arrow),
      )
    }),
    !neighbors.length
      ? h(
          'div',
          { className: 'la-canvas__empty' },
          h('p', { className: 'la-empty__title' }, t('loop.subject.neighborsEmpty')),
        )
      : null,
  )
}

function relationshipsBadge(h, count) {
  if (!count) return null
  return h('span', { className: 'la-gnode__count', 'aria-hidden': 'true' }, String(count))
}
