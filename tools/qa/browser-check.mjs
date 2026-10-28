#!/usr/bin/env node
/**
 * R2/R5 开发期浏览器检查（假宿主 + 真实 Chromium；不是实机验收）。
 *
 * 页面由 test/harness/dev-server.mjs 提供：
 *   - 真实 Host 逻辑（index.js apply 后的 HTTP 路由 + 临时数据目录）
 *   - 构建产物 client.js
 *   - react-lite（开发期最小 React 兼容运行时）+ 平台桩
 *
 * 检查：三尺度切换、问题尺度 3—7 邻居与字号、关系选中与详情、资料与备份弹层
 * （dialog 语义 / Escape / 焦点归还）、键盘 Tab、1024/390 布局、200% 缩放、浅/深色对比、
 * i18n 原始 key 泄漏、控制台错误；输出截图与 JSON 报告到 tools/qa/evidence/browser/。
 *
 * 明确边界：这是"假宿主 + 真实浏览器"的开发期证据，不能替代在真实 DeepSeek Harness
 * 里的实机视觉验收（见 docs/acceptance.md 的"真实应用验证"一节）。
 *
 * 用法：node tools/qa/browser-check.mjs [--headful] [--no-browser]
 */
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startDevServer } from '../../test/harness/dev-server.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const EVIDENCE_DIR = join(HERE, 'evidence', 'browser')
const PLAYWRIGHT_PATH = 'file:///C:/Users/22878/AppData/Roaming/npm/node_modules/playwright/index.mjs'

