/**
 * 当前节点档案（阅读面）：定义/机制/边界/反例/检验/历史/迁移/主张来源/关系列表。
 * 正文阅读宽度由 CSS 控制在约 34—42 个汉字。
 */

const { useMemo } = React

import { Button, Tag, EmptyState } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { Collapsible } from './shared.js'
import { ClaimList, SourceList } from './Claims.js'
import { claimsForIds, migrateTypeLabel, nodeEraLabel, nodeKindLabel, relationsForNode, relationTypeLabel, sourcesForNode, sourcesForClaims } from '../model.js'

const TEXT_FIELDS = ['can', 'mech', 'limits', 'counter', 'check', 'hist']

export function NodeDossier(props) {
  const t = props.t
  const ci = props.ci
  const node = props.node
  const noteCount = (props.notes || []).length
  const claims = useMemo(() => claimsForIds(ci, node ? node.claimIds : []), [ci, node])
  const claimSources = useMemo(() => sourcesForClaims(ci, claims), [ci, claims])
  const directSources = useMemo(() => (node ? sourcesForNode(ci, node) : []), [ci, node])
  const relations = useMemo(() => (node ? relationsForNode(ci, node.id) : []), [ci, node])
  const era = nodeEraLabel(node)
  const group = node && node.groupId ? ci.groupsById.get(node.groupId) : null
  if (!node) return h(EmptyState, { icon: 'graph', title: t('loop.subject.current') })

  return h(
    'section',
    { className: 'la-dossier', 'aria-label': t('loop.subject.current') },
    h(
      'div',
      { className: 'la-dossier__head' },
      h(
        'div',
        { className: 'la-dossier__kicker' },
        h(Tag, { tone: 'neutral' }, nodeKindLabel(t, node.kind)),
        node.era || era.text
          ? h('span', { className: 'la-dossier__era' }, era.uncertain ? t('loop.subject.eraUnknown') : era.text)
          : null,
        group ? h('span', { className: 'la-dossier__group' }, group.title) : null,
      ),
      h('h2', { className: 'la-dossier__title' }, node.title),
      node.def ? h('p', { className: 'la-dossier__lead' }, node.def) : null,
    ),
    h(
      'div',
      { className: 'la-dossier__actions' },
      h(Button, { variant: 'primary', icon: 'flask', onClick: () => props.onViewEvidence() }, t('loop.subject.viewEvidence')),
      h(Button, { variant: 'ghost', icon: 'notes', onClick: () => props.onOpenNotes() }, t('loop.subject.notesCount', { count: noteCount })),
      h(Button, { variant: 'ghost', icon: 'chat', onClick: () => props.onAsk() }, t('loop.relation.ask')),
    ),
    h(
      'div',
      { className: 'la-dossier__fields' },
      TEXT_FIELDS.filter((field) => node[field]).map((field) =>
        h(
          'div',
          { key: field, className: 'la-dossier__field' },
          h('h3', { className: 'la-dossier__label' }, t(`loop.subject.${field}`)),
          h('p', { className: 'la-dossier__text' }, node[field]),
        ),
      ),
      node.migrate
        ? h(
            'div',
            { className: 'la-dossier__field' },
            h('h3', { className: 'la-dossier__label' }, t('loop.subject.migrate')),
            h('p', { className: 'la-dossier__text' }, node.migrate),
            h(
              'p',
              { className: 'la-dossier__note' },
              h(Tag, { tone: 'warn' }, migrateTypeLabel(t, node.migrateType)),
              t('loop.practice.caveat'),
            ),
          )
        : null,
    ),
    claims.length
      ? h(
          'div',
          { className: 'la-dossier__claims' },
          h('h3', { className: 'la-dossier__label' }, t('loop.subject.claims')),
          h(ClaimList, { t, claims, ci, onOpenSource: props.onOpenSource }),
        )
      : directSources.length
        ? h(
            'div',
            { className: 'la-dossier__claims' },
            h('h3', { className: 'la-dossier__label' }, t('loop.subject.sources')),
            h(SourceList, { t, sources: directSources, onOpenSource: props.onOpenSource }),
          )
        : h(
            'div',
            { className: 'la-dossier__claims' },
            h('h3', { className: 'la-dossier__label' }, t('loop.subject.sources')),
            h('p', { className: 'la-muted' }, t('loop.relation.noClaims')),
          ),
    relations.length
      ? h(Collapsible, { title: `${t('loop.subject.relationsCount', { count: relations.length })}`, defaultOpen: true },
          h(
            'ul',
            { className: 'la-relationlist' },
            relations.map((relation) => {
              const from = ci.nodesById.get(relation.from)
              const to = ci.nodesById.get(relation.to)
              return h(
                'li',
                { key: relation.id },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'la-relationlist__item',
                    onClick: () => props.onSelectRelation(relation.id),
                  },
                  h(Tag, { tone: 'neutral' }, relationTypeLabel(t, relation.type)),
                  h('span', { className: 'la-relationlist__route' }, `${from ? from.title : relation.from} → ${to ? to.title : relation.to}`),
                  h('span', { className: 'la-relationlist__claim' }, relation.claim || relation.condition || ''),
                  h(Icon, { name: 'arrowRight', size: 14 }),
                ),
              )
            }),
          ),
        )
      : null,
  )
}
