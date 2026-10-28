# 用户数据 v3 迁移与回退（T01）

本文件记录掌控 v2 的 v2 → v3 数据迁移、验收方式与回退步骤。实现见
`src/domain/migrate.js`、`src/domain/schema.js`、`src/host/storage.js`。

## 1. 版本与表

- `schemaVersion`：2 → **3**。
- v2 八张表（notes/revisions/relations/investigations/predictions/experiments/tasks/dialogs）**原样保留**，只做追溯，不再由新 UI 写入。
- v3 新增三张表：`loops`（掌控卡）、`interventions`（干预）、`observations`（观察）；另有 `archive`（无法映射记录的只读归档，正常迁移为空）。
- `view` 增加 `screen` 与 `activeLoopId`；旧字段保留兼容。

## 2. 映射规则（不丢数据）

| v2 | v3 | 说明 |
| --- | --- | --- |
| investigations | loops（`lp_<invId>`） | claim/counter → hypothesis；nextTest → nextAction；状态保守映射（open→modeled、testing→testing、supported→reviewing、revised→revised、inconclusive→paused） |
| predictions（open） | interventions（`iv_<id>`） | 旧版没有记录实际干预动作，action 写明来源；status=planned |
| predictions（已解决） | observations（`ob_<id>`） | verdict 按 supported/refuted/inconclusive 映射；不重新判定 |
| experiments | observations（`ob_run_<id>`, source=experiment） | 旧判据与新观察语义不同，verdict 记为 inconclusive，并以 evidenceRefs 指向原实验记录 |
| 无归属的预测/实验 | `lp_legacy_v2`（archived） | 兜底卡，不丢弃 |
| tasks / notes / dialogs / relations | 原表保留 | subject 增加 `loop` 支持；旧记录不动 |
| 无法解析的记录 | archive | 只读、可导出 |

## 3. 迁移流程（storage）

1. 复制当前 `state.json` 到 `backups/state.pre-v3-<时间戳>.json`（逐字节，不覆盖旧备份）。
2. `migrateToV3`：v1 走 v1→v2→v3 链，v2 直接 v2→v3；纯内存转换。
3. `validateState` 全量校验（表结构、引用闭合、时间戳）。
4. 原子写：临时文件 → fsync → rename。
5. 读回 `state.json`，逐表计数核对（含 loops/interventions/observations）；不一致即失败并保留原文件。
6. 失败降级只读，绝不覆盖或删除用户原文件。

## 4. 回退

1. 关闭插件（或退出应用）。
2. 把 `backups/state.pre-v3-<时间戳>.json` 复制回 `state.json`。
3. 切回 `v1.0.0-loop-atlas` 标签的代码（或 `master` 快照）。
4. 启动后旧插件按 v2 读取；或再次升级时重新迁移（幂等）。
5. 迁移只会新增备份，不删除旧备份。

## 5. 已验证证据

- 单测/集成：`node --test test/domain test/integration`（79 / 45 全绿；v1 迁移含备份逐字节、回滚、幂等）。
- 真实数据演练（2026-10-28，只读复制真实 v2 数据到临时目录）：
  - schemaVersion 2 → 3，`validateState` ok；
  - 计数：notes 3、revisions 3、predictions 1、experiments 1、tasks 1、dialogs 1 全部保留；新增 loops 1（legacy 兜底）、interventions 1、observations 1；
  - 迁移前备份与原始文件 sha256 一致（逐字节）；
  - 二次启动 `migrationReport === null`，`state.json` 字节不变（幂等）。
- 未验证：Windows 掉电场景（目录项 fsync 不受支持，不宣称掉电安全）；真实用户数据将在 G4 验收通过后才迁移。