const results = []
function record(id, ok, title, detail) {
  results.push({ id, ok, title, detail: detail === undefined ? null : detail, at: new Date().toISOString() })
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${id} ${title}${ok ? '' : ' :: ' + JSON.stringify(detail)}`)
}

async function loadPlaywright() {
  try {
    const module = await import(PLAYWRIGHT_PATH)
    return module.default || module
  } catch (error) {
    console.log('未找到可用的 Playwright：' + String(error?.message || error))
    return null
  }
}

function parseColor(color) {
  const match = /rgba?\(([^)]+)\)/.exec(String(color))
  if (!match) return null
  const parts = match[1].split(',').map((value) => Number(value.trim()))
  if (parts.length < 3 || parts.some((value) => Number.isNaN(value))) return null
  return [parts[0], parts[1], parts[2]]
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(foreground, background) {
  const fg = parseColor(foreground)
  const bg = parseColor(background)
  if (!fg || !bg) return null
  const lighter = Math.max(luminance(fg), luminance(bg))
  const darker = Math.min(luminance(fg), luminance(bg))
  return (lighter + 0.05) / (darker + 0.05)
}

async function main() {
  const useBrowser = !process.argv.includes('--no-browser')
  const headful = process.argv.includes('--headful')
  const started = await startDevServer({ seed: true })
  const host = started.host
  const state = await host.get('/api/loop-atlas/state')
  const body = state.body || {}
  const core = body.core || {}
  const nodes = core.nodes || []
  const relations = core.relations || []
  const node = nodes.find((item) => item.id === body.store?.view?.selectedNodeId) || nodes.find((item) => item.id === 'feedback') || nodes[0] || {}
  const neighborCount = relations.filter((relation) => relation.from === node.id || relation.to === node.id).length
  await mkdir(EVIDENCE_DIR, { recursive: true })

  let browser = null
  try {
    if (useBrowser) {
      const playwright = await loadPlaywright()
      if (!playwright) {
        record('B0', false, '加载 Playwright', '本机全局 node_modules 没有可用 playwright，无法做真实浏览器检查')
      } else {
        try {
          browser = await playwright.chromium.launch({ headless: !headful })
        } catch (error) {
          record('B0', false, '启动 Chromium', String(error?.message || error))
        }
      }
    }
    if (browser) {
      await runBrowserChecks(browser, started.url, { core, node, neighborCount, host })
    } else if (useBrowser) {
      record('B1', false, '浏览器检查', '浏览器不可用（见 B0）')
    }
  } finally {
    if (browser) await browser.close().catch(() => {})
    await started.close().catch(() => {})
  }

  const report = {
    at: new Date().toISOString(),
    mode: '假宿主（test/harness）+ 真实 Chromium（开发期检查，非实机验收）',
    devServer: started.url,
    dataPath: body.dataPath,
    contentVersion: body.contentVersion,
    results,
  }
  await writeFile(join(EVIDENCE_DIR, 'browser-report.json'), JSON.stringify(report, null, 2), 'utf8')
  const failed = results.filter((item) => !item.ok).length
  console.log(`\n浏览器检查：PASS ${results.length - failed} / FAIL ${failed}`)
  console.log('证据目录：' + EVIDENCE_DIR)
  return failed > 0 ? 1 : 0
}

async function newPage(browser, { width, height, colorScheme }) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme,
    deviceScaleFactor: 2,
    locale: 'zh-CN',
  })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(String(error.message || error)))
  return { context, page, consoleErrors }
}

async function bootPage(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 20000 })
  await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0 && document.querySelector('.la-root'), { timeout: 15000 })
  await page.waitForTimeout(900)
}

async function snapshotDiagnostics(page) {
  return page.evaluate(() => {
    const root = document.querySelector('.la-root')
    const innerText = root ? root.innerText : ''
    const rawKeys = [...new Set((innerText.match(/loop\.[a-zA-Z0-9_.]+/g) || []).filter((key) => !key.endsWith('.')))]
    const devState = window.__PLUGIN_DEV_STATE__ || {}
    return {
      devErrors: (window.__DEV_ERRORS__ || []).slice(0, 10),
      reactErrors: (window.__REACT_LITE_ERRORS__ || []).slice(0, 10),
      unknownServices: (window.__DEV_UNKNOWNS__ || []).slice(0, 20),
      slots: (devState.slots || []).map((slot) => slot.name),
      effectCount: devState.effectCount || 0,
      rawKeys,
      textLength: innerText.length,
      activeScales: [...document.querySelectorAll('[aria-pressed="true"]')].map((element) => (element.innerText || '').trim()).filter(Boolean),
      nodeLabels: document.querySelectorAll('.la-gnode').length,
      neighborLabels: document.querySelectorAll('.la-gnode--neighbor').length,
    }
  })
}

async function runBrowserChecks(browser, url, contextData) {
  const scenarios = [
    { name: '1440-light', width: 1440, height: 900, colorScheme: 'light' },
    { name: '1440-dark', width: 1440, height: 900, colorScheme: 'dark' },
    { name: '1024-light', width: 1024, height: 800, colorScheme: 'light' },
    { name: '390-light', width: 390, height: 844, colorScheme: 'light' },
  ]
  const summaries = {}

  for (const scenario of scenarios) {
    const { context, page, consoleErrors } = await newPage(browser, scenario)
    try {
      // 每个场景都从"问题尺度 + 选中入口节点"开始，避免上一个场景的 view 持久化影响断言
      await contextData.host.op('view.save', {
        scale: 'subject',
        projection: 'theory',
        selectedNodeId: contextData.node.id,
        selectedRelationId: null,
      })
      await bootPage(page, url)
      const diagnostics = await snapshotDiagnostics(page)
      summaries[scenario.name] = { diagnostics, consoleErrors }

      record(
        `R2-${scenario.name}-render`,
        diagnostics.devErrors.length === 0 && diagnostics.reactErrors.length === 0 && diagnostics.textLength > 300,
        `${scenario.name} 首屏渲染成功（无 dev/react 错误、有正文）`,
        { devErrors: diagnostics.devErrors, reactErrors: diagnostics.reactErrors, textLength: diagnostics.textLength },
      )
      record(
        `R2-${scenario.name}-slots`,
        diagnostics.slots.includes('main') && diagnostics.slots.includes('settings.section') && diagnostics.slots.includes('sidebar.footer.action'),
        `${scenario.name} 三个槽位都注册`,
        diagnostics.slots,
      )
      record(
        `R2-${scenario.name}-no-console-error`,
        consoleErrors.length === 0,
        `${scenario.name} 浏览器控制台无错误`,
        consoleErrors.slice(0, 5),
      )
      record(
        `R5-${scenario.name}-no-raw-i18n`,
        diagnostics.rawKeys.length === 0,
        `${scenario.name} 界面没有泄漏 i18n 原始 key`,
        diagnostics.rawKeys,
      )

      const layout = await page.evaluate(() => {
        const root = document.querySelector('.la-root')
        const doc = document.documentElement
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          rootColor: root ? getComputedStyle(root).color : null,
          rootBg: root ? getComputedStyle(root).backgroundColor : null,
          hasLaPrefix: !!document.querySelector('[class*="la-"]'),
        }
      })
      summaries[scenario.name].layout = layout
      record(
        `R2-${scenario.name}-no-h-overflow`,
        layout.scrollWidth <= layout.clientWidth + 2,
        `${scenario.name} 无横向溢出`,
        layout,
      )
      const contrast = contrastRatio(layout.rootColor, layout.rootBg)
      record(
        `R2-${scenario.name}-contrast`,
        contrast !== null && contrast >= 4.5,
        `${scenario.name} 正文对比度 ≥ 4.5:1`,
        { contrast: contrast && Number(contrast.toFixed(2)), color: layout.rootColor, bg: layout.rootBg },
      )

      // 问题尺度：3—7 个邻居 + 字号（首屏默认问题尺度）
      const initialScale = diagnostics.activeScales.includes('问题') ? 'subject' : diagnostics.activeScales[0] || 'unknown'
      summaries[scenario.name].initialScale = initialScale
      if (initialScale === 'subject') {
        record(
          `R2-${scenario.name}-neighbors`,
          diagnostics.neighborLabels >= 3 && diagnostics.neighborLabels <= 7,
          `${scenario.name} 问题尺度默认 3—7 个邻居`,
          { neighborLabels: diagnostics.neighborLabels, totalNodes: diagnostics.nodeLabels, expectedFromCore: contextData.neighborCount },
        )
        const fontInfo = await page.evaluate(() => {
          const elements = [...document.querySelectorAll('.la-gnode__title')]
          return elements.map((element) => ({
            text: (element.textContent || '').trim().slice(0, 20),
            fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
          }))
        })
        record(
          `R2-${scenario.name}-font-size`,
          fontInfo.length > 0 && fontInfo.every((item) => item.fontSize >= 12) && fontInfo.some((item) => item.fontSize >= 14),
          `${scenario.name} 节点标题字号 ≥12px（标题级 ≥14px，不随图缩放）`,
          fontInfo,
        )
        await page.screenshot({ path: join(EVIDENCE_DIR, `${scenario.name}-subject.png`) })

        // 窄屏图谱可读性：节点卡片/关系标签是否大面积互相遮挡（R2 观察项）
        const overlap = await page.evaluate(() => {
          const rects = (selector) =>
            [...document.querySelectorAll(selector)].map((element) => {
              const rect = element.getBoundingClientRect()
              return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }
            })
          const countOverlaps = (items) => {
            let pairs = 0
            for (let i = 0; i < items.length; i += 1) {
              for (let j = i + 1; j < items.length; j += 1) {
                const a = items[i]
                const b = items[j]
                const width = Math.min(a.right, b.right) - Math.max(a.left, b.left)
                const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
                if (width <= 0 || height <= 0) continue
                const overlapArea = width * height
                const smaller = Math.min(a.width * a.height, b.width * b.height)
                if (smaller > 0 && overlapArea / smaller > 0.3) pairs += 1
              }
            }
            return pairs
          }
          return { nodeOverlaps: countOverlaps(rects('.la-gnode')), chipOverlaps: countOverlaps(rects('.la-relchip')) }
        })
        summaries[scenario.name].overlap = overlap
        if (scenario.name.startsWith('390')) {
          record(
            'R2-390-overlap',
            overlap.nodeOverlaps === 0 && overlap.chipOverlaps === 0,
            '390 窄屏图谱节点/关系标签没有大面积互相遮挡（假宿主浏览器观察）',
            overlap,
          )
        }
      }

      // 关系选中：点关系 chip → 详情出现主张/条件/代价，且 view.save 回执持久化（必须在问题尺度）
      const chips = page.locator('.la-relchip')
      const chipCount = await chips.count()
      let relationOk = false
      let relationDetail = null
      if (chipCount > 0) {
        // 窄屏图上关系标签可能互相遮挡（这本身是 R2 观察项），用 force 点击验证选中逻辑仍可达
        await chips.first().click({ timeout: 3000 }).catch(async () => {
          await chips.first().click({ timeout: 3000, force: true }).catch(() => {})
        })
        await page.waitForTimeout(450)
        // 窄屏用 图/阅读/对话 分段展示：关系详情在"阅读"段，需要切过去再断言
        if (scenario.name.startsWith('390')) {
          const readSegment = page.getByRole('button', { name: /^阅读$/ }).first()
          if (await readSegment.count()) {
            await readSegment.click({ timeout: 3000 }).catch(() => {})
            await page.waitForTimeout(400)
          }
        }
        relationDetail = await page.evaluate(() => {
          const inspector = document.querySelector('.la-inspector')
          const text = inspector ? inspector.innerText : ''
          return {
            hasClaim: text.includes('这条关系断言什么'),
            hasCondition: text.includes('在什么条件下成立'),
            hasCost: text.includes('相信或使用它的代价'),
            textLength: text.length,
          }
        })
        const latest = (await contextData.host.get('/api/loop-atlas/state')).body
        relationOk = relationDetail.hasClaim && relationDetail.hasCondition && relationDetail.hasCost && !!latest.store?.view?.selectedRelationId
        summaries[scenario.name].relation = { relationDetail, persisted: latest.store?.view?.selectedRelationId }
        if (scenario.name === '1440-light') {
          await page.screenshot({ path: join(EVIDENCE_DIR, '1440-light-relation.png') })
        }
      }
      record(`R2-${scenario.name}-relation`, relationOk, `${scenario.name} 关系可选中并显示主张/条件/代价`, { chipCount, ...relationDetail })

      // 列表视图（图谱的可访问替代）：切到列表能看到节点/关系列表，再切回图谱
      if (scenario.name.startsWith('390')) {
        const graphSegment = page.getByRole('button', { name: /^图$/ }).first()
        if (await graphSegment.count()) {
          await graphSegment.click({ timeout: 3000 }).catch(() => {})
          await page.waitForTimeout(300)
        }
      }
      const listButton = page.getByRole('button', { name: /^列表$/ }).first()
      let listViewOk = false
      let listViewDetail = null
      if (await listButton.count()) {
        await listButton.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(400)
        listViewDetail = await page.evaluate(() => ({
          listview: !!document.querySelector('.la-listview'),
          rows: document.querySelectorAll('.la-listrow').length,
        }))
        listViewOk = listViewDetail.listview && listViewDetail.rows >= 3
        if (scenario.name === '1440-light') {
          await page.screenshot({ path: join(EVIDENCE_DIR, '1440-light-listview.png') })
        }
        const graphButton = page.getByRole('button', { name: /^图谱$/ }).first()
        if (await graphButton.count()) {
          await graphButton.click({ timeout: 3000 }).catch(() => {})
          await page.waitForTimeout(300)
        }
      }
      record(`R2-${scenario.name}-listview`, listViewOk, `${scenario.name} 提供列表视图替代图谱`, listViewDetail)

      // 三尺度切换 + 每尺度截图（仅 1440-light 存全部截图）
      const scaleResults = []
      for (const label of ['领域', '问题', '证据']) {
        const button = page.getByRole('button', { name: new RegExp('^' + label + '$') }).first()
        const count = await button.count()
        if (!count) {
          scaleResults.push({ label, found: false })
          continue
        }
        await button.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(450)
        const after = await snapshotDiagnostics(page)
        scaleResults.push({ label, found: true, activeScales: after.activeScales, nodes: after.nodeLabels, neighbors: after.neighborLabels, textLength: after.textLength })
        if (scenario.name === '1440-light') {
          await page.screenshot({ path: join(EVIDENCE_DIR, `1440-light-${label}.png`) })
        }
      }
      summaries[scenario.name].scaleResults = scaleResults
      const domainOk = (scaleResults.find((item) => item.label === '领域')?.activeScales || []).includes('领域')
      const evidenceOk = (scaleResults.find((item) => item.label === '证据')?.activeScales || []).includes('证据')
      const backToSubject = (scaleResults.find((item) => item.label === '问题')?.activeScales || []).includes('问题')
      record(
        `R2-${scenario.name}-scales`,
        domainOk && evidenceOk && backToSubject,
        `${scenario.name} 领域/问题/证据三尺度可来回切换`,
        scaleResults,
      )

      // 视角切换：理论 / 历史 / 实践（问题尺度下）
      const subjectButton = page.getByRole('button', { name: /^问题$/ }).first()
      if (await subjectButton.count()) {
        await subjectButton.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(350)
      }
      const projectionResults = []
      for (const label of ['理论', '历史', '实践']) {
        const button = page.getByRole('button', { name: new RegExp('^' + label + '$') }).first()
        if (!(await button.count())) {
          projectionResults.push({ label, found: false })
          continue
        }
        await button.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(450)
        const text = await page.evaluate(() => (document.querySelector('.la-root')?.innerText || ''))
        const keywords = { 理论: ['先修', '设计取舍'], 历史: ['时间不确定', '历史', '年代'], 实践: ['目标', '验收', '修订'] }
        projectionResults.push({
          label,
          found: true,
          textLength: text.length,
          keywordHits: (keywords[label] || []).filter((keyword) => text.includes(keyword)),
        })
        if (scenario.name === '1440-light') {
          await page.screenshot({ path: join(EVIDENCE_DIR, `1440-light-projection-${label}.png`) })
        }
      }
      summaries[scenario.name].projectionResults = projectionResults
      const projectionOk = projectionResults.every((item) => item.found && item.keywordHits.length >= 1)
      record(
        `R2-${scenario.name}-projections`,
        projectionOk,
        `${scenario.name} 理论/历史/实践三视角可切换且各有关键结构`,
        projectionResults,
      )

      // 资料与备份弹层：dialog 语义、Escape 关闭、焦点归还
      const resourceButton = page.getByRole('button', { name: /资料与备份/ }).first()
      let modalOk = false
      let modalDetail = null
      if (await resourceButton.count()) {
        await resourceButton.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(500)
        modalDetail = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]')
          const overlay = document.querySelector('.la-overlay')
          return {
            hasDialogRole: !!dialog,
            hasOverlay: !!overlay,
            text: (dialog ? dialog.innerText : '').slice(0, 160),
            activeBeforeEscape: document.activeElement ? String(document.activeElement.className || document.activeElement.tagName) : null,
          }
        })
        await page.keyboard.press('Escape')
        await page.waitForTimeout(450)
        const afterEscape = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]')
          const active = document.activeElement
          return {
            dialogGone: !dialog,
            activeClass: active ? String(active.className || active.tagName) : null,
            activeText: active ? (active.innerText || '').trim().slice(0, 20) : null,
          }
        })
        modalOk = modalDetail.hasDialogRole && afterEscape.dialogGone && String(afterEscape.activeText || '').includes('资料与备份')
        modalDetail.afterEscape = afterEscape
        if (scenario.name === '1440-light') {
          await page.screenshot({ path: join(EVIDENCE_DIR, '1440-light-resources-after-escape.png') })
        }
      }
      record(`R2-${scenario.name}-modal`, modalOk, `${scenario.name} 资料与备份弹层有 dialog 语义且 Escape 可关闭`, modalDetail)

      // 键盘可达：Tab 遍历，焦点可见
      await page.evaluate(() => document.body.focus && document.body.focus())
      const focusTrail = []
      for (let index = 0; index < 26; index += 1) {
        await page.keyboard.press('Tab')
        const focused = await page.evaluate(() => {
          const element = document.activeElement
          if (!element || element === document.body) return null
          const style = getComputedStyle(element)
          return {
            tag: element.tagName,
            text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 30),
            className: String(typeof element.className === 'string' ? element.className : '').slice(0, 60),
            outline: style.outlineStyle,
            boxShadow: style.boxShadow,
          }
        })
        if (focused) focusTrail.push(focused)
      }
      const distinctFocus = new Set(focusTrail.map((item) => item.tag + '|' + item.text)).size
      const focusVisible = focusTrail.some((item) => item.outline !== 'none' || (item.boxShadow && item.boxShadow !== 'none'))
      summaries[scenario.name].keyboard = { distinctFocus, focusVisible, sample: focusTrail.slice(0, 8) }
      record(
        `R2-${scenario.name}-keyboard`,
        distinctFocus >= 10 && focusVisible,
        `${scenario.name} 键盘 Tab 可遍历且焦点可见`,
        { distinctFocus, focusVisible, sample: focusTrail.slice(0, 6) },
      )
    } catch (error) {
      record(`R2-${scenario.name}-exception`, false, `${scenario.name} 检查异常`, String((error && error.stack) || error))
      await page.screenshot({ path: join(EVIDENCE_DIR, `${scenario.name}-error.png`) }).catch(() => {})
    } finally {
      await context.close().catch(() => {})
    }
  }

  // 浅/深色确实不同
  const light = summaries['1440-light']?.layout
  const dark = summaries['1440-dark']?.layout
  record(
    'R5-theme',
    !!light && !!dark && light.rootBg !== dark.rootBg && light.rootColor !== dark.rootColor,
    '浅/深色主题确实不同（宿主 token）',
    { light: light && [light.rootBg, light.rootColor], dark: dark && [dark.rootBg, dark.rootColor] },
  )

  // 1024 与窄屏：主体仍可操作（分段控件存在、无溢出已查）
  const narrow = summaries['390-light']
  if (narrow) {
    const narrowInfo = await (async () => {
      const { context, page } = await newPage(browser, { width: 390, height: 844, colorScheme: 'light' })
      try {
        await bootPage(page, url)
        const info = await page.evaluate(() => {
          const text = document.querySelector('.la-root')?.innerText || ''
          const segmented = ['图', '阅读', '对话'].filter((label) => text.split('\n').some((line) => line.trim() === label))
          const doc = document.documentElement
          return { segmented, scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth }
        })
        await page.screenshot({ path: join(EVIDENCE_DIR, '390-light-narrow.png') })
        return info
      } finally {
        await context.close().catch(() => {})
      }
    })()
    record(
      'R2-narrow-390',
      narrowInfo.segmented.length === 3 && narrowInfo.scrollWidth <= narrowInfo.clientWidth + 2,
      '窄屏 390 有 图/阅读/对话 分段且无横向溢出',
      narrowInfo,
    )
  }

  // 200% 缩放
  const { context: zoomContext, page: zoomPage } = await newPage(browser, { width: 1440, height: 900, colorScheme: 'light' })
  try {
    await bootPage(zoomPage, url)
    await zoomPage.evaluate(() => {
      document.documentElement.style.zoom = '2'
    })
    await zoomPage.waitForTimeout(400)
    const zoomState = await zoomPage.evaluate(() => {
      const doc = document.documentElement
      const root = document.querySelector('.la-root')
      const buttons = [...document.querySelectorAll('button')].filter((button) => {
        const rect = button.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        visibleButtons: buttons.length,
        textLength: root ? root.innerText.length : 0,
      }
    })
    record('R2-zoom200', zoomState.textLength > 300 && zoomState.visibleButtons >= 5, '200% 缩放下主要操作仍可见', zoomState)
    await zoomPage.screenshot({ path: join(EVIDENCE_DIR, '1440-zoom200.png') })
  } catch (error) {
    record('R2-zoom200', false, '200% 缩放检查异常', String((error && error.message) || error))
  } finally {
    await zoomContext.close().catch(() => {})
  }

  const files = [
    '1440-light-subject.png',
    '1440-light-领域.png',
    '1440-light-证据.png',
    '1440-dark-subject.png',
    '1024-light-subject.png',
    '390-light-narrow.png',
    '1440-light-relation.png',
    '1440-light-resources-after-escape.png',
    '1440-zoom200.png',
  ]
  const sizes = {}
  for (const file of files) {
    try {
      sizes[file] = (await stat(join(EVIDENCE_DIR, file))).size
    } catch {
      sizes[file] = null
    }
  }
  console.log('截图：' + JSON.stringify(sizes, null, 1))
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    console.error('浏览器检查自身异常：', error)
    process.exitCode = 2
  })
