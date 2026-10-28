# 掌控 v2 内容报告（Grasp）

> 记录范围：本仓库/工作树是 v2 的 `grasp-t04` worktree（分支 `feature/grasp-t04-content-coach`，基线 `develop@6074539`）。
> 仓库内没有 v1 内容报告（v1 报告留在 `loop-atlas` 仓库，未迁入本仓库，避免伪造历史）。本文件从 **T04 教练包**开始记录 v2 内容交付，后续内容任务在此追加。

---

## 教练包（T04，Issue #9）

### 0. 交付摘要

| 项 | 结果 |
| --- | --- |
| `data/core.json` | 新增顶层 `coach` 元数据；**29 节点 / 55 关系 / 119 主张 / 21 来源的正文与来源未改**（git diff：242 insertions，0 deletions） |
| `locale/zh.json`、`locale/en.json` | 各新增 **98 个** `loop.coach.*` key：540 → **638**，zh/en key 集合一致，未删任何旧 key（各 98 insertions） |
| `test/content/content.test.mjs` | 新增 6 项教练包校验：9 项 → **15 项全绿**，原 9 项无回归 |
| `docs/content-report.md` | 本文件（新建；T04 起记录） |
| `validateContent(core)` | **ok**：0 errors，1 个 T04 之前就存在的 `completeness` warning |

给下游的契约（T02 引擎 / T07 向导 / T08 卡详情共用）：

- 缺口 id 与 `src/domain/loop-schema.js` 的 `GAP_TYPES` 完全一致（10 类）；模板 id 与 `SYSTEM_TYPES`（除 `custom`）一致（4 类）。
- 六问 id 固定为 `goal / measurement / action / disturbance / delay / hypothesis`，对应设计 §4 的 Q1—Q6。
- `coach` 里所有 `*Key` 都是 **locale key 引用**（不是字面文案）；文案只存在于 `locale/{zh,en}.json`。

### 1. 缺口 → 原理卡映射（`coach.gapPlaybook`）

设计 §5 的映射落到内容包现有 29 张卡上，每类 1—2 张；`firstActionKey` 是「建议的第一个小动作」的规则文案（模型不可用时也能显示，不依赖 LLM）。

| 缺口 id | 中文 label | 原理卡（nodeId） | 首个动作 key |
| --- | --- | --- | --- |
| `unclear-goal` | 目标不清 | `goal`（目标与被维持的量） / `boundary`（系统边界） | `loop.coach.gap.unclear-goal.firstAction` |
| `unmeasured` | 没有测量 | `measurement`（测量与可观测性） / `blackbox`（黑箱） | `loop.coach.gap.unmeasured.firstAction` |
| `late-measurement` | 测得晚 | `delay`（延迟） / `sampling`（采样与分辨率） | `loop.coach.gap.late-measurement.firstAction` |
| `authority-gap` | 没有可改动作 | `actuator`（行动能力与饱和） / `variety`（必要多样性） | `loop.coach.gap.authority-gap.firstAction` |
| `saturated` | 动作顶到上限 | `actuator`（行动能力与饱和） / `pi`（比例与积分） | `loop.coach.gap.saturated.firstAction` |
| `proxy` | 代理指标当目标 | `indicator`（指标与代理目标） / `positive`（正反馈与放大） | `loop.coach.gap.proxy.firstAction` |
| `missing-counter-signal` | 缺反证条件 | `positive`（正反馈与放大） / `secondorder`（二阶控制论） | `loop.coach.gap.missing-counter-signal.firstAction` |
| `oscillating` | 来回摆动 | `stability`（稳定性与振荡） / `delay`（延迟） | `loop.coach.gap.oscillating.firstAction` |
| `drift` | 稳定但不在目标 | `pi`（比例与积分） / `measurement`（测量与可观测性） | `loop.coach.gap.drift.firstAction` |
| `adaptation-failure` | 同一动作反复失败 | `adaptation`（适应与换规则） / `model`（模型与前馈） | `loop.coach.gap.adaptation-failure.firstAction` |

说明：

- 设计 §5 中 `oscillating` 列了 stability / delay / pi 三张，按 T04 约束「每类 1—2 张」收敛为 `stability + delay`；其余按设计表原样。
- 映射共覆盖 **15 / 29** 张原理卡（`goal/boundary/measurement/blackbox/delay/sampling/actuator/variety/pi/indicator/positive/secondorder/stability/adaptation/model`），每个 nodeId 都是内容包里已存在、有正文与来源的卡片，不新造节点。
- 每类缺口另配 `labelKey` 作为缺口名称显示文案；10 类首个动作文案互不重复。

### 2. 四类系统模板（`coach.systemTemplates`）

同一六问内核 + 按系统类型定制的措辞与示例；每类含 `labelKey`、`questionHints`（六问各一句提示）、`examples`（六问各一个示例答案）。

