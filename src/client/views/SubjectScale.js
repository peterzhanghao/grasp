/**
 * 问题尺度（默认工作视图）：当前节点 + 3—7 个相关邻居。
 * 宽屏：上方图谱/投影，下方节点档案；窄屏：图/阅读 分段切换。
 */

const { useState } = React

import { Button, Tag, Segmented, EmptyState } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { GraphCanvas } from './GraphCanvas.js'
import { SubjectList } from './SubjectList.js'
import { HistoryView } from './HistoryView.js'
import { PracticeView } from './PracticeView.js'
import { NodeDossier } from './NodeDossier.js'
import { useElementSize } from '../state/hooks.js'
import { classNames } from '../util.js'

export function SubjectScale(props) {
  const t = props.t
  const ci = props.ci
  const view = props.view
  const center = props.center
  const neighbors = props.neighbors
  const totalNeighbors = props.totalNeighbors
  const selectedRelation = props.selectedRelation
  const [listMode, setListMode] = useState(false)
  const [canvasRef, canvasSize] = useElementSize({ width: 0, height: 0 })
  const narrow = props.narrow
  const stage = props.stage

  if (!center) {
    return h(
      'section',
      { className: 'la-scale la-scale--subject' },
      h(EmptyState, {
        icon: 'graph',
        title: t('loop.subject.empty'),
        hint: t('loop.subject.neighborsEmpty'),
      }),
    )
  }

  const showGraph = listMode || !narrow || stage === 'graph'
  const showDossier = !listMode && (!narrow || stage === 'read')
  const group = center.groupId ? ci.groupsById.get(center.groupId) : null

  return h(
    'section',
    { className: classNames('la-scale', 'la-scale--subject', `is-projection-${view.projection}`), 'aria-label': t('loop.scale.subject') },
    h(
      'div',
      { className: 'la-subjecthead' },
      h(
        'div',
        { className: 'la-subjecthead__title' },
        group ? h('span', { className: 'la-subjecthead__group' }, group.title) : null,
        h('h2', { className: 'la-subjecthead__name' }, center.title),
        selectedRelation
          ? h(
              'span',
              { className: 'la-subjecthead__relation' },
              h(Tag, { tone: 'accent' }, t(`loop.relation.type.${selectedRelation.type}`)),
              h(
                'button',
                { type: 'button', className: 'la-linkbtn', onClick: props.onClearRelation },
                t('loop.subject.clearRelation'),
              ),
            )
          : null,
      ),
      h(
        'div',
        { className: 'la-subjecthead__tools' },
        h(
          'span',
          { className: 'la-subjecthead__neighbors' },
          t('loop.subject.neighbors', { count: neighbors.length }),
          totalNeighbors > neighbors.length
            ? ` · ${t('loop.subject.moreNeighbors', { count: totalNeighbors - neighbors.length })}`
            : '',
        ),
        h(Segmented, {
          label: t('loop.list.title'),
          value: listMode ? 'list' : 'graph',
          options: [
            { id: 'graph', label: t('loop.subject.graph') },
            { id: 'list', label: t('loop.subject.list') },
          ],
          onChange: (value) => {
            if (props.onRequestGraph) props.onRequestGraph()
            setListMode(value === 'list')
          },
        }),
      ),
    ),
    showGraph
      ? h(
          'div',
          { className: classNames('la-subjectmain', listMode && 'is-list', narrow && 'is-narrow') },
          listMode
            ? h(SubjectList, {
                t,
                ci,
                center,
                neighbors,
                selectedNodeId: center.id,
                selectedRelationId: view.selectedRelationId,
                onSelectNode: props.onSelectNode,
                onSelectRelation: props.onSelectRelation,
              })
            : view.projection === 'theory'
              ? h(
                  'div',
                  { className: 'la-canvaswrap', ref: canvasRef },
                  h(GraphCanvas, {
                    t,
                    center,
                    neighbors,
                    width: canvasSize.width || 860,
                    height: canvasSize.height || 520,
                    selectedNodeId: center.id,
                    selectedRelationId: view.selectedRelationId,
                    onSelectNode: props.onSelectNode,
                    onSelectRelation: props.onSelectRelation,
                    nodeTitle: (id) => {
                      const node = ci.nodesById.get(id)
                      return node ? node.title : id
                    },
                    relationCountFor: (id) => (ci.relationsByNode.get(id) || []).length,
                  }),
                  neighbors.length
                    ? h('p', { className: 'la-canvas__hint la-muted' }, t('loop.subject.graphHint'))
                    : null,
                )
              : view.projection === 'history'
                ? h(HistoryView, {
                    t,
                    ci,
                    subject: { kind: 'node', id: center.id },
                    onSelectNode: props.onSelectNode,
                    onOpenSource: props.onOpenSource,
                  })
                : h(PracticeView, {
                    t,
                    ci,
                    subject: { kind: 'node', id: center.id },
                    onSelectNode: props.onSelectNode,
                  }),
          showDossier && !narrow ? null : null,
        )
      : null,
    showDossier
      ? h(
          'div',
          { className: classNames('la-readpane', narrow && 'is-narrow') },
          narrow && props.relationInspector
            ? h('div', { className: 'la-readpane__inspector' }, props.relationInspector)
            : null,
          h(NodeDossier, {
            t,
            ci,
            node: center,
            notes: props.notes,
            onOpenSource: props.onOpenSource,
            onViewEvidence: props.onViewEvidence,
            onOpenNotes: props.onOpenNotes,
            onAsk: props.onAsk,
            onSelectRelation: props.onSelectRelation,
          }),
        )
      : null,
  )
}
