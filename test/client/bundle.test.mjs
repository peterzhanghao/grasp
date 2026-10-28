/**
 * 单文件产物冒烟：在 node:vm 中加载 client.js，验证插件对象、槽位注册、locale
 * 字典与主面板渲染。不连接真实宿主，也不作为视觉验收证据。
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createReactStub, createGlobals, makeT, deepRender } from './helpers.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const CLIENT_FILE = join(ROOT, 'client.js')

async function loadBundle() {
  const source = await readFile(CLIENT_FILE, 'utf8')
  let definition = null
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(moduleDefinition) {
          definition = moduleDefinition
        },
      },
    },
    console,
  }
  vm.runInNewContext(source, sandbox, { filename: 'client.js', timeout: 10000 })
  assert.ok(definition, 'client.js 必须调用 window.__ModuleLoader__.load')
  return definition
}

function makeCtx() {
  const state = {
    effects: [],
    registrations: [],
    locales: [],
    panelSelections: [],
  }
  const reactStub = createReactStub()
  const ctx = {
    effect(factory) {
      const disposer = factory()
      state.effects.push(disposer)
      return disposer
    },
    slots: {
      inject(_name, callback) {
        return callback()
      },
      register(options, render) {
        state.registrations.push({ options, render })
        return () => {}
      },
    },
    locale: {
      register(namespace, dicts) {
        state.locales.push({ namespace, dicts })
        return () => {}
      },
      bind() {
        return makeT()
      },
      subscribe() {
        return () => {}
      },
      getSnapshot() {
        return { active: 'zh', revision: 0, locales: [] }
      },
    },
    layout: {
      selectPanel(id) {
        state.panelSelections.push(id)
      },
    },
    react: reactStub,
  }
  return { ctx, state }
}

test('产物加载：id 与 factory 形态正确，只 require(react)', async () => {
  const definition = await loadBundle()
  assert.equal(definition.id, '@local/loop-atlas')
  assert.equal(typeof definition.factory, 'function')
  const reactStub = createReactStub()
  const required = []
  const plugin = definition.factory((specifier) => {
    required.push(specifier)
    if (specifier === 'react') return reactStub
    throw new Error(`产物 require 了不允许的模块：${specifier}`)
  })
  assert.deepEqual(required, ['react'])
  assert.ok(plugin && typeof plugin.apply === 'function')
  assert.ok(Array.isArray(plugin.inject) && plugin.inject.includes('slots') && plugin.inject.includes('layout'))
  assert.ok(plugin.inject.includes('locale'), '需要 locale 服务来注册/绑定 loop 命名空间')
})

test('apply 注册三个槽位与 loop locale 字典', async () => {
  const definition = await loadBundle()
  const plugin = definition.factory(() => createReactStub())
  const { ctx, state } = makeCtx()
  plugin.apply(ctx)

  const main = state.registrations.find((entry) => entry.options.name === 'main')
  assert.ok(main, '必须注册 main 槽位')
  assert.equal(main.options.key, 'loop-atlas')
  assert.equal(typeof main.render, 'function')

  const settings = state.registrations.find((entry) => entry.options.name === 'settings.section')
  assert.ok(settings, '必须注册 settings.section')
  assert.equal(settings.options.id, 'loop-atlas')
  assert.equal(settings.options.order, 92)
  assert.match(settings.options.label, /掌控/)

  const sidebar = state.registrations.find((entry) => entry.options.name === 'sidebar.footer.action')
  assert.ok(sidebar, '必须注册 sidebar.footer.action')
  assert.equal(sidebar.options.id, 'loop-atlas-open')
  assert.equal(sidebar.options.order, 40)

  assert.equal(state.locales.length, 1, 'locale 字典只注册一次')
  const dictionary = state.locales[0]
  assert.equal(dictionary.namespace, 'loop')
  assert.ok(dictionary.dicts.zh && dictionary.dicts.en)
  const zhKeys = Object.keys(dictionary.dicts.zh).sort()
  const enKeys = Object.keys(dictionary.dicts.en).sort()
  assert.deepEqual(enKeys, zhKeys, 'zh/en 字典 key 必须一致')
  for (const key of zhKeys) assert.ok(key.startsWith('loop.'), `文案 key 必须带 loop. 前缀：${key}`)
  assert.ok(zhKeys.length > 300)

  // 槽位渲染函数可调用：settings / sidebar 返回可渲染的按钮或说明。
  const settingsElement = settings.render({})
  assert.ok(settingsElement && settingsElement.type, 'settings 渲染函数必须返回元素')
  const settingsRendered = deepRender(settingsElement)
  assert.match(settingsRendered.html, /打开掌控|Open Grasp/, 'settings 区应包含打开按钮文案')
  const sidebarElement = sidebar.render({})
  const sidebarRendered = deepRender(sidebarElement)
  assert.match(sidebarRendered.html, /掌控|Grasp/, '侧栏按钮应包含掌控文案')
  const mainElement = main.render({})
  assert.ok(mainElement && mainElement.type, 'main 渲染函数必须返回元素')
})

test('主面板在 loading 态可深渲染（无崩溃）', async () => {
  const definition = await loadBundle()
  const plugin = definition.factory(() => createReactStub())
  const { ctx, state } = makeCtx()
  plugin.apply(ctx)
  const main = state.registrations.find((entry) => entry.options.name === 'main')
  const element = main.render({})
  const rendered = deepRender(element, { collectErrorsOnly: true })
  assert.deepEqual(rendered.errors.map((error) => error.message), [], 'loading 态不应有渲染错误')
  assert.match(rendered.html, /正在读取宿主数据|Reading host data/, 'loading 态应显示加载文案')
})
