/**
 * `node --test test/client` 的目录入口。
 *
 * Node 26.7 的 test runner 不再把位置参数里的目录展开为测试文件集合
 * （实测 `node --test test/client` 会把目录当模块入口），因此这里提供一个
 * 显式入口：一次导入本目录全部 *.test.mjs，测试仍在每个文件中独立注册。
 * 直接跑单个文件（`node --test test/client/build.test.mjs`）不受影响。
 */

import './build.test.mjs'
import './bundle.test.mjs'
import './i18n.test.mjs'
import './imports.test.mjs'
import './pure.test.mjs'
import './render.test.mjs'
