#!/usr/bin/env node
/**
 * 本地开发服务器（开发期检查专用，不是验收证据）。
 *
 * 做的事：
 * 1. 用假宿主 harness 启动真实 Host（index.js apply → 真实 HTTP 路由 + 临时数据目录）；
 * 2. 用 node:http 提供页面：假宿主平台桩 + react-lite（开发期最小 React 运行时）+ 构建产物 client.js；
 * 3. /api/* 反向代理到假宿主的真实路由（client 的 fetch 打到真实 Host 逻辑）；
 * 4. 可选 seed 少量演示数据（笔记/研究问题/预测/实验/任务/一段对话）。
 *
 * 页面顶部有"仅开发期检查"标识；截图与浏览器断言只能证明"假宿主 + 真实浏览器布局"，
 * 真实 DeepSeek Harness 内的视觉验收由 Lead 实机完成（见 docs/acceptance.md）。
 *
 * 用法：node test/harness/dev-server.mjs [--port 0] [--data-dir <dir>] [--no-seed] [--keep-alive]
 * 输出：DEV_SERVER_URL=http://127.0.0.1:<port>
 */
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startPlugin, makeTempDataDir, removeTempDir } from './fake-ctx.mjs'
import { createLlmFixture } from './llm-fixture.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const BROWSER_DIR = join(HERE, 'browser')
const PLUGIN_ROOT = join(HERE, '..', '..')
const CLIENT_FILE = join(PLUGIN_ROOT, 'client.js')
const CONTENT_TYPE = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const DEV_BANNER = '仅开发期检查 · 假宿主 + 假模型 · 不是验收证据'

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])
}