| 模板 id | label（zh / en） | 六问 hint | 六问 example | 定制重点 |
| --- | --- | --- | --- | --- |
| `coding-agent` | 编程智能体 / Coding agent | 6 | 6 | 完整定制：测试、CI、评审、time-to-green、上下文预算、模型/工具波动（对应设计 §10「完整」） |
| `product` | 产品 / 项目 / Product / project | 6 | 6 | 通用占位：回滚、发布节奏、验收争议、需求中途变更 |
| `team` | 团队协作 / Team collaboration | 6 | 6 | 通用占位：协调失败、返工、责任落点、信息传递 |
| `personal` | 个人学习 / Personal learning | 6 | 6 | 通用占位：学习回路、注意力、练习难度与错误率 |

说明：

- 四类模板的同一问提示/示例互不相同（测试断言「每问四类文案去重后仍为 4 条」），不是复制占位的同一句话。
- 设计 §10 的 v2.0 取舍：`coding-agent` 做深；`product/team/personal` 是「通用占位但可跑」——六问、诊断、示例都能用，只是没有专用证据源（会话证据 v2.1 只面向 coding agent）。
- `systemType: custom` 不单独出模板，直接回落到通用六问；不阻断建卡。

### 3. 六问与掌控卡字段预填（`coach.questionOrder` / `coach.fieldMap`）

| 问 id | 设计 §4 问 | 预填的掌控卡字段（对齐 `loop-schema.js` 的 `LOOP_DEFAULTS`） |
| --- | --- | --- |
| `goal` | Q1 目标量 | `goal.quantity` / `goal.criterion` / `goal.current` |
| `measurement` | Q2 测量 | `measurement.how` / `measurement.cadence` |
| `action` | Q3 动作与权限 | `action.levers` / `action.cannot` / `boundary.nonGoals` |
| `disturbance` | Q4 扰动 | `disturbances[].text` |
| `delay` | Q5 延迟 | `delays[].from` / `delays[].to` / `delays[].estimateSeconds` |
| `hypothesis` | Q6 解释与推翻条件 | `hypothesis.claim` / `hypothesis.counter` / `hypothesis.falsifier` |

这是 dev-plan T04 里「掌控卡字段预填模板」的落点：向导 UI 只需按 `questionOrder` 逐问取值，再按 `fieldMap` 写回字段；字段路径在测试里对 `LOOP_DEFAULTS` 做了根字段校验。

### 4. 向导文案契约（`coach.wizardCopy`）

一屏一问的界面文案全部是 key 引用；向导 UI（T07）不得把文案写死在源码里。

| 字段 | key | 用途 |
| --- | --- | --- |
| `titleKey` | `loop.coach.wizard.title` | 向导标题「掌控六问」 |
| `introKey` | `loop.coach.wizard.intro` | 开场规则：一屏一问、可跳过、草稿自动存 |
| `progressKey` | `loop.coach.wizard.progress` | 进度「第 {current} 问 / 共 {total} 问」（zh/en 占位符一致） |
| `skipKey` | `loop.coach.wizard.skip` | 跳过本问 |
| `unknownHintKey` | `loop.coach.wizard.unknownHint` | 「我不知道」通用分支说明（这一项会记成缺口） |
| `draftSavedKey` | `loop.coach.wizard.draftSaved` | 草稿自动保存提示 |
| `createCardKey` | `loop.coach.wizard.createCard` | 主按钮「生成掌控卡」 |
| `createCardHintKey` | `loop.coach.wizard.createCardHint` | 完成门槛：第 1 问 + 第 6 问有内容即可先建卡再补 |
| `questions.<q>.titleKey` | `loop.coach.question.<q>.title` | 六问标题（问句） |
| `questions.<q>.hintKey` | `loop.coach.question.<q>.hint` | 六问提示 |
| `questions.<q>.unknownKey` | `loop.coach.question.<q>.unknown` | 六问各自的「我不知道」分支具体说法 |

### 5. 新增 key 统计

| 类别 | key 数 | 构成 |
| --- | --- | --- |
| `gapPlaybook` | 20 | 10 类缺口 ×（`label` + `firstAction`） |
| `systemTemplates` | 52 | 4 类模板 ×（1 `label` + 6 `hint` + 6 `example`） |
| `question`（六问标题/提示/我不知道） | 18 | 6 问 × 3 |
| `wizard`（标题/开场/进度/跳过/分支说明/草稿/建卡/门槛） | 8 | 8 项界面文案 |
| **合计** | **98** | zh/en 各 98：540 → **638**；集合一致；旧 key 一个未删 |

### 6. 校验与测试

命令（本 worktree，Node v26）：

```pwsh
cd D:\plug-in\grasp-t04
node --test test/content
```

输出（15/15 通过，含原 9 项无回归）：

