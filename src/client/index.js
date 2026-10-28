/**
 * 客户端插件入口：注册 locale 字典与三个宿主槽位，返回 plugin 对象。
 *
 * 槽位（契约 §0，勿改 id/order 含义）：
 * - main：全页面板（key 'loop-atlas'）
 * - settings.section：设置区入口（id 'loop-atlas'，order 92，label 掌控 · 控制论）
 * - sidebar.footer.action：侧栏底部按钮（id 'loop-atlas-open'，order 40，label 掌控）
 */

import { LOCALE } from '#locale'
import { App } from './App.js'

function SettingsSection(props) {
  const ctx = props.ctx
  const t = ctx.locale.bind('loop')
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    if (typeof ctx.locale.subscribe !== 'function') return undefined
    const unsubscribe = ctx.locale.subscribe(() => setTick((value) => value + 1))
    return typeof unsubscribe === 'function' ? unsubscribe : undefined
  }, [ctx])
  return h(
    'div',
    { style: { padding: '4px 0', fontSize: '13px', lineHeight: 1.9, color: 'var(--dsw-alias-label-primary)' } },
    h('p', { style: { margin: '0 0 10px', color: 'var(--dsw-alias-label-secondary)' } }, t('loop.settings.description')),
    h(
      'button',
      {
        type: 'button',
        onClick: () => {
          try {
            ctx.layout.selectPanel('loop-atlas')
          } catch (error) {
            console.error('[loop-atlas] 无法切换面板', error)
          }
        },
        style: {
          background: 'var(--dsw-alias-brand-primary)',
          color: 'var(--dsw-alias-bg-base)',
          border: 0,
          borderRadius: 'var(--dsw-radius-sm)',
          padding: '8px 16px',
          minHeight: '40px',
          cursor: 'pointer',
          font: 'inherit',
          fontSize: '14px',
        },
      },
      t('loop.settings.open'),
    ),
  )
}

function SidebarButton(props) {
  const ctx = props.ctx
  const t = ctx.locale.bind('loop')
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    if (typeof ctx.locale.subscribe !== 'function') return undefined
    const unsubscribe = ctx.locale.subscribe(() => setTick((value) => value + 1))
    return typeof unsubscribe === 'function' ? unsubscribe : undefined
  }, [ctx])
  return h(
    'button',
    {
      type: 'button',
      title: t('loop.settings.open'),
      onClick: () => {
        try {
          ctx.layout.selectPanel('loop-atlas')
        } catch (error) {
          console.error('[loop-atlas] 无法切换面板', error)
        }
      },
      style: {
        background: 'none',
        border: '1px solid var(--dsw-alias-border-l1)',
        color: 'var(--dsw-alias-label-primary)',
        borderRadius: 'var(--dsw-radius-sm)',
        cursor: 'pointer',
        fontSize: '12px',
        padding: '6px 10px',
        minHeight: '32px',
        letterSpacing: '0.08em',
        font: 'inherit',
      },
    },
    t('loop.sidebar.open'),
  )
}

export const plugin = {
  inject: ['slots', 'layout', 'locale'],
  apply(ctx) {
    ctx.effect(() => ctx.locale.register('loop', LOCALE), 'loop-atlas: dictionaries')

    ctx.effect(
      () =>
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'loop-atlas', locale: 'loop' }, (props) =>
            h(App, Object.assign({}, props, { ctx, localeDict: LOCALE })),
          ),
        ),
      'loop-atlas: main panel',
    )

    ctx.effect(
      () =>
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            { name: 'settings.section', id: 'loop-atlas', order: 92, label: '掌控 · 控制论' },
            (props) => h(SettingsSection, Object.assign({}, props, { ctx })),
          ),
        ),
      'loop-atlas: settings section',
    )

    ctx.effect(
      () =>
        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            { name: 'sidebar.footer.action', id: 'loop-atlas-open', order: 40, label: '掌控' },
            (props) => h(SidebarButton, Object.assign({}, props, { ctx })),
          ),
        ),
      'loop-atlas: sidebar action',
    )
  },
}
