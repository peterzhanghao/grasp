/**
 * harness 自测用的最小插件：形状模仿真实 index.js 的契约面，但不含产品逻辑。
 * 只被 test/harness/harness.test.mjs 使用。
 */
export const name = 'fixture-plugin'
export const inject = ['webServer']

export function apply(ctx, config = {}) {
  let llm = null
  let selection = null

  ctx.effect(() => () => {
    /* 插件卸载清理占位 */
  })

  ctx.inject(['llm'], (serviceCtx) => {
    llm = serviceCtx.llm
  })
  ctx.inject(['agentDefaultModel'], (serviceCtx) => {
    selection = serviceCtx.agentDefaultModel
  })

  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'prefix',
      path: '/api/fixture',
      handler: async (req, res) => {
        const send = (status, body) => {
          res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify(body))
        }
        const url = new URL(req.url || '/', 'http://fixture.local')
        const suffix = url.pathname.slice('/api/fixture'.length) || '/'
        if (req.method === 'GET' && (suffix === '/' || suffix === '/state')) {
          return send(200, {
            ok: true,
            dataPath: config.dataDir,
            hasLlm: !!llm,
            hasSelection: !!selection,
            selection: selection ? selection.currentSelection() : null,
            schemaVersion: 2,
          })
        }
        if (req.method === 'POST' && suffix === '/echo') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          let body = {}
          try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          } catch {
            return send(400, { ok: false, code: 'VALIDATION', error: 'bad json' })
          }
          return send(200, { ok: true, echo: body })
        }
        if (req.method === 'POST' && suffix === '/stream') {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8' })
          res.write(JSON.stringify({ type: 'start', requestId: body.requestId }) + '\n')
          if (!llm) {
            res.write(JSON.stringify({ type: 'error', code: 'LLM_UNAVAILABLE', message: 'no llm' }) + '\n')
            return res.end()
          }
          const model = selection?.currentSelection?.() || {}
          try {
            for await (const chunk of llm.stream({ provider: model.provider, model: model.model, messages: body.messages || [], signal: null })) {
              if (chunk.type === 'text-delta') res.write(JSON.stringify({ type: 'delta', text: chunk.text }) + '\n')
              if (chunk.type === 'finish') {
                if (chunk.reason === 'error') {
                  res.write(JSON.stringify({ type: 'error', code: chunk.failure?.code, message: chunk.failure?.message }) + '\n')
                } else {
                  res.write(JSON.stringify({ type: 'done', reason: chunk.reason }) + '\n')
                }
                break
              }
            }
          } catch (error) {
            res.write(JSON.stringify({ type: 'error', code: 'INTERNAL', message: String(error?.message || error) }) + '\n')
          }
          return res.end()
        }
        return send(404, { ok: false, code: 'NOT_FOUND', error: 'unknown fixture route' })
      },
    }),
  )

  ctx.inject(['tools'], (toolCtx) => {
    toolCtx.effect(() => {
      toolCtx.tools.register({
        name: 'fixture_tool',
        description: 'harness 自测工具',
        parameters: { type: 'object', properties: { action: { type: 'string' } } },
        output: { schema: { type: 'object' }, render: () => [] },
        execute: async (args) => ({ ok: true, action: args?.action || null, dataDir: config.dataDir }),
      })
    })
  })
}

export const FIXTURE_ROUTE_COUNT = 1
