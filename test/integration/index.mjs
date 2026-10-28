/**
 * test/integration 的入口包装：让 `node --test test/integration` 在 Node >= 24
 * （不再递归目录参数）下也能一次跑完本目录所有集成测试。
 *
 * 做法：package.json 的 main 指向本文件，本文件 import 各 *.test.mjs，
 * 各文件里的 test() 会注册到同一测试进程。
 */
await import('./r0-experiments.test.mjs')
await import('./r0-storage.test.mjs')
await import('./r0-import.test.mjs')
await import('./r0-migration.test.mjs')
await import('./r1-dialog.test.mjs')
await import('./r3-loop.test.mjs')
await import('./r4-task.test.mjs')
await import('./r5-content.test.mjs')
await import('./r7-loop-ops.test.mjs')
