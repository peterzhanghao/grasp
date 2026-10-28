# 掌控 v2 问题台账（Issue register）

- 仓库：https://github.com/peterzhanghao/grasp
- 基线：`main` @ f17bb726269457d4f77be1c944015d4aba07924f
- 同步快照：2026-10-28 创建（创建后回读通过；后续变更随 PR 更新本表）
- 状态口径：`status::*` 唯一；blocked-by 全部关闭后才能置 `ready`

| 规划键 | GitHub # | 标题 | 状态（创建时） | 依赖 | 同步状态 | 最后回读 |
| --- | --- | --- | --- | --- | --- | --- |
| GRASP-00 | [#1](https://github.com/peterzhanghao/grasp/issues/1) | 总控 | tracking | — | in-sync | 2026-10-28 |
| GRASP-P1 | [#2](https://github.com/peterzhanghao/grasp/issues/2) | [Tracking] P1 · 地基：schema v3 / 引擎 / host ops / 内容教练包 | tracking | — | in-sync | 2026-10-28 |
| GRASP-P2 | [#3](https://github.com/peterzhanghao/grasp/issues/3) | [Tracking] P2 · 教练 UI：首页 / 掌控六问 / 掌控卡 / 观察修订 | tracking | — | in-sync | 2026-10-28 |
| GRASP-P3 | [#4](https://github.com/peterzhanghao/grasp/issues/4) | [Tracking] P3 · 会话证据：只读摘要 / 候选预览 / 删除撤回 | tracking | — | in-sync | 2026-10-28 |
| GRASP-P4 | [#5](https://github.com/peterzhanghao/grasp/issues/5) | [Tracking] P4 · 打磨验收：真实使用 / 实机视觉 / 发布回退 | tracking | — | in-sync | 2026-10-28 |
| GRASP-T01 | [#6](https://github.com/peterzhanghao/grasp/issues/6) | [T01] 数据模型 v3 与 v2→v3 迁移（含备份/归档/回退） | ready | — | in-sync | 2026-10-28 |
| GRASP-T02 | [#7](https://github.com/peterzhanghao/grasp/issues/7) | [T02] 缺口诊断与「今天这一步」纯函数引擎 | ready | — | in-sync | 2026-10-28 |
| GRASP-T03 | [#8](https://github.com/peterzhanghao/grasp/issues/8) | [T03] Host ops v3：掌控卡/干预/观察/版本/应用产物 + 接口 | blocked | T01 | in-sync | 2026-10-28 |
| GRASP-T04 | [#9](https://github.com/peterzhanghao/grasp/issues/9) | [T04] 内容教练包：缺口→原理卡映射与四类系统六问话术 | ready | — | in-sync | 2026-10-28 |
| GRASP-T05 | [#10](https://github.com/peterzhanghao/grasp/issues/10) | [T05] 改名收尾：host 文案与仓库文档切到「掌控 / Grasp」 | ready | — | in-sync | 2026-10-28 |
| GRASP-T06 | [#11](https://github.com/peterzhanghao/grasp/issues/11) | [T06] 新信息架构外壳：今天/向导/掌控卡/原理库/资料与权限 | blocked | T01, T02, T03 | in-sync | 2026-10-28 |
| GRASP-T07 | [#12](https://github.com/peterzhanghao/grasp/issues/12) | [T07] 掌控六问向导：10 分钟建出第一张卡 | blocked | T06 | in-sync | 2026-10-28 |
| GRASP-T08 | [#13](https://github.com/peterzhanghao/grasp/issues/13) | [T08] 掌控卡详情：小回路图 + 缺口 + 原理卡 + 今天这一步 | blocked | T06 | in-sync | 2026-10-28 |
| GRASP-T09 | [#14](https://github.com/peterzhanghao/grasp/issues/14) | [T09] 干预、观察回填与「预测 vs 实际」对比 | blocked | T08 | in-sync | 2026-10-28 |
| GRASP-T10 | [#15](https://github.com/peterzhanghao/grasp/issues/15) | [T10] 修订、版本对比与应用产物（验收/停止条件/检查点） | blocked | T08 | in-sync | 2026-10-28 |
| GRASP-T11 | [#16](https://github.com/peterzhanghao/grasp/issues/16) | [T11] 原理库：复用 v1 内容与图谱/列表（降级为参考） | blocked | T06 | in-sync | 2026-10-28 |
| GRASP-T12 | [#17](https://github.com/peterzhanghao/grasp/issues/17) | [T12] 资料与权限：备份/导入导出/迁移报告修复/证据开关占位 | blocked | T06 | in-sync | 2026-10-28 |
| GRASP-T13 | [#18](https://github.com/peterzhanghao/grasp/issues/18) | [T13] 可访问性、响应式与状态文案矩阵 | blocked | T07, T08, T09, T10, T11, T12 | in-sync | 2026-10-28 |
| GRASP-T14 | [#19](https://github.com/peterzhanghao/grasp/issues/19) | [T14] 会话摘要 provider（只读白名单，需用户同意） | blocked | T03 | in-sync | 2026-10-28 |
| GRASP-T15 | [#20](https://github.com/peterzhanghao/grasp/issues/20) | [T15] 证据候选预览、勾选写入与删除撤回 UI | blocked | T06, T14 | in-sync | 2026-10-28 |
| GRASP-T16 | [#21](https://github.com/peterzhanghao/grasp/issues/21) | [T16] 权限文案、同意记录与审计说明 | blocked | T12, T14, T15 | in-sync | 2026-10-28 |
| GRASP-T17 | [#22](https://github.com/peterzhanghao/grasp/issues/22) | [T17] 真实使用两周：S3/S4 行为记录与阻塞修复 | blocked | T13, T16 | in-sync | 2026-10-28 |
| GRASP-T18 | [#23](https://github.com/peterzhanghao/grasp/issues/23) | [T18] 实机视觉验收：浅深色/1024/窄屏/200%/弹层/状态 | blocked | T13 | in-sync | 2026-10-28 |
| GRASP-T19 | [#24](https://github.com/peterzhanghao/grasp/issues/24) | [T19] v2 文档与交付报告：设计/计划/验收/回退手册/证据索引 | blocked | T17, T18 | in-sync | 2026-10-28 |
| GRASP-T20 | [#25](https://github.com/peterzhanghao/grasp/issues/25) | [T20] 发布 2.0.0：真实数据迁移、回退演练与版本标签 | blocked | T17, T19 | in-sync | 2026-10-28 |

## 说明
- 本表由 `ai-github-issue-workflow` 的台账结构改写而来；首次发布前无历史台账，创建后回读并记录真实编号。
- 发布门禁：本轮用户明确要求“创建开发任务”，且 docs/v2-dev-plan.md 已确认范围，因此视为确认发布；后续新增/修改 Issue 仍需按 skill 过门禁。
- 证据与截图存放在本地（docs/evidence、tools/qa/evidence），不进入公开仓库。
