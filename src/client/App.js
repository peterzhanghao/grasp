/**
 * 应用外壳：顶栏 / 目录 / 主视图 / 学习伙伴 / 状态条 / 弹层，以及 1440/1024/窄屏布局。
 * 插件只占宿主 main 槽分配的区域，不重做 Harness 外壳。
 */

const { useState, useEffect, useMemo, useCallback, useRef } = React

import { createTranslator, FALLBACK_ZH, FALLBACK_EN } from './i18n.js'
import { classNames, clamp, subjectKey, copyText } from './util.js'
import { indexCore, neighborsOf } from './model.js'
import { indexStore } from './store.js'
import { useAppState, useView } from './state/app.js'
import { useLocaleRevision, useKeyedDrafts, useMediaQuery, useFillViewportHeight } from './state/hooks.js'
import { useChat } from './state/dialog.js'
import { Button, Notice, EmptyState } from './components/primitives.js'
import { Icon } from './components/Icons.js'
import { TopBar } from './views/TopBar.js'
import { Directory } from './views/Directory.js'
import { StatusBar } from './views/StatusBar.js'
import { DomainScale } from './views/DomainScale.js'
import { SubjectScale } from './views/SubjectScale.js'
import { EvidenceScale } from './views/EvidenceScale.js'
import { Partner } from './views/Partner.js'
import { RelationInspector } from './views/RelationInspector.js'
import { ResourcesDialog } from './views/ResourcesDialog.js'
import { ContinueDialog } from './views/ContinueDialog.js'
import { SourceDialog } from './views/SourceDialog.js'
import { ReceiptsDialog } from './views/ReceiptsDialog.js'
import { useCopyText } from './views/shared.js'
import { CSS } from './styles/index.js'

const FALLBACK_DICTS = { zh: FALLBACK_ZH, en: FALLBACK_EN }

export function App(props) {
  const ctx = props && props.ctx
  const locale = ctx && ctx.locale
  useLocaleRevision(locale)
  const localeDict = props && props.localeDict
  const t = useMemo(() => {
    if (locale && typeof locale.bind === 'function') {
      try {
        return locale.bind('loop')
      } catch {
        /* 回退到内置字典 */
      }
    }
    return createTranslator(localeDict || FALLBACK_DICTS)
  }, [locale, localeDict])
  const app = useAppState(t)

  if (app.phase === 'loading') {
    return h(
      'div',
      { className: 'la-root la-root--state' },
      h('style', null, CSS),
      h(
        'div',
        { className: 'la-statepane', role: 'status' },
        h(Icon, { name: 'refresh', size: 20 }),
        h('p', null, t('loop.app.loading')),
      ),
    )
  }

  if (app.phase === 'error' || !app.data) {
    return h(
      'div',
      { className: 'la-root la-root--state' },
      h('style', null, CSS),
      h(
        'div',
        { className: 'la-statepane', role: 'alert' },
        h(Icon, { name: 'error', size: 22 }),
        h('h1', { className: 'la-statepane__title' }, t('loop.app.loadError')),
        h('p', { className: 'la-statepane__message' }, app.error ? String(app.error.message) : ''),
        app.error && app.error.code ? h('p', { className: 'la-muted' }, `[${app.error.code}]`) : null,
        h('p', { className: 'la-statepane__hint la-muted' }, t('loop.app.errorHint')),
        h(Button, { variant: 'primary', icon: 'refresh', onClick: () => app.load({}) }, t('loop.app.retry')),
      ),
    )
  }

  return h(Panel, { app, t, ctx, localeDict })
}