function pageHtml({ clientExists }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>掌控 dev-server · 仅开发期检查</title>
<style>
  :root {
    color-scheme: light dark;
    --dsw-alias-bg-base: #F3F5F8;
    --dsw-alias-bg-layer-1: #FFFFFF;
    --dsw-alias-bg-layer-2: #E9EDF3;
    --dsw-alias-bg-overlay: rgba(23, 35, 49, 0.08);
    --dsw-alias-border-l1: #D4DAE3;
    --dsw-alias-border-l2: #BFC7D4;
    --dsw-alias-brand-primary: #175CD3;
    --dsw-alias-label-primary: #172331;
    --dsw-alias-label-secondary: #536276;
    --dsw-alias-state-error-primary: #B42318;
    --dsw-alias-state-idle-primary: #536276;
    --dsw-alias-state-success-primary: #067647;
    --dsw-alias-state-warn-primary: #9B6300;
    --dsw-specific-sidebar-fill: #E4E9F0;
    --dsw-radius-xs: 4px;
    --dsw-radius-sm: 6px;
    --dsw-radius-md: 10px;
    --dsw-radius-lg: 14px;
    --dsw-radius-xl: 20px;
    --ds-transition-duration: 160ms;
    --dev-font: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --dsw-alias-bg-base: #0F141B;
      --dsw-alias-bg-layer-1: #161D27;
      --dsw-alias-bg-layer-2: #1E2734;
      --dsw-alias-bg-overlay: rgba(255, 255, 255, 0.08);
      --dsw-alias-border-l1: #2A3542;
      --dsw-alias-border-l2: #3A4757;
      --dsw-alias-brand-primary: #6EA0F8;
      --dsw-alias-label-primary: #E6ECF4;
      --dsw-alias-label-secondary: #9DAAB9;
      --dsw-alias-state-error-primary: #F97066;
      --dsw-alias-state-idle-primary: #9DAAB9;
      --dsw-alias-state-success-primary: #4ADE80;
      --dsw-alias-state-warn-primary: #FDB022;
      --dsw-specific-sidebar-fill: #121922;
    }
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    background: var(--dsw-alias-bg-base);
    color: var(--dsw-alias-label-primary);
    font-family: var(--dev-font);
    font-size: 16px;
    line-height: 1.7;
  }
  .host-shell { display: flex; height: 100vh; overflow: hidden; }
  .host-rail {
    width: 56px; flex: 0 0 56px; background: var(--dsw-specific-sidebar-fill);
    border-right: 1px solid var(--dsw-alias-border-l1);
    display: flex; flex-direction: column; align-items: center; gap: 12px; padding-top: 16px;
    color: var(--dsw-alias-label-secondary); font-size: 12px;
  }
  .host-rail .rail-dot { width: 28px; height: 28px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }
  .host-main-wrap { flex: 1 1 auto; display: flex; flex-direction: column; min-width: 0; }
  .host-topbar {
    height: 44px; flex: 0 0 44px; display: flex; align-items: center; gap: 12px;
    padding: 0 16px; border-bottom: 1px solid var(--dsw-alias-border-l1);
    color: var(--dsw-alias-label-secondary); font-size: 13px;
    background: var(--dsw-alias-bg-layer-1);
  }
  .host-topbar strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
  #dev-panel-badge { margin-left: auto; }
  #host-main { flex: 1 1 auto; min-height: 0; overflow: auto; position: relative; }
  #root { min-height: 100%; }
  .dev-banner {
    position: fixed; right: 12px; bottom: 12px; z-index: 9999;
    background: #9B6300; color: #FFF8E6; font-size: 12px; line-height: 1.4;
    padding: 6px 10px; border-radius: 6px; max-width: 340px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  }
  #dev-error {
    position: fixed; left: 72px; right: 24px; top: 56px; z-index: 9998;
    background: #B42318; color: #fff; padding: 10px 14px; border-radius: 8px;
    font: 12px/1.5 ui-monospace, Consolas, monospace; white-space: pre-wrap; max-height: 45vh; overflow: auto;
  }
  .dev-registrations {
    position: fixed; left: 72px; bottom: 12px; z-index: 9997;
    color: var(--dsw-alias-label-secondary); font-size: 11px; max-width: 60vw;
    background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1);
    padding: 3px 8px; border-radius: 6px;
  }
  .rl-error { color: #B42318; white-space: pre-wrap; font: 12px/1.5 ui-monospace, Consolas, monospace; padding: 12px; }
</style>
</head>
<body>
<div class="host-shell">
  <aside class="host-rail" aria-label="宿主侧栏桩">
    <div class="rail-dot" title="宿主侧栏（桩）"></div>
    <div class="rail-dot"></div>
    <div>桩</div>
  </aside>
  <div class="host-main-wrap">
    <header class="host-topbar">
      <strong>DeepSeek Harness</strong><span>· 假宿主桩（dev-server）</span>
      <span id="dev-panel-badge"></span>
    </header>
    <main id="host-main">
      <div id="root" data-testid="loop-atlas-root"></div>
    </main>
  </div>
</div>
<div id="dev-error" hidden></div>
<div class="dev-banner">${escapeHtml(DEV_BANNER)}</div>
<div id="dev-registrations" class="dev-registrations"></div>
${clientExists ? '<script src="/vendor/react-lite.js"></script>\n<script src="/vendor/platform-stub.js"></script>\n<script src="/client.js"></script>\n<script>window.__BOOT__ && window.__BOOT__.start()</script>' : '<script>document.getElementById("dev-error").hidden=false;document.getElementById("dev-error").textContent="client.js 尚未构建：在 D:\\\\plug-in\\\\loop-atlas 运行 node build/build-client.mjs 后刷新。"</script>'}
</body>
</html>`
}

export async function startDevServer(options = {}) {
  const dataDir = options.dataDir || (await makeTempDataDir('loop-atlas-dev'))
  const llm = options.llm || createLlmFixture()
  const host = await startPlugin({ dataDir, llm })
  if (options.seed !== false) {
    await seedData(host, llm).catch((error) => {
      console.warn('[dev-server] seed 失败（不影响页面）：' + String(error && error.message))
    })
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://dev.local')
      if (url.pathname === '/') {
        let clientExists = true
        try {
          await readFile(CLIENT_FILE)
        } catch (error) {
          clientExists = false
        }
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
        res.end(pageHtml({ clientExists }))
        return
      }
      if (url.pathname === '/vendor/react-lite.js' || url.pathname === '/vendor/platform-stub.js') {
        const file = join(BROWSER_DIR, url.pathname.split('/').pop())
        const text = await readFile(file, 'utf8')
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
        res.end(text)
        return
      }
      if (url.pathname === '/client.js') {
        const text = await readFile(CLIENT_FILE, 'utf8')
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
        res.end(text)
        return
      }
      if (url.pathname.startsWith('/api/')) {
        await proxyToHost(host, req, res)
        return
      }
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('dev-server 没有这个路径：' + url.pathname)
    } catch (error) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('dev-server 错误：' + String((error && error.stack) || error))
    }
  })

  await new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(options.port || 0, '127.0.0.1', () => resolvePromise())
  })
  const port = server.address().port
  const url = `http://127.0.0.1:${port}`
  return {
    url,
    port,
    host,
    dataDir,
    async close({ cleanupData = true } = {}) {
      await new Promise((resolvePromise) => {
        server.close(() => resolvePromise())
        server.closeAllConnections?.()
      })
      await host.dispose({ cleanupData: false }).catch(() => {})
      if (cleanupData) await removeTempDir(dataDir).catch(() => {})
    },
  }
}

