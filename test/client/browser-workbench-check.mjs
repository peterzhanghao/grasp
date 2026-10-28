/**
 * 开发期真实浏览器联调（假宿主 + Chromium）：证据尺度实验/预测/任务草案。
 * 仅 client 组自查，不是验收证据。运行：node test/client/browser-workbench-check.mjs
 */

import { startDevServer } from '../harness/dev-server.mjs'
import { createLlmFixture } from '../harness/llm-fixture.mjs'

const PLAYWRIGHT_PATH = 'file:///C:/Users/22878/AppData/Roaming/npm/node_modules/playwright/index.mjs'
const playwright = (await import(PLAYWRIGHT_PATH)).default

const results = []
function check(id, ok, detail) {
  results.push({ id, ok, detail })
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${id}${detail === undefined ? '' : ' :: ' + JSON.stringify(detail)}`)
}

const llm = createLlmFixture()
const started = await startDevServer({ seed: true, llm })
const host = started.host
await host.op('view.save', { scale: 'evidence', projection: 'theory', selectedNodeId: 'delay', selectedRelationId: null })
const browser = await playwright.chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push('pageerror: ' + error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push('console: ' + message.text())
})

try {
  await page.goto(started.url, { waitUntil: 'load' })
  await page.waitForFunction(() => document.querySelector('.la-root'), { timeout: 15000 })
  await page.waitForTimeout(900)
  check('evidence-scale', (await page.locator('.la-scale--evidence').count()) === 1)

  // 1) 延迟实验：运行 → 判定/判据/运行记录来自宿主
  const runButton = page.getByRole('button', { name: /^运行$/ }).first()
  check('experiment-run-button', (await runButton.count()) >= 1)
  await runButton.click()
  await page.waitForSelector('.la-expresult', { timeout: 15000 })
  const exp = await page.evaluate(() => ({
    verdict: document.querySelector('.la-expresult__label')?.innerText,
    criterion: document.querySelector('.la-expresult__criterion')?.innerText?.slice(0, 60),
    trace: document.querySelectorAll('.la-trace__svg').length,
    runSaved: document.querySelector('.la-expresult__meta')?.innerText?.includes('运行记录已由宿主保存'),
  }))
  check('experiment-result', !!exp.verdict && exp.trace >= 1 && exp.runSaved, exp)
  const stateAfterRun = await (await host.get('/api/loop-atlas/state')).body
  const runCount = Object.keys(stateAfterRun.store.experiments || {}).length
  check('experiment-run-persisted', runCount >= 1, { runCount, verdict: exp.verdict })

  // 2) 预测：保存 → 记录判定
  await page.getByRole('button', { name: /写一条预测/ }).first().click()
  await page.waitForTimeout(300)
  const predTextarea = page.locator('.la-formcard textarea').first()
  await predTextarea.fill('D=1.2 时同一增益会持续穿越目标')
  const resolveByInput = page.locator('.la-formcard input').first()
  await resolveByInput.fill('延迟实验判定为 oscillating')
  await page.getByRole('button', { name: /保存预测/ }).first().click()
  await page.waitForTimeout(1200)
  const predictionVisible = await page.locator('.la-pred').filter({ hasText: '持续穿越目标' }).count()
  check('prediction-saved', predictionVisible >= 1, { predictionVisible })
  const stateAfterPrediction = await (await host.get('/api/loop-atlas/state')).body
  const prediction = Object.values(stateAfterPrediction.store.predictions || {}).find((item) => String(item.text).includes('持续穿越目标'))
  check('prediction-persisted', !!prediction && prediction.status === 'open', prediction && { id: prediction.id, status: prediction.status })

  const predCard = page.locator('.la-pred').filter({ hasText: '持续穿越目标' }).first()
  await predCard.getByRole('button', { name: /记录判定/ }).click()
  await page.waitForTimeout(300)
  await predCard.locator('.la-pred__form .la-chip').filter({ hasText: '支持' }).first().click()
  await predCard.locator('.la-pred__form input').fill('依据延迟实验运行记录')
  await predCard.locator('.la-pred__form').getByRole('button', { name: /记录判定/ }).click()
  await page.waitForTimeout(1200)
  const stateAfterResolve = await (await host.get('/api/loop-atlas/state')).body
  const resolved = Object.values(stateAfterResolve.store.predictions || {}).find((item) => String(item.text).includes('持续穿越目标'))
  check('prediction-resolve', resolved && resolved.status === 'supported', resolved && { status: resolved.status, note: resolved.resolutionNote })

  // 3) 任务草案：真实请求 → 模型 JSON → 三栏可编辑 → 保存
  llm.enqueueSuccess(
    JSON.stringify({
      title: '验收等待观测窗口',
      goal: '完成判定只在观测窗口结束后发生。',
      acceptance: [{ text: '窗口未结束时不得报告完成', evidence: '延迟实验复跑判定一致' }],
      boundary: ['不修改宿主权限配置', '不自动发送草案到外部工具'],
      unknowns: [{ question: '观测窗口由谁定义？' }, { question: '窗口长度按什么条件决定？' }],
      conceptIds: ['delay', 'stability'],
    }),
  )
  await page.getByRole('button', { name: /新建任务草案/ }).first().click()
  await page.waitForTimeout(400)
  const requestBox = page.locator('.la-taskstart textarea').first()
  await requestBox.fill('我的智能体在测试还没稳定时就宣告完成，希望它等到观测窗口结束再验收。')
  await page.getByRole('button', { name: /生成可编辑草案/ }).click()
  await page.waitForSelector('.la-taskform', { timeout: 20000 })
  const draftState = await page.evaluate(() => ({
    title: document.querySelector('.la-taskform input')?.value,
    columns: document.querySelectorAll('.la-taskcol').length,
    acceptances: document.querySelectorAll('.la-taskcol input[aria-label^="验收"]').length,
    unknowns: document.querySelectorAll('.la-taskblock input').length,
    concepts: document.querySelectorAll('.la-chips .la-chip').length,
  }))
  check('task-draft-generated', draftState.columns === 3 && draftState.acceptances >= 1 && draftState.concepts >= 1, draftState)
  await page.getByRole('button', { name: /^保存草案$/ }).first().click()
  await page.waitForSelector('.la-taskeditor--saved', { timeout: 15000 })
  const savedState = await page.evaluate(() => ({
    title: document.querySelector('.la-taskeditor__title')?.innerText,
    status: [...document.querySelectorAll('.la-taskeditor .la-tag')].map((item) => item.innerText),
    notSent: document.body.innerText.includes('不会自动发送'),
  }))
  check('task-saved-view', !!savedState.title && savedState.notSent, savedState)
  const stateAfterTask = await (await host.get('/api/loop-atlas/state')).body
  const taskCount = Object.keys(stateAfterTask.store.tasks || {}).length
  check('task-persisted', taskCount >= 1, { taskCount })

  // 4) 实践视角在中间区较窄时不能溢出裁剪（Lead 在真实 1941px 窗口发现的问题）
  await page.getByRole('button', { name: /^问题$/ }).first().click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: /^实践$/ }).first().click()
  await page.waitForTimeout(500)
  const practice = await page.evaluate(() => {
    const grid = document.querySelector('.la-practice')
    if (!grid) return { found: false }
    const gridRect = grid.getBoundingClientRect()
    const columns = [...grid.querySelectorAll('.la-practice__stage')].map((item) => {
      const rect = item.getBoundingClientRect()
      return { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }
    })
    return {
      found: true,
      scrollWidth: grid.scrollWidth,
      clientWidth: grid.clientWidth,
      gridWidth: Math.round(gridRect.width),
      columns,
      overflow: grid.scrollWidth > grid.clientWidth + 1,
      clipped: columns.filter((item) => item.right > Math.round(gridRect.right) + 1).length,
      columnCount: columns.length,
    }
  })
  check('practice-no-overflow', practice.found && !practice.overflow && practice.clipped === 0 && practice.columnCount >= 6, practice)
} catch (error) {
  check('workbench-run', false, String((error && error.message) || error))
} finally {
  await page.screenshot({ path: 'test/client/debug-workbench.png' })
  check('no-console-errors', errors.length === 0, errors.slice(0, 4))
  await browser.close()
  await started.stop?.()
}

const failed = results.filter((item) => !item.ok)
console.log(`\n工作台联调：PASS ${results.length - failed.length} / FAIL ${failed.length}`)
process.exit(failed.length ? 1 : 0)
