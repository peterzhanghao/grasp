/**
 * 实践视角：目标→上下文→行动→观测→验收→修订 的工作回路布局（按 practiceStages）。
 * 只放工程机制；历史类比明确标注不是同一机制。
 */

import { Tag } from '../components/primitives.js'
import { EmptyState } from '../components/primitives.js'
import { nodeKindLabel, practiceForSubject } from '../model.js'
import { classNames } from '../util.js'

export function PracticeView(props) {
  const t = props.t
  const ci = props.ci
  const subject = props.subject
  const data = practiceForSubject(ci, subject)
  const hasNodes = data.stages.some((stage) => stage.nodes.length)
  return h(
    'section',
    { className: 'la-projection la-projection--practice', 'aria-label': t('loop.projection.practice') },
    h(
      'div',
      { className: 'la-projection__head' },
      h('h2', { className: 'la-projection__title' }, t('loop.practice.title')),
      h('p', { className: 'la-projection__hint' }, t('loop.practice.stageHint')),
    ),
    !hasNodes
      ? h(EmptyState, { icon: 'target', title: t('loop.practice.empty') })
      : h(
          'div',
          { className: 'la-practice' },
          data.stages.map((stage, index) =>
            h(
              'section',
              { key: stage.stage, className: 'la-practice__stage', 'aria-label': t(`loop.practice.${stage.stage}`) },
              h(
                'h3',
                { className: 'la-practice__stagetitle' },
                h('span', { className: 'la-practice__stageindex', 'aria-hidden': 'true' }, String(index + 1)),
                t(`loop.practice.${stage.stage}`),
              ),
              stage.nodes.length
                ? h(
                    'ul',
                    { className: 'la-practice__nodes' },
                    stage.nodes.slice(0, 4).map((node) =>
                      h(
                        'li',
                        { key: node.id },
                        h(
                          'button',
                          {
                            type: 'button',
                            className: classNames('la-practice__node', data.centerId === node.id && 'is-current'),
                            onClick: () => props.onSelectNode(node.id),
                            'aria-current': data.centerId === node.id ? 'true' : undefined,
                          },
                          h('span', { className: 'la-practice__nodetitle' }, node.title),
                          h('span', { className: 'la-practice__nodemeta' }, nodeKindLabel(t, node.kind)),
                        ),
                      ),
                    ),
                    stage.nodes.length > 4
                      ? h('li', { className: 'la-practice__more la-muted' }, `+${stage.nodes.length - 4}`)
                      : null,
                  )
                : h('p', { className: 'la-practice__empty' }, '—'),
            ),
          ),
        ),
    data.unmapped.length
      ? h(
          'div',
          { className: 'la-practice__unmapped' },
          h(Tag, { tone: 'neutral' }, t('loop.practice.other')),
          data.unmapped.map((node) =>
            h(
              'button',
              { key: node.id, type: 'button', className: 'la-chip', onClick: () => props.onSelectNode(node.id) },
              node.title,
            ),
          ),
        )
      : null,
    h('p', { className: 'la-projection__foot' }, t('loop.practice.caveat')),
  )
}
