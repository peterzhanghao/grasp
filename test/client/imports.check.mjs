/**
 * 源码一致性检查：每个相对 import 的具名导出都必须存在。
 * 构建器只做语法级拼接，这个检查补上「模块契约」层，避免运行期才炸。
 */

import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const SRC = join(ROOT, 'src', 'client')

async function listFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await listFiles(full)))
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full)
  }
  return out.sort()
}

export async function checkImports() {
  const files = await listFiles(SRC)
  const exportsMap = new Map()
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const names = new Set()
    for (const match of source.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) {
      names.add(match[1])
    }
    for (const match of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
      for (const part of match[1].split(',')) {
        const trimmed = part.trim().split(/\s+as\s+/)
        if (trimmed[0]) names.add(trimmed[trimmed.length - 1])
      }
    }
    exportsMap.set(normalize(file), names)
  }
  const problems = []
  for (const file of files) {
    const relative = file.slice(SRC.length + 1)
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(/^import\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/gm)) {
      const spec = match[2]
      if (spec === '#locale') continue
      if (!spec.startsWith('.')) {
        problems.push(`${relative}: 非相对 import ${spec}`)
        continue
      }
      const target = normalize(join(dirname(file), spec))
      const names = exportsMap.get(target)
      if (!names) {
        problems.push(`${relative}: 目标模块不存在 ${spec}`)
        continue
      }
      for (const raw of match[1].split(',')) {
        const name = raw.trim().split(/\s+as\s+/)[0]
        if (name && !names.has(name)) problems.push(`${relative}: ${spec} 没有导出 ${name}`)
      }
    }
    for (const match of source.matchAll(/^import\s+\*\s+as\s+[A-Za-z_$][\w$]*\s+from\s+['"]([^'"]+)['"]/gm)) {
      const target = normalize(join(dirname(file), match[1]))
      if (!exportsMap.has(target)) problems.push(`${relative}: 目标模块不存在 ${match[1]}`)
    }
  }
  return problems
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const problems = await checkImports()
  if (problems.length) {
    process.stderr.write(`导入/导出不一致（${problems.length}）：\n${problems.map((item) => '  - ' + item).join('\n')}\n`)
    process.exitCode = 1
  } else {
    process.stdout.write(`导入/导出一致：${(await listFiles(SRC)).length} 个模块\n`)
  }
}
