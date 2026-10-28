/**
 * 顶栏：品牌、阅读尺度、视角、搜索、继续研究、资料与备份、学习伙伴开关。
 */

const { useState, useRef, useEffect, useMemo, useCallback } = React

import { IconButton, Button, Segmented } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { classNames } from '../util.js'
import { searchContent } from '../model.js'
import { nextLocalId } from '../state/hooks.js'

export function SearchBox(props) {
  const t = props.t
  const ci = props.ci
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listId = useMemo(() => nextLocalId('la-search-list'), [])
  const results = useMemo(() => searchContent(ci, query, 8), [ci, query])
  const flat = useMemo(() => {
    const rows = []
    for (const node of results.nodes) rows.push({ kind: 'node', id: node.id, node })
    for (const relation of results.relations) {
      rows.push({ kind: 'relation', id: relation.relation.id, relation: relation.relation, from: relation.from, to: relation.to })
    }
    return rows
  }, [results])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault()
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const choose = useCallback(
    (row) => {
      if (!row) return
      if (row.kind === 'node') props.onSelectNode(row.id)
      else props.onSelectRelation(row.id)
      setOpen(false)
      setQuery('')
    },
    [props],
  )

  function onInputKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(flat.length - 1, index + 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.max(0, index - 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      choose(flat[activeIndex])
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
      if (inputRef.current) inputRef.current.blur()
    }
  }

  const showList = open && query.trim().length > 0
  return h(
    'div',
    { className: 'la-search' },
    h(Icon, { name: 'search', size: 16, className: 'la-search__icon' }),
    h('input', {
      ref: inputRef,
      className: 'la-search__input',
      type: 'search',
      value: query,
      placeholder: t('loop.search.placeholder'),
      'aria-label': t('loop.search.label'),
      role: 'combobox',
      'aria-expanded': showList,
      'aria-controls': showList ? listId : undefined,
      'aria-autocomplete': 'list',
      'aria-activedescendant': showList && flat[activeIndex] ? `${listId}-${activeIndex}` : undefined,
      onChange: (event) => {
        setQuery(event.target.value)
        setOpen(true)
      },
      onFocus: () => setOpen(true),
      onBlur: () => {
        // 让点击结果先发生，再关列表。
        setTimeout(() => setOpen(false), 150)
      },
      onKeyDown: onInputKeyDown,
    }),
    showList
      ? h(
          'div',
          { className: 'la-search__popover' },
          flat.length
            ? h(
                'ul',
                { className: 'la-search__list', role: 'listbox', id: listId, 'aria-label': t('loop.search.label') },
                flat.map((row, index) =>
                  h(
                    'li',
                    { key: `${row.kind}:${row.id}`, role: 'option', 'aria-selected': index === activeIndex, id: `${listId}-${index}` },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: classNames('la-search__result', index === activeIndex && 'is-active'),
                        onMouseDown: (event) => {
                          event.preventDefault()
                          choose(row)
                        },
                        onMouseEnter: () => setActiveIndex(index),
                      },
                      h(
                        'span',
                        { className: 'la-search__result-main' },
                        row.kind === 'node'
                          ? row.node.title
                          : `${t(`loop.relation.type.${row.relation.type}`)}：${row.from ? row.from.title : row.relation.from} → ${
                              row.to ? row.to.title : row.relation.to
                            }`,
                        row.kind === 'node'
                          ? h('span', { className: 'la-search__result-sub' }, row.node.def)
                          : h('span', { className: 'la-search__result-sub' }, row.relation.claim || row.relation.condition),
                      ),
                      h(
                        'span',
                        { className: 'la-search__result-kind' },
                        row.kind === 'node' ? t('loop.search.node') : t('loop.search.relation'),
                      ),
                    ),
                  ),
                ),
              )
            : h('p', { className: 'la-search__empty' }, t('loop.search.empty')),
          h('p', { className: 'la-search__hint' }, t('loop.search.hint')),
        )
      : null,
  )
}

export function TopBar(props) {
  const t = props.t
  const view = props.view
  const scaleOptions = [
    { id: 'domain', label: t('loop.scale.domain'), hint: t('loop.scale.domain.hint') },
    { id: 'subject', label: t('loop.scale.subject'), hint: t('loop.scale.subject.hint') },
    { id: 'evidence', label: t('loop.scale.evidence'), hint: t('loop.scale.evidence.hint') },
  ]
  const projectionOptions = [
    { id: 'theory', label: t('loop.projection.theory') },
    { id: 'history', label: t('loop.projection.history') },
    { id: 'practice', label: t('loop.projection.practice') },
  ]
  return h(
    'header',
    { className: 'la-topbar' },
    h(
      'div',
      { className: 'la-brand' },
      h('span', { className: 'la-brand__name' }, t('loop.app.title')),
      h('span', { className: 'la-brand__sub' }, t('loop.brand.sub')),
    ),
    h(
      'div',
      { className: 'la-topbar__cluster' },
      h('span', { className: 'la-topbar__label' }, t('loop.scale.label')),
      h(Segmented, {
        label: t('loop.scale.label'),
        value: view.scale,
        options: scaleOptions,
        onChange: (scale) => props.onChangeView({ scale }),
      }),
    ),
    h(
      'div',
      { className: 'la-topbar__cluster la-topbar__cluster--view' },
      h('span', { className: 'la-topbar__label' }, t('loop.projection.label')),
      h(Segmented, {
        label: t('loop.projection.label'),
        value: view.projection,
        options: projectionOptions.map((option) => Object.assign({}, option, { disabled: view.scale !== 'subject' })),
        onChange: (projection) => {
          if (view.scale !== 'subject') return
          props.onChangeView({ projection })
        },
      }),
    ),
    h(
      'div',
      { className: 'la-topbar__spacer' },
      h(SearchBox, {
        t,
        ci: props.ci,
        onSelectNode: props.onSelectNode,
        onSelectRelation: props.onSelectRelation,
      }),
    ),
    h(
      'div',
      { className: 'la-topbar__actions' },
      h(
        Button,
        { variant: 'ghost', size: 'sm', icon: 'clock', onClick: props.onOpenContinue, title: t('loop.continue') },
        t('loop.continue'),
      ),
      h(
        Button,
        { variant: 'ghost', size: 'sm', icon: 'folder', onClick: props.onOpenResources, title: t('loop.resources') },
        t('loop.resources'),
      ),
      h(IconButton, {
        icon: props.rightOpen ? 'collapseRight' : 'partner',
        label: props.rightOpen ? t('loop.partner.hide') : t('loop.partner.show'),
        pressed: props.rightOpen,
        onClick: props.onTogglePartner,
      }),
      h(IconButton, {
        className: 'la-topbar__menu',
        icon: 'menu',
        label: t('loop.dir.expand'),
        expanded: props.directoryOpen,
        onClick: props.onToggleDirectory,
      }),
    ),
  )
}