```text
✔ 内容包元数据与 8 个单元 (1.447ms)
✔ 节点：旧 24 id 原样保留、字段完整、era 精度一致 (0.9544ms)
✔ 节点 claim/source 引用闭合且主语一致 (0.5453ms)
✔ 关系：稳定 id、引用闭合、必须有 claim/condition/cost/claimIds (0.9998ms)
✔ 17 条 theorem 误标已修正；formal 只给真正有前提与推导的结果 (1.3406ms)
✔ 主张与来源：三档核验、引用闭合、不编页码/引文/DOI (1.0457ms)
✔ 实验元数据与 domain 模型 id/version 一致 (2.8137ms)
✔ completeness：40 项基线逐项交代、节点全部有归属 (0.6384ms)
✔ locale：zh/en 完整对照、key 与 client 实际使用的 key 不缺失 (6.4618ms)
✔ 教练包：结构完整，六问顺序与四类系统模板齐全 (1.872ms)
✔ 教练包：缺口映射引用闭合（nodeId 存在、文案 key 存在且可操作） (0.5208ms)
✔ 教练包：四类系统模板六问 hint/example 齐全且各自定制 (0.4808ms)
✔ 教练包：向导六问标题/提示/「我不知道」分支/进度/建卡按钮文案齐全且具体 (0.804ms)
✔ 教练包：locale 的 loop.coach.* 与 core 引用双向闭合、zh/en 集合一致、文案非空 (0.6852ms)
✔ 教练包：新增元数据不破坏内容校验（validateContent 仍 ok） (3.6585ms)
ℹ tests 15
ℹ pass 15
ℹ fail 0
```

新增 6 项断言覆盖：

1. `coach` 结构完整；六问顺序与 `GAP_TYPES` / `SYSTEM_TYPES` 对齐；`fieldMap` 字段根在 `LOOP_DEFAULTS` 中存在。
2. `gapPlaybook` 引用闭合：nodeId 必须在 `core.nodes` 中存在；每类 1—2 张且不重复；`labelKey` / `firstActionKey` 在 zh、en 里都真实存在、长度达标、不是占位口号。
3. 四类模板齐全，六问 hint/example 全部存在；同一问在四类模板里的提示/示例互不相同（证明按系统类型定制，而不是复制占位）；示例是「答案」不是「问句」。
4. 向导文案：六问标题都是问句、提示与「我不知道」分支具体；进度 key 含 `{current}`/`{total}` 且 zh/en 占位符集合一致；建卡门槛文案写明第 1 问 + 第 6 问。
5. `loop.coach.*` **双向闭合**：locale 里的 coach key 集合 = `core.coach` 递归引用到的 key 集合（既不缺文案，也没有死文案）；zh/en 集合一致；逐条非空、无连续空格、zh≠en（防漏译）；并锁定教练包 key 总数为 98。
6. `validateContent(core)` 仍 `ok`；节点/关系/主张/来源数量仍为 29/55/119/21（教练包不许改内容正文）。

`validateContent(core)` 实测：

```text
ok=true errors=0 warnings=1
[{"path":"completeness.included","code":"COMPLETENESS","message":"included + merged 数量少于 baselineCount，逐项交代可能不完整"}]
```

该 warning 在 T04 之前就存在（`completeness.included + merged` 少于 40 项基线），属于 v2 内容包既有交代，不是本次教练包引入；本次未改 `completeness`。

本次改动（`git diff --stat`）：

```text
 data/core.json                | 242 ++++++++++++++++++++++++++++++++++++++
 locale/en.json                |  98 ++++++++++++++++
 locale/zh.json                |  98 ++++++++++++++++
 test/content/content.test.mjs | 265 ++++++++++++++++++++++++++++++++++++++++++
 4 files changed, 703 insertions(+)
```

### 7. 未覆盖项与边界（如实记录）

- **缺口判定规则不在本包**：10 类缺口的触发条件属 T02 `src/domain/gaps.js`；本包只提供「缺口 → 原理卡 + 第一个小动作」的静态映射与文案，不实现诊断逻辑。
- **向导 UI 不在本包**：`wizardCopy` 只是文案 key 契约（本轮冻结命名）；T07 才把它渲染成页面。这里只验证 JSON/文案契约，未做界面可见性验证。
- **AI 追问文案未提供**：设计 §4「AI 追问最多 2 个」属于 T07/T02 交互层，本包未写追问 prompt 或追问专属文案。
- **四类模板的深度不一致**：`product/team/personal` 是设计 §10 明确允许的 v2.0「通用占位」——六问话术与示例齐全，但没有专用证据源（会话证据仅 coding-agent，且属 v2.1）。
- **模板专属缺口优先级未做**：v2.0 四类共用同一套 10 类缺口规则与排序，未按系统类型加权。
- **只有 zh-CN / en 两种语言**；新增 key 未做其它 locale。
- **未引入新主张/来源**：`coach` 文案是编辑性操作说明（怎么问、怎么做下一步），不对控制论结论作新断言；内容包主张/来源集合保持原样。
- **未验证实机**：本工作树未重组合插件，教练包尚未在真实 Harness 中展示；T07/T08 接入后才算实机可见文案验收。
