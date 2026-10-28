/**
 * 模块契约测试：受控 ESM 子集的相对 import 必须都能解析到真实具名导出。
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { checkImports } from './imports.check.mjs'

test('src/client 的相对 import/export 完全一致（含 #locale 虚拟模块）', async () => {
  const problems = await checkImports()
  assert.deepEqual(problems, [])
})
