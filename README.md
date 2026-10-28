# 掌控（Grasp）· 看清一个系统如何纠正自己

> 当前安装版本 1.0.0（原名「回路」，内部包名 `@local/loop-atlas` 不变）。v2「教练版」正在按计划重构：
> 设计 [docs/v2-design.md](docs/v2-design.md)，开发计划 [docs/v2-dev-plan.md](docs/v2-dev-plan.md)。

DeepSeek Harness 原生学习插件。一个研究问题贯穿图谱阅读、证据实验、学习对话和编程任务草案：

**选一条关系 → 看机制和条件 → 写一个预测 → 运行/观察 → 保存证据 → 修订这条关系的个人理解 → 应用于编程任务。**

## 打开

- 侧栏底部「掌控」按钮，或 设置 → 掌控 → 打开掌控。
- 全页面板占宿主 `main` 区域，不重做 Harness 外壳；主题、语言跟随宿主。

## 数据在哪

- 用户数据：`D:\plug-in\loop-atlas-data\state.json`（可在 `cordis.patch.yml` 的 `config.dataDir` 修改）。
- 备份：同目录 `backups/`，迁移前自动备份，旧备份不覆盖。
- 内容包：`data/core.json`，与用户数据分开版本化。

## 结构

| 部分 | 位置 |
| --- | --- |
| Host 入口 | `index.js` — 只装配 |
| Host 业务 | `src/host/**` — 存储提交队列、HTTP/NDJSON、对话、ops、agent 工具 |
| 纯函数领域 | `src/domain/**` — 实验模型与判定、schema、迁移、导入校验、内容校验 |
| Client 源码 | `src/client/**` — 三尺度图谱、关系阅读、学习伙伴、实验/任务面板 |
| Client 产物 | `client.js` — 由 `node build/build-client.mjs` 生成，勿手改 |
| 内容包 | `data/core.json` — 单元/节点/关系/主张/来源/实验元数据 |
| 测试 | `test/domain`、`test/content`、`test/client`、`test/integration`、`test/harness` |

## 开发

```powershell
node build/build-client.mjs          # 构建 client.js
node --test test/domain test/content test/client
```

Host 代码改动需要在宿主里重新组合插件（插件页关/开一次，或重启应用）；Client 代码改动刷新页面即可。

## 诚实边界

- 三个实验都是**确定性教学模型**（一阶惯性+纯延迟+执行器饱和、两条确定性指标公式、分页检查器），不是真实系统辨识，也不是任何项目的真实事故。
- 学习对话走宿主真实模型；模型不可用时页面明确显示原因，并保留问题草稿。AI 回答不会自动变成用户的笔记。
- 来源分「已核验 / 二手来源 / 未核验」三档；未核验的来源保留，但不会冒充已证实。
- 插件不执行用户代码、不申请 shell/文件写入/外发能力，也不会自动把任务草案发送给任何工具。
- 一次回答、一次仿真都不等于掌握；记录状态不等于掌握状态。
