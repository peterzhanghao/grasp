/**
 * 资料与备份：数据路径、备份、导出、导入（先预览冲突再确认）、迁移报告、导入历史。
 * 所有成功提示都来自 Host 真实回执；导入冲突必须显式展示。
 */

const { useState, useRef } = React

import { Dialog } from '../components/Dialog.js'
import { Button, Tag, Notice, FieldLabel, EmptyState } from '../components/primitives.js'
import { Icon } from '../components/Icons.js'
import { formatBytes, formatTime, downloadJson } from '../util.js'

const MAX_PACK_BYTES = 8 * 1024 * 1024

function summarizeCounts(counts) {
  if (!counts || typeof counts !== 'object') return '—'
  return Object.entries(counts)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => `${key} ${value}`)
    .join(' · ')
}

export function ResourcesDialog(props) {
  const t = props.t
  const data = props.data || {}
  const meta = (data.store && data.store.meta) || {}
  const fileRef = useRef(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [pack, setPack] = useState(null)
  const [mode, setMode] = useState('merge')
  const [replaceConfirmed, setReplaceConfirmed] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [migration, setMigration] = useState(data.migrationReport || null)
  const notices = []
  for (const notice of data.notices || []) notices.push(notice)
  for (const notice of meta.notices || []) notices.push(notice)

  const setBusyNamed = (name) => setBusy(name)

  const runBusy = async (name, task) => {
    setBusy(name)
    setError('')
    try {
      await task()
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy('')
    }
  }

  const backup = () =>
    runBusy('backup', async () => {
      await props.perform('backup.create', {}, {
        successText: (result) => t('loop.res.backupDone', { path: (result && result.path) || '—' }),
      })
    })

  const exportPack = () =>
    runBusy('export', async () => {
      const result = await props.perform('package.export', {}, { receipt: false })
      const packData = result && result.pack ? result.pack : null
      if (!packData) throw new Error(t('loop.res.invalidPack'))
      const filename = `loop-atlas-${new Date().toISOString().slice(0, 10)}.json`
      const written = downloadJson(filename, packData)
      if (!written.ok) throw new Error(`${t('loop.common.copyFailed')}：${written.reason}`)
      if (props.addReceipt) props.addReceipt({ kind: 'ok', text: t('loop.res.exportDone') })
    })

  const pickFile = () => {
    setError('')
    setPreview(null)
    setPack(null)
    setImportResult(null)
    if (fileRef.current) fileRef.current.click()
  }

  const onFile = async (event) => {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (!file) return
    setBusyNamed('preview')
    setError('')
    setPreview(null)
    setPack(null)
    setImportResult(null)
    try {
      if (file.size > MAX_PACK_BYTES) {
        throw new Error(t('loop.res.packTooLarge', { size: formatBytes(file.size) }))
      }
      const text = await file.text()
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch (parseError) {
        throw new Error(t('loop.res.parseError', { reason: String((parseError && parseError.message) || parseError) }))
      }
      if (!parsed || parsed.kind !== 'loop-atlas-user-package') {
        throw new Error(t('loop.res.invalidPack'))
      }
      const response = await props.perform('package.preview', { pack: parsed }, { receipt: false, reload: false })
      setPack(parsed)
      setPreview(response.preview || {})
      setMode('merge')
      setReplaceConfirmed(false)
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusyNamed('')
    }
  }

  const confirmImport = () =>
    runBusy('import', async () => {
      if (!pack) return
      if (mode === 'replace' && !replaceConfirmed) {
        throw new Error(t('loop.res.replaceConfirm'))
      }
      const response = await props.perform(
        'package.import',
        { pack, mode, confirm: mode === 'replace' ? replaceConfirmed : undefined },
        { receipt: false },
      )
      const conflicts = response.conflicts || []
      setImportResult({
        applied: response.applied === undefined ? null : response.applied,
        counts: response.counts || null,
        conflicts,
      })
      if (props.addReceipt) {
        props.addReceipt({
          kind: conflicts.length ? 'error' : 'ok',
          text: conflicts.length
            ? `${t('loop.res.conflicts', { count: conflicts.length })}`
            : t('loop.res.importDone', { summary: summarizeCounts(response.counts || response.applied) }),
        })
      }
      if (!conflicts.length) {
        setPreview(null)
        setPack(null)
      }
    })

  const loadMigration = () =>
    runBusy('migration', async () => {
      const response = await props.perform('migration.report', {}, { receipt: false, reload: false })
      setMigration(response.report || null)
    })

  const previewCounts = preview ? preview.counts || {} : {}
  const previewConflicts = preview ? preview.conflicts || [] : []
  const previewErrors = preview ? preview.errors || [] : []

  return h(
    Dialog,
    {
      open: props.open,
      onClose: props.onClose,
      title: t('loop.res.title'),
      description: t('loop.common.optional'),
      size: 'lg',
      closeLabel: t('loop.common.close'),
      footer: h(
        'div',
        { className: 'la-dialog__actions' },
        h(Button, { variant: 'ghost', onClick: props.onClose }, t('loop.common.close')),
      ),
    },
    h(
      'div',
      { className: 'la-resources' },
      error ? h(Notice, { tone: 'error' }, error) : null,
      h(
        'section',
        { className: 'la-resblock' },
        h(FieldLabel, null, t('loop.res.dataPath')),
        h(
          'div',
          { className: 'la-respath' },
          h(Icon, { name: 'folder', size: 16 }),
          h('code', { className: 'la-respath__text' }, data.dataPath || '—'),
          h(
            Button,
            {
              size: 'sm',
              variant: 'ghost',
              onClick: async () => {
                if (!props.copyText) return
                await props.copyText(data.dataPath || '')
              },
            },
            t('loop.res.copyPath'),
          ),
        ),
        h(
          'div',
          { className: 'la-resrow' },
          h(Button, { variant: 'secondary', icon: 'archive', loading: busy === 'backup', onClick: backup }, t('loop.res.backup')),
          h(Button, { variant: 'secondary', icon: 'external', loading: busy === 'export', onClick: exportPack }, t('loop.res.export')),
          h(
            Button,
            { variant: 'secondary', icon: 'notes', loading: busy === 'migration', onClick: loadMigration },
            t('loop.res.migration'),
          ),
          h(Button, { variant: 'secondary', icon: 'folder', onClick: pickFile }, t('loop.res.import')),
          h('input', {
            ref: fileRef,
            type: 'file',
            accept: 'application/json,.json',
            style: { display: 'none' },
            onChange: onFile,
            tabIndex: -1,
            'aria-hidden': 'true',
          }),
        ),
        h('p', { className: 'la-muted' }, t('loop.res.importIdempotent')),
      ),
      preview
        ? h(
            'section',
            { className: 'la-resblock' },
            h(FieldLabel, null, t('loop.res.preview')),
            h(
              'p',
              { className: 'la-respreview__line' },
              `${t('loop.res.counts', { summary: summarizeCounts(previewCounts) })} · ${
                preview.version ? `v${preview.version}` : ''
              }${preview.schema ? ` · schema ${preview.schema}` : ''}`,
            ),
            previewErrors.length
              ? h(
                  'div',
                  { className: 'la-respreview__errors' },
                  h(Tag, { tone: 'danger' }, t('loop.res.errors', { count: previewErrors.length })),
                  h(
                    'ul',
                    { className: 'la-reslist' },
                    previewErrors.slice(0, 20).map((item, index) =>
                      h('li', { key: index }, typeof item === 'string' ? item : item.message || JSON.stringify(item)),
                    ),
                  ),
                  h('p', { className: 'la-hintwarn' }, t('loop.res.blocked')),
                )
              : null,
            previewConflicts.length
              ? h(
                  'div',
                  { className: 'la-respreview__conflicts' },
                  h(Tag, { tone: 'warn' }, t('loop.res.conflicts', { count: previewConflicts.length })),
                  h(
                    'ul',
                    { className: 'la-reslist' },
                    previewConflicts.slice(0, 20).map((item, index) =>
                      h('li', { key: index }, typeof item === 'string' ? item : item.id || item.message || JSON.stringify(item)),
                    ),
                  ),
                )
              : null,
            h(
              'div',
              { className: 'la-resmodes', role: 'radiogroup', 'aria-label': t('loop.res.mode') },
              h('span', { className: 'la-fieldlabel' }, t('loop.res.mode')),
              ['merge', 'skip', 'replace'].map((value) =>
                h(
                  'label',
                  { key: value, className: 'la-radio' },
                  h('input', {
                    type: 'radio',
                    name: 'la-import-mode',
                    value,
                    checked: mode === value,
                    onChange: () => setMode(value),
                  }),
                  h('span', null, t(`loop.res.mode.${value}`)),
                ),
              ),
            ),
            mode === 'replace'
              ? h(
                  'label',
                  { className: 'la-check' },
                  h('input', {
                    type: 'checkbox',
                    checked: replaceConfirmed,
                    onChange: (event) => setReplaceConfirmed(event.target.checked),
                  }),
                  h('span', null, t('loop.res.replaceConfirm')),
                )
              : null,
            h(
              'div',
              { className: 'la-resrow' },
              h(
                Button,
                {
                  variant: 'primary',
                  icon: 'check',
                  loading: busy === 'import',
                  disabled: previewErrors.length > 0 || (mode === 'replace' && !replaceConfirmed),
                  onClick: confirmImport,
                },
                t('loop.res.confirmImport'),
              ),
              h(Button, { variant: 'ghost', onClick: pickFile }, t('loop.res.importPick')),
            ),
          )
        : null,
      importResult
        ? h(
            'section',
            { className: 'la-resblock' },
            h(FieldLabel, null, t('loop.res.import')),
            importResult.conflicts.length
              ? h(
                  'div',
                  null,
                  h(Tag, { tone: 'danger' }, t('loop.res.conflictList')),
                  h(
                    'ul',
                    { className: 'la-reslist' },
                    importResult.conflicts.slice(0, 20).map((item, index) =>
                      h('li', { key: index }, typeof item === 'string' ? item : item.id || JSON.stringify(item)),
                    ),
                  ),
                )
              : h('p', { className: 'la-okText' }, t('loop.res.importDone', { summary: summarizeCounts(importResult.counts || importResult.applied) })),
          )
        : null,
      h(
        'section',
        { className: 'la-resblock' },
        h(FieldLabel, null, t('loop.res.migration')),
        migration
          ? h(
              'div',
              { className: 'la-migration' },
              h(
                'dl',
                { className: 'la-migration__list' },
                Object.entries(migration)
                  .filter(([, value]) => value === null || ['string', 'number', 'boolean'].includes(typeof value))
                  .map(([key, value]) => h('div', { key, className: 'la-migration__row' }, h('dt', null, key), h('dd', null, String(value)))),
              ),
              h('pre', { className: 'la-pre' }, JSON.stringify(migration, null, 2)),
            )
          : h('p', { className: 'la-muted' }, t('loop.res.migrationEmpty')),
      ),
      notices.length
        ? h(
            'section',
            { className: 'la-resblock' },
            h(FieldLabel, null, t('loop.res.notices')),
            notices.map((notice, index) =>
              h(
                'p',
                { key: index, className: `la-notice la-notice--${notice.level === 'warn' ? 'warn' : 'info'}` },
                h(Icon, { name: notice.level === 'warn' ? 'warning' : 'info', size: 16 }),
                h('span', null, notice.text || JSON.stringify(notice)),
              ),
            ),
          )
        : null,
      (data.store && data.store.importLog && data.store.importLog.length) || (props.storeIndex && props.storeIndex.importLog.length)
        ? h(
            'section',
            { className: 'la-resblock' },
            h(FieldLabel, null, t('loop.res.importLog')),
            h(
              'ul',
              { className: 'la-reslist' },
              (data.store.importLog || []).slice(0, 10).map((entry, index) =>
                h(
                  'li',
                  { key: index },
                  `${formatTime(entry.at)} · ${entry.mode || ''} · ${summarizeCounts(entry.counts || {})} · ${
                    t('loop.res.conflicts', { count: entry.conflicts || 0 })
                  }`,
                ),
              ),
            ),
          )
        : null,
    ),
  )
}
