/**
 * 开发期真实浏览器联调（假宿主 + Chromium）：对话流式/停止/失败重试/草案采纳/主题隔离。
 * 不是验收证据；仅用于 client 组自查。运行：node test/client/browser-chat-check.mjs
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
  await page.waitForTimeout(700)

  // 选中关系 A 作为对话 subject
  await page.locator('.la-relchip').first().click()
  await page.waitForTimeout(400)
  const subjectA = await page.locator('.la-partner__subjectname').innerText()

  // 1) 流式 + 停止
  llm.enqueueSlow('这是一段应该被中途停止的长回答，用来验证停止按钮与取消回执。', { chunkSize: 2, chunkDelayMs: 120 })
  await page.locator('.la-chat__input').fill('慢速问题：请详细解释')
  await page.getByRole('button', { name: /^发送$/ }).click()
  await page.waitForTimeout(450)
  check('chat-streaming-visible', (await page.locator('.la-msg.is-streaming').count()) >= 1, {
    streaming: await page.locator('.la-msg.is-streaming').count(),
  })
  const stopButton = page.getByRole('button', { name: /^停止$/ }).first()
  check('chat-stop-button', (await stopButton.count()) === 1)
  await stopButton.click()
  await page.waitForTimeout(1800)
  const afterStop = await page.evaluate(() => ({
    streaming: document.querySelectorAll('.la-msg.is-streaming').length,
    cancelled: [...document.querySelectorAll('.la-msg')].some((item) => item.innerText.includes('已停止')),
    receipt: document.querySelector('.la-statusbar__receipt')?.innerText || '',
  }))
  check('chat-stop-cancelled', afterStop.streaming === 0 && afterStop.cancelled, afterStop)

  // 2) 失败 + 重试
  llm.enqueueFailure({ code: 'RATE_LIMIT', message: '限流（fixture）' })
  llm.enqueueSuccess('重试成功：延迟会改变同一增益的判定。', { chunkSize: 8 })
  await page.locator('.la-chat__input').fill('失败重试问题')
  await page.getByRole('button', { name: /^发送$/ }).click()
  await page.waitForFunction(
    () => [...document.querySelectorAll('.la-msg')].some((item) => item.innerText.includes('LLM_RATE_LIMIT')),
    { timeout: 15000 },
  )
  const failure = await page.evaluate(() => ({
    code: [...document.querySelectorAll('.la-msg')].some((item) => item.innerText.includes('LLM_RATE_LIMIT')),
    retry: [...document.querySelectorAll('button')].some((item) => item.innerText.trim() === '重试'),
  }))
  check('chat-failure-real-code', failure.code && failure.retry, failure)
  const retryButton = page.getByRole('button', { name: /^重试$/ }).first()
  await retryButton.click()
  await page.waitForFunction(
    () => [...document.querySelectorAll('.la-msg--assistant')].some((item) => item.innerText.includes('重试成功')),
    { timeout: 20000 },
  )
  check('chat-retry-completed', true)

  // 3) 采纳 AI 回复为草案
  const adopt = page.getByRole('button', { name: /存为我的证据/ }).first()
  check('chat-adopt-button', (await adopt.count()) >= 1)
  await adopt.click()
  await page.waitForTimeout(900)
  const adopted = await page.getByRole('button', { name: /已存为草案/ }).count()
  check('chat-adopt-state', adopted >= 1, { adopted })
  await page.getByRole('tab', { name: /笔记/ }).first().click()
  await page.waitForTimeout(400)
  const notesText = await page.locator('.la-notes').innerText()
  check('note-source-ai-draft', notesText.includes('AI 草案'), { length: notesText.length })

  // 4) 切主题：B 的对话不串 A 的内容
  await page.getByRole('tab', { name: /对话/ }).first().click()
  await page.waitForTimeout(300)
  const nodeButton = page.locator('.la-gnode--neighbor').first()
  if (await nodeButton.count()) {
    const textBefore = await page.locator('.la-chat__list').innerText()
    await nodeButton.click()
    await page.waitForTimeout(600)
    const subjectB = await page.locator('.la-partner__subjectname').innerText()
    const textB = await page.locator('.la-chat__list').innerText()
    check('chat-subject-isolation', subjectB !== subjectA && textB !== textBefore, {
      subjectA,
      subjectB,
      sameText: textB === textBefore,
    })
  } else {
    check('chat-subject-isolation', false, '找不到邻居节点可切换')
  }

  // 5) 草稿按 subject 隔离
  await page.locator('.la-chat__input').fill('B 的草稿')
  await page.waitForTimeout(200)
  const relationChip = page.locator('.la-relchip').first()
  if (await relationChip.count()) {
    await relationChip.click()
    await page.waitForTimeout(500)
  }
  const draftA = await page.locator('.la-chat__input').inputValue()
  check('chat-draft-isolation', draftA !== 'B 的草稿', { draftA })
} catch (error) {
  check('browser-chat-run', false, String((error && error.message) || error))
} finally {
  await page.screenshot({ path: 'test/client/debug-chat.png' })
  check('no-console-errors', errors.length === 0, errors.slice(0, 4))
  await browser.close()
  await started.stop?.()
}

const failed = results.filter((item) => !item.ok)
console.log(`\n对话联调：PASS ${results.length - failed.length} / FAIL ${failed.length}`)
process.exit(failed.length ? 1 : 0)