function proxyToHost(host, req, res) {
  return new Promise((resolvePromise) => {
    const target = new URL(host.baseUrl)
    const proxyReq = http.request(
      {
        hostname: target.hostname,
        port: target.port,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: target.host },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
        proxyRes.pipe(res)
        proxyRes.on('end', resolvePromise)
        proxyRes.on('error', resolvePromise)
      },
    )
    proxyReq.on('error', (error) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, code: 'INTERNAL', error: 'dev-server 代理失败：' + String(error.message) }))
      }
      resolvePromise()
    })
    req.pipe(proxyReq)
  })
}

/** 演示数据：不用于断言数据正确性，只为让页面有内容可看。 */
async function seedData(host, llm) {
  const state = await host.get('/api/loop-atlas/state')
  if (state.status !== 200 || !state.body?.core || state.body.fatal) return
  const core = state.body.core
  const node = (core.nodes || []).find((item) => item.id === 'feedback') || (core.nodes || [])[0]
  if (!node) return
  const relation = (core.relations || [])[0] || null
  const subject = relation ? { kind: 'relation', id: relation.id } : { kind: 'node', id: node.id }
  const nodeSubject = { kind: 'node', id: node.id }

  await host.op('view.save', {
    scale: 'subject',
    projection: 'theory',
    selectedNodeId: relation ? null : node.id,
    selectedRelationId: relation ? relation.id : null,
    directoryOpen: true,
    rightOpen: true,
  })
  await host.op('note.save', { subject: nodeSubject, kind: '理解', text: '开发期演示笔记：先看目标量，再看反馈是否真的缩短偏差。', authorSource: 'user', savedBy: 'ui' })
  const investigation = await host.op('investigation.save', {
    subject: nodeSubject,
    title: '延迟如何改变纠正效果',
    claim: '延迟足够大时，同一增益的反馈会从收敛变成振荡。',
    counter: '也可能只是采样窗口太短，看起来像振荡。',
    nextTest: '固定 K，比较 D=0.2 与 D=1.5 的末段振幅。',
  })
  const investigationId = investigation.body?.investigation?.id
  if (investigationId) {
    await host.op('prediction.save', {
      subject: nodeSubject,
      investigationId,
      text: 'K=3、D=1.5 时末段仍在振荡，不再收敛。',
      resolveBy: 'lastAmplitude ≥ 0.04 且末 4 秒穿越目标。',
    })
    await host.op('experiment.run', { experimentId: 'delay', params: { K: 3, D: 1.5 }, subject: nodeSubject, investigationId })
  }
  await host.op('task.save', {
    request: '我希望改完实验参数之后，还能看到上次同一组参数的结果。',
    title: '实验记录可复跑',
    goal: '保存参数与判定，重开后能找回同一组运行。',
    acceptance: [{ text: '运行记录包含参数与判据', evidence: '实验列表能取到该记录' }],
    boundary: ['不自动外发', '不修改公共内容包'],
    unknowns: [{ question: '需要保留多少次历史运行？', answer: null }],
    conceptIds: [node.id],
    evidenceRefs: [{ kind: 'node', id: node.id }],
  }).catch(() => {})

  llm.enqueueSuccess('这条关系的关键是条件：延迟大小改变了同一增益下的判定。把它当作可反驳的联系，而不是定理。', { chunkSize: 6 })
  const stream = await host.openDialogStream({ subject, text: '先帮我看清这条关系在什么条件下不成立。' })
  await stream.readAll().catch(() => [])
}

const invokedDirectly = process.argv[1] && /dev-server\.mjs$/i.test(process.argv[1])
if (invokedDirectly) {
  const args = process.argv.slice(2)
  const option = (name, fallback) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : fallback
  }
  const port = Number(option('--port', '0')) || 0
  const dataDir = option('--data-dir', null)
  const seed = !args.includes('--no-seed')
  const started = await startDevServer({ port, dataDir: dataDir || undefined, seed })
  console.log('DEV_SERVER_URL=' + started.url)
  console.log('数据目录（临时）：' + started.dataDir)
  console.log('提示：本页面仅用于开发期检查，不是验收证据；真实验收在 DeepSeek Harness 实机进行。')
  const shutdown = async () => {
    await started.close().catch(() => {})
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  if (!args.includes('--keep-alive') && process.env.DEV_SERVER_AUTO_EXIT !== '0') {
    // 前台运行：保持存活，等待 Ctrl+C
  }
}