export function Panel(props) {
  const t = props.t
  const app = props.app
  const data = app.data
  const ci = useMemo(() => indexCore(data && data.core), [data])
  const storeIndex = useMemo(() => indexStore(data && data.store), [data])

  const addReceipt = app.addReceipt
  const onPersistError = useCallback(
    (error) => {
      addReceipt({
        kind: 'error',
        text: t('loop.status.viewSaveFailed', { message: error.message }),
        code: error.code,
      })
    },
    [addReceipt, t],
  )
  const [view, updateView] = useView(data.store && data.store.view, onPersistError)
  const narrow = useMediaQuery('(max-width: 919px)')
  const [rootRef, fillHeight] = useFillViewportHeight()
  const [narrowStage, setNarrowStage] = useState('graph')
  const [partnerTab, setPartnerTab] = useState('chat')
  const [chatOverride, setChatOverride] = useState(null)
  const noteDrafts = useKeyedDrafts()
  const [sourceDialog, setSourceDialog] = useState(null)
  const [continueOpen, setContinueOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [receiptsOpen, setReceiptsOpen] = useState(false)
  const [rightWidth, setRightWidth] = useState(() => {
    try {
      const stored = Number(window.localStorage.getItem('loop.partnerWidth'))
      if (stored >= 300 && stored <= 460) return stored
    } catch {
      /* 隐私模式没有 localStorage */
    }
    return 352
  })
  const rightWidthRef = useRef(rightWidth)
  rightWidthRef.current = rightWidth
  const dragState = useRef(null)

  const copy = useCopyText(t, addReceipt)

  const chat = useChat({
    reload: () => app.load({ quiet: true }),
    addReceipt,
    t,
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('loop.partnerWidth', String(rightWidth))
    } catch {
      /* 忽略持久化失败：宽度只是本地偏好 */
    }
  }, [rightWidth])

  useEffect(() => {
    if (!narrow) return
    if (view.rightOpen) updateView({ rightOpen: false })
    if (view.directoryOpen) updateView({ directoryOpen: false })
    // 只在进入窄屏时收一次，之后由用户自己开关。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow])

  useEffect(() => {
    if (!ci.hasContent) return
    const hasRelation = view.selectedRelationId && ci.relationsById.has(view.selectedRelationId)
    const hasNode = view.selectedNodeId && ci.nodesById.has(view.selectedNodeId)
    if (hasRelation || hasNode) return
    const firstGroup = ci.groups[0]
    const entry = firstGroup && firstGroup.entryNodeId ? ci.nodesById.get(firstGroup.entryNodeId) : null
    const fallback = entry || ci.nodes[0]
    if (fallback) updateView({ selectedNodeId: fallback.id })
  }, [ci, view.selectedNodeId, view.selectedRelationId, updateView])

  const subject = useMemo(() => {
    if (view.selectedRelationId && ci.relationsById.has(view.selectedRelationId)) {
      return { kind: 'relation', id: view.selectedRelationId }
    }
    if (view.selectedNodeId && ci.nodesById.has(view.selectedNodeId)) {
      return { kind: 'node', id: view.selectedNodeId }
    }
    if (view.activeInvestigationId && storeIndex.investigations.some((item) => item.id === view.activeInvestigationId)) {
      return { kind: 'investigation', id: view.activeInvestigationId }
    }
    return null
  }, [ci, view.selectedRelationId, view.selectedNodeId, view.activeInvestigationId, storeIndex])

  const centerNode = useMemo(() => {
    if (!subject) return null
    if (subject.kind === 'node') return ci.nodesById.get(subject.id) || null
    if (subject.kind === 'relation') {
      const relation = ci.relationsById.get(subject.id)
      if (!relation) return null
      return ci.nodesById.get(relation.from) || ci.nodesById.get(relation.to) || null
    }
    return null
  }, [ci, subject])

  const neighborData = useMemo(
    () => (centerNode ? neighborsOf(ci, centerNode.id, 7) : { neighbors: [], total: 0 }),
    [ci, centerNode],
  )
  const selectedRelation = view.selectedRelationId ? ci.relationsById.get(view.selectedRelationId) || null : null
  const ck = subject ? subjectKey(subject) : ''
  const activeGroupId = centerNode && centerNode.groupId ? centerNode.groupId : null
  const partnerSubject = chatOverride || subject
  const noteDraft = noteDrafts.getDraft(ck)
  const recommendedGroupId = useMemo(() => {
    const hasUserData =
      storeIndex.notes.length > 0 || storeIndex.investigations.length > 0 || storeIndex.runs.length > 0
    if (hasUserData) return null
    const goalGroup = ci.groups.find((group) => (ci.nodesByGroup.get(group.id) || []).some((node) => node.id === 'goal'))
    return goalGroup ? goalGroup.id : ci.groups[0] ? ci.groups[0].id : null
  }, [ci, storeIndex])

  const modelAvailable = data.modelAvailable !== false && !(data.model && data.model.available === false)
  const modelReason = data.modelReason || (data.model && data.model.reason) || t('loop.chat.noModel')
  const notices = data.notices || []

  /* ── 键盘：Escape 取消关系选择 / 窄屏回到图 ─────────────── */
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      const target = event.target
      const tag = target && target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target && target.isContentEditable)) return
      if (sourceDialog || continueOpen || resourcesOpen || receiptsOpen) return
      if (view.selectedRelationId) {
        updateView({ selectedRelationId: null })
        return
      }
      if (narrow && narrowStage !== 'graph') setNarrowStage('graph')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [
    view.selectedRelationId,
    sourceDialog,
    continueOpen,
    resourcesOpen,
    receiptsOpen,
    narrow,
    narrowStage,
    updateView,
  ])

  /* ── 选择与导航 ─────────────────────────────────────────── */
  const onSelectNode = useCallback(
    (id, options) => {
      const opts = options || {}
      if (!ci.nodesById.has(id)) return
      setChatOverride(null)
      updateView({
        selectedNodeId: id,
        selectedRelationId: null,
        activeInvestigationId: null,
        scale: opts.scale || 'subject',
      })
      if (narrow) setNarrowStage('graph')
    },
    [ci, narrow, updateView],
  )

  const onSelectRelation = useCallback(
    (id, options) => {
      const relation = ci.relationsById.get(id)
      if (!relation) return
      const opts = options || {}
      setChatOverride(null)
      updateView({
        selectedRelationId: id,
        selectedNodeId: relation.from,
        activeInvestigationId: null,
        scale: opts.scale || 'subject',
      })
      if (narrow) setNarrowStage('read')
      else setPartnerTab('chat')
    },
    [ci, narrow, updateView],
  )

  const onClearRelation = useCallback(() => {
    updateView({ selectedRelationId: null })
  }, [updateView])

  const onSelectGroup = useCallback(
    (group) => {
      const entry = group.entryNodeId ? ci.nodesById.get(group.entryNodeId) : null
      const nodes = ci.nodesByGroup.get(group.id) || []
      const target = entry || nodes[0]
      if (!target) return
      onSelectNode(target.id)
      if (narrow) updateView({ directoryOpen: false })
    },
    [ci, narrow, onSelectNode, updateView],
  )

  const onChangeView = useCallback(
    (patch) => {
      if (patch.scale && patch.scale !== 'subject' && narrow) setNarrowStage('graph')
      updateView(patch)
    },
    [narrow, updateView],
  )

  const onGoSubject = useCallback(
    (target, scale) => {
      setContinueOpen(false)
      if (!target) return
      if (target.kind === 'relation') {
        onSelectRelation(target.id, { scale: scale || 'subject' })
        return
      }
      if (target.kind === 'node') {
        onSelectNode(target.id, { scale: scale || 'subject' })
        return
      }
      updateView({ scale: scale || 'evidence', activeInvestigationId: target.id })
      setNarrowStage('graph')
    },
    [narrow, onSelectNode, onSelectRelation, updateView],
  )

  const onDiscussInvestigation = useCallback(
    (investigation) => {
      if (!investigation) return
      setContinueOpen(false)
      updateView({
        scale: 'evidence',
        activeInvestigationId: investigation.id,
        selectedNodeId:
          investigation.subject && investigation.subject.kind === 'node' ? investigation.subject.id : view.selectedNodeId,
        selectedRelationId:
          investigation.subject && investigation.subject.kind === 'relation' ? investigation.subject.id : view.selectedRelationId,
      })
      setChatOverride({ kind: 'investigation', id: investigation.id })
      setPartnerTab('chat')
      if (narrow) setNarrowStage('chat')
      else updateView({ rightOpen: true })
      setNarrowStage((stage) => (narrow ? 'chat' : stage))
    },
    [narrow, updateView, view.selectedNodeId, view.selectedRelationId],
  )

  const onGoRun = useCallback(
    (run) => {
      setContinueOpen(false)
      if (run && run.subject) onGoSubject(run.subject, 'evidence')
      else updateView({ scale: 'evidence' })
    },
    [onGoSubject, updateView],
  )

  const openPartner = useCallback(
    (tab) => {
      if (tab) setPartnerTab(tab)
      if (narrow) setNarrowStage('chat')
      else if (!view.rightOpen) updateView({ rightOpen: true })
    },
    [narrow, updateView, view.rightOpen],
  )

  const onAsk = useCallback(() => openPartner('chat'), [openPartner])

  const onOpenNotes = useCallback(() => {
    openPartner('notes')
  }, [openPartner])

  /* ── 写入：全部经 Host 回执 ─────────────────────────────── */
  const saveNote = useCallback(
    (payload) =>
      app.perform('note.save', payload, {
        successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
      }),
    [app, t],
  )
  const adoptDraft = useCallback(
    (message) => {
      if (!subject || !message) return Promise.resolve(null)
      return app.perform(
        'note.save',
        {
          subject,
          kind: '证据',
          text: message.text,
          authorSource: 'ai-draft',
          savedBy: 'ui',
          adopted: true,
        },
        { successText: t('loop.note.adoptedDraft') },
      )
    },
    [app, subject, t],
  )
  const isMessageAdopted = useCallback(
    (message) => {
      if (!subject || !message) return false
      const value = String(message.text || '').trim()
      if (!value) return false
      return storeIndex
        .notesFor(subject)
        .some((note) => note.authorSource === 'ai-draft' && note.adopted === true && note.text.trim() === value)
    },
    [storeIndex, subject],
  )
  const onPrefillNote = useCallback(
    (text) => {
      if (!ck) return
      noteDrafts.setDraft(ck, text)
      addReceipt({ kind: 'info', text: t('loop.exp.saveObs') })
    },
    [addReceipt, ck, noteDrafts, t],
  )
  const onToggleDirectory = useCallback(() => updateView({ directoryOpen: !view.directoryOpen }), [updateView, view.directoryOpen])
  const onCollapseDirectory = useCallback(() => updateView({ directoryOpen: false }), [updateView])

  /* ── 左右栏拖拽/键盘调整 ───────────────────────────────── */
  const startResize = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    dragState.current = { startX: event.clientX, startWidth: rightWidthRef.current }
    function onMove(moveEvent) {
      if (!dragState.current) return
      const delta = dragState.current.startX - moveEvent.clientX
      setRightWidth(clamp(Math.round(dragState.current.startWidth + delta), 320, 460))
    }
    function onUp() {
      dragState.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const onResizeKeyDown = useCallback((event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setRightWidth((width) => clamp(width + (event.key === 'ArrowLeft' ? 16 : -16), 320, 460))
  }, [])

  /* ── 渲染 ───────────────────────────────────────────────── */
  const partnerElement = h(Partner, {
    t,
    ci,
    storeIndex,
    subject: partnerSubject,
    selectedRelation,
    model: data.model,
    modelAvailable,
    modelReason,
    perform: app.perform,
    addReceipt,
    chat,
    tab: partnerTab,
    onTabChange: setPartnerTab,
    noteDraft: noteDrafts.getDraft(partnerSubject ? subjectKey(partnerSubject) : ''),
    onNoteDraftChange: (text) => noteDrafts.setDraft(partnerSubject ? subjectKey(partnerSubject) : '', text),
    onSaveNote: saveNote,
    onSaveNoteEdit: (payload) =>
      app.perform('note.save', payload, { successText: t('loop.status.saveOk', { what: t('loop.note.title') }) }),
    onArchiveNote: (note) =>
      app.perform('note.archive', { noteId: note.id }, {
        successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
      }),
    onDeleteNote: (note) =>
      app.perform('note.delete', { noteId: note.id }, {
        successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
      }),
    onAdoptDraft: adoptDraft,
    isAdopted: isMessageAdopted,
    onOpenSource: (source) => setSourceDialog({ open: true, source }),
    onClearRelation,
    onCollapse: () => (narrow ? setNarrowStage('graph') : updateView({ rightOpen: false })),
  })

  const subjectScale = h(SubjectScale, {
    t,
    ci,
    view,
    center: centerNode,
    neighbors: neighborData.neighbors,
    totalNeighbors: neighborData.total,
    selectedRelation,
    notes: subject ? storeIndex.notesFor(subject) : [],
    narrow,
    stage: narrowStage === 'read' ? 'read' : 'graph',
    onSelectNode,
    onSelectRelation,
    onClearRelation,
    onRequestGraph: () => setNarrowStage('graph'),
    onOpenSource: (source) => setSourceDialog({ open: true, source }),
    onViewEvidence: () => updateView({ scale: 'evidence' }),
    onOpenNotes,
    onAsk,
    relationInspector:
      narrow && selectedRelation
        ? h(RelationInspector, {
            t,
            ci,
            relation: selectedRelation,
            record: storeIndex.relationFor(selectedRelation.id),
            notes: storeIndex.notesFor({ kind: 'relation', id: selectedRelation.id }),
            onOpenSource: (source) => setSourceDialog({ open: true, source }),
            onClearRelation,
            onAsk,
            onSaveAnnotation: (payload) =>
              app.perform('relation.annotate', Object.assign({ edgeId: selectedRelation.id }, payload), {
                successText: t('loop.relation.saved'),
              }),
          })
        : null,
  })

  const centerContent =
    view.scale === 'domain'
      ? h(DomainScale, {
          t,
          ci,
          store: data.store,
          recommendedGroupId,
          onEnterGroup: onSelectGroup,
        })
      : view.scale === 'evidence'
        ? h(EvidenceScale, {
            t,
            ci,
            storeIndex,
            subject,
            perform: app.perform,
            addReceipt,
            noteDraft,
            onNoteDraftChange: (text) => (ck ? noteDrafts.setDraft(ck, text) : null),
            onSaveNote: saveNote,
            onSaveNoteEdit: (payload) =>
              app.perform('note.save', payload, { successText: t('loop.status.saveOk', { what: t('loop.note.title') }) }),
            onArchiveNote: (note) =>
              app.perform('note.archive', { noteId: note.id }, {
                successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
              }),
            onDeleteNote: (note) =>
              app.perform('note.delete', { noteId: note.id }, {
                successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
              }),
            onPrefillNote,
            onGoSubject: (target) => onGoSubject(target, 'subject'),
            onDiscussInvestigation,
          })
        : subjectScale

  const layoutClass = classNames(
    'la-body',
    view.directoryOpen && 'has-dir',
    !narrow && view.rightOpen && 'has-right',
    narrow && 'is-narrow',
    narrow && narrowStage === 'chat' && 'is-chatstage',
  )

  return h(
    'div',
    {
      className: classNames('la-root', narrow && 'is-narrow'),
      ref: rootRef,
      style: {
        '--la-right-width': `${rightWidth}px`,
        height: fillHeight ? `${fillHeight}px` : undefined,
      },
    },
    h('style', null, CSS),
    h(TopBar, {
      t,
      ci,
      view,
      rightOpen: narrow ? narrowStage === 'chat' : view.rightOpen,
      directoryOpen: view.directoryOpen,
      onChangeView,
      onSelectNode,
      onSelectRelation,
      onOpenContinue: () => setContinueOpen(true),
      onOpenResources: () => setResourcesOpen(true),
      onTogglePartner: () => {
        if (narrow) setNarrowStage((stage) => (stage === 'chat' ? 'graph' : 'chat'))
        else updateView({ rightOpen: !view.rightOpen })
      },
      onToggleDirectory: onToggleDirectory,
    }),
    data.fatal ? h('div', { className: 'la-banner' }, h(Notice, { tone: 'error' }, String(data.fatal))) : null,
    data.readOnly ? h('div', { className: 'la-banner' }, h(Notice, { tone: 'warn' }, t('loop.error.READ_ONLY'))) : null,
    h(
      'div',
      { className: layoutClass },
      view.directoryOpen
        ? [
            h(Directory, {
              key: 'dir',
              t,
              ci,
              store: data.store,
              view,
              activeGroupId,
              narrow,
              onCollapse: onCollapseDirectory,
              onOpenDomain: () => onChangeView({ scale: 'domain' }),
              onSelectGroup,
            }),
            narrow
              ? h('div', {
                  key: 'backdrop',
                  className: 'la-backdrop',
                  onClick: onCollapseDirectory,
                  'aria-hidden': 'true',
                })
              : null,
          ]
        : null,
      narrow && narrowStage === 'chat'
        ? h('main', { className: 'la-mainpane', key: 'chatmain' }, partnerElement)
        : h('main', { className: 'la-mainpane', key: 'main' }, centerContent),
      !narrow && view.rightOpen
        ? h(
            'div',
            { className: 'la-splitter', key: 'splitter' },
            h('span', {
              className: 'la-splitter__handle',
              role: 'separator',
              'aria-orientation': 'vertical',
              'aria-label': t('loop.partner.title'),
              'aria-valuenow': rightWidth,
              'aria-valuemin': 320,
              'aria-valuemax': 460,
              tabIndex: 0,
              onMouseDown: startResize,
              onKeyDown: onResizeKeyDown,
            }),
          )
        : null,
      !narrow && view.rightOpen ? partnerElement : null,
    ),
    narrow
      ? h(
          'nav',
          { className: 'la-mobilestage', 'aria-label': t('loop.stage.label') },
          [
            { id: 'graph', label: t('loop.stage.graph') },
            { id: 'read', label: t('loop.stage.read') },
            { id: 'chat', label: t('loop.stage.chat') },
          ].map((stage) =>
            h(
              'button',
              {
                key: stage.id,
                type: 'button',
                className: `la-mobilestage__item ${narrowStage === stage.id ? 'is-active' : ''}`.trim(),
                onClick: () => setNarrowStage(stage.id),
                'aria-pressed': narrowStage === stage.id,
              },
              stage.label,
            ),
          ),
        )
      : null,
    h(StatusBar, {
      t,
      data,
      receipts: app.receipts,
      notices,
      refreshing: app.refreshing,
      onRefresh: () => app.load({ showRefreshing: true, quiet: true }),
      onCopyPath: () => copy(data.dataPath || ''),
      onOpenReceipts: () => setReceiptsOpen(true),
    }),
    h(ContinueDialog, {
      open: continueOpen,
      onClose: () => setContinueOpen(false),
      t,
      ci,
      storeIndex,
      view,
      onGoSubject,
      onGoInvestigation: onDiscussInvestigation,
      onGoRun,
    }),
    h(ResourcesDialog, {
      open: resourcesOpen,
      onClose: () => setResourcesOpen(false),
      t,
      data,
      storeIndex,
      perform: app.perform,
      addReceipt,
      copyText: copy,
    }),
    h(SourceDialog, {
      open: !!(sourceDialog && sourceDialog.open),
      source: sourceDialog && sourceDialog.source,
      t,
      onClose: () => setSourceDialog(null),
      onCopy: (text) => copy(text),
    }),
    h(ReceiptsDialog, {
      open: receiptsOpen,
      onClose: () => setReceiptsOpen(false),
      t,
      receipts: app.receipts,
      notices,
      onClear: app.clearReceipts,
    }),
    h('div', { className: 'la-live', 'aria-live': 'polite', role: 'status' }, app.receipts[0] ? app.receipts[0].text : ''),
  )
}
