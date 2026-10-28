/**
 * 兼容入口：Node 26 的 `node --test <目录>` 不再自动展开目录参数，
 * 会把目录当成一个模块路径加载。为了让验收命令 `node --test test/domain`
 * 直接可用，本文件在被当作模块加载时导入全部 domain 测试。
 *
 * 注意：它不是测试文件（不匹配 *.test.mjs），所以 `node --test`（无参）
 * 或 `node --test "test/domain/*.test.mjs"` 都不会重复加载它。
 */
import './experiments.test.mjs'
import './schema.test.mjs'
import './graph.test.mjs'
import './validate-content.test.mjs'
import './migrate.test.mjs'
import './pack.test.mjs'
