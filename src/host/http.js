/**
 * HTTP 层：/api/loop-atlas 前缀路由。
 *
 * 只做协议适配（JSON、NDJSON、大小限制、断连取消），业务全部在 ops / dialog。
 * 任何异常都转成 { ok:false, code, error }，不向浏览器暴露堆栈。
 */
import { AppError, statusFor, toErrorBody } from './errors.js'

const MAX_JSON_BYTES = 12 * 1024 * 1024
const MAX_IMPORT_BYTES = 8 * 1024 * 1024

function sendJson(res, status, body) {
  if (res.writableEnded) return
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(text)
}

async function readBody(req, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) {
      throw new AppError('PACKAGE_TOO_LARGE', `请求体超过上限（${Math.round(limit / 1024 / 1024)} MiB）`)
    }
    chunks.push(chunk)
  }
  return { buffer: Buffer.concat(chunks), size }
}

async function readJson(req, limit = MAX_JSON_BYTES) {
  const { buffer, size } = await readBody(req, limit)
  if (!size) return { body: {}, size }
  try {
    return { body: JSON.parse(buffer.toString('utf8')), size }
  } catch {
    throw new AppError('VALIDATION', '请求体不是合法 JSON')
  }
}

export function createHttpHandler({ storage, ops, dialog, resolveModel, version }) {
  async function sendState(res) {
    const snap = await storage.ensure()
    const info = await dialog.availability()
    sendJson(res, 200, {
      ok: !snap.fatal,
      serverVersion: version,
      schemaVersion: snap.schemaVersion,
      contentVersion: snap.contentVersion,
      core: snap.core,
      store: snap.store,
      dataPath: snap.dataPath,
      backupDir: snap.backupDir,
      readOnly: snap.readOnly,
      fatal: snap.fatal,
      notices: snap.notices,
      migrationReport: snap.migrationReport,
      lastError: snap.lastError,
      lastWrite: snap.lastWrite,
      model: info.model,
      modelAvailable: info.ok,
      modelReason: info.reason,
      capabilities: { llm: !!info.ok, dialogue: true, streaming: true },
    })
  }

  function sendHealth(res) {
    sendJson(res, 200, {
      ok: true,
      version,
      schemaVersion: 2,
      endpoint: '/api/loop-atlas',
      time: new Date().toISOString(),
    })
  }

  async function handleStream(req, res, body) {
    res.writeHead(200, {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
      connection: 'keep-alive',
    })
    let requestId = null
    let finished = false
    const write = (event) => {
      if (res.writableEnded || res.destroyed) return
      try {
        res.write(JSON.stringify(event) + '\n')
      } catch {
        /* 客户端断开后写失败是正常的 */
      }
    }
    res.on('close', () => {
      if (!finished && requestId) {
        try {
          dialog.cancel(requestId)
        } catch {
          /* ignore */
        }
      }
    })
    try {
      await dialog.stream(body, (event) => {
        if (event && event.type === 'start' && event.requestId) requestId = event.requestId
        write(event)
      })
    } catch (error) {
      write({ type: 'error', ...toErrorBody(error) })
    } finally {
      finished = true
      if (!res.writableEnded) res.end()
    }
  }

  return async function handler(req, res) {
    let pathname = '/'
    try {
      pathname = new URL(req.url || '/', 'http://loop-atlas.local').pathname.replace(/\/+$/, '') || '/api/loop-atlas'
    } catch {
      return sendJson(res, 400, { ok: false, code: 'VALIDATION', error: '请求路径不合法' })
    }
    const suffix = pathname.startsWith('/api/loop-atlas') ? pathname.slice('/api/loop-atlas'.length) || '/' : null
    if (suffix === null) return sendJson(res, 404, { ok: false, code: 'NOT_FOUND', error: '未知前缀' })

    try {
      if (req.method === 'GET') {
        if (suffix === '/' || suffix === '/state') return await sendState(res)
        if (suffix === '/health') return sendHealth(res)
        if (suffix === '/dialog') {
          const subject = parseSubjectFromQuery(req.url)
          const result = await dialog.get({ subject })
          return sendJson(res, 200, { ok: true, ...result })
        }
        return sendJson(res, 404, { ok: false, code: 'NOT_FOUND', error: '未知接口：' + pathname })
      }

      if (req.method !== 'POST') return sendJson(res, 405, { ok: false, code: 'VALIDATION', error: '只支持 GET/POST' })

      if (suffix === '/ops') {
        const { body } = await readJson(req)
        const result = await ops.run(body.op, body.payload, { caller: 'ui' })
        return sendJson(res, 200, { ok: true, ...result })
      }

      if (suffix === '/dialog/stream') {
        const { body, size } = await readJson(req)
        if (size > MAX_JSON_BYTES) throw new AppError('PACKAGE_TOO_LARGE', '请求体过大')
        return await handleStream(req, res, body)
      }

      if (suffix === '/dialog/cancel') {
        const { body } = await readJson(req)
        const result = await ops.run('dialog.cancel', body, { caller: 'ui' })
        return sendJson(res, 200, result)
      }

      if (suffix === '/import') {
        const { body } = await readJson(req, MAX_IMPORT_BYTES)
        const result = await ops.run('package.import', body, { caller: 'ui' })
        return sendJson(res, 200, result)
      }

      return sendJson(res, 404, { ok: false, code: 'NOT_FOUND', error: '未知接口：' + pathname })
    } catch (error) {
      const body = toErrorBody(error)
      const status = statusFor(error)
      if (!res.headersSent) return sendJson(res, status, body)
      try {
        res.end(JSON.stringify(body))
      } catch {
        /* ignore */
      }
      return undefined
    }
  }
}

function parseSubjectFromQuery(rawUrl) {
  try {
    const url = new URL(rawUrl || '/', 'http://loop-atlas.local')
    const kind = url.searchParams.get('kind')
    const id = url.searchParams.get('id')
    if (!kind || !id) throw new AppError('VALIDATION', '缺少 kind/id 查询参数')
    return { kind, id }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('VALIDATION', '查询参数不合法')
  }
}
