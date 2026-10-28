/*!
 * 掌控 (Grasp) 客户端单文件产物 — 由 build/build-client.mjs 从 src/client/** 生成，请勿手改。
 * 模块：43 个 · zh key：651 · en key：651
 * 运行形态：__ModuleLoader__.load({ id: '@local/loop-atlas', factory(require) {…} })
 */
window.__ModuleLoader__.load({
  id: "@local/loop-atlas",
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const __defs = Object.create(null)
    const __cache = Object.create(null)
    const __def = (id, fn) => { __defs[id] = fn }
    const __req = (id) => {
      const cached = __cache[id]
      if (cached) return cached
      const fn = __defs[id]
      if (!fn) throw new Error('未打包模块: ' + id)
      const exported = fn(__req)
      __cache[id] = exported
      return exported
    }
__def("i18n.js", function (__req) {
/**
 * 掌控（Grasp）· 客户端文案字典（唯一 key 清单）
 *
 * 约定（与 content 组一致）：
 * - key 一律以 `loop.` 开头，是完整字符串；宿主 locale 服务不做命名空间拼接，
 *   `ctx.locale.register('loop', dict)` 后 `bind('loop')` 里 `t('loop.xxx')` 原样查找。
 * - 这里的两份 fallback 字典是最终兜底：构建时 build/build-client.mjs 会读取
 *   locale/{zh,en}.json 的 messages 覆盖同 key；两边 key 集合应一致。
 * - 缺 key 时页面显示 key 本身。en 必须与 zh 的 key 完全对应。
 * - 占位符用 `{name}`，由 translator 做简单插值。
 */

const FALLBACK_ZH = {
  // ── 外壳 / 顶栏 ────────────────────────────────────────────
  'loop.app.title': '掌控',
  'loop.app.tagline': '看清一个系统如何纠正自己，也看清自己凭什么相信它',
  'loop.app.loading': '正在读取宿主数据…',
  'loop.app.loadError': '读不到本地数据',
  'loop.app.errorHint': '页面通过 /api/loop-atlas 读取宿主写入的数据文件。请确认宿主侧插件已激活，然后重试。',
  'loop.app.retry': '重试',
  'loop.brand.sub': '控制论 · 推理与验证',
  'loop.scale.label': '阅读尺度',
  'loop.scale.domain': '领域',
  'loop.scale.subject': '问题',
  'loop.scale.evidence': '证据',
  'loop.scale.domain.hint': '看骨架：八个单元各自解决什么问题',
  'loop.scale.subject.hint': '读懂关系：当前节点与它的相关邻居',
  'loop.scale.evidence.hint': '动手验证：实验、预测、证据与任务草案',
  'loop.projection.label': '视角',
  'loop.projection.theory': '理论',
  'loop.projection.history': '历史',
  'loop.projection.practice': '实践',
  'loop.projection.hint': '视角切换在问题尺度可用',
  'loop.search.placeholder': '搜索节点、关系…',
  'loop.search.label': '搜索',
  'loop.search.empty': '没有匹配的节点或关系',
  'loop.search.node': '节点',
  'loop.search.relation': '关系',
  'loop.search.hint': '↑↓ 选择 · Enter 打开 · Esc 关闭',
  'loop.continue': '继续研究',
  'loop.continue.title': '继续研究',
  'loop.continue.lastSubject': '上次阅读',
  'loop.continue.investigations': '进行中的研究问题',
  'loop.continue.predictions': '待验证的预测',
  'loop.continue.runs': '最近的运行',
  'loop.continue.nextTest': '下一项检验',
  'loop.continue.noNextTest': '还没写下一项检验',
  'loop.continue.empty': '还没有进行中的研究。先在问题尺度选一个节点，或写下一条预测。',
  'loop.continue.open': '回到这里',
  'loop.resources': '资料与备份',
  'loop.partner.show': '展开学习伙伴',
  'loop.partner.hide': '收起学习伙伴',
  'loop.partner.title': '学习伙伴',
  'loop.partner.model': '模型',
  'loop.partner.model.available': '可用',
  'loop.partner.model.unavailable': '不可用',
  'loop.partner.tab.chat': '对话',
  'loop.partner.tab.notes': '笔记',
  'loop.dir.title': '单元目录',
  'loop.dir.overview': '领域总览',
  'loop.dir.entry': '入口',
  'loop.dir.notes': '{count} 条笔记',
  'loop.dir.collapse': '收起目录',
  'loop.dir.expand': '展开目录',
  'loop.dir.current': '当前',
  'loop.stage.graph': '图',
  'loop.stage.read': '阅读',
  'loop.stage.chat': '对话',
  'loop.stage.label': '窄屏分段视图',
  'loop.dialog.close': '关闭',
  'loop.overlay.close': '关闭弹层',

  // ── 领域尺度 ───────────────────────────────────────────────
  'loop.domain.intro': '八个单元，每个回答一个维持性问题。进入单元即回到它的入口节点。',
  'loop.domain.question': '解决什么问题',
  'loop.domain.capability': '能力目标',
  'loop.domain.concepts': '{count} 个概念',
  'loop.domain.start': '从目标与边界开始',
  'loop.domain.recommended': '建议起点',
  'loop.domain.openUnit': '进入单元：{title}',

  // ── 问题尺度 ───────────────────────────────────────────────
  'loop.subject.current': '当前节点',
  'loop.subject.neighbors': '{count} 个相关邻居',
  'loop.subject.neighborsEmpty': '这个节点还没有已收录的关系。可切到理论视角看单元结构，或在证据尺度写下你的问题。',
  'loop.subject.moreNeighbors': '还有 {count} 个相关节点未展开',
  'loop.subject.kind.concept': '概念',
  'loop.subject.kind.device': '装置',
  'loop.subject.kind.event': '事件',
  'loop.subject.eraUnknown': '时间不确定',
  'loop.subject.graph': '图谱',
  'loop.subject.list': '列表',
  'loop.subject.read': '读当前节点',
  'loop.subject.def': '定义',
  'loop.subject.can': '能做什么',
  'loop.subject.mech': '机制',
  'loop.subject.limits': '适用条件与边界',
  'loop.subject.counter': '反例',
  'loop.subject.check': '检验任务',
  'loop.subject.hist': '历史关联',
  'loop.subject.migrate': '迁移到编程智能体',
  'loop.subject.migrateType.formal': '同一机制',
  'loop.subject.migrateType.application': '工程应用',
  'loop.subject.migrateType.analogy': '类比，不是同一机制',
  'loop.subject.migrateType.heuristic': '经验法则，不是同一机制',
  'loop.subject.claims': '主张与来源',
  'loop.subject.sources': '来源',
  'loop.subject.notesCount': '{count} 条相关笔记',
  'loop.subject.relationsCount': '{count} 条关系',
  'loop.subject.graphHint': '点节点切换中心，点连线或关系标签读条件与代价。',
  'loop.subject.viewEvidence': '在证据尺度验证',
  'loop.subject.clearRelation': '取消选中关系',
  'loop.subject.group': '所属单元',
  'loop.subject.unknownGroup': '未分组',
  'loop.subject.empty': '内容包缺少节点数据，无法显示问题尺度。',

  // ── 关系类型与关系详情 ─────────────────────────────────────
  'loop.relation.type.prerequisite': '依赖',
  'loop.relation.type.formal': '形式结果',
  'loop.relation.type.constraint': '限制',
  'loop.relation.type.parallel': '并行',
  'loop.relation.type.historical': '历史影响',
  'loop.relation.type.analogy': '类比',
  'loop.relation.type.application': '工程应用',
  'loop.relation.type.unknown': '关系',
  'loop.relation.detail': '关系详情',
  'loop.relation.fromTo': '{from} → {to}',
  'loop.relation.claim': '这条关系断言什么',
  'loop.relation.condition': '在什么条件下成立',
  'loop.relation.cost': '相信或使用它的代价',
  'loop.relation.claims': '主张级来源',
  'loop.relation.noClaims': '这条关系还没有主张级来源。',
  'loop.relation.noClaim': '这条关系没有单独的主张文本。',
  'loop.relation.annotation': '我的批注',
  'loop.relation.annotationPlaceholder': '在你的条件下，这条关系如何成立？写下你的判断，不必与教材一致。',
  'loop.relation.status': '我的判断',
  'loop.relation.status.open': '待判断',
  'loop.relation.status.supported': '我确认支持',
  'loop.relation.status.challenged': '我有反例',
  'loop.relation.evidence': '相关证据（{count}）',
  'loop.relation.evidenceEmpty': '还没有挂在这条关系上的笔记。在右侧笔记里写一条，或用实验观察生成一条。',
  'loop.relation.attach': '挂为证据',
  'loop.relation.detach': '取消挂载',
  'loop.relation.ask': '就这条关系对话',
  'loop.relation.saveAnnotation': '保存批注',
  'loop.relation.saved': '批注已保存（宿主已确认）',
  'loop.relation.verified.verified': '已核验',
  'loop.relation.verified.secondary': '二手来源',
  'loop.relation.verified.unverified': '未核验',
  'loop.relation.claimKind.formal': '形式结果',
  'loop.relation.claimKind.empirical': '经验',
  'loop.relation.claimKind.historical': '历史',
  'loop.relation.claimKind.interpretation': '解释',
  'loop.relation.selectHint': '点一条连线或关系标签，读它的主张、条件与代价。',
  'loop.relation.noCondition': '未写明条件 —— 这本身值得怀疑。',
  'loop.relation.noCost': '未写明代价。',
  'loop.relation.openSource': '查看来源：{title}',

  // ── 理论 / 历史 / 实践视角 ─────────────────────────────────
  'loop.theory.title': '理论视角：先修 → 形式结果 → 设计取舍',
  'loop.theory.current': '当前节点',
  'loop.theory.prereq': '先修与依赖',
  'loop.theory.formal': '形式结果',
  'loop.theory.tradeoff': '设计取舍',
  'loop.theory.historical': '历史影响',
  'loop.theory.analogy': '类比（非同一机制）',
  'loop.theory.application': '工程应用',
  'loop.theory.empty': '这个节点在理论视角下没有更多已收录结构。',
  'loop.history.title': '历史视角：按确证时间区间排列',
  'loop.history.unknown': '时间不确定',
  'loop.history.unknownHint': '以下节点没有可确证的年代起点，单独列出，不编年表。',
  'loop.history.empty': '没有与当前节点相关、且可确证时间的历史资料。',
  'loop.history.gap': '缺口：{item}',
  'loop.history.searchPath': '检索路径：{path}',
  'loop.history.source': '来源',
  'loop.history.work': '著作 / 文献',
  'loop.history.yearUnknown': '年代不确定',
  'loop.history.yearRange': '{from}—{to}',
  'loop.history.yearSingle': '{year}',
  'loop.practice.title': '实践视角：目标 → 上下文 → 行动 → 观测 → 验收 → 修订',
  'loop.practice.goal': '目标',
  'loop.practice.measurement': '测量',
  'loop.practice.context': '上下文',
  'loop.practice.action': '行动',
  'loop.practice.observation': '观测',
  'loop.practice.acceptance': '验收',
  'loop.practice.revision': '修订',
  'loop.practice.other': '未映射到阶段',
  'loop.practice.caveat': '这里放的是工程机制。历史类比只作参照，不等于同一机制。',
  'loop.practice.empty': '这个节点的实践阶段还没有被内容包标注。',
  'loop.practice.stageHint': '按内容包的 practiceStages 标注排列，不是流程顺序的证据。',

  // ── 证据尺度 ───────────────────────────────────────────────
  'loop.evidence.title': '证据尺度：动手验证当前主题',
  'loop.evidence.noSubject': '先在问题尺度选一个节点或关系，再回到证据尺度。',
  'loop.evidence.pickSubject': '去问题尺度选主题',
  'loop.evidence.experiments': '实验',
  'loop.evidence.experimentHint': '实验由宿主侧的确定性模型执行；记录模型版本、参数与判据。',
  'loop.evidence.noExperiments': '没有与当前主题关联的实验。',
  'loop.evidence.investigations': '研究问题',
  'loop.evidence.predictions': '预测',
  'loop.evidence.notes': '证据笔记',
  'loop.evidence.tasks': '任务草案',
  'loop.evidence.runs': '运行记录',
  'loop.evidence.noRuns': '还没有运行记录。运行一次实验，它会带着模型版本和判据保存下来。',
  'loop.evidence.newTask': '新建任务草案',
  'loop.evidence.back': '返回证据总览',
  'loop.evidence.investigateFor': '为「{name}」写一个研究问题',
  'loop.evidence.openTask': '打开任务草案',
  'loop.evidence.subjectSources': '{sources} 个来源 · {unverified} 项待核验',
  'loop.evidence.savedAt': '记录于 {at}',
  'loop.evidence.reproducible': '同一参数可复现',
  'loop.evidence.taskEmpty': '还没有任务草案。先写清楚你要改变什么行为。',
  'loop.evidence.viewAllRuns': '查看全部运行',
  'loop.evidence.hideRuns': '收起运行记录',

  // ── 实验 ───────────────────────────────────────────────────
  'loop.exp.predict': '先写下你的预测（可跳过）',
  'loop.exp.predictionPlaceholder': '改动之后会发生什么？',
  'loop.exp.run': '运行',
  'loop.exp.running': '运行中…',
  'loop.exp.skip': '跳过预测，直接运行',
  'loop.exp.rerun': '改参数后重跑',
  'loop.exp.verdict': '判定结果',
  'loop.exp.criterion': '判据',
  'loop.exp.model': '模型',
  'loop.exp.params': '参数',
  'loop.exp.recordedAt': '记录时间',
  'loop.exp.reproducible': '同一参数得到同一结果',
  'loop.exp.yourPrediction': '你的预测',
  'loop.exp.match': '预测与判定一致',
  'loop.exp.mismatch': '预测与判定不一致 —— 这比猜对更有信息',
  'loop.exp.saveObs': '把这次观察写成证据',
  'loop.exp.teaching': '教学模型',
  'loop.exp.notRealSystem': '这是教学模型，不是任何真实系统的辨识结果。',
  'loop.exp.failed': '运行失败：{message}',
  'loop.exp.trace': '响应轨迹',
  'loop.exp.target': '目标',
  'loop.exp.closePanel': '收起实验',
  'loop.exp.openPanel': '打开实验',
  'loop.exp.runSaved': '运行记录已由宿主保存',
  'loop.exp.verdict.converged': '收敛',
  'loop.exp.verdict.overshoot-settled': '过冲后收敛',
  'loop.exp.verdict.oscillating': '持续振荡（穿越目标）',
  'loop.exp.verdict.oscillating-below': '目标下方振荡（不穿越目标）',
  'loop.exp.verdict.drift': '漂移（未到目标）',
  'loop.exp.verdict.diverging': '发散',
  'loop.exp.verdict.pass': '通过',
  'loop.exp.verdict.fail': '失败',
  'loop.exp.verdict.mixed': '部分通过',
  'loop.exp.delay.K': '增益 K',
  'loop.exp.delay.D': '延迟 D（秒）',
  'loop.exp.delay.formula': '一阶惯性 + 纯延迟：y′ = (u − y)/τ，τ = 0.5 s，u = clamp(K·(1 − y(t−D)), −2, 2)，dt = 0.02 s，目标 1。',
  'loop.exp.proxy.e': '优化力度 e',
  'loop.exp.proxy.visible': '可见指标',
  'loop.exp.proxy.hidden': '隐藏指标',
  'loop.exp.proxy.ratio': '隐藏 / 可见',
  'loop.exp.proxy.peak': '隐藏指标峰值出现在 e ≈ {e}，值 {value}',
  'loop.exp.green.cases': '检查用例',
  'loop.exp.green.allGreen': '已勾选的检查全部通过',
  'loop.exp.green.notCorrect': '这只说明「已测到的行为」通过，不等于功能正确。',
  'loop.exp.green.caveat': '把「越界」用例勾上再看一次。',
  'loop.exp.green.off': '未启用',
  'loop.exp.green.pass': '通过',
  'loop.exp.green.fail': '失败',
  'loop.exp.green.actual': '实得：{actual}',
  'loop.exp.green.expect': '期望：{expect}',

  // ── 预测 ───────────────────────────────────────────────────
  'loop.pred.title': '预测',
  'loop.pred.new': '写一条预测',
  'loop.pred.text': '预测内容',
  'loop.pred.textPlaceholder': '例如：延迟大到 1 秒后，同一增益会持续振荡。',
  'loop.pred.resolveBy': '可判定条件',
  'loop.pred.resolveByPlaceholder': '例如：D ≥ 0.9、K = 1.2 时，16 秒内穿越目标 4 次以上。',
  'loop.pred.save': '保存预测（未解决）',
  'loop.pred.saved': '预测已保存（宿主已确认）',
  'loop.pred.saving': '保存中…',
  'loop.pred.empty': '还没有预测。先写一条可判定的预测，再用实验或观察去碰它。',
  'loop.pred.status.open': '待验证',
  'loop.pred.status.supported': '支持',
  'loop.pred.status.refuted': '反驳',
  'loop.pred.status.inconclusive': '不足以判断',
  'loop.pred.resolve.supported': '支持',
  'loop.pred.resolve.refuted': '反驳',
  'loop.pred.resolve.inconclusive': '不足以判断',
  'loop.pred.resolutionNote': '判定说明',
  'loop.pred.resolutionNotePlaceholder': '依据是哪次运行、哪条观察？',
  'loop.pred.resolve': '记录判定',
  'loop.pred.resolvedAt': '判定于 {at}',
  'loop.pred.legacy': '旧记录',
  'loop.pred.legacyHint': '旧版本预测没有完整判定字段，按「待验证」显示。',
  'loop.pred.linkRun': '关联运行（可选）',
  'loop.pred.noRun': '不关联运行',
  'loop.pred.investigation': '所属研究问题',
  'loop.pred.noneInvestigation': '不关联研究问题',
  'loop.pred.needText': '先写预测内容。',

  // ── 研究问题 ───────────────────────────────────────────────
  'loop.inv.title': '研究问题',
  'loop.inv.new': '新建研究问题',
  'loop.inv.titleLabel': '问题标题',
  'loop.inv.titlePlaceholder': '例如：负反馈在什么延迟下不再稳定？',
  'loop.inv.claim': '当前主张',
  'loop.inv.claimPlaceholder': '你认为现在成立的解释。',
  'loop.inv.counter': '相反解释',
  'loop.inv.counterPlaceholder': '如果当前主张错了，最可能的另一种解释是什么？',
  'loop.inv.nextTest': '下一项检验',
  'loop.inv.nextTestPlaceholder': '一句话：下一步怎么检验。',
  'loop.inv.save': '保存研究问题',
  'loop.inv.saved': '研究问题已保存（宿主已确认）',
  'loop.inv.saving': '保存中…',
  'loop.inv.empty': '还没有研究问题。写下一个主张和一个相反解释，让后面每一步都有对手。',
  'loop.inv.status.open': '开放',
  'loop.inv.status.testing': '检验中',
  'loop.inv.status.supported': '支持',
  'loop.inv.status.revised': '已修订',
  'loop.inv.status.inconclusive': '不足以判断',
  'loop.inv.statusLabel': '状态',
  'loop.inv.resolve': '更新状态',
  'loop.inv.resolveNote': '说明',
  'loop.inv.discuss': '就这个问题对话',
  'loop.inv.predCount': '{count} 条预测',
  'loop.inv.runCount': '{count} 次运行',
  'loop.inv.editing': '正在编辑：{title}',
  'loop.inv.cancel': '取消编辑',
  'loop.inv.needTitle': '先写研究问题标题。',
  'loop.inv.nextTestLabel': '下一步',

  // ── 笔记 ───────────────────────────────────────────────────
  'loop.note.title': '笔记',
  'loop.note.placeholder': '写下你自己的话。它只属于你，AI 的回复不会自动变成你的笔记。',
  'loop.note.kind': '类型',
  'loop.note.kind.理解': '理解',
  'loop.note.kind.疑问': '疑问',
  'loop.note.kind.证据': '证据',
  'loop.note.kind.反驳': '反驳',
  'loop.note.kind.实践': '实践',
  'loop.note.save': '保存为我的笔记',
  'loop.note.saving': '保存中…',
  'loop.note.edit': '编辑',
  'loop.note.saveEdit': '保存修改',
  'loop.note.cancel': '取消',
  'loop.note.archive': '归档',
  'loop.note.restore': '恢复',
  'loop.note.delete': '删除',
  'loop.note.deleteConfirm': '确定删除这条笔记？此操作会写入本地数据。',
  'loop.note.empty': '这个主题还没有笔记。先写一句自己的理解。',
  'loop.note.source.user': '用户原文',
  'loop.note.source.ai-draft': 'AI 草案',
  'loop.note.source.import': '导入材料',
  'loop.note.source.legacy': '旧记录来源不确定',
  'loop.note.legacyHint': '旧版本记录无法区分是你亲写还是工具代写；请确认后自行修改。',
  'loop.note.encodingHint': '这条旧记录可能包含编码损坏（? 替换字符）。',
  'loop.note.savedBy': '保存者',
  'loop.note.savedBy.ui': '你',
  'loop.note.savedBy.agent': '智能体',
  'loop.note.adopted': '已采纳',
  'loop.note.revision': '修订 {n}',
  'loop.note.adoptDraft': '存为我的证据（草案）',
  'loop.note.adoptedDraft': '已存为草案',
  'loop.note.draftHint': '作为 AI 草案保存；不会冒充你的原文。',
  'loop.note.saveError': '保存失败：{message}',
  'loop.note.count': '{count} 条',
  'loop.note.archivedLabel': '已归档',
  'loop.note.statusLabel': '状态',
  'loop.note.adoptError': '存为草案失败：{message}',
  'loop.note.notesFor': '当前主题的笔记',

  // ── 学习伙伴对话 ───────────────────────────────────────────
  'loop.chat.title': '对话',
  'loop.chat.empty': '就当前主题向真实模型提问。回答不会自动变成你的笔记。',
  'loop.chat.placeholder': '针对当前主题提问…（Ctrl+Enter 发送）',
  'loop.chat.send': '发送',
  'loop.chat.sending': '生成中…',
  'loop.chat.stop': '停止',
  'loop.chat.stopping': '停止中…',
  'loop.chat.retry': '重试',
  'loop.chat.failed': '失败',
  'loop.chat.cancelled': '已停止',
  'loop.chat.streaming': '生成中…',
  'loop.chat.errorCode': '错误代码：{code}',
  'loop.chat.interrupted': '上次回答在关闭页面时中断，可重试。',
  'loop.chat.modelUnavailable': '模型不可用：{reason}。问题草稿会保留。',
  'loop.chat.sendFailed': '请求失败：{message}',
  'loop.chat.draftHint': '草稿按主题保存；切换主题不会串题。',
  'loop.chat.subjectNote': '回答归属发送时的主题，切换主题不会改变它。',
  'loop.chat.you': '你',
  'loop.chat.ai': '学习伙伴',
  'loop.chat.copy': '复制',
  'loop.chat.copied': '已复制',
  'loop.chat.copyFailed': '复制失败：{reason}',
  'loop.chat.noModel': '未配置默认模型',
  'loop.chat.sourcesSummary': '来源 {sources} · 待核验 {unverified}',
  'loop.chat.retryUnavailable': '宿主未提供重试接口：{message}',
  'loop.chat.partial': '（未完成）',

  // ── 任务草案 ───────────────────────────────────────────────
  'loop.task.title': '任务草案',
  'loop.task.startTitle': '先问：你要改变什么行为？',
  'loop.task.request': '真实需求',
  'loop.task.requestPlaceholder': '用你自己的话写：现在什么行为不对，你希望它变成什么？不用先想验收标准。',
  'loop.task.generate': '生成可编辑草案',
  'loop.task.generating': '生成中…',
  'loop.task.goal': '目标',
  'loop.task.acceptance': '验收（什么算够）',
  'loop.task.boundary': '边界（不做什么）',
  'loop.task.unknowns': '未知项（以问题呈现）',
  'loop.task.answerPlaceholder': '先写你的判断（可留空）',
  'loop.task.concepts': '相关概念',
  'loop.task.evidence': '证据关联',
  'loop.task.save': '保存草案',
  'loop.task.saving': '保存中…',
  'loop.task.saved': '草案已保存（宿主已确认）',
  'loop.task.archive': '归档',
  'loop.task.versions': '版本',
  'loop.task.version': '第 {n} 版',
  'loop.task.compare': '对比当前与所选版本',
  'loop.task.copy': '复制全文',
  'loop.task.export': '导出',
  'loop.task.notSent': '草案只保存在本地，不会自动发送给任何外部工具。',
  'loop.task.empty': '还没有任务草案。',
  'loop.task.needRequest': '先写真实需求，再生成草案。',
  'loop.task.addAcceptance': '加一条验收',
  'loop.task.addBoundary': '加一条边界',
  'loop.task.addUnknown': '加一条未知项',
  'loop.task.remove': '移除',
  'loop.task.status.draft': '草案',
  'loop.task.status.saved': '已保存',
  'loop.task.status.archived': '已归档',
  'loop.task.model': '生成模型',
  'loop.task.fromSubject': '来自主题',
  'loop.task.evidenceEmpty': '还没有可关联的证据。',
  'loop.task.editorTitle': '编辑任务草案',
  'loop.task.back': '返回',
  'loop.task.readOnly': '已保存版本（只读）',
  'loop.task.compareTitle': '版本对比',
  'loop.task.draftReady': '草案已生成，可逐条修改后再保存。',
  'loop.task.generatedAt': '生成于 {at}',
  'loop.task.exportDone': '已导出任务草案',
  'loop.task.basedOn': '依据缺口',
  'loop.task.modelUnavailable': '模型不可用：{reason}',
  'loop.task.acceptanceEmpty': '还没有验收条目 —— 这样的草案不值得执行。',

  // ── 资料与备份 ─────────────────────────────────────────────
  'loop.res.title': '资料与备份',
  'loop.res.dataPath': '数据文件路径',
  'loop.res.backup': '立即备份',
  'loop.res.backupDone': '备份已创建：{path}',
  'loop.res.backingUp': '备份中…',
  'loop.res.export': '导出用户数据包',
  'loop.res.exportDone': '已导出用户数据包',
  'loop.res.exporting': '导出中…',
  'loop.res.import': '导入用户数据包',
  'loop.res.importPick': '选择数据包 JSON…',
  'loop.res.preview': '预览与校验',
  'loop.res.previewing': '校验中…',
  'loop.res.counts': '记录数：{summary}',
  'loop.res.conflicts': '冲突：{count}',
  'loop.res.errors': '校验错误：{count}',
  'loop.res.mode': '导入方式',
  'loop.res.mode.merge': '合并（同 ID 不同内容时报冲突，整体不写）',
  'loop.res.mode.skip': '跳过已存在的记录',
  'loop.res.mode.replace': '替换（需确认，会先自动备份）',
  'loop.res.replaceConfirm': '我已了解：替换会覆盖现有记录',
  'loop.res.confirmImport': '确认导入',
  'loop.res.importing': '导入中…',
  'loop.res.importDone': '导入完成：{summary}',
  'loop.res.conflictList': '冲突清单',
  'loop.res.errorList': '校验错误',
  'loop.res.migration': '迁移报告',
  'loop.res.migrationEmpty': '没有迁移记录（当前数据不是从旧版本升级来的）。',
  'loop.res.migrating': '读取中…',
  'loop.res.notices': '数据提示',
  'loop.res.importLog': '导入历史',
  'loop.res.copyPath': '复制路径',
  'loop.res.copied': '已复制',
  'loop.res.copyFailed': '复制失败：{reason}',
  'loop.res.packTooLarge': '用户数据包不能超过 8 MiB（当前约 {size}）。',
  'loop.res.parseError': '不是合法的 JSON 文件：{reason}',
  'loop.res.invalidPack': '不是本插件导出的用户数据包。',
  'loop.res.reportTitle': '迁移细节',
  'loop.res.importIdempotent': '重复导入同一数据包不会产生新记录。',
  'loop.res.blocked': '有校验错误时不能导入，请先修正数据包。',

  // ── 状态条 / 回执 ──────────────────────────────────────────
  'loop.status.dataPath': '数据：{path}',
  'loop.status.model': '模型：{model}',
  'loop.status.modelUnavailable': '模型不可用',
  'loop.status.saveOk': '已保存（宿主确认）：{what}',
  'loop.status.saveError': '保存失败：{message}',
  'loop.status.at': '{at}',
  'loop.status.receipts': '回执与提示',
  'loop.status.noReceipts': '还没有回执。',
  'loop.status.notice': '提示',
  'loop.status.warning': '警告',
  'loop.status.error': '错误',
  'loop.status.ok': '成功',
  'loop.status.viewSaveFailed': '视图状态未能保存：{message}',
  'loop.status.dismiss': '清空回执',
  'loop.status.ready': '就绪',
  'loop.status.loading': '读取中',
  'loop.status.loadFailed': '读取失败',
  'loop.status.noticesCount': '{count} 条数据提示',
  'loop.status.receiptFromHost': '以下回执来自宿主真实响应',
  'loop.status.copiedPath': '路径已复制',

  // ── 列表视图 / 可访问性 ────────────────────────────────────
  'loop.list.title': '列表视图',
  'loop.list.filter': '过滤节点与关系…',
  'loop.list.nodes': '节点',
  'loop.list.relations': '关系',
  'loop.list.empty': '没有匹配的条目。',
  'loop.list.nodeHint': '选一个节点把它放到中心。',
  'loop.list.relationHint': '选一条关系读它的条件与代价。',
  'loop.a11y.graph': '知识图谱：当前节点与相关邻居',
  'loop.a11y.list': '知识图谱的列表替代视图',
  'loop.a11y.current': '当前',
  'loop.a11y.relation': '关系 {type}：{from} 到 {to}',
  'loop.a11y.selected': '已选中',
  'loop.a11y.panel': '掌控面板',
  'loop.a11y.status': '状态与回执',
  'loop.a11y.notes': '笔记列表',
  'loop.a11y.chat': '对话消息列表',
  'loop.a11y.unknown': '未命名',

  // ── 时间 ───────────────────────────────────────────────────
  'loop.time.unknown': '时间不确定',
  'loop.time.justNow': '刚刚',
  'loop.time.minutesAgo': '{count} 分钟前',
  'loop.time.hoursAgo': '{count} 小时前',

  // ── 通用 ───────────────────────────────────────────────────
  'loop.common.cancel': '取消',
  'loop.common.confirm': '确认',
  'loop.common.close': '关闭',
  'loop.common.save': '保存',
  'loop.common.delete': '删除',
  'loop.common.edit': '编辑',
  'loop.common.back': '返回',
  'loop.common.loading': '加载中…',
  'loop.common.none': '—',
  'loop.common.unknown': '未知',
  'loop.common.copy': '复制',
  'loop.common.copied': '已复制',
  'loop.common.copyFailed': '复制失败',
  'loop.common.more': '更多',
  'loop.common.less': '收起',
  'loop.common.expand': '展开',
  'loop.common.new': '新建',
  'loop.common.optional': '可选',
  'loop.common.required': '必填',
  'loop.common.refresh': '刷新',
  'loop.common.retry': '重试',
  'loop.common.previous': '上一步',
  'loop.common.next': '下一步',
  'loop.common.notes': '笔记',
  'loop.common.evidence': '证据',
  'loop.common.sources': '来源',
  'loop.common.revision': '修订',
  'loop.common.dismiss': '知道了',
  'loop.common.you': '你',
  'loop.common.agent': '智能体',
  'loop.common.source': '来源',

  // ── 错误代码 ───────────────────────────────────────────────
  'loop.error.VALIDATION': '输入不合法',
  'loop.error.NOT_FOUND': '找不到记录',
  'loop.error.CONFLICT': '数据冲突',
  'loop.error.STORAGE_WRITE': '写入存储失败',
  'loop.error.LLM_UNAVAILABLE': '模型不可用',
  'loop.error.LLM_AUTH': '模型鉴权失败',
  'loop.error.LLM_RATE_LIMIT': '模型限流',
  'loop.error.LLM_CONTEXT': '上下文超限',
  'loop.error.BUSY': '同一主题已有进行中的回答',
  'loop.error.CANCELED': '已取消',
  'loop.error.IMPORT_INVALID': '导入包不合法',
  'loop.error.PACKAGE_TOO_LARGE': '数据包过大',
  'loop.error.READ_ONLY': '数据只读',
  'loop.error.NETWORK': '无法连接宿主接口',
  'loop.error.PROTOCOL': '宿主返回了无法解析的响应',
  'loop.error.HTTP': '宿主返回 HTTP {status}',
  'loop.error.UNKNOWN': '未知错误',

  // ── 宿主设置区入口 ─────────────────────────────────────────
  'loop.settings.title': '掌控 · 控制论',
  'loop.settings.description':
    '一张同源知识图谱：沿控制论的历史与理论，把反馈、延迟、测量与边界迁移到编程智能体的任务设计上。笔记、实验记录与任务草案都保存在本地数据文件中。',
  'loop.settings.open': '打开掌控',
  'loop.settings.dataPath': '数据文件：{path}',
  'loop.sidebar.open': '掌控',
  'loop.today.cta.answer': '继续回答六问',
  'loop.today.cta.backfill': '回填这次观察',
  'loop.today.cta.checkEarly': '提前看一次',
  'loop.today.cta.designCheck': '设计一次最小检验',
  'loop.today.cta.startCheck': '开始这次检验',
  'loop.today.cta.compare': '对比预测与实际',
  'loop.today.cta.designNext': '设计下一次检验',
  'loop.today.cta.restart': '重启这条回路',
  'loop.today.cta.archived': '已归档，开一张新卡',
  'loop.today.cta.quick': '只做 5 分钟版本',
  'loop.today.tier.quick': '5 分钟',
  'loop.today.tier.standard': '30 分钟',
  'loop.today.tier.deep': '深度',
}

const FALLBACK_EN = {
  // Shell / top bar
  'loop.app.title': 'Grasp',
  'loop.app.tagline': 'See how a system corrects itself — and why you should believe it.',
  'loop.app.loading': 'Reading host data…',
  'loop.app.loadError': 'Cannot read local data',
  'loop.app.errorHint':
    'The panel reads the host-written data file through /api/loop-atlas. Check that the host plugin is active, then retry.',
  'loop.app.retry': 'Retry',
  'loop.brand.sub': 'Cybernetics · reasoning & verification',
  'loop.scale.label': 'Reading scale',
  'loop.scale.domain': 'Domain',
  'loop.scale.subject': 'Question',
  'loop.scale.evidence': 'Evidence',
  'loop.scale.domain.hint': 'Skeleton: what each of the eight units solves',
  'loop.scale.subject.hint': 'Read one relation: the current node and its neighbours',
  'loop.scale.evidence.hint': 'Test it: experiments, predictions, evidence, task drafts',
  'loop.projection.label': 'View',
  'loop.projection.theory': 'Theory',
  'loop.projection.history': 'History',
  'loop.projection.practice': 'Practice',
  'loop.projection.hint': 'View switching is available on the question scale',
  'loop.search.placeholder': 'Search nodes, relations…',
  'loop.search.label': 'Search',
  'loop.search.empty': 'No matching node or relation',
  'loop.search.node': 'Node',
  'loop.search.relation': 'Relation',
  'loop.search.hint': '↑↓ select · Enter open · Esc close',
  'loop.continue': 'Continue',
  'loop.continue.title': 'Continue research',
  'loop.continue.lastSubject': 'Last read',
  'loop.continue.investigations': 'Open investigations',
  'loop.continue.predictions': 'Unresolved predictions',
  'loop.continue.runs': 'Recent runs',
  'loop.continue.nextTest': 'Next test',
  'loop.continue.noNextTest': 'No next test written yet',
  'loop.continue.empty': 'Nothing in progress. Pick a node on the question scale, or write a prediction.',
  'loop.continue.open': 'Go back here',
  'loop.resources': 'Data & backup',
  'loop.partner.show': 'Show learning partner',
  'loop.partner.hide': 'Hide learning partner',
  'loop.partner.title': 'Learning partner',
  'loop.partner.model': 'Model',
  'loop.partner.model.available': 'Available',
  'loop.partner.model.unavailable': 'Unavailable',
  'loop.partner.tab.chat': 'Chat',
  'loop.partner.tab.notes': 'Notes',
  'loop.dir.title': 'Unit directory',
  'loop.dir.overview': 'Domain overview',
  'loop.dir.entry': 'Entry',
  'loop.dir.notes': '{count} notes',
  'loop.dir.collapse': 'Collapse directory',
  'loop.dir.expand': 'Expand directory',
  'loop.dir.current': 'Current',
  'loop.stage.graph': 'Graph',
  'loop.stage.read': 'Read',
  'loop.stage.chat': 'Chat',
  'loop.stage.label': 'Narrow-screen sections',
  'loop.dialog.close': 'Close',
  'loop.overlay.close': 'Close dialog',

  // Domain scale
  'loop.domain.intro':
    'Eight units, each answering one sustaining question. Entering a unit returns to its entry node.',
  'loop.domain.question': 'What it solves',
  'loop.domain.capability': 'Capability',
  'loop.domain.concepts': '{count} concepts',
  'loop.domain.start': 'Start with goals and boundaries',
  'loop.domain.recommended': 'Suggested start',
  'loop.domain.openUnit': 'Enter unit: {title}',

  // Subject scale
  'loop.subject.current': 'Current node',
  'loop.subject.neighbors': '{count} related neighbours',
  'loop.subject.neighborsEmpty':
    'No recorded relation touches this node yet. Switch to the theory view for unit structure, or write your question on the evidence scale.',
  'loop.subject.moreNeighbors': '{count} more related nodes not expanded',
  'loop.subject.kind.concept': 'Concept',
  'loop.subject.kind.device': 'Device',
  'loop.subject.kind.event': 'Event',
  'loop.subject.eraUnknown': 'Date uncertain',
  'loop.subject.graph': 'Graph',
  'loop.subject.list': 'List',
  'loop.subject.read': 'Read current node',
  'loop.subject.def': 'Definition',
  'loop.subject.can': 'What it can do',
  'loop.subject.mech': 'Mechanism',
  'loop.subject.limits': 'Conditions & limits',
  'loop.subject.counter': 'Counterexample',
  'loop.subject.check': 'Test task',
  'loop.subject.hist': 'Historical context',
  'loop.subject.migrate': 'Transfer to coding agents',
  'loop.subject.migrateType.formal': 'Same mechanism',
  'loop.subject.migrateType.application': 'Engineering application',
  'loop.subject.migrateType.analogy': 'Analogy, not the same mechanism',
  'loop.subject.migrateType.heuristic': 'Heuristic, not the same mechanism',
  'loop.subject.claims': 'Claims & sources',
  'loop.subject.sources': 'Sources',
  'loop.subject.notesCount': '{count} related notes',
  'loop.subject.relationsCount': '{count} relations',
  'loop.subject.graphHint':
    'Click a node to re-centre; click an edge or its label to read conditions and costs.',
  'loop.subject.viewEvidence': 'Test on the evidence scale',
  'loop.subject.clearRelation': 'Clear selected relation',
  'loop.subject.group': 'Unit',
  'loop.subject.unknownGroup': 'Ungrouped',
  'loop.subject.empty': 'The content pack has no nodes, so the question scale cannot render.',

  // Relation types / relation detail
  'loop.relation.type.prerequisite': 'Prerequisite',
  'loop.relation.type.formal': 'Formal result',
  'loop.relation.type.constraint': 'Constraint',
  'loop.relation.type.parallel': 'Parallel',
  'loop.relation.type.historical': 'Historical influence',
  'loop.relation.type.analogy': 'Analogy',
  'loop.relation.type.application': 'Engineering use',
  'loop.relation.type.unknown': 'Relation',
  'loop.relation.detail': 'Relation detail',
  'loop.relation.fromTo': '{from} → {to}',
  'loop.relation.claim': 'What this relation asserts',
  'loop.relation.condition': 'When it holds',
  'loop.relation.cost': 'Cost of trusting or using it',
  'loop.relation.claims': 'Claim-level sources',
  'loop.relation.noClaims': 'This relation has no claim-level source yet.',
  'loop.relation.noClaim': 'This relation has no standalone claim text.',
  'loop.relation.annotation': 'My annotation',
  'loop.relation.annotationPlaceholder':
    'How does this relation hold under your conditions? Write your own judgement — it need not match the text.',
  'loop.relation.status': 'My judgement',
  'loop.relation.status.open': 'Undecided',
  'loop.relation.status.supported': 'I confirm it',
  'loop.relation.status.challenged': 'I have a counterexample',
  'loop.relation.evidence': 'Related evidence ({count})',
  'loop.relation.evidenceEmpty':
    'No note is attached to this relation yet. Write one in the Notes tab, or generate one from an experiment observation.',
  'loop.relation.attach': 'Attach as evidence',
  'loop.relation.detach': 'Detach',
  'loop.relation.ask': 'Discuss this relation',
  'loop.relation.saveAnnotation': 'Save annotation',
  'loop.relation.saved': 'Annotation saved (host confirmed)',
  'loop.relation.verified.verified': 'Verified',
  'loop.relation.verified.secondary': 'Secondary source',
  'loop.relation.verified.unverified': 'Unverified',
  'loop.relation.claimKind.formal': 'Formal result',
  'loop.relation.claimKind.empirical': 'Empirical',
  'loop.relation.claimKind.historical': 'Historical',
  'loop.relation.claimKind.interpretation': 'Interpretation',
  'loop.relation.selectHint': 'Click an edge or a relation label to read its claim, condition and cost.',
  'loop.relation.noCondition': 'No condition recorded — that itself is worth doubting.',
  'loop.relation.noCost': 'No cost recorded.',
  'loop.relation.openSource': 'View source: {title}',

  // Theory / history / practice projections
  'loop.theory.title': 'Theory view: prerequisites → formal results → trade-offs',
  'loop.theory.current': 'Current node',
  'loop.theory.prereq': 'Prerequisites & dependencies',
  'loop.theory.formal': 'Formal results',
  'loop.theory.tradeoff': 'Design trade-offs',
  'loop.theory.historical': 'Historical influence',
  'loop.theory.analogy': 'Analogy (not the same mechanism)',
  'loop.theory.application': 'Engineering use',
  'loop.theory.empty': 'This node has no further recorded structure in the theory view.',
  'loop.history.title': 'History view: ordered by verified date ranges',
  'loop.history.unknown': 'Date uncertain',
  'loop.history.unknownHint':
    'The following nodes have no verifiable start date; they are listed separately instead of being placed on the timeline.',
  'loop.history.empty': 'No history with a verifiable date relates to the current node.',
  'loop.history.gap': 'Gap: {item}',
  'loop.history.searchPath': 'Search path: {path}',
  'loop.history.source': 'Source',
  'loop.history.work': 'Work / literature',
  'loop.history.yearUnknown': 'Date unknown',
  'loop.history.yearRange': '{from}—{to}',
  'loop.history.yearSingle': '{year}',
  'loop.practice.title': 'Practice view: goal → context → action → observation → acceptance → revision',
  'loop.practice.goal': 'Goal',
  'loop.practice.measurement': 'Measurement',
  'loop.practice.context': 'Context',
  'loop.practice.action': 'Action',
  'loop.practice.observation': 'Observation',
  'loop.practice.acceptance': 'Acceptance',
  'loop.practice.revision': 'Revision',
  'loop.practice.other': 'Unmapped stage',
  'loop.practice.caveat':
    'This view shows engineering mechanisms. Historical analogies are references, not the same mechanism.',
  'loop.practice.empty': 'The content pack has not annotated practice stages for this node.',
  'loop.practice.stageHint': 'Arranged by the content pack practiceStages labels, not by evidential order.',

  // Evidence scale
  'loop.evidence.title': 'Evidence scale: test the current subject',
  'loop.evidence.noSubject': 'Pick a node or relation on the question scale, then return to the evidence scale.',
  'loop.evidence.pickSubject': 'Choose a subject on the question scale',
  'loop.evidence.experiments': 'Experiments',
  'loop.evidence.experimentHint':
    'Experiments run in the host-side deterministic models; each record carries model version, parameters and criterion.',
  'loop.evidence.noExperiments': 'No experiment is linked to the current subject.',
  'loop.evidence.investigations': 'Investigations',
  'loop.evidence.predictions': 'Predictions',
  'loop.evidence.notes': 'Evidence notes',
  'loop.evidence.tasks': 'Task drafts',
  'loop.evidence.runs': 'Run records',
  'loop.evidence.noRuns': 'No runs recorded yet. Run an experiment and it is saved with model version and criterion.',
  'loop.evidence.newTask': 'New task draft',
  'loop.evidence.back': 'Back to evidence overview',
  'loop.evidence.investigateFor': 'Write an investigation for “{name}”',
  'loop.evidence.openTask': 'Open task draft',
  'loop.evidence.subjectSources': '{sources} sources · {unverified} unverified',
  'loop.evidence.savedAt': 'Recorded {at}',
  'loop.evidence.reproducible': 'Same parameters reproduce',
  'loop.evidence.taskEmpty': 'No task draft yet. Start with the behaviour you want to change.',
  'loop.evidence.viewAllRuns': 'Show all runs',
  'loop.evidence.hideRuns': 'Hide run records',

  // Experiments
  'loop.exp.predict': 'Write your prediction first (optional)',
  'loop.exp.predictionPlaceholder': 'What will happen when you change it?',
  'loop.exp.run': 'Run',
  'loop.exp.running': 'Running…',
  'loop.exp.skip': 'Skip prediction and run',
  'loop.exp.rerun': 'Change parameters and rerun',
  'loop.exp.verdict': 'Verdict',
  'loop.exp.criterion': 'Criterion',
  'loop.exp.model': 'Model',
  'loop.exp.params': 'Parameters',
  'loop.exp.recordedAt': 'Recorded at',
  'loop.exp.reproducible': 'Same parameters give the same result',
  'loop.exp.yourPrediction': 'Your prediction',
  'loop.exp.match': 'Your prediction matched the verdict',
  'loop.exp.mismatch': 'Your prediction missed the verdict — that is more informative than guessing right',
  'loop.exp.saveObs': 'Turn this observation into evidence',
  'loop.exp.teaching': 'Teaching model',
  'loop.exp.notRealSystem': 'This is a teaching model, not an identification of any real system.',
  'loop.exp.failed': 'Run failed: {message}',
  'loop.exp.trace': 'Response trace',
  'loop.exp.target': 'Target',
  'loop.exp.closePanel': 'Collapse experiment',
  'loop.exp.openPanel': 'Open experiment',
  'loop.exp.runSaved': 'Run record saved by the host',
  'loop.exp.verdict.converged': 'Converges',
  'loop.exp.verdict.overshoot-settled': 'Overshoots, then settles',
  'loop.exp.verdict.oscillating': 'Sustained oscillation (crosses target)',
  'loop.exp.verdict.oscillating-below': 'Oscillates below target (never crosses)',
  'loop.exp.verdict.drift': 'Drifts (does not reach target)',
  'loop.exp.verdict.diverging': 'Diverges',
  'loop.exp.verdict.pass': 'Pass',
  'loop.exp.verdict.fail': 'Fail',
  'loop.exp.verdict.mixed': 'Partially passes',
  'loop.exp.delay.K': 'Gain K',
  'loop.exp.delay.D': 'Delay D (s)',
  'loop.exp.delay.formula':
    'First-order lag + pure delay: y′ = (u − y)/τ, τ = 0.5 s, u = clamp(K·(1 − y(t−D)), −2, 2), dt = 0.02 s, target 1.',
  'loop.exp.proxy.e': 'Optimisation effort e',
  'loop.exp.proxy.visible': 'Visible metric',
  'loop.exp.proxy.hidden': 'Hidden metric',
  'loop.exp.proxy.ratio': 'Hidden / visible',
  'loop.exp.proxy.peak': 'Hidden metric peaks at e ≈ {e}, value {value}',
  'loop.exp.green.cases': 'Check cases',
  'loop.exp.green.allGreen': 'All enabled checks pass',
  'loop.exp.green.notCorrect': 'This only means the measured behaviour passes, not that the function is correct.',
  'loop.exp.green.caveat': 'Enable the “beyond range” case and look again.',
  'loop.exp.green.off': 'Disabled',
  'loop.exp.green.pass': 'Pass',
  'loop.exp.green.fail': 'Fail',
  'loop.exp.green.actual': 'Actual: {actual}',
  'loop.exp.green.expect': 'Expected: {expect}',

  // Predictions
  'loop.pred.title': 'Predictions',
  'loop.pred.new': 'Write a prediction',
  'loop.pred.text': 'Prediction',
  'loop.pred.textPlaceholder': 'e.g. Once the delay reaches 1 s, the same gain will oscillate forever.',
  'loop.pred.resolveBy': 'Decidable condition',
  'loop.pred.resolveByPlaceholder':
    'e.g. With D ≥ 0.9 and K = 1.2, the response crosses the target four or more times within 16 s.',
  'loop.pred.save': 'Save prediction (open)',
  'loop.pred.saved': 'Prediction saved (host confirmed)',
  'loop.pred.saving': 'Saving…',
  'loop.pred.empty': 'No predictions yet. Write a decidable one, then let an experiment or observation hit it.',
  'loop.pred.status.open': 'Open',
  'loop.pred.status.supported': 'Supported',
  'loop.pred.status.refuted': 'Refuted',
  'loop.pred.status.inconclusive': 'Inconclusive',
  'loop.pred.resolve.supported': 'Support',
  'loop.pred.resolve.refuted': 'Refute',
  'loop.pred.resolve.inconclusive': 'Inconclusive',
  'loop.pred.resolutionNote': 'Resolution note',
  'loop.pred.resolutionNotePlaceholder': 'Which run or observation decides it?',
  'loop.pred.resolve': 'Record verdict',
  'loop.pred.resolvedAt': 'Resolved {at}',
  'loop.pred.legacy': 'Legacy record',
  'loop.pred.legacyHint': 'Legacy predictions lack full verdict fields and are shown as open.',
  'loop.pred.linkRun': 'Link run (optional)',
  'loop.pred.noRun': 'No linked run',
  'loop.pred.investigation': 'Investigation',
  'loop.pred.noneInvestigation': 'No investigation',
  'loop.pred.needText': 'Write the prediction text first.',

  // Investigations
  'loop.inv.title': 'Investigations',
  'loop.inv.new': 'New investigation',
  'loop.inv.titleLabel': 'Question title',
  'loop.inv.titlePlaceholder': 'e.g. Under what delay does negative feedback stop being stable?',
  'loop.inv.claim': 'Current claim',
  'loop.inv.claimPlaceholder': 'The explanation you currently hold.',
  'loop.inv.counter': 'Counter-explanation',
  'loop.inv.counterPlaceholder': 'If the current claim is wrong, what is the most likely alternative?',
  'loop.inv.nextTest': 'Next test',
  'loop.inv.nextTestPlaceholder': 'One sentence: how will you test it next?',
  'loop.inv.save': 'Save investigation',
  'loop.inv.saved': 'Investigation saved (host confirmed)',
  'loop.inv.saving': 'Saving…',
  'loop.inv.empty': 'No investigations yet. Write one claim and one counter-explanation so later steps have an opponent.',
  'loop.inv.status.open': 'Open',
  'loop.inv.status.testing': 'Testing',
  'loop.inv.status.supported': 'Supported',
  'loop.inv.status.revised': 'Revised',
  'loop.inv.status.inconclusive': 'Inconclusive',
  'loop.inv.statusLabel': 'Status',
  'loop.inv.resolve': 'Update status',
  'loop.inv.resolveNote': 'Note',
  'loop.inv.discuss': 'Discuss this investigation',
  'loop.inv.predCount': '{count} predictions',
  'loop.inv.runCount': '{count} runs',
  'loop.inv.editing': 'Editing: {title}',
  'loop.inv.cancel': 'Cancel editing',
  'loop.inv.needTitle': 'Write an investigation title first.',
  'loop.inv.nextTestLabel': 'Next',

  // Notes
  'loop.note.title': 'Notes',
  'loop.note.placeholder':
    'Write your own words. They are yours alone; an AI reply never becomes your note automatically.',
  'loop.note.kind': 'Kind',
  'loop.note.kind.理解': 'Understanding',
  'loop.note.kind.疑问': 'Question',
  'loop.note.kind.证据': 'Evidence',
  'loop.note.kind.反驳': 'Counterexample',
  'loop.note.kind.实践': 'Practice',
  'loop.note.save': 'Save as my note',
  'loop.note.saving': 'Saving…',
  'loop.note.edit': 'Edit',
  'loop.note.saveEdit': 'Save changes',
  'loop.note.cancel': 'Cancel',
  'loop.note.archive': 'Archive',
  'loop.note.restore': 'Restore',
  'loop.note.delete': 'Delete',
  'loop.note.deleteConfirm': 'Delete this note? This writes to local data.',
  'loop.note.empty': 'No notes on this subject yet. Start with one sentence of your own understanding.',
  'loop.note.source.user': 'User text',
  'loop.note.source.ai-draft': 'AI draft',
  'loop.note.source.import': 'Imported material',
  'loop.note.source.legacy': 'Legacy origin uncertain',
  'loop.note.legacyHint':
    'Older records cannot distinguish your own writing from tool-written text; confirm and edit it yourself.',
  'loop.note.encodingHint': 'This legacy record may contain encoding damage (? replacement characters).',
  'loop.note.savedBy': 'Saved by',
  'loop.note.savedBy.ui': 'You',
  'loop.note.savedBy.agent': 'Agent',
  'loop.note.adopted': 'Adopted',
  'loop.note.revision': 'Revision {n}',
  'loop.note.adoptDraft': 'Save as my evidence (draft)',
  'loop.note.adoptedDraft': 'Saved as draft',
  'loop.note.draftHint': 'Saved as an AI draft; never passed off as your own words.',
  'loop.note.saveError': 'Save failed: {message}',
  'loop.note.count': '{count}',
  'loop.note.archivedLabel': 'Archived',
  'loop.note.statusLabel': 'Status',
  'loop.note.adoptError': 'Could not save as draft: {message}',
  'loop.note.notesFor': 'Notes on the current subject',

  // Chat
  'loop.chat.title': 'Chat',
  'loop.chat.empty': 'Ask the real model about the current subject. Replies never become your notes automatically.',
  'loop.chat.placeholder': 'Ask about the current subject… (Ctrl+Enter to send)',
  'loop.chat.send': 'Send',
  'loop.chat.sending': 'Generating…',
  'loop.chat.stop': 'Stop',
  'loop.chat.stopping': 'Stopping…',
  'loop.chat.retry': 'Retry',
  'loop.chat.failed': 'Failed',
  'loop.chat.cancelled': 'Stopped',
  'loop.chat.streaming': 'Generating…',
  'loop.chat.errorCode': 'Error code: {code}',
  'loop.chat.interrupted': 'The last reply was interrupted while the page was closed; you can retry.',
  'loop.chat.modelUnavailable': 'Model unavailable: {reason}. Your question draft is kept.',
  'loop.chat.sendFailed': 'Request failed: {message}',
  'loop.chat.draftHint': 'Drafts are kept per subject; switching subjects never mixes them.',
  'loop.chat.subjectNote': 'A reply belongs to the subject it was sent from; switching subjects does not move it.',
  'loop.chat.you': 'You',
  'loop.chat.ai': 'Learning partner',
  'loop.chat.copy': 'Copy',
  'loop.chat.copied': 'Copied',
  'loop.chat.copyFailed': 'Copy failed: {reason}',
  'loop.chat.noModel': 'No default model configured',
  'loop.chat.sourcesSummary': '{sources} sources · {unverified} unverified',
  'loop.chat.retryUnavailable': 'The host offers no retry endpoint: {message}',
  'loop.chat.partial': '(incomplete)',

  // Task drafts
  'loop.task.title': 'Task draft',
  'loop.task.startTitle': 'First: what behaviour do you want to change?',
  'loop.task.request': 'The real request',
  'loop.task.requestPlaceholder':
    'In your own words: what behaviour is wrong now, and what should it become? Do not start with acceptance criteria.',
  'loop.task.generate': 'Generate editable draft',
  'loop.task.generating': 'Generating…',
  'loop.task.goal': 'Goal',
  'loop.task.acceptance': 'Acceptance (what counts as enough)',
  'loop.task.boundary': 'Boundaries (what not to do)',
  'loop.task.unknowns': 'Unknowns (as questions)',
  'loop.task.answerPlaceholder': 'Write your judgement first (may stay empty)',
  'loop.task.concepts': 'Related concepts',
  'loop.task.evidence': 'Evidence links',
  'loop.task.save': 'Save draft',
  'loop.task.saving': 'Saving…',
  'loop.task.saved': 'Draft saved (host confirmed)',
  'loop.task.archive': 'Archive',
  'loop.task.versions': 'Versions',
  'loop.task.version': 'Version {n}',
  'loop.task.compare': 'Compare current with selected version',
  'loop.task.copy': 'Copy full text',
  'loop.task.export': 'Export',
  'loop.task.notSent': 'The draft stays local; it is never sent anywhere automatically.',
  'loop.task.empty': 'No task drafts yet.',
  'loop.task.needRequest': 'Write the real request before generating a draft.',
  'loop.task.addAcceptance': 'Add acceptance item',
  'loop.task.addBoundary': 'Add boundary',
  'loop.task.addUnknown': 'Add unknown',
  'loop.task.remove': 'Remove',
  'loop.task.status.draft': 'Draft',
  'loop.task.status.saved': 'Saved',
  'loop.task.status.archived': 'Archived',
  'loop.task.model': 'Generated by',
  'loop.task.fromSubject': 'From subject',
  'loop.task.evidenceEmpty': 'No evidence available to link.',
  'loop.task.editorTitle': 'Edit task draft',
  'loop.task.back': 'Back',
  'loop.task.readOnly': 'Saved version (read-only)',
  'loop.task.compareTitle': 'Version comparison',
  'loop.task.draftReady': 'Draft generated. Edit each part before saving.',
  'loop.task.generatedAt': 'Generated {at}',
  'loop.task.exportDone': 'Task draft exported',
  'loop.task.basedOn': 'Evidence gaps',
  'loop.task.modelUnavailable': 'Model unavailable: {reason}',
  'loop.task.acceptanceEmpty': 'No acceptance items yet — such a draft should not be executed.',

  // Data & backup
  'loop.res.title': 'Data & backup',
  'loop.res.dataPath': 'Data file path',
  'loop.res.backup': 'Back up now',
  'loop.res.backupDone': 'Backup created: {path}',
  'loop.res.backingUp': 'Backing up…',
  'loop.res.export': 'Export user package',
  'loop.res.exportDone': 'User package exported',
  'loop.res.exporting': 'Exporting…',
  'loop.res.import': 'Import user package',
  'loop.res.importPick': 'Choose package JSON…',
  'loop.res.preview': 'Preview & validate',
  'loop.res.previewing': 'Validating…',
  'loop.res.counts': 'Records: {summary}',
  'loop.res.conflicts': 'Conflicts: {count}',
  'loop.res.errors': 'Validation errors: {count}',
  'loop.res.mode': 'Import mode',
  'loop.res.mode.merge': 'Merge (same id with different content conflicts; nothing is written)',
  'loop.res.mode.skip': 'Skip existing records',
  'loop.res.mode.replace': 'Replace (requires confirmation; auto-backup first)',
  'loop.res.replaceConfirm': 'I understand replacing overwrites existing records',
  'loop.res.confirmImport': 'Confirm import',
  'loop.res.importing': 'Importing…',
  'loop.res.importDone': 'Import finished: {summary}',
  'loop.res.conflictList': 'Conflicts',
  'loop.res.errorList': 'Validation errors',
  'loop.res.migration': 'Migration report',
  'loop.res.migrationEmpty': 'No migration recorded (this data was not upgraded from an older version).',
  'loop.res.migrating': 'Reading…',
  'loop.res.notices': 'Data notices',
  'loop.res.importLog': 'Import history',
  'loop.res.copyPath': 'Copy path',
  'loop.res.copied': 'Copied',
  'loop.res.copyFailed': 'Copy failed: {reason}',
  'loop.res.packTooLarge': 'A user package must not exceed 8 MiB (current about {size}).',
  'loop.res.parseError': 'Not valid JSON: {reason}',
  'loop.res.invalidPack': 'Not a user package exported by this plugin.',
  'loop.res.reportTitle': 'Migration detail',
  'loop.res.importIdempotent': 'Importing the same package twice creates no new records.',
  'loop.res.blocked': 'Validation errors block import; fix the package first.',

  // Status bar / receipts
  'loop.status.dataPath': 'Data: {path}',
  'loop.status.model': 'Model: {model}',
  'loop.status.modelUnavailable': 'Model unavailable',
  'loop.status.saveOk': 'Saved (host confirmed): {what}',
  'loop.status.saveError': 'Save failed: {message}',
  'loop.status.at': '{at}',
  'loop.status.receipts': 'Receipts & notices',
  'loop.status.noReceipts': 'No receipts yet.',
  'loop.status.notice': 'Notice',
  'loop.status.warning': 'Warning',
  'loop.status.error': 'Error',
  'loop.status.ok': 'OK',
  'loop.status.viewSaveFailed': 'View state was not saved: {message}',
  'loop.status.dismiss': 'Clear receipts',
  'loop.status.ready': 'Ready',
  'loop.status.loading': 'Loading',
  'loop.status.loadFailed': 'Load failed',
  'loop.status.noticesCount': '{count} data notices',
  'loop.status.receiptFromHost': 'Receipts below come from real host responses',
  'loop.status.copiedPath': 'Path copied',

  // List view / a11y
  'loop.list.title': 'List view',
  'loop.list.filter': 'Filter nodes and relations…',
  'loop.list.nodes': 'Nodes',
  'loop.list.relations': 'Relations',
  'loop.list.empty': 'Nothing matches.',
  'loop.list.nodeHint': 'Pick a node to centre it.',
  'loop.list.relationHint': 'Pick a relation to read its conditions and costs.',
  'loop.a11y.graph': 'Knowledge graph: current node and related neighbours',
  'loop.a11y.list': 'Accessible list alternative to the knowledge graph',
  'loop.a11y.current': 'Current',
  'loop.a11y.relation': 'Relation {type}: {from} to {to}',
  'loop.a11y.selected': 'Selected',
  'loop.a11y.panel': 'Grasp panel',
  'loop.a11y.status': 'Status and receipts',
  'loop.a11y.notes': 'Notes list',
  'loop.a11y.chat': 'Chat messages',
  'loop.a11y.unknown': 'Untitled',

  // Time
  'loop.time.unknown': 'Date uncertain',
  'loop.time.justNow': 'just now',
  'loop.time.minutesAgo': '{count} min ago',
  'loop.time.hoursAgo': '{count} h ago',

  // Common
  'loop.common.cancel': 'Cancel',
  'loop.common.confirm': 'Confirm',
  'loop.common.close': 'Close',
  'loop.common.save': 'Save',
  'loop.common.delete': 'Delete',
  'loop.common.edit': 'Edit',
  'loop.common.back': 'Back',
  'loop.common.loading': 'Loading…',
  'loop.common.none': '—',
  'loop.common.unknown': 'Unknown',
  'loop.common.copy': 'Copy',
  'loop.common.copied': 'Copied',
  'loop.common.copyFailed': 'Copy failed',
  'loop.common.more': 'More',
  'loop.common.less': 'Less',
  'loop.common.expand': 'Expand',
  'loop.common.new': 'New',
  'loop.common.optional': 'Optional',
  'loop.common.required': 'Required',
  'loop.common.refresh': 'Refresh',
  'loop.common.retry': 'Retry',
  'loop.common.previous': 'Previous',
  'loop.common.next': 'Next',
  'loop.common.notes': 'Notes',
  'loop.common.evidence': 'Evidence',
  'loop.common.sources': 'Sources',
  'loop.common.revision': 'Revision',
  'loop.common.dismiss': 'Dismiss',
  'loop.common.you': 'You',
  'loop.common.agent': 'Agent',
  'loop.common.source': 'Source',

  // Error codes
  'loop.error.VALIDATION': 'Invalid input',
  'loop.error.NOT_FOUND': 'Record not found',
  'loop.error.CONFLICT': 'Data conflict',
  'loop.error.STORAGE_WRITE': 'Storage write failed',
  'loop.error.LLM_UNAVAILABLE': 'Model unavailable',
  'loop.error.LLM_AUTH': 'Model authentication failed',
  'loop.error.LLM_RATE_LIMIT': 'Model rate limited',
  'loop.error.LLM_CONTEXT': 'Context window exceeded',
  'loop.error.BUSY': 'This subject already has a reply in progress',
  'loop.error.CANCELED': 'Cancelled',
  'loop.error.IMPORT_INVALID': 'Invalid import package',
  'loop.error.PACKAGE_TOO_LARGE': 'Package too large',
  'loop.error.READ_ONLY': 'Data is read-only',
  'loop.error.NETWORK': 'Cannot reach the host API',
  'loop.error.PROTOCOL': 'The host returned an unparseable response',
  'loop.error.HTTP': 'Host returned HTTP {status}',
  'loop.error.UNKNOWN': 'Unknown error',

  // Host settings section
  'loop.settings.title': 'Grasp · Cybernetics',
  'loop.settings.description':
    'One knowledge graph for the history and theory of cybernetics, carried into coding-agent task design: feedback, delay, measurement, boundary. Notes, experiment records and task drafts all live in the local data file.',
  'loop.settings.open': 'Open Grasp',
  'loop.settings.dataPath': 'Data file: {path}',
  'loop.sidebar.open': 'Grasp',
  'loop.today.cta.answer': 'Continue the six questions',
  'loop.today.cta.backfill': 'Backfill this observation',
  'loop.today.cta.checkEarly': 'Check early',
  'loop.today.cta.designCheck': 'Design a minimal test',
  'loop.today.cta.startCheck': 'Start this test',
  'loop.today.cta.compare': 'Compare prediction and outcome',
  'loop.today.cta.designNext': 'Design the next test',
  'loop.today.cta.restart': 'Restart this loop',
  'loop.today.cta.archived': 'Archived — start a new card',
  'loop.today.cta.quick': 'Do the 5-minute version',
  'loop.today.tier.quick': '5 min',
  'loop.today.tier.standard': '30 min',
  'loop.today.tier.deep': 'Deep',
}

/** 简单插值 translator；缺 key 返回 key 本身（与宿主 locale 行为一致）。 */
function createTranslator(dicts) {
  return function translate(key, params) {
    const value = dicts.zh[key] ?? dicts.en[key] ?? key
    if (!params) return value
    return String(value).replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
    )
  }
}

/** 合并 fallback 与 locale/*.json 的 messages；locale 值优先。 */
function mergeDictionaries(zhMessages, enMessages) {
  return {
    zh: Object.assign({}, FALLBACK_ZH, zhMessages || {}),
    en: Object.assign({}, FALLBACK_EN, enMessages || {}),
  }
}

/** 供构建脚本/测试使用：两个 locale 的 key 差异。 */
function dictionaryKeyDiff() {
  const zhKeys = new Set(Object.keys(FALLBACK_ZH))
  const enKeys = new Set(Object.keys(FALLBACK_EN))
  const missingEn = [...zhKeys].filter((k) => !enKeys.has(k))
  const missingZh = [...enKeys].filter((k) => !zhKeys.has(k))
  return { missingEn, missingZh }
}
  return { FALLBACK_ZH, FALLBACK_EN, createTranslator, mergeDictionaries, dictionaryKeyDiff }
})
__def("util.js", function (__req) {
/**
 * 通用工具：id、subjectKey、时间格式化、剪贴板、下载、classNames。
 * 纯函数优先，方便 node --test 直接 import。
 */

/** 生成 `r_<base36 时间>_<随机>`，满足 Host 的 r_ + [A-Za-z0-9_-]{4,64} 校验。 */
function newRequestId() {
  const stamp = Date.now().toString(36)
  let rand = ''
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 8; i++) rand += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `r_${stamp}_${rand}`
}

/** 生成一次性的本地 id（笔记、草稿等客户端临时对象用）。 */
function newLocalId(prefix) {
  return `${prefix || 'l'}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function classNames(...args) {
  const out = []
  for (const arg of args) {
    if (!arg) continue
    if (typeof arg === 'string') out.push(arg)
    else if (Array.isArray(arg)) {
      const nested = classNames(...arg)
      if (nested) out.push(nested)
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) if (value) out.push(key)
    }
  }
  return out.join(' ')
}

/** subject 对象 → 'node:delay'；兼容字符串 subjectKey。 */
function subjectKey(subject) {
  if (!subject) return ''
  if (typeof subject === 'string') return subject
  if (!subject.kind || !subject.id) return ''
  return `${subject.kind}:${subject.id}`
}

/** 'node:delay' → { kind:'node', id:'delay' }；非法返回 null。 */
function parseSubjectKey(key) {
  if (typeof key !== 'string') return null
  const index = key.indexOf(':')
  if (index <= 0 || index === key.length - 1) return null
  return { kind: key.slice(0, index), id: key.slice(index + 1) }
}

function sameSubject(a, b) {
  return !!a && !!b && a.kind === b.kind && a.id === b.id
}

function isSubjectOf(kind, id, subject) {
  return !!subject && subject.kind === kind && subject.id === id
}

/** ISO 时间 → 本地可读（YYYY-MM-DD HH:mm）；非法输入返回原值/空串。 */
function formatTime(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

/** ISO 时间 → 2026-10-28。 */
function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 相对时间（用于回执/消息）；无法判断则回退 formatTime。 */
function formatRelative(value, now) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const reference = now === undefined ? Date.now() : now
  const delta = reference - date.getTime()
  if (delta < 0) return formatTime(date)
  const minutes = Math.floor(delta / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return formatTime(date)
}

/** 文本截断（按字符，末尾加省略号）。 */
function truncate(text, limit) {
  const value = String(text == null ? '' : text)
  if (value.length <= limit) return value
  return value.slice(0, Math.max(0, limit - 1)) + '…'
}

/** 30 字以内的单行摘要。 */
function oneLine(text, limit) {
  return truncate(String(text == null ? '' : text).replace(/\s+/g, ' ').trim(), limit || 80)
}

/** 复制文本：返回 {ok, reason}，不抛错（异步拒绝也会被接住）。 */
async function copyText(text) {
  const value = String(text == null ? '' : text)
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
      return { ok: false, reason: '当前环境没有剪贴板接口' }
    }
    await navigator.clipboard.writeText(value)
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: String((error && error.message) || error) }
  }
}

/** 触发浏览器下载（导出数据包/任务草案用）。 */
function downloadJson(filename, data) {
  try {
    const text = JSON.stringify(data, null, 2)
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: String((error && error.message) || error) }
  }
}

function downloadText(filename, text, mime) {
  try {
    const blob = new Blob([String(text)], { type: (mime || 'text/plain') + ';charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: String((error && error.message) || error) }
  }
}

/** 人类可读的字节数（数据包大小提示用）。 */
function formatBytes(bytes) {
  const value = Number(bytes) || 0
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`
  return `${(value / (1024 * 1024)).toFixed(2)} MiB`
}

/** 键盘事件是否可视为激活（Enter/Space）。 */
function isActivationKey(event) {
  return !!event && (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
  return { newRequestId, newLocalId, clamp, classNames, subjectKey, parseSubjectKey, sameSubject, isSubjectOf, formatTime, formatDate, formatRelative, truncate, oneLine, copyText, downloadJson, downloadText, formatBytes, isActivationKey, escapeRegExp }
})
__def("model.js", function (__req) {
/**
 * 内容模型：core.json v2 的索引与派生视图。
 *
 * 纯函数（不依赖 React / DOM），node --test 可直接 import。
 * 输入允许是尚未升级的 v1 core（edges/src 字段），这里做良性归一化，
 * 保证 Host 升级与内容包升级之间页面仍然可读。
 */

const RELATION_TYPES = [
  'prerequisite',
  'formal',
  'constraint',
  'application',
  'analogy',
  'parallel',
  'historical',
]

const TYPE_PRIORITY = {
  formal: 0,
  prerequisite: 1,
  constraint: 2,
  application: 3,
  analogy: 4,
  parallel: 5,
  historical: 6,
}

const V1_TYPE_MAP = {
  theorem: 'formal',
  application: 'application',
  history: 'historical',
  parallel: 'parallel',
  analogy: 'analogy',
  constraint: 'constraint',
  prerequisite: 'prerequisite',
  heuristic: 'analogy',
}

function normalizeRelationType(type) {
  if (RELATION_TYPES.includes(type)) return type
  if (V1_TYPE_MAP[type]) return V1_TYPE_MAP[type]
  return 'constraint'
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

/** 从 v1 的 "1868" / "1868—1947" / "" 推测 era 字段（不编造，解析不出就 unknown）。 */
function legacyEra(node) {
  if (typeof node.eraStart === 'number') {
    return {
      eraStart: node.eraStart,
      eraEnd: typeof node.eraEnd === 'number' ? node.eraEnd : node.eraStart,
      eraPrecision: node.eraPrecision || (node.eraEnd === node.eraStart ? 'year' : 'range'),
    }
  }
  const text = String(node.era || '')
  const years = text.match(/-?\d{3,4}/g)
  if (!years || years.length === 0) {
    return { eraStart: null, eraEnd: null, eraPrecision: 'unknown' }
  }
  if (years.length === 1) {
    const year = Number(years[0])
    return { eraStart: year, eraEnd: year, eraPrecision: 'year' }
  }
  return { eraStart: Number(years[0]), eraEnd: Number(years[years.length - 1]), eraPrecision: 'range' }
}

function legacySources(node) {
  const out = []
  for (const [index, source] of toArray(node.src).entries()) {
    if (!source || typeof source !== 'object') continue
    const verifiedText = String(source.status || '')
    const verified =
      verifiedText.includes('已核验') || verifiedText === 'verified'
        ? 'verified'
        : verifiedText.includes('二手') || verifiedText === 'secondary'
          ? 'secondary'
          : 'unverified'
    out.push({
      id: `legacy:${node.id}:${index}`,
      title: source.title || '(未命名来源)',
      author: source.author || '',
      year: source.year === undefined ? null : source.year,
      kind: source.kind || 'book',
      ref: source.ref || '',
      url: source.url || null,
      doi: source.doi || null,
      verified,
      verifiedAt: source.verifiedAt || null,
      note: source.note || '旧版本内联来源，未做主张级核验。',
      legacy: true,
    })
  }
  return out
}

function legacyExperiments(core) {
  return toArray(core.experiments).map((experiment, index) => {
    const conceptText = String(experiment.concept || '')
    const conceptNodeIds = toArray(experiment.conceptNodeIds).length
      ? toArray(experiment.conceptNodeIds)
      : conceptText
          .split(/[/,，、\s]+/)
          .map((part) => part.trim())
          .filter(Boolean)
    return {
      id: experiment.id || `experiment-${index}`,
      order: experiment.order || index + 1,
      title: experiment.title || `实验 ${index + 1}`,
      subtitle: experiment.subtitle || '',
      question: experiment.question || '',
      modelId: experiment.modelId || '',
      modelVersion: experiment.modelVersion || null,
      conceptNodeIds,
      note: experiment.note || '',
    }
  })
}

/**
 * 构建内容索引。
 * @param {object|null} core
 * @returns {object} 索引对象；所有 list 都是稳定顺序。
 */
function indexCore(core) {
  const source = core && typeof core === 'object' ? core : {}

  const groups = toArray(source.groups)
    .map((group, index) => ({
      id: group.id || `group-${index}`,
      order: Number.isFinite(group.order) ? group.order : index + 1,
      title: group.title || group.id || `单元 ${index + 1}`,
      question: group.question || '',
      capability: group.capability || '',
      entryNodeId: group.entryNodeId || null,
    }))
    .sort((a, b) => a.order - b.order)

  const rawRelations = toArray(source.relations).length ? toArray(source.relations) : toArray(source.edges)
  const relations = rawRelations.map((relation, index) => ({
    id: relation.id || `e.${relation.from || '?'}-${relation.to || '?'}-${index}`,
    from: relation.from,
    to: relation.to,
    type: normalizeRelationType(relation.type),
    claim: relation.claim || relation.title || '',
    condition: relation.condition || '',
    cost: relation.cost || '',
    claimIds: toArray(relation.claimIds),
    version: relation.version || 1,
  }))

  const legacySourceList = []
  const nodes = toArray(source.nodes).map((node) => {
    const era = legacyEra(node)
    const nodeSources = legacySources(node)
    legacySourceList.push(...nodeSources)
    return {
      id: node.id,
      groupId: node.groupId || null,
      kind: node.kind || 'concept',
      title: node.title || node.id,
      aliases: toArray(node.aliases),
      era: node.era || '',
      eraStart: era.eraStart,
      eraEnd: era.eraEnd,
      eraPrecision: era.eraPrecision,
      def: node.def || '',
      can: node.can || '',
      mech: node.mech || '',
      limits: node.limits || '',
      counter: node.counter || '',
      check: node.check || '',
      hist: node.hist || '',
      migrate: node.migrate || '',
      migrateType: node.migrateType || 'analogy',
      practiceStages: toArray(node.practiceStages),
      claimIds: toArray(node.claimIds),
      sourceIds: toArray(node.sourceIds),
      legacySources: nodeSources,
    }
  })

  const claims = toArray(source.claims).map((claim, index) => ({
    id: claim.id || `claim-${index}`,
    subject: claim.subject || null,
    text: claim.text || '',
    kind: claim.kind || 'interpretation',
    sourceIds: toArray(claim.sourceIds),
    verified: claim.verified || 'unverified',
    verifiedAt: claim.verifiedAt || null,
  }))

  const declaredSources = toArray(source.sources).map((entry, index) => ({
    id: entry.id || `source-${index}`,
    title: entry.title || '(未命名来源)',
    author: entry.author || '',
    year: entry.year === undefined ? null : entry.year,
    kind: entry.kind || 'book',
    ref: entry.ref || '',
    url: entry.url || null,
    doi: entry.doi || null,
    verified: entry.verified || 'unverified',
    verifiedAt: entry.verifiedAt || null,
    verifiedBy: entry.verifiedBy || '',
    note: entry.note || '',
  }))
  const sources = declaredSources.concat(legacySourceList)

  const experiments = legacyExperiments(source).sort((a, b) => (a.order || 0) - (b.order || 0))

  const nodesById = new Map()
  for (const node of nodes) nodesById.set(node.id, node)
  const relationsById = new Map()
  for (const relation of relations) relationsById.set(relation.id, relation)
  const claimsById = new Map()
  for (const claim of claims) claimsById.set(claim.id, claim)
  const sourcesById = new Map()
  for (const entry of sources) sourcesById.set(entry.id, entry)
  const groupsById = new Map()
  for (const group of groups) groupsById.set(group.id, group)
  const experimentsById = new Map()
  for (const experiment of experiments) experimentsById.set(experiment.id, experiment)

  const nodesByGroup = new Map()
  for (const group of groups) nodesByGroup.set(group.id, [])
  for (const node of nodes) {
    if (!node.groupId) continue
    if (!nodesByGroup.has(node.groupId)) nodesByGroup.set(node.groupId, [])
    nodesByGroup.get(node.groupId).push(node)
  }

  const relationsByNode = new Map()
  const outgoing = new Map()
  const incoming = new Map()
  for (const node of nodes) {
    relationsByNode.set(node.id, [])
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  }
  for (const relation of relations) {
    if (relationsByNode.has(relation.from)) relationsByNode.get(relation.from).push(relation)
    if (relationsByNode.has(relation.to)) relationsByNode.get(relation.to).push(relation)
    if (outgoing.has(relation.from)) outgoing.get(relation.from).push(relation)
    if (incoming.has(relation.to)) incoming.get(relation.to).push(relation)
  }

  return {
    raw: source,
    packId: source.packId || '',
    version: source.version || '',
    language: source.language || '',
    completeness: source.completeness || null,
    groups,
    nodes,
    relations,
    claims,
    sources,
    experiments,
    nodesById,
    relationsById,
    claimsById,
    sourcesById,
    groupsById,
    experimentsById,
    nodesByGroup,
    relationsByNode,
    outgoing,
    incoming,
    hasContent: nodes.length > 0,
  }
}

function emptyCoreIndex() {
  return indexCore({ groups: [], nodes: [], relations: [], claims: [], sources: [], experiments: [] })
}

/* ─────────────────────────── 标签 ─────────────────────────── */

function relationTypeLabel(t, type) {
  const known = RELATION_TYPES.includes(type) ? type : 'unknown'
  return t(`loop.relation.type.${known}`)
}

function nodeKindLabel(t, kind) {
  const known = ['concept', 'device', 'event'].includes(kind) ? kind : 'concept'
  return t(`loop.subject.kind.${known}`)
}

function verifiedLabel(t, verified) {
  const known = ['verified', 'secondary', 'unverified'].includes(verified) ? verified : 'unverified'
  return t(`loop.relation.verified.${known}`)
}

function claimKindLabel(t, kind) {
  const known = ['formal', 'empirical', 'historical', 'interpretation'].includes(kind) ? kind : 'interpretation'
  return t(`loop.relation.claimKind.${known}`)
}

function migrateTypeLabel(t, migrateType) {
  const known = ['formal', 'application', 'analogy', 'heuristic'].includes(migrateType) ? migrateType : 'analogy'
  return t(`loop.subject.migrateType.${known}`)
}

/** 节点年代标签：{ text, uncertain }；优先 eraStart/eraEnd，回退旧 era 字符串。 */
function nodeEraLabel(node) {
  if (!node) return { text: '', uncertain: true }
  const { eraStart, eraEnd, eraPrecision } = node
  if (eraPrecision === 'unknown' || eraStart === null || eraStart === undefined) {
    return { text: node.era ? String(node.era) : '', uncertain: true }
  }
  if (eraPrecision === 'range' || (eraEnd !== null && eraEnd !== undefined && eraEnd !== eraStart)) {
    return { text: `${eraStart}—${eraEnd}`, uncertain: false }
  }
  return { text: String(eraStart), uncertain: false }
}

/* ─────────────────────────── subject ─────────────────────────── */

/** 由 view 恢复的选区推出当前 subject；优先选中关系。 */
function subjectFromView(view) {
  if (!view) return null
  if (view.selectedRelationId) return { kind: 'relation', id: view.selectedRelationId }
  if (view.selectedNodeId) return { kind: 'node', id: view.selectedNodeId }
  if (view.activeInvestigationId) return { kind: 'investigation', id: view.activeInvestigationId }
  return null
}

function subjectLabel(ci, subject, store, t) {
  if (!subject || !subject.id) return ''
  if (subject.kind === 'node') return (ci.nodesById.get(subject.id) || {}).title || subject.id
  if (subject.kind === 'relation') {
    const relation = ci.relationsById.get(subject.id)
    if (!relation) return subject.id
    const from = ci.nodesById.get(relation.from)
    const to = ci.nodesById.get(relation.to)
    return `${from ? from.title : relation.from} → ${to ? to.title : relation.to}`
  }
  if (subject.kind === 'investigation') {
    const investigation = store && store.investigations ? store.investigations[subject.id] : null
    return (investigation && investigation.title) || subject.id
  }
  return subject.id
}

function subjectTypeLabel(t, subject) {
  if (!subject) return ''
  if (subject.kind === 'relation') return t('loop.relation.detail')
  if (subject.kind === 'investigation') return t('loop.inv.title')
  return t('loop.subject.current')
}

/* ─────────────────────────── 关系 / 邻居 ─────────────────────────── */

/** 某个节点的全部关系（按类型优先级 + 对端标题排序）。 */
function relationsForNode(ci, nodeId) {
  const list = ci.relationsByNode.get(nodeId) || []
  return list.slice().sort((a, b) => {
    const priority = (TYPE_PRIORITY[a.type] ?? 9) - (TYPE_PRIORITY[b.type] ?? 9)
    if (priority !== 0) return priority
    return a.id < b.id ? -1 : 1
  })
}

/**
 * 当前节点的问题尺度邻居（3—7 个）：按关系类型优先级挑选，
 * 返回每个邻居与"连接它的关系"。同一邻居只出现一次。
 */
function neighborsOf(ci, nodeId, limit) {
  const max = Number.isFinite(limit) ? limit : 7
  const relations = relationsForNode(ci, nodeId)
  const seen = new Set([nodeId])
  const result = []
  for (const relation of relations) {
    const otherId = relation.from === nodeId ? relation.to : relation.from
    if (seen.has(otherId)) continue
    const other = ci.nodesById.get(otherId)
    if (!other) continue
    seen.add(otherId)
    result.push({
      node: other,
      relation,
      direction: relation.from === nodeId ? 'out' : 'in',
    })
    if (result.length >= max) break
  }
  const total = new Set()
  for (const relation of relations) {
    total.add(relation.from === nodeId ? relation.to : relation.from)
  }
  total.delete(nodeId)
  return { neighbors: result, total: total.size }
}

/** 一个可视集合内的全部关系（当前节点 + 邻居），带 focus 标记。 */
function relationsWithin(ci, nodeId, visibleNodeIds) {
  const visible = visibleNodeIds instanceof Set ? visibleNodeIds : new Set(visibleNodeIds)
  const out = []
  for (const relation of ci.relations) {
    if (!visible.has(relation.from) || !visible.has(relation.to)) continue
    out.push({ relation, focus: relation.from === nodeId || relation.to === nodeId })
  }
  return out.sort((a, b) => (TYPE_PRIORITY[a.relation.type] ?? 9) - (TYPE_PRIORITY[b.relation.type] ?? 9))
}

/** 关系两端的节点对象。 */
function relationEndpoints(ci, relation) {
  return {
    from: ci.nodesById.get(relation.from) || null,
    to: ci.nodesById.get(relation.to) || null,
  }
}

/* ─────────────────────────── 主张 / 来源 ─────────────────────────── */

function claimsForIds(ci, claimIds) {
  return toArray(claimIds)
    .map((id) => ci.claimsById.get(id))
    .filter(Boolean)
}

function claimsForSubject(ci, subject) {
  if (!subject) return []
  if (subject.kind === 'node') {
    const node = ci.nodesById.get(subject.id)
    return node ? claimsForIds(ci, node.claimIds) : []
  }
  if (subject.kind === 'relation') {
    const relation = ci.relationsById.get(subject.id)
    return relation ? claimsForIds(ci, relation.claimIds) : []
  }
  return []
}

/** 节点自身的旧式来源（v1 src 或 v2 sourceIds → sources）。 */
function sourcesForNode(ci, node) {
  if (!node) return []
  const out = []
  for (const id of toArray(node.sourceIds)) {
    const entry = ci.sourcesById.get(id)
    if (entry) out.push(entry)
  }
  for (const entry of toArray(node.legacySources)) out.push(entry)
  return dedupeSources(out)
}

function sourcesForClaims(ci, claims) {
  const out = []
  for (const claim of toArray(claims)) {
    for (const id of toArray(claim.sourceIds)) {
      const entry = ci.sourcesById.get(id)
      if (entry) out.push(entry)
    }
  }
  return dedupeSources(out)
}

function dedupeSources(list) {
  const seen = new Set()
  const out = []
  for (const entry of list) {
    if (!entry || seen.has(entry.id)) continue
    seen.add(entry.id)
    out.push(entry)
  }
  return out
}

function sourcesForSubject(ci, subject) {
  if (!subject) return []
  if (subject.kind === 'relation') {
    return sourcesForClaims(ci, claimsForSubject(ci, subject))
  }
  const node = subject.kind === 'node' ? ci.nodesById.get(subject.id) : null
  const claims = claimsForSubject(ci, subject)
  const fromClaims = sourcesForClaims(ci, claims)
  const direct = sourcesForNode(ci, node)
  const merged = dedupeSources(fromClaims.concat(direct))
  // relation 的 subject 不直接挂 node.sourceIds；其余仍返回 claim 级来源。
  return merged
}

function sourceSummary(ci, subject) {
  const list = sourcesForSubject(ci, subject)
  const unverified = list.filter((entry) => entry.verified === 'unverified').length
  return { sources: list.length, unverified, list }
}

/* ─────────────────────────── 实验 ─────────────────────────── */

/** 与当前 subject 相关的实验：节点看 conceptNodeIds；关系看两端节点。 */
function experimentsForSubject(ci, subject) {
  if (!subject) return []
  const nodeIds = new Set()
  if (subject.kind === 'node') nodeIds.add(subject.id)
  if (subject.kind === 'relation') {
    const relation = ci.relationsById.get(subject.id)
    if (relation) {
      nodeIds.add(relation.from)
      nodeIds.add(relation.to)
    }
  }
  if (subject.kind === 'investigation') return ci.experiments.slice()
  const matched = ci.experiments.filter((experiment) =>
    toArray(experiment.conceptNodeIds).some((id) => nodeIds.has(id)),
  )
  return matched.length ? matched : ci.experiments.slice()
}

/** 实验面板类型：按 id / modelId 前缀选择；未知返回 'green' 兜底但由调用方显示。 */
function experimentKind(experiment) {
  const id = String((experiment && experiment.id) || '')
  const modelId = String((experiment && experiment.modelId) || '')
  const probe = `${id} ${modelId}`.toLowerCase()
  if (probe.includes('delay')) return 'delay'
  if (probe.includes('proxy')) return 'proxy'
  if (probe.includes('green')) return 'green'
  return 'green'
}

/* ─────────────────────────── 历史时间轴 ─────────────────────────── */

/**
 * 历史投影：当前节点 + 邻居 + 同单元节点，按 eraStart 排列；
 * 时间不确定的单列。返回 { known:[{node}], unknown:[{node}], gaps:[], sources:[] }。
 */
function historyForSubject(ci, subject, limit) {
  if (!subject || subject.kind === 'investigation') {
    return { known: [], unknown: [], gaps: [], sources: [] }
  }
  const centerId = subject.kind === 'node' ? subject.id : null
  const nodeId = centerId || (subject.kind === 'relation' ? ci.relationsById.get(subject.id)?.from : null)
  if (!nodeId || !ci.nodesById.has(nodeId)) return { known: [], unknown: [], gaps: [], sources: [] }
  const center = ci.nodesById.get(nodeId)
  const related = new Set([nodeId])
  for (const relation of ci.relationsByNode.get(nodeId) || []) {
    related.add(relation.from)
    related.add(relation.to)
  }
  if (center.groupId) {
    for (const node of ci.nodesByGroup.get(center.groupId) || []) related.add(node.id)
  }
  const known = []
  const unknown = []
  const seenSources = new Set()
  const sources = []
  for (const id of related) {
    const node = ci.nodesById.get(id)
    if (!node) continue
    const era = nodeEraLabel(node)
    if (era.uncertain || node.eraStart === null || node.eraStart === undefined) {
      unknown.push({ node, era })
    } else {
      known.push({
        node,
        era,
        start: node.eraStart,
        end: node.eraEnd === null || node.eraEnd === undefined ? node.eraStart : node.eraEnd,
      })
    }
    for (const entry of sourcesForSubject(ci, { kind: 'node', id: node.id })) {
      if (seenSources.has(entry.id)) continue
      seenSources.add(entry.id)
      if (entry.year === null || entry.year === undefined) continue
      sources.push({ source: entry, node })
    }
  }
  known.sort((a, b) => a.start - b.start || (a.end - b.end) || (a.node.title < b.node.title ? -1 : 1))
  unknown.sort((a, b) => (a.node.title < b.node.title ? -1 : 1))
  sources.sort((a, b) => Number(a.source.year) - Number(b.source.year))
  const max = Number.isFinite(limit) ? limit : 14
  return {
    known: known.slice(0, max),
    unknown: unknown.slice(0, Math.max(4, Math.floor(max / 2))),
    gaps: gapsOf(ci),
    sources: sources.slice(0, max),
  }
}

function gapsOf(ci) {
  const completeness = ci.completeness
  if (!completeness || !Array.isArray(completeness.gaps)) return []
  return completeness.gaps.slice(0, 3)
}

/* ─────────────────────────── 实践回路 ─────────────────────────── */

const PRACTICE_STAGES = ['goal', 'measurement', 'action', 'observation', 'acceptance', 'revision']

/** 实践投影：相关节点按 practiceStages 分栏（可见 6 个阶段）。 */
function practiceForSubject(ci, subject) {
  if (!subject || subject.kind === 'investigation') return { stages: [], unmapped: [], caveat: true }
  const nodeId = subject.kind === 'node' ? subject.id : ci.relationsById.get(subject.id)?.from
  const center = nodeId ? ci.nodesById.get(nodeId) : null
  if (!center) return { stages: [], unmapped: [], caveat: true }
  const related = new Set([center.id])
  for (const relation of ci.relationsByNode.get(center.id) || []) {
    related.add(relation.from)
    related.add(relation.to)
  }
  if (center.groupId) for (const node of ci.nodesByGroup.get(center.groupId) || []) related.add(node.id)
  const buckets = new Map(PRACTICE_STAGES.map((stage) => [stage, []]))
  const unmapped = []
  for (const id of related) {
    const node = ci.nodesById.get(id)
    if (!node) continue
    const stages = toArray(node.practiceStages).filter((stage) => PRACTICE_STAGES.includes(stage))
    if (!stages.length) {
      unmapped.push(node)
      continue
    }
    for (const stage of stages) buckets.get(stage).push(node)
  }
  return {
    stages: PRACTICE_STAGES.map((stage) => ({ stage, nodes: buckets.get(stage) })),
    unmapped,
    centerId: center.id,
    caveat: true,
  }
}



/* ─────────────────────────── 搜索 ─────────────────────────── */

/** 跨节点/关系搜索；返回 { nodes, relations }。 */
function searchContent(ci, query, limit) {
  const max = Number.isFinite(limit) ? limit : 12
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return { nodes: [], relations: [] }
  const nodes = []
  for (const node of ci.nodes) {
    const haystack = `${node.title} ${(node.aliases || []).join(' ')} ${node.def} ${node.mech} ${node.can}`.toLowerCase()
    if (haystack.includes(needle)) nodes.push(node)
    if (nodes.length >= max) break
  }
  const relations = []
  for (const relation of ci.relations) {
    const from = ci.nodesById.get(relation.from)
    const to = ci.nodesById.get(relation.to)
    const haystack = `${relation.id} ${relation.type} ${relation.claim} ${relation.condition} ${relation.cost} ${
      from ? from.title : ''
    } ${to ? to.title : ''}`.toLowerCase()
    if (haystack.includes(needle)) relations.push({ relation, from, to })
    if (relations.length >= max) break
  }
  return { nodes, relations }
}

/** 单元统计：节点数、当前用户笔记数（按 subjectId 节点）。 */
function groupStats(ci, groupId, store) {
  const nodes = ci.nodesByGroup.get(groupId) || []
  const nodeIds = new Set(nodes.map((node) => node.id))
  let notes = 0
  for (const note of Object.values((store && store.notes) || {})) {
    if (note && note.subject && note.subject.kind === 'node' && nodeIds.has(note.subject.id)) notes += 1
    else if (note && typeof note.subjectId === 'string' && nodeIds.has(note.subjectId)) notes += 1
  }
  return { nodes: nodes.length, notes }
}
  return { normalizeRelationType, indexCore, emptyCoreIndex, relationTypeLabel, nodeKindLabel, verifiedLabel, claimKindLabel, migrateTypeLabel, nodeEraLabel, subjectFromView, subjectLabel, subjectTypeLabel, relationsForNode, neighborsOf, relationsWithin, relationEndpoints, claimsForIds, claimsForSubject, sourcesForNode, sourcesForClaims, sourcesForSubject, sourceSummary, experimentsForSubject, experimentKind, historyForSubject, practiceForSubject, PRACTICE_STAGES, RELATION_TYPES, searchContent, groupStats }
})
__def("store.js", function (__req) {
/**
 * 用户数据（store）的索引与归一化：state v2，同时容忍 v1 记录。
 *
 * 契约要点：
 * - 旧 v1 `origin:'user'` 不能直接追认为用户亲写 → legacyOriginUncertain=true，UI 必须提示。
 * - subject 统一成 {kind:'node'|'relation'|'investigation', id}；
 *   旧记录的 subjectId 视为 node。
 * - 只做展示归一化，不回写数据（回写是 Host 的职责）。
 */

const { subjectKey } = __req("util.js")

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const NOTE_KINDS = ['理解', '疑问', '证据', '反驳', '实践']

function normalizeNote(raw, id) {
  if (!isObject(raw)) return null
  const noteId = raw.id || id
  if (!noteId) return null
  let subject = raw.subject
  if (!isObject(subject) || !subject.kind) {
    const legacyId = raw.subjectId
    subject = legacyId ? { kind: 'node', id: String(legacyId) } : null
  }
  const legacy = !isObject(raw.subject) && !!raw.subjectId
  const authorSource = raw.authorSource || (raw.origin === 'import' ? 'import' : raw.origin === 'user' ? 'user' : 'import')
  const savedBy = raw.savedBy || (raw.origin === 'user' ? 'ui' : 'agent')
  return {
    id: String(noteId),
    subject,
    subjectId: subject && subject.kind === 'node' ? subject.id : null,
    kind: NOTE_KINDS.includes(raw.kind) ? raw.kind : '理解',
    text: String(raw.text || ''),
    status: raw.status === 'archived' ? 'archived' : 'active',
    authorSource,
    savedBy,
    adopted: raw.adopted === true ? true : raw.adopted === false ? false : null,
    legacyOriginUncertain: raw.legacyOriginUncertain === true || legacy || (raw.origin === 'user' && raw.authorSource === undefined),
    encodingSuspected: raw.encodingSuspected === true,
    parentRevision: raw.parentRevision === undefined ? null : raw.parentRevision,
    createdAt: raw.createdAt || raw.updatedAt || null,
    updatedAt: raw.updatedAt || raw.createdAt || null,
    revision: Number(raw.revision) || 1,
    raw,
  }
}

function normalizeInvestigation(raw, id) {
  if (!isObject(raw)) return null
  const invId = raw.id || id
  if (!invId) return null
  let subject = raw.subject
  if (!isObject(subject) || !subject.kind) {
    subject = raw.subjectId ? { kind: 'node', id: String(raw.subjectId) } : null
  }
  return {
    id: String(invId),
    subject,
    title: String(raw.title || ''),
    claim: String(raw.claim || ''),
    counter: String(raw.counter || ''),
    nextTest: String(raw.nextTest || ''),
    status: ['open', 'testing', 'supported', 'revised', 'inconclusive'].includes(raw.status) ? raw.status : 'open',
    predictionIds: toArray(raw.predictionIds).map(String),
    experimentRunIds: toArray(raw.experimentRunIds).map(String),
    dialogSubjectKey: raw.dialogSubjectKey || (subject ? subjectKey(subject) : ''),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || raw.createdAt || null,
    raw,
  }
}

function normalizePrediction(raw, id) {
  if (!isObject(raw)) return null
  const predId = raw.id || id
  if (!predId) return null
  let subject = raw.subject
  if (!isObject(subject) || !subject.kind) {
    subject = raw.subjectId ? { kind: 'node', id: String(raw.subjectId) } : null
  }
  const legacy = raw.legacy === true || !('status' in raw)
  let status = raw.status
  if (!['open', 'supported', 'refuted', 'inconclusive'].includes(status)) {
    if (raw.resolved === true) status = 'inconclusive'
    else if (raw.resolved === false) status = 'open'
    else status = 'open'
  }
  return {
    id: String(predId),
    investigationId: raw.investigationId || null,
    subject,
    text: String(raw.text || ''),
    resolveBy: String(raw.resolveBy || ''),
    status,
    resolvedAt: raw.resolvedAt || null,
    resolvedByRunId: raw.resolvedByRunId || null,
    resolutionNote: raw.resolutionNote || null,
    legacy: legacy || raw.legacy === true,
    at: raw.at || raw.createdAt || null,
    raw,
  }
}

function normalizeRun(raw, id) {
  if (!isObject(raw)) return null
  const runId = raw.id || id
  if (!runId) return null
  let subject = raw.subject
  if (!isObject(subject) || !subject.kind) {
    subject = isObject(raw.subjectRef) ? raw.subjectRef : null
  }
  return {
    id: String(runId),
    experimentId: raw.experimentId || '',
    modelId: raw.modelId || '',
    modelVersion: raw.modelVersion === undefined ? null : raw.modelVersion,
    params: isObject(raw.params) ? raw.params : {},
    initial: isObject(raw.initial) ? raw.initial : null,
    prediction: raw.prediction === undefined ? null : raw.prediction,
    observation: isObject(raw.observation) ? raw.observation : null,
    criterion: raw.criterion || '',
    verdict: raw.verdict || '',
    subject,
    investigationId: raw.investigationId || null,
    legacy: raw.legacy === true,
    at: raw.at || raw.createdAt || null,
    result: isObject(raw.result) ? raw.result : null,
    raw,
  }
}

function normalizeTask(raw, id) {
  if (!isObject(raw)) return null
  const taskId = raw.id || id
  if (!taskId) return null
  // v1 契约记录：{ id, title, text, nodeIds, revision, updatedAt }
  const legacy = !Array.isArray(raw.acceptance) && typeof raw.text === 'string'
  const acceptance = legacy
    ? []
    : toArray(raw.acceptance).map((item) =>
        typeof item === 'string' ? { text: item, evidence: '' } : { text: String(item.text || ''), evidence: String(item.evidence || '') },
      )
  return {
    id: String(taskId),
    title: String(raw.title || ''),
    request: String(raw.request || raw.text || ''),
    goal: String(raw.goal || ''),
    acceptance,
    boundary: toArray(raw.boundary).map((item) => (typeof item === 'string' ? item : String(item.text || ''))),
    unknowns: toArray(raw.unknowns).map((item) =>
      typeof item === 'string' ? { question: item, answer: null } : { question: String(item.question || ''), answer: item.answer === undefined ? null : item.answer },
    ),
    conceptIds: toArray(raw.conceptIds).map(String),
    evidenceRefs: toArray(raw.evidenceRefs).filter(isObject),
    status: ['draft', 'saved', 'archived'].includes(raw.status) ? raw.status : 'saved',
    revision: Number(raw.revision) || 1,
    revisions: toArray(raw.revisions),
    model: isObject(raw.model) ? raw.model : null,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || raw.createdAt || null,
    legacy,
    raw,
  }
}

function normalizeMessage(raw, index) {
  if (!isObject(raw)) return null
  const messageId = raw.id || `m_${index}`
  const role = raw.role === 'assistant' ? 'assistant' : 'user'
  let error = null
  if (isObject(raw.error)) error = { code: String(raw.error.code || ''), message: String(raw.error.message || raw.error.error || '') }
  const status = ['completed', 'failed', 'cancelled', 'streaming'].includes(raw.status) ? raw.status : 'completed'
  return {
    id: String(messageId),
    role,
    text: String(raw.text || ''),
    at: raw.at || null,
    requestId: raw.requestId || null,
    contextVersion: raw.contextVersion || '',
    model: isObject(raw.model) ? raw.model : null,
    status,
    error,
    partial: raw.partial === true,
    raw,
  }
}

function normalizeDialog(raw, key) {
  if (!isObject(raw)) return null
  const messages = toArray(raw.messages)
    .map((message, index) => normalizeMessage(message, index))
    .filter(Boolean)
  return {
    key,
    subject: isObject(raw.subject) ? raw.subject : null,
    messages,
    lastRequestId: raw.lastRequestId || null,
    pending: raw.pending || null,
    updatedAt: raw.updatedAt || null,
    raw,
  }
}

/**
 * 构建用户数据索引。
 * @param {object|null} store
 */
function indexStore(store) {
  const source = isObject(store) ? store : {}

  const notes = []
  for (const [id, raw] of Object.entries(isObject(source.notes) ? source.notes : {})) {
    const note = normalizeNote(raw, id)
    if (note) notes.push(note)
  }
  notes.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  const notesById = new Map(notes.map((note) => [note.id, note]))
  const notesBySubject = new Map()
  for (const note of notes) {
    const key = note.subject ? subjectKey(note.subject) : ''
    if (!key) continue
    if (!notesBySubject.has(key)) notesBySubject.set(key, [])
    notesBySubject.get(key).push(note)
  }

  const relations = new Map()
  for (const [edgeId, raw] of Object.entries(isObject(source.relations) ? source.relations : {})) {
    if (!isObject(raw)) continue
    relations.set(edgeId, {
      edgeId,
      annotation: String(raw.annotation || ''),
      status: ['open', 'supported', 'challenged'].includes(raw.status) ? raw.status : 'open',
      evidenceNoteIds: toArray(raw.evidenceNoteIds).map(String),
      version: Number(raw.version) || 1,
      updatedAt: raw.updatedAt || null,
      raw,
    })
  }

  const investigations = []
  for (const [id, raw] of Object.entries(isObject(source.investigations) ? source.investigations : {})) {
    const item = normalizeInvestigation(raw, id)
    if (item) investigations.push(item)
  }
  investigations.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  const investigationsBySubject = new Map()
  for (const item of investigations) {
    const key = item.subject ? subjectKey(item.subject) : ''
    if (!key) continue
    if (!investigationsBySubject.has(key)) investigationsBySubject.set(key, [])
    investigationsBySubject.get(key).push(item)
  }

  const predictions = []
  for (const [id, raw] of Object.entries(isObject(source.predictions) ? source.predictions : {})) {
    const item = normalizePrediction(raw, id)
    if (item) predictions.push(item)
  }
  predictions.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
  const predictionsBySubject = new Map()
  const predictionsByInvestigation = new Map()
  for (const item of predictions) {
    const key = item.subject ? subjectKey(item.subject) : ''
    if (key) {
      if (!predictionsBySubject.has(key)) predictionsBySubject.set(key, [])
      predictionsBySubject.get(key).push(item)
    }
    if (item.investigationId) {
      if (!predictionsByInvestigation.has(item.investigationId)) predictionsByInvestigation.set(item.investigationId, [])
      predictionsByInvestigation.get(item.investigationId).push(item)
    }
  }

  const runs = []
  for (const [id, raw] of Object.entries(isObject(source.experiments) ? source.experiments : {})) {
    const item = normalizeRun(raw, id)
    if (item) runs.push(item)
  }
  /** 兼容旧结构：{ experiments: { [id]: record } } 与契约 v2 的 runs 同表。 */
  runs.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
  const runsBySubject = new Map()
  const runsByExperiment = new Map()
  for (const run of runs) {
    const key = run.subject ? subjectKey(run.subject) : ''
    if (key) {
      if (!runsBySubject.has(key)) runsBySubject.set(key, [])
      runsBySubject.get(key).push(run)
    }
    if (!runsByExperiment.has(run.experimentId)) runsByExperiment.set(run.experimentId, [])
    runsByExperiment.get(run.experimentId).push(run)
  }

  const tasks = []
  for (const [id, raw] of Object.entries(isObject(source.tasks) ? source.tasks : {})) {
    const item = normalizeTask(raw, id)
    if (item) tasks.push(item)
  }
  // v1 contracts 兼容
  for (const [id, raw] of Object.entries(isObject(source.contracts) ? source.contracts : {})) {
    if (tasks.some((task) => task.id === id)) continue
    const item = normalizeTask(raw, id)
    if (item) {
      item.legacy = true
      tasks.push(item)
    }
  }
  tasks.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  const tasksById = new Map(tasks.map((task) => [task.id, task]))

  const dialogsRaw = isObject(source.dialogs) ? source.dialogs : {}
  const dialogs = new Map()
  for (const [key, raw] of Object.entries(dialogsRaw)) {
    const dialog = normalizeDialog(raw, key)
    if (dialog) dialogs.set(key, dialog)
  }

  const importLog = toArray(source.importLog)
  const view = isObject(source.view) ? source.view : {}
  const meta = isObject(source.meta) ? source.meta : {}

  return {
    raw: source,
    schemaVersion: source.schemaVersion || null,
    notes,
    notesById,
    notesBySubject,
    relations,
    investigations,
    investigationsBySubject,
    predictions,
    predictionsBySubject,
    predictionsByInvestigation,
    runs,
    runsBySubject,
    runsByExperiment,
    tasks,
    tasksById,
    dialogs,
    importLog,
    view,
    meta,
    getDialog(subject) {
      const key = subjectKey(subject)
      return key ? dialogs.get(key) || null : null
    },
    notesFor(subject) {
      const key = subjectKey(subject)
      return key ? notesBySubject.get(key) || [] : []
    },
    relationFor(edgeId) {
      return relations.get(edgeId) || null
    },
    investigationsFor(subject) {
      const key = subjectKey(subject)
      return key ? investigationsBySubject.get(key) || [] : []
    },
    predictionsFor(subject) {
      const key = subjectKey(subject)
      return key ? predictionsBySubject.get(key) || [] : []
    },
    runsFor(subject) {
      const key = subjectKey(subject)
      return key ? runsBySubject.get(key) || [] : []
    },
    openInvestigations() {
      return investigations.filter((item) => item.status === 'open' || item.status === 'testing')
    },
    openPredictions() {
      return predictions.filter((item) => item.status === 'open')
    },
  }
}

function emptyStoreIndex() {
  return indexStore({})
}
  return { normalizeNote, normalizeMessage, indexStore, emptyStoreIndex }
})
__def("api.js", function (__req) {
/**
 * Host API 客户端（contract §4）。
 *
 * - GET  /api/loop-atlas/state          → 全量状态
 * - POST /api/loop-atlas/ops            → { op, payload } → { ok, ... }
 * - POST /api/loop-atlas/dialog/stream  → text/x-ndjson 流
 * - POST /api/loop-atlas/dialog/cancel  → { requestId }
 *
 * 所有失败都转成 ApiError：code 来自宿主 {ok:false,code,error,details}；
 * 客户端不得吞错，UI 必须显示真实 code / 原因。
 */

const API_BASE = '/api/loop-atlas'

class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message)
    this.name = 'ApiError'
    this.code = code || 'UNKNOWN'
    this.status = typeof status === 'number' ? status : 0
    this.details = details === undefined ? null : details
  }
}

function errorFromBody(status, body, fallbackText) {
  const code = body && typeof body.code === 'string' ? body.code : status ? `HTTP` : 'UNKNOWN'
  const message =
    (body && (body.error || body.message)) ||
    fallbackText ||
    (status ? `宿主返回 HTTP ${status}` : '请求失败')
  return new ApiError(String(message), status ? code : code || 'UNKNOWN', status, body && body.details)
}

async function readJsonBody(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { __unparsed: text.slice(0, 400) }
  }
}

/** GET /state；失败抛 ApiError。 */
async function fetchState() {
  let response
  try {
    response = await fetch(`${API_BASE}/state`, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
  } catch (error) {
    throw new ApiError(String((error && error.message) || error), 'NETWORK', 0)
  }
  const body = await readJsonBody(response)
  if (!response.ok) throw errorFromBody(response.status, body)
  if (!body || body.ok !== true) throw errorFromBody(response.status, body, 'GET /state 未返回 ok:true')
  return body
}

/** POST /ops；宿主成功返回 {ok:true,...}，失败返回 4xx 错误信封。 */
async function runOp(op, payload) {
  let response
  try {
    response = await fetch(`${API_BASE}/ops`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ op, payload: payload || {} }),
    })
  } catch (error) {
    throw new ApiError(String((error && error.message) || error), 'NETWORK', 0)
  }
  const body = await readJsonBody(response)
  if (!response.ok) throw errorFromBody(response.status, body)
  if (!body) throw new ApiError(`操作 ${op} 返回空响应`, 'PROTOCOL', response.status)
  if (body.ok === false) throw errorFromBody(response.status || 500, body)
  return body
}

/** 读取错误响应体（流式请求失败时用）。 */
async function readErrorEnvelope(response, fallback) {
  let body = null
  try {
    const text = await response.text()
    if (text) body = JSON.parse(text)
  } catch {
    body = null
  }
  if (body && typeof body === 'object') return errorFromBody(response.status, body)
  return new ApiError(fallback || `宿主返回 HTTP ${response.status}`, 'HTTP', response.status)
}

/** 把一条 NDJSON 文本行转事件；非法行抛 PROTOCOL。 */
function parseNdjsonLine(line) {
  try {
    return JSON.parse(line)
  } catch (error) {
    throw new ApiError(`流式响应行不是合法 JSON：${String((error && error.message) || error)}`, 'PROTOCOL', 0)
  }
}

/** 逐行读取 NDJSON 流；返回最后一个事件（便于断言）。 */
async function consumeNdjson(response, onEvent, signal) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new ApiError('当前环境不支持流式读取（ReadableStream 缺失）', 'PROTOCOL', response.status)
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let last = null
  const emit = (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const event = parseNdjsonLine(trimmed)
    last = event
    if (typeof onEvent === 'function') onEvent(event)
  }
  try {
    for (;;) {
      if (signal && signal.aborted) throw new ApiError('请求已取消', 'CANCELED', 0)
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let index
      while ((index = buffer.indexOf('\n')) >= 0) {
        emit(buffer.slice(0, index))
        buffer = buffer.slice(index + 1)
      }
    }
    buffer += decoder.decode()
    emit(buffer)
    return last
  } finally {
    // 提前退出（abort）时显式释放 reader；失败不覆盖原始错误。
    try {
      reader.releaseLock()
    } catch {
      /* reader 已释放 */
    }
  }
}

/**
 * POST /dialog/stream。
 * @param {object} options
 * @param {{kind:string,id:string}} options.subject
 * @param {string} [options.text] 新问题正文（重试时为空）
 * @param {string} options.requestId 客户端生成的新请求号
 * @param {string} [options.retryRequestId] 要重试的失败请求号
 * @param {AbortSignal} [options.signal]
 * @param {(event:object)=>void} [options.onEvent]
 */
async function streamDialog({ subject, text, requestId, retryRequestId, signal, onEvent }) {
  const payload = { subject, text: text || '', requestId }
  if (retryRequestId) payload.retryRequestId = retryRequestId
  let response
  try {
    response = await fetch(`${API_BASE}/dialog/stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (error) {
    if (error && (error.name === 'AbortError' || error.code === 'ABORT_ERR')) {
      throw new ApiError('已停止', 'CANCELED', 0)
    }
    throw new ApiError(String((error && error.message) || error), 'NETWORK', 0)
  }
  if (!response.ok) throw await readErrorEnvelope(response, `对话请求失败（HTTP ${response.status}）`)
  const contentType = String(response.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('application/json')) {
    // 兼容：宿主用 JSON 信封直接报错（例如模型不可用），而不是开流。
    const body = await readJsonBody(response)
    if (body && body.ok === false) throw errorFromBody(response.status, body)
    throw new ApiError('对话接口没有返回 NDJSON 流', 'PROTOCOL', response.status)
  }
  return consumeNdjson(response, onEvent, signal)
}

/** POST /dialog/cancel；失败回退 ops dialog.cancel。 */
async function cancelDialog(requestId) {
  try {
    const response = await fetch(`${API_BASE}/dialog/cancel`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ requestId }),
    })
    const body = await readJsonBody(response)
    if (response.ok && body && body.ok !== false) return body
    // 宿主可能对已结束请求返回 NOT_FOUND；回退 ops 再试一次。
    if (response.status !== 404) throw errorFromBody(response.status, body)
  } catch (error) {
    if (error instanceof ApiError && error.status !== 404 && error.code !== 'NOT_FOUND') throw error
  }
  return runOp('dialog.cancel', { requestId })
}

/** ops dialog.get；返回 {dialog, available, model, reason}。 */
async function fetchDialog(subject) {
  const body = await runOp('dialog.get', { subject })
  return body
}
  return { API_BASE, ApiError, fetchState, runOp, readErrorEnvelope, parseNdjsonLine, streamDialog, cancelDialog, fetchDialog }
})
__def("state/app.js", function (__req) {
/**
 * 应用状态：GET /state 的加载、写操作回执、view 持久化。
 *
 * 硬约束：UI 只有拿到宿主真实回执才显示成功；写失败必须带 code + 原因；
 * view.save 失败不再静默（状态条显示真实原因）。
 */

const { useState, useEffect, useRef, useCallback } = React

const { fetchState, runOp, ApiError } = __req("api.js")

const SCALES = ['domain', 'subject', 'evidence']
const PROJECTIONS = ['theory', 'history', 'practice']
const PERSISTED_VIEW_FIELDS = [
  'scale',
  'projection',
  'selectedNodeId',
  'selectedRelationId',
  'activeInvestigationId',
  'directoryOpen',
  'rightOpen',
]

function toApiError(error) {
  if (error instanceof ApiError) return error
  return new ApiError(String((error && error.message) || error), 'UNKNOWN', 0)
}

/** 兼容 v1 view（selected/projection）并补默认值。 */
function normalizeView(raw) {
  const view = raw && typeof raw === 'object' ? raw : {}
  return {
    scale: SCALES.includes(view.scale) ? view.scale : 'subject',
    projection: PROJECTIONS.includes(view.projection) ? view.projection : 'theory',
    selectedNodeId: view.selectedNodeId || (typeof view.selected === 'string' ? view.selected : null),
    selectedRelationId: view.selectedRelationId || null,
    activeInvestigationId: view.activeInvestigationId || null,
    directoryOpen: view.directoryOpen !== false,
    rightOpen: view.rightOpen !== false,
  }
}

function pickPersistedView(view) {
  const out = {}
  for (const field of PERSISTED_VIEW_FIELDS) out[field] = view[field]
  return out
}

function useAppState(t) {
  const [phase, setPhase] = useState('loading')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [staleError, setStaleError] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const mounted = useRef(true)
  const receiptSeq = useRef(0)
  const loadingRef = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const addReceipt = useCallback((receipt) => {
    if (!mounted.current) return null
    receiptSeq.current += 1
    const entry = Object.assign(
      { id: `receipt-${receiptSeq.current}`, at: new Date().toISOString(), kind: 'info' },
      receipt,
    )
    setReceipts((previous) => [entry, ...previous].slice(0, 40))
    return entry
  }, [])

  const clearReceipts = useCallback(() => setReceipts([]), [])

  const load = useCallback(
    async (options) => {
      const opts = options || {}
      if (loadingRef.current) return null
      loadingRef.current = true
      if (opts.showRefreshing) setRefreshing(true)
      try {
        const next = await fetchState()
        if (!mounted.current) return next
        setData(next)
        setPhase('ready')
        setError(null)
        setStaleError(null)
        return next
      } catch (rawError) {
        const apiError = toApiError(rawError)
        if (!mounted.current) return null
        setStaleError(apiError)
        setPhase((previous) => (previous === 'loading' ? 'error' : previous))
        setError(apiError)
        if (!opts.quiet) {
          addReceipt({
            kind: 'error',
            text: `${t('loop.app.loadError')}：${apiError.message}`,
            code: apiError.code,
            details: apiError.details,
          })
        }
        return null
      } finally {
        loadingRef.current = false
        if (mounted.current) setRefreshing(false)
      }
    },
    [addReceipt, t],
  )

  useEffect(() => {
    load({ quiet: true })
    // 只在挂载时读取一次；后续由写操作/手动刷新触发。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 执行写操作；成功/失败都落到真实回执。成功后静默重读 state。 */
  const perform = useCallback(
    async (opName, payload, options) => {
      const opts = options || {}
      try {
        const result = await runOp(opName, payload)
        if (opts.receipt !== false) {
          const text =
            typeof opts.successText === 'function'
              ? opts.successText(result)
              : opts.successText || t('loop.status.saveOk', { what: opts.label || opName })
          addReceipt({ kind: 'ok', text, details: result })
        }
        if (opts.reload !== false) load({ quiet: true })
        return result
      } catch (rawError) {
        const apiError = toApiError(rawError)
        if (opts.receipt !== false) {
          addReceipt({
            kind: 'error',
            text: opts.errorPrefix ? `${opts.errorPrefix}：${apiError.message}` : apiError.message,
            code: apiError.code,
            details: apiError.details,
          })
        }
        throw apiError
      }
    },
    [addReceipt, load, t],
  )

  return {
    phase,
    data,
    error,
    staleError,
    receipts,
    refreshing,
    addReceipt,
    clearReceipts,
    load,
    perform,
    ready: phase === 'ready' && !!data,
  }
}

/**
 * view 状态：先本地响应，防抖持久化到 Host；失败通过 onPersistError 可见。
 * @returns {[view, updateView]}
 */
function useView(initialView, onPersistError) {
  const [view, setView] = useState(() => normalizeView(initialView))
  const latest = useRef(view)
  const timer = useRef(null)
  const mounted = useRef(true)
  const errorHandler = useRef(onPersistError)
  errorHandler.current = onPersistError

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const persist = useCallback((next) => {
    runOp('view.save', pickPersistedView(next)).catch((rawError) => {
      const apiError = toApiError(rawError)
      if (errorHandler.current) errorHandler.current(apiError)
    })
  }, [])

  const updateView = useCallback(
    (patch) => {
      const previous = latest.current
      const next = Object.assign({}, previous, typeof patch === 'function' ? patch(previous) : patch)
      latest.current = next
      setView(next)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        if (mounted.current) persist(latest.current)
      }, 350)
    },
    [persist],
  )

  return [view, updateView]
}

/** 写一条本地提示（不来自宿主时也明确 kind，避免 UI 假装是保存回执）。 */
function infoReceipt(kind, text, details) {
  return { kind, text, details }
}
  return { SCALES, PROJECTIONS, PERSISTED_VIEW_FIELDS, toApiError, normalizeView, pickPersistedView, useAppState, useView, infoReceipt }
})
__def("state/hooks.js", function (__req) {
/**
 * 浏览器侧基础 hooks：媒体查询、locale 变更订阅、元素尺寸、焦点陷阱、本地 id。
 */

const { useState, useEffect, useRef, useCallback, useMemo } = React

/** 订阅宿主 locale 快照变化，返回自增 tick（用于强制重渲染 t 文案）。 */
function useLocaleRevision(locale) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!locale || typeof locale.subscribe !== 'function') return undefined
    const unsubscribe = locale.subscribe(() => setTick((value) => value + 1))
    return typeof unsubscribe === 'function' ? unsubscribe : undefined
  }, [locale])
  return tick
}

/** matchMedia 查询（SSR/无 window 时返回 false）。 */
function useMediaQuery(query) {
  const getMatch = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    try {
      return window.matchMedia(query).matches
    } catch {
      return false
    }
  }, [query])
  const [matches, setMatches] = useState(getMatch)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    let media
    try {
      media = window.matchMedia(query)
    } catch {
      return undefined
    }
    const listener = (event) => setMatches(!!event.matches)
    setMatches(media.matches)
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
    if (typeof media.addListener === 'function') {
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
    return undefined
  }, [query])
  return matches
}

/** 观察元素尺寸；返回 [ref, size]。 */
function useElementSize(initial) {
  const ref = useRef(null)
  const [size, setSize] = useState(initial || { width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    function measure() {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      setSize((previous) => {
        const next = { width: Math.round(rect.width), height: Math.round(rect.height) }
        return previous.width === next.width && previous.height === next.height ? previous : next
      })
    }
    measure()
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      return () => observer.disconnect()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    return undefined
  }, [])
  return [ref, size]
}

/** 本地自增 id（弹层标题/aria 关联用；不依赖 React.useId，便于冒烟测试）。 */
let localIdCounter = 0
function nextLocalId(prefix) {
  localIdCounter += 1
  return `${prefix || 'la'}-${localIdCounter}`
}

/**
 * 让插件面板填满宿主分配的可视区域。
 *
 * 真实 Harness 的 main 容器有确定高度，CSS `height:100%` 即可；但开发期壳层
 * （以及某些宿主变体）父容器是 auto 高度，100% 不生效会让面板按内容撑高、底部
 * 状态条被裁掉。这里按「面板顶部到窗口底部」计算一次高度，作为 CSS 之外的后备，
 * 窗口尺寸变化时重算。
 * @returns {[object, number]} [根元素 ref, 应设置的高度 px]
 */
function useFillViewportHeight() {
  const ref = useRef(null)
  const [height, setHeight] = useState(0)
  useEffect(() => {
    function measure() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return
      const element = ref.current
      if (!element) return
      const rect = element.getBoundingClientRect()
      let available = Math.max(420, Math.round(window.innerHeight - Math.max(0, rect.top)))
      // 若某个祖先明确限制了高度（真实宿主的面板容器），优先用它的可见范围，
      // 避免把高度算到宿主底部状态栏之外。
      let parent = element.parentElement
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent)
        const overflowY = style ? style.overflowY : ''
        if ((overflowY === 'hidden' || overflowY === 'auto' || overflowY === 'scroll') && parent.clientHeight > 200) {
          const parentRect = parent.getBoundingClientRect()
          const candidate = Math.round(parentRect.bottom - rect.top)
          if (candidate > 200) available = Math.min(available, candidate)
          break
        }
        parent = parent.parentElement
      }
      setHeight((previous) => (Math.abs(previous - available) <= 1 ? previous : available))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return [ref, height]
}

/** 复制到剪贴板并返回真实结果；调用方负责把结果渲染成 receipt。 */
async function copyWithReceipt(copyText, text) {
  return copyText(text)
}

/** 按 key（通常是 subjectKey）隔离的文本草稿；切换主题不串题。 */
function useKeyedDrafts() {
  const [drafts, setDrafts] = useState({})
  const getDraft = useCallback((key) => drafts[key] || '', [drafts])
  const setDraft = useCallback((key, text) => {
    setDrafts((previous) => (previous[key] === text ? previous : Object.assign({}, previous, { [key]: text })))
  }, [])
  const clearDraft = useCallback((key) => {
    setDrafts((previous) => {
      if (!(key in previous)) return previous
      const next = Object.assign({}, previous)
      delete next[key]
      return next
    })
  }, [])
  return { drafts, getDraft, setDraft, clearDraft }
}
  return { useLocaleRevision, useMediaQuery, useElementSize, nextLocalId, useFillViewportHeight, copyWithReceipt, useKeyedDrafts }
})
__def("state/dialog.js", function (__req) {
/**
 * 学习伙伴对话引擎：真实模型流式对话、按 subject 隔离的草稿与请求状态。
 *
 * 协议（contract §4 + Lead 确认，2026-10-28）：
 * - POST /dialog/stream，body { subject, text, requestId, retryRequestId? }
 * - NDJSON：start / delta / done / error（error 若带 message 表示失败回答已落盘，可用 requestId 重试）
 * - 停止：AbortController + POST /dialog/cancel { requestId }
 * - 重试：同一 /dialog/stream + retryRequestId（Host 复用原 user 消息，不重复）
 * - 回答归属发送时的 subject；切 subject 只影响显示。
 */

const { useState, useEffect, useRef, useCallback } = React

const { streamDialog, cancelDialog } = __req("api.js")
const { newRequestId, subjectKey } = __req("util.js")
const { toApiError } = __req("state/app.js")

function normalizeChatError(event, t) {
  const code = String((event && (event.code || (event.error && event.error.code))) || 'UNKNOWN')
  let message = (event && typeof event.error === 'string' && event.error) || ''
  if (!message && event && typeof event.message === 'string') message = event.message
  if (!message && event && event.message && typeof event.message === 'object') {
    message = event.message.error || event.message.text || ''
  }
  if (!message) message = t(`loop.error.${code}`)
  return { code, message: String(message) }
}

const EMPTY_STREAM = {
  phase: 'idle',
  text: '',
  requestId: null,
  error: null,
  model: null,
  sentText: '',
  retryRequestId: null,
  startedAt: null,
}

/**
 * @param {object} options
 * @param {() => Promise<any>} options.reload 重新读取 /state
 * @param {(receipt:object)=>void} options.addReceipt
 * @param {(key:string, params?:object)=>string} options.t
 */
function useChat(options) {
  const { reload, addReceipt, t } = options
  const [streams, setStreams] = useState({})
  const [drafts, setDrafts] = useState({})
  const controllers = useRef(new Map())
  const requestIds = useRef(new Map())
  const activeKeys = useRef(new Set())
  const mounted = useRef(true)
  const reloadRef = useRef(reload)
  reloadRef.current = reload

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      for (const controller of controllers.current.values()) {
        try {
          controller.abort()
        } catch {
          /* 已结束 */
        }
      }
      controllers.current.clear()
    }
  }, [])

  const patchStream = useCallback((key, patch) => {
    if (!mounted.current) return
    setStreams((previous) => {
      const current = previous[key] || EMPTY_STREAM
      const next = Object.assign({}, current, typeof patch === 'function' ? patch(current) : patch)
      return Object.assign({}, previous, { [key]: next })
    })
  }, [])

  const settleAfterReload = useCallback(
    (key) => {
      const settle = () => {
        if (!mounted.current) return
        setStreams((previous) => {
          const current = previous[key]
          if (!current) return previous
          if (current.phase === 'finishing' || current.phase === 'cancelled') {
            return Object.assign({}, previous, {
              [key]: Object.assign({}, EMPTY_STREAM, {
                phase: 'idle',
                error: null,
              }),
            })
          }
          return previous
        })
      }
      const reloadPromise = reloadRef.current ? reloadRef.current() : Promise.resolve(null)
      Promise.resolve(reloadPromise)
        .catch(() => null)
        .then(settle)
      // 重读异常慢时也允许继续输入（真实回执仍以 /state 为准）。
      setTimeout(settle, 1500)
    },
    [],
  )

  const setDraft = useCallback((subject, text) => {
    const key = subjectKey(subject)
    setDrafts((previous) => (previous[key] === text ? previous : Object.assign({}, previous, { [key]: text })))
  }, [])

  const runStream = useCallback(
    async (subject, payload) => {
      const key = subjectKey(subject)
      if (!key) return null
      if (activeKeys.current.has(key)) return null
      activeKeys.current.add(key)
      const controller = new AbortController()
      controllers.current.set(key, controller)
      requestIds.current.set(key, payload.requestId)
      patchStream(key, {
        phase: 'streaming',
        text: '',
        requestId: payload.requestId,
        error: null,
        model: payload.model || null,
        sentText: payload.text || '',
        retryRequestId: payload.retryRequestId || null,
        startedAt: new Date().toISOString(),
      })
      let sawDone = false
      let streamError = null
      try {
        await streamDialog({
          subject,
          text: payload.text || '',
          requestId: payload.requestId,
          retryRequestId: payload.retryRequestId,
          signal: controller.signal,
          onEvent: (event) => {
            if (!mounted.current || !event || typeof event !== 'object') return
            if (event.type === 'start') {
              if (event.requestId) requestIds.current.set(key, event.requestId)
              patchStream(key, (current) => ({
                requestId: event.requestId || current.requestId,
                model: event.model || current.model,
                contextVersion: event.contextVersion || null,
              }))
              return
            }
            if (event.type === 'delta') {
              const chunk = String(event.text || '')
              if (chunk) patchStream(key, (current) => ({ text: current.text + chunk }))
              return
            }
            if (event.type === 'done') {
              sawDone = true
              patchStream(key, { phase: 'finishing' })
              return
            }
            if (event.type === 'error') {
              streamError = normalizeChatError(event, t)
              patchStream(key, {
                phase: 'error',
                error: streamError,
                requestId: event.requestId || requestIds.current.get(key) || null,
              })
            }
          },
        })
        if (!streamError && !sawDone) {
          streamError = { code: 'PROTOCOL', message: t('loop.error.PROTOCOL') }
          patchStream(key, { phase: 'error', error: streamError })
        }
      } catch (rawError) {
        const apiError = toApiError(rawError)
        if (apiError.code === 'CANCELED') {
          patchStream(key, { phase: 'cancelled', error: null, requestId: null })
        } else {
          patchStream(key, {
            phase: 'error',
            error: { code: apiError.code, message: apiError.message },
          })
        }
      } finally {
        controllers.current.delete(key)
        requestIds.current.delete(key)
        activeKeys.current.delete(key)
        settleAfterReload(key)
      }
      return payload.requestId
    },
    [patchStream, settleAfterReload, t],
  )

  const send = useCallback(
    async (subject, text) => {
      const value = String(text || '').trim()
      if (!value) return null
      const requestId = newRequestId()
      const result = await runStream(subject, { text: value, requestId })
      return result
    },
    [runStream],
  )

  const retry = useCallback(
    async (subject, failedRequestId) => {
      if (!failedRequestId) return null
      const requestId = newRequestId()
      return runStream(subject, { text: '', requestId, retryRequestId: failedRequestId })
    },
    [runStream],
  )

  /** 传输层失败（消息尚未落盘）时，改成一次全新的发送。 */
  const resend = useCallback(
    async (subject, text) => {
      const value = String(text || '').trim()
      if (!value) return null
      const requestId = newRequestId()
      return runStream(subject, { text: value, requestId })
    },
    [runStream],
  )

  const stop = useCallback(
    (subject) => {
      const key = subjectKey(subject)
      const controller = controllers.current.get(key)
      const requestId = requestIds.current.get(key)
      if (!controller) return
      patchStream(key, { phase: 'stopping' })
      try {
        controller.abort()
      } catch {
        /* 已结束 */
      }
      if (requestId) {
        cancelDialog(requestId)
          .then(() => {
            if (mounted.current) addReceipt({ kind: 'info', text: t('loop.chat.cancelled') })
          })
          .catch((rawError) => {
            const apiError = toApiError(rawError)
            // 请求已经结束时 Host 返回 NOT_FOUND 属正常竞态。
            if (apiError.code === 'NOT_FOUND') return
            if (mounted.current) {
              addReceipt({
                kind: 'error',
                text: `${t('loop.chat.cancelled')}（${apiError.code}）：${apiError.message}`,
                code: apiError.code,
              })
            }
          })
      }
    },
    [addReceipt, patchStream, t],
  )

  const dismissError = useCallback(
    (subject) => {
      const key = subjectKey(subject)
      setStreams((previous) => {
        const current = previous[key]
        if (!current || current.phase !== 'error') return previous
        return Object.assign({}, previous, { [key]: Object.assign({}, EMPTY_STREAM, { phase: 'idle' }) })
      })
    },
    [],
  )

  const streamFor = useCallback(
    (subject) => {
      const key = subjectKey(subject)
      return streams[key] || null
    },
    [streams],
  )

  return {
    streams,
    streamFor,
    draftFor(subject) {
      return drafts[subjectKey(subject)] || ''
    },
    setDraft,
    send,
    retry,
    resend,
    stop,
    dismissError,
    isStreaming(subject) {
      const stream = streamFor(subject)
      if (!stream) return false
      return stream.phase === 'streaming' || stream.phase === 'stopping' || stream.phase === 'finishing'
    },
  }
}
  return { useChat }
})
__def("components/Icons.js", function (__req) {
/**
 * 内联 SVG 图标（单色，currentColor）。不依赖宿主图标包，避免平台模块绑定。
 */

const SVG_PATHS = {
  search: ['M10.5 3.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'm15.6 15.6 4 4'],
  close: ['m5 5 12 12', 'm17 5-12 12'],
  chevronDown: ['m6 9 6 6 6-6'],
  chevronRight: ['m9 6 6 6-6 6'],
  chevronLeft: ['m15 6-6 6 6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  check: ['m4.5 12.5 5 5 10-11'],
  warning: ['M12 4 2.8 19.5h18.4L12 4Z', 'M12 10v4', 'M12 16.8v.4'],
  error: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z', 'M12 7.5v5.5', 'M12 16.2v.5'],
  info: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z', 'M12 11v5', 'M12 7.6v.4'],
  copy: ['M9 9h9v11H9z', 'M15 9V5H5v12h4'],
  external: ['M14 4h6v6', 'm20 4-9 9', 'M18 13v6H5V6h6'],
  chat: ['M4 5h16v11H9l-4.5 3.5V16H4z'],
  notes: ['M6 3h9l4 4v14H6z', 'M9 9h6', 'M9 13h6', 'M9 17h4'],
  graph: ['M12 5.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Z', 'M5 14a2.2 2.2 0 1 0 0 4.4A2.2 2.2 0 0 0 5 14Z', 'M19 14a2.2 2.2 0 1 0 0 4.4A2.2 2.2 0 0 0 19 14Z', 'M10.7 9.2 6.4 13.2', 'm13.3 9.2 4.3 4'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3.5 6h.5', 'M3.5 12h.5', 'M3.5 18h.5'],
  partner: ['M4 4h16v13H9.5L4 21V4Z', 'M8 9h8', 'M8 13h5'],
  collapseLeft: ['m14 6-6 6 6 6', 'M4 4v16'],
  collapseRight: ['m10 6 6 6-6 6', 'M20 4v16'],
  collapseUp: ['m6 14 6-6 6 6'],
  collapseDown: ['m6 10 6 6 6-6'],
  refresh: ['M20 12a8 8 0 1 1-2.6-5.9', 'M20 4v5h-5'],
  stop: ['M7 7h10v10H7z'],
  send: ['m4 12 16-8-6 8 6 8-16-8Z'],
  arrowRight: ['M4 12h15', 'm13 6 6 6-6 6'],
  arrowDown: ['M12 4v15', 'm6 13 6 6 6-6'],
  folder: ['M3.5 6h6l2 2h9v11H3.5z'],
  book: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z', 'M8 7h5', 'M8 11h5'],
  flask: ['M9 3h6', 'M10 3v5.2L5.2 17a2 2 0 0 0 1.8 3h10a2 2 0 0 0 1.8-3L14 8.2V3', 'M7.5 13h9'],
  target: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z', 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z', 'M12 11.4v1.2'],
  clock: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z', 'M12 7.5V12l3 2'],
  edit: ['m4 20 4-1 10.5-10.5-3-3L5 16Z', 'm13.5 4.5 3 3'],
  archive: ['M3.5 5h17v4h-17z', 'M5.5 9v11h13V9', 'M10 13h4'],
  restore: ['M4 12a8 8 0 1 0 3-6.2', 'M4 4v5h5'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6.5 7 7.5 21h9l1-14', 'M10 11v6', 'M14 11v6'],
  dot: ['M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  stopCircle: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z', 'M9 9h6v6H9z'],
}

const FILLED = new Set(['dot'])

function Icon(props) {
  const name = props && props.name
  const paths = SVG_PATHS[name] || SVG_PATHS.info
  const size = (props && props.size) || 18
  const extraClass = (props && props.className) || ''
  return h(
    'svg',
    {
      className: `la-icon ${extraClass}`.trim(),
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: FILLED.has(name) ? 'currentColor' : 'none',
      stroke: FILLED.has(name) ? 'none' : 'currentColor',
      strokeWidth: props && props.strokeWidth ? props.strokeWidth : 1.6,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    paths.map((d, index) => h('path', { key: index, d })),
  )
}
  return { Icon }
})
__def("components/primitives.js", function (__req) {
/**
 * 基础控件：按钮、图标按钮、分段切换、标签、提示、空状态。
 * 尺寸与热区遵循 contract §6：主操作 40—44px，图标按钮 40px，文字 ≥12px。
 */

const { classNames } = __req("util.js")
const { Icon } = __req("components/Icons.js")

function Button(props) {
  const variant = props.variant || 'secondary'
  const size = props.size || 'md'
  const className = classNames('la-btn', `la-btn--${variant}`, `la-btn--${size}`, props.block && 'la-btn--block', props.className)
  return h(
    'button',
    {
      type: props.type || 'button',
      className,
      disabled: props.disabled || props.loading || false,
      onClick: props.onClick,
      title: props.title,
      'aria-label': props['aria-label'],
      'aria-pressed': props.pressed === undefined ? undefined : props.pressed,
      'aria-busy': props.loading ? 'true' : undefined,
      style: props.style,
    },
    props.loading ? h('span', { className: 'la-spinner', 'aria-hidden': 'true' }) : props.icon ? h(Icon, { name: props.icon, size: 16 }) : null,
    props.children ? h('span', { className: 'la-btn__label' }, props.children) : null,
  )
}

function IconButton(props) {
  return h(
    'button',
    {
      type: 'button',
      className: classNames('la-iconbtn', props.className),
      onClick: props.onClick,
      title: props.title || props.label,
      'aria-label': props.label,
      'aria-pressed': props.pressed === undefined ? undefined : props.pressed,
      'aria-expanded': props.expanded === undefined ? undefined : props.expanded,
      disabled: props.disabled || false,
      style: props.style,
    },
    h(Icon, { name: props.icon, size: props.size || 18 }),
  )
}

/**
 * 分段切换（尺度 / 视角 / 笔记 tab 等）。
 * options: [{ id, label, hint?, disabled? }]
 */
function Segmented(props) {
  const options = props.options || []
  return h(
    'div',
    {
      className: classNames('la-seg', props.className),
      role: 'group',
      'aria-label': props.label,
    },
    options.map((option) =>
      h(
        'button',
        {
          key: option.id,
          type: 'button',
          className: classNames('la-seg__item', props.value === option.id && 'is-active'),
          onClick: option.disabled ? undefined : () => props.onChange && props.onChange(option.id),
          disabled: !!option.disabled,
          title: option.hint || option.label,
          'aria-pressed': props.value === option.id,
        },
        option.label,
      ),
    ),
  )
}

function Tag(props) {
  const tone = props.tone || 'neutral'
  return h(
    'span',
    { className: classNames('la-tag', `la-tag--${tone}`, props.className), title: props.title },
    props.children,
  )
}

function StatusDot(props) {
  const tone = props.tone || 'idle'
  return h('span', { className: classNames('la-dot', `la-dot--${tone}`), 'aria-hidden': 'true' })
}

function FieldLabel(props) {
  return h(
    'span',
    { className: classNames('la-fieldlabel', props.className) },
    props.children,
    props.optional ? h('span', { className: 'la-fieldlabel__optional' }, ' · ' + props.optional) : null,
  )
}

function Spinner(props) {
  return h('span', { className: classNames('la-spinner', props && props.className), 'aria-hidden': 'true' })
}

function EmptyState(props) {
  return h(
    'div',
    { className: classNames('la-empty', props.className) },
    props.icon ? h(Icon, { name: props.icon, size: 22 }) : null,
    props.title ? h('p', { className: 'la-empty__title' }, props.title) : null,
    props.hint ? h('p', { className: 'la-empty__hint' }, props.hint) : null,
    props.action || null,
  )
}

function Notice(props) {
  const tone = props.tone || 'info'
  return h(
    'div',
    { className: classNames('la-notice', `la-notice--${tone}`, props.className), role: tone === 'error' ? 'alert' : 'status' },
    h(Icon, { name: tone === 'error' ? 'error' : tone === 'warn' ? 'warning' : 'info', size: 16 }),
    h('div', { className: 'la-notice__body' }, props.children),
    props.action || null,
  )
}

function CountBadge(props) {
  return h('span', { className: 'la-count', 'aria-label': props.label }, props.children)
}

function SectionHeader(props) {
  return h(
    'div',
    { className: classNames('la-sectionhead', props.className) },
    h(
      'div',
      { className: 'la-sectionhead__text' },
      h('h3', { className: 'la-sectionhead__title' }, props.title),
      props.hint ? h('p', { className: 'la-sectionhead__hint' }, props.hint) : null,
    ),
    props.action || null,
  )
}

function Divider(props) {
  return h('hr', { className: classNames('la-divider', props && props.className) })
}
  return { Button, IconButton, Segmented, Tag, StatusDot, FieldLabel, Spinner, EmptyState, Notice, CountBadge, SectionHeader, Divider }
})
__def("views/TopBar.js", function (__req) {
/**
 * 顶栏：品牌、阅读尺度、视角、搜索、继续研究、资料与备份、学习伙伴开关。
 */

const { useState, useRef, useEffect, useMemo, useCallback } = React

const { IconButton, Button, Segmented } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { classNames } = __req("util.js")
const { searchContent } = __req("model.js")
const { nextLocalId } = __req("state/hooks.js")

function SearchBox(props) {
  const t = props.t
  const ci = props.ci
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listId = useMemo(() => nextLocalId('la-search-list'), [])
  const results = useMemo(() => searchContent(ci, query, 8), [ci, query])
  const flat = useMemo(() => {
    const rows = []
    for (const node of results.nodes) rows.push({ kind: 'node', id: node.id, node })
    for (const relation of results.relations) {
      rows.push({ kind: 'relation', id: relation.relation.id, relation: relation.relation, from: relation.from, to: relation.to })
    }
    return rows
  }, [results])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault()
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const choose = useCallback(
    (row) => {
      if (!row) return
      if (row.kind === 'node') props.onSelectNode(row.id)
      else props.onSelectRelation(row.id)
      setOpen(false)
      setQuery('')
    },
    [props],
  )

  function onInputKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(flat.length - 1, index + 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.max(0, index - 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      choose(flat[activeIndex])
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
      if (inputRef.current) inputRef.current.blur()
    }
  }

  const showList = open && query.trim().length > 0
  return h(
    'div',
    { className: 'la-search' },
    h(Icon, { name: 'search', size: 16, className: 'la-search__icon' }),
    h('input', {
      ref: inputRef,
      className: 'la-search__input',
      type: 'search',
      value: query,
      placeholder: t('loop.search.placeholder'),
      'aria-label': t('loop.search.label'),
      role: 'combobox',
      'aria-expanded': showList,
      'aria-controls': showList ? listId : undefined,
      'aria-autocomplete': 'list',
      'aria-activedescendant': showList && flat[activeIndex] ? `${listId}-${activeIndex}` : undefined,
      onChange: (event) => {
        setQuery(event.target.value)
        setOpen(true)
      },
      onFocus: () => setOpen(true),
      onBlur: () => {
        // 让点击结果先发生，再关列表。
        setTimeout(() => setOpen(false), 150)
      },
      onKeyDown: onInputKeyDown,
    }),
    showList
      ? h(
          'div',
          { className: 'la-search__popover' },
          flat.length
            ? h(
                'ul',
                { className: 'la-search__list', role: 'listbox', id: listId, 'aria-label': t('loop.search.label') },
                flat.map((row, index) =>
                  h(
                    'li',
                    { key: `${row.kind}:${row.id}`, role: 'option', 'aria-selected': index === activeIndex, id: `${listId}-${index}` },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: classNames('la-search__result', index === activeIndex && 'is-active'),
                        onMouseDown: (event) => {
                          event.preventDefault()
                          choose(row)
                        },
                        onMouseEnter: () => setActiveIndex(index),
                      },
                      h(
                        'span',
                        { className: 'la-search__result-main' },
                        row.kind === 'node'
                          ? row.node.title
                          : `${t(`loop.relation.type.${row.relation.type}`)}：${row.from ? row.from.title : row.relation.from} → ${
                              row.to ? row.to.title : row.relation.to
                            }`,
                        row.kind === 'node'
                          ? h('span', { className: 'la-search__result-sub' }, row.node.def)
                          : h('span', { className: 'la-search__result-sub' }, row.relation.claim || row.relation.condition),
                      ),
                      h(
                        'span',
                        { className: 'la-search__result-kind' },
                        row.kind === 'node' ? t('loop.search.node') : t('loop.search.relation'),
                      ),
                    ),
                  ),
                ),
              )
            : h('p', { className: 'la-search__empty' }, t('loop.search.empty')),
          h('p', { className: 'la-search__hint' }, t('loop.search.hint')),
        )
      : null,
  )
}

function TopBar(props) {
  const t = props.t
  const view = props.view
  const scaleOptions = [
    { id: 'domain', label: t('loop.scale.domain'), hint: t('loop.scale.domain.hint') },
    { id: 'subject', label: t('loop.scale.subject'), hint: t('loop.scale.subject.hint') },
    { id: 'evidence', label: t('loop.scale.evidence'), hint: t('loop.scale.evidence.hint') },
  ]
  const projectionOptions = [
    { id: 'theory', label: t('loop.projection.theory') },
    { id: 'history', label: t('loop.projection.history') },
    { id: 'practice', label: t('loop.projection.practice') },
  ]
  return h(
    'header',
    { className: 'la-topbar' },
    h(
      'div',
      { className: 'la-brand' },
      h('span', { className: 'la-brand__name' }, t('loop.app.title')),
      h('span', { className: 'la-brand__sub' }, t('loop.brand.sub')),
    ),
    h(
      'div',
      { className: 'la-topbar__cluster' },
      h('span', { className: 'la-topbar__label' }, t('loop.scale.label')),
      h(Segmented, {
        label: t('loop.scale.label'),
        value: view.scale,
        options: scaleOptions,
        onChange: (scale) => props.onChangeView({ scale }),
      }),
    ),
    h(
      'div',
      { className: 'la-topbar__cluster la-topbar__cluster--view' },
      h('span', { className: 'la-topbar__label' }, t('loop.projection.label')),
      h(Segmented, {
        label: t('loop.projection.label'),
        value: view.projection,
        options: projectionOptions.map((option) => Object.assign({}, option, { disabled: view.scale !== 'subject' })),
        onChange: (projection) => {
          if (view.scale !== 'subject') return
          props.onChangeView({ projection })
        },
      }),
    ),
    h(
      'div',
      { className: 'la-topbar__spacer' },
      h(SearchBox, {
        t,
        ci: props.ci,
        onSelectNode: props.onSelectNode,
        onSelectRelation: props.onSelectRelation,
      }),
    ),
    h(
      'div',
      { className: 'la-topbar__actions' },
      h(
        Button,
        { variant: 'ghost', size: 'sm', icon: 'clock', onClick: props.onOpenContinue, title: t('loop.continue') },
        t('loop.continue'),
      ),
      h(
        Button,
        { variant: 'ghost', size: 'sm', icon: 'folder', onClick: props.onOpenResources, title: t('loop.resources') },
        t('loop.resources'),
      ),
      h(IconButton, {
        icon: props.rightOpen ? 'collapseRight' : 'partner',
        label: props.rightOpen ? t('loop.partner.hide') : t('loop.partner.show'),
        pressed: props.rightOpen,
        onClick: props.onTogglePartner,
      }),
      h(IconButton, {
        className: 'la-topbar__menu',
        icon: 'menu',
        label: t('loop.dir.expand'),
        expanded: props.directoryOpen,
        onClick: props.onToggleDirectory,
      }),
    ),
  )
}
  return { SearchBox, TopBar }
})
__def("views/Directory.js", function (__req) {
/**
 * 左侧单元目录（200—224px，可折叠）。点单元进入其入口节点。
 */

const { IconButton, Tag } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { groupStats } = __req("model.js")
const { classNames } = __req("util.js")

function Directory(props) {
  const t = props.t
  const ci = props.ci
  const store = props.store
  const activeGroupId = props.activeGroupId
  return h(
    'nav',
    { className: classNames('la-dir', props.className), 'aria-label': t('loop.dir.title') },
    h(
      'div',
      { className: 'la-dir__head' },
      h('h2', { className: 'la-dir__title' }, t('loop.dir.title')),
      h(IconButton, {
        icon: props.narrow ? 'close' : 'collapseLeft',
        label: t('loop.dir.collapse'),
        onClick: props.onCollapse,
      }),
    ),
    h(
      'button',
      {
        type: 'button',
        className: classNames('la-dir__overview', props.view.scale === 'domain' && 'is-active'),
        onClick: props.onOpenDomain,
        'aria-pressed': props.view.scale === 'domain',
      },
      h(Icon, { name: 'target', size: 16 }),
      h('span', null, t('loop.dir.overview')),
    ),
    h(
      'ul',
      { className: 'la-dir__list' },
      ci.groups.map((group, index) => {
        const stats = groupStats(ci, group.id, store)
        const active = group.id === activeGroupId
        const entry = group.entryNodeId ? ci.nodesById.get(group.entryNodeId) : null
        return h(
          'li',
          { key: group.id },
          h(
            'button',
            {
              type: 'button',
              className: classNames('la-dir__item', active && 'is-active'),
              onClick: () => props.onSelectGroup(group),
              'aria-current': active ? 'true' : undefined,
              title: `${group.title} · ${t('loop.domain.question')}：${group.question}`,
            },
            h('span', { className: 'la-dir__index' }, String(group.order || index + 1).padStart(2, '0')),
            h(
              'span',
              { className: 'la-dir__text' },
              h('span', { className: 'la-dir__name' }, group.title),
              group.question ? h('span', { className: 'la-dir__question' }, group.question) : null,
              h(
                'span',
                { className: 'la-dir__meta' },
                t('loop.domain.concepts', { count: stats.nodes }),
                stats.notes ? ` · ${t('loop.dir.notes', { count: stats.notes })}` : '',
              ),
            ),
            active ? h(Tag, { tone: 'accent' }, t('loop.dir.current')) : null,
          ),
        )
      }),
    ),
    h(
      'div',
      { className: 'la-dir__foot' },
      h(
        'p',
        { className: 'la-dir__footline' },
        `v${ci.version || '—'} · ${ci.nodes.length} ${t('loop.search.node')} · ${ci.relations.length} ${t('loop.search.relation')}`,
      ),
    ),
  )
}
  return { Directory }
})
__def("views/StatusBar.js", function (__req) {
/**
 * 底部状态条：数据路径、模型状态、最近的真实保存回执 / 错误。
 * 所有成功文案只来自 Host 回执；错误显示 code + 原因。
 */

const { IconButton, StatusDot, Tag, Notice } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { truncate } = __req("util.js")

function StatusBar(props) {
  const t = props.t
  const data = props.data || {}
  const latest = (props.receipts || [])[0] || null
  const modelName = data.model && data.model.model ? `${data.model.provider || '?'} / ${data.model.model}` : t('loop.chat.noModel')
  const modelAvailable = data.modelAvailable !== false && !(data.model && data.model.available === false)
  const readOnly = data.readOnly === true || data.fatal === true
  return h(
    'footer',
    { className: 'la-statusbar', role: 'contentinfo', 'aria-label': t('loop.a11y.status') },
    h(
      'button',
      {
        type: 'button',
        className: 'la-statusbar__path',
        title: `${t('loop.res.dataPath')}：${data.dataPath || '—'}`,
        onClick: props.onCopyPath,
      },
      h(Icon, { name: 'folder', size: 14 }),
      h('span', { className: 'la-statusbar__pathtext' }, data.dataPath || '—'),
    ),
    h(
      'span',
      { className: 'la-statusbar__model' },
      h(StatusDot, { tone: modelAvailable ? 'ok' : 'danger' }),
      h('span', null, `${t('loop.status.model', { model: modelName })}`),
      modelAvailable ? null : h(Tag, { tone: 'danger' }, t('loop.status.modelUnavailable')),
    ),
    readOnly
      ? h(
          'span',
          { className: 'la-statusbar__alert' },
          h(Notice, { tone: 'warn' }, data.fatal ? String(data.fatal) : t('loop.error.READ_ONLY')),
        )
      : null,
    h(
      'button',
      {
        type: 'button',
        className: `la-statusbar__receipt ${latest ? `is-${latest.kind}` : ''}`.trim(),
        onClick: props.onOpenReceipts,
        'aria-live': 'polite',
        title: t('loop.status.receipts'),
      },
      latest
        ? h(
            'span',
            { className: 'la-statusbar__receipttext' },
            latest.kind === 'ok' ? '✓ ' : latest.kind === 'error' ? '✕ ' : '· ',
            truncate(latest.text, 120),
            latest.code ? h('span', { className: 'la-statusbar__code' }, ` [${latest.code}]`) : null,
          )
        : h('span', { className: 'la-statusbar__receipttext la-muted' }, t('loop.status.noReceipts')),
      (props.receipts || []).length > 1 ? h('span', { className: 'la-statusbar__receiptcount' }, String(props.receipts.length)) : null,
    ),
    h(
      'span',
      { className: 'la-statusbar__right' },
      (props.notices || []).length
        ? h(
            'button',
            { type: 'button', className: 'la-statusbar__notices', onClick: props.onOpenReceipts },
            h(Icon, { name: 'info', size: 14 }),
            t('loop.status.noticesCount', { count: props.notices.length }),
          )
        : null,
      props.refreshing ? h('span', { className: 'la-statusbar__refreshing' }, t('loop.common.loading')) : null,
      h(IconButton, { icon: 'refresh', label: t('loop.common.refresh'), onClick: props.onRefresh, disabled: props.refreshing }),
    ),
  )
}
  return { StatusBar }
})
__def("views/DomainScale.js", function (__req) {
/**
 * 领域尺度：8 个单元卡片，显示 title + question + 能力目标（不是节点数为主）。
 */

const { Tag } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { groupStats } = __req("model.js")

function DomainScale(props) {
  const t = props.t
  const ci = props.ci
  const store = props.store
  const recommendedGroupId = props.recommendedGroupId
  if (!ci.groups.length) {
    return h('div', { className: 'la-scale la-scale--domain' }, h('p', { className: 'la-muted' }, t('loop.subject.empty')))
  }
  return h(
    'section',
    { className: 'la-scale la-scale--domain', 'aria-label': t('loop.scale.domain') },
    h(
      'div',
      { className: 'la-scalehead' },
      h('h2', { className: 'la-scalehead__title' }, t('loop.scale.domain')),
      h('p', { className: 'la-scalehead__hint' }, t('loop.domain.intro')),
    ),
    h(
      'div',
      { className: 'la-domaingrid' },
      ci.groups.map((group, index) => {
        const stats = groupStats(ci, group.id, store)
        const entry = group.entryNodeId ? ci.nodesById.get(group.entryNodeId) : null
        const recommended = group.id === recommendedGroupId
        return h(
          'button',
          {
            key: group.id,
            type: 'button',
            className: `la-domaincard ${recommended ? 'is-recommended' : ''}`.trim(),
            onClick: () => props.onEnterGroup(group),
            'aria-label': t('loop.domain.openUnit', { title: group.title }),
          },
          h(
            'span',
            { className: 'la-domaincard__top' },
            h('span', { className: 'la-domaincard__index' }, String(group.order || index + 1).padStart(2, '0')),
            recommended ? h(Tag, { tone: 'accent' }, t('loop.domain.recommended')) : null,
          ),
          h('span', { className: 'la-domaincard__title' }, group.title),
          group.question
            ? h(
                'span',
                { className: 'la-domaincard__row' },
                h('span', { className: 'la-domaincard__label' }, t('loop.domain.question')),
                h('span', { className: 'la-domaincard__question' }, group.question),
              )
            : null,
          group.capability
            ? h(
                'span',
                { className: 'la-domaincard__row' },
                h('span', { className: 'la-domaincard__label' }, t('loop.domain.capability')),
                h('span', { className: 'la-domaincard__capability' }, group.capability),
              )
            : null,
          h(
            'span',
            { className: 'la-domaincard__foot' },
            h(
              'span',
              { className: 'la-domaincard__entry' },
              h(Icon, { name: 'arrowRight', size: 14 }),
              entry ? `${t('loop.dir.entry')}：${entry.title}` : t('loop.dir.overview'),
            ),
            h(
              'span',
              { className: 'la-domaincard__stats' },
              t('loop.domain.concepts', { count: stats.nodes }),
              stats.notes ? ` · ${t('loop.dir.notes', { count: stats.notes })}` : '',
            ),
          ),
        )
      }),
    ),
  )
}
  return { DomainScale }
})
__def("layout/graph.js", function (__req) {
/**
 * 问题尺度图谱布局（纯函数，便于 node --test）。
 *
 * 设计约束（contract §6）：
 * - 容器自适应，HTML 节点用屏幕 px 绝对定位；SVG 连线坐标与容器同 px，不用 viewBox 整图缩放；
 * - 当前节点居中，邻居按关系类型分区；
 * - 字号由 CSS 固定（不随图缩放）；
 * - 非当前关系不靠透明度隐藏。
 */

const NODE_SIZE = {
  center: { width: 208, height: 96 },
  neighbor: { width: 156, height: 58 },
}

function relationZone(neighbor) {
  const { direction, relation } = neighbor
  if (direction === 'in') return 'prereq'
  if (!relation) return 'context'
  if (relation.type === 'formal' || relation.type === 'application' || relation.type === 'constraint') {
    return 'downstream'
  }
  return 'context'
}

function placeColumn(items, x, height, nodeSize) {
  const count = items.length
  if (!count) return []
  const usable = Math.max(1, height - nodeSize.height - 32)
  return items.map((item, index) => {
    const y = 24 + nodeSize.height / 2 + (usable * (index + 0.5)) / count
    return { item, x, y }
  })
}

function clampPosition(x, y, width, height, size, padding) {
  const pad = Number.isFinite(padding) ? padding : 10
  const halfW = size.width / 2
  const halfH = size.height / 2
  return {
    x: Math.min(Math.max(x, halfW + pad), Math.max(halfW + pad, width - halfW - pad)),
    y: Math.min(Math.max(y, halfH + pad), Math.max(halfH + pad, height - halfH - pad)),
  }
}

/**
 * @param {object} options
 * @param {object} options.center 当前节点
 * @param {Array<{node:object, relation:object, direction:'in'|'out'}>} options.neighbors
 * @param {number} options.width 画布宽度（px）
 * @param {number} options.height 画布高度（px）
 * @returns {{width:number,height:number,nodes:Array,edges:Array,labelNodes:Array}}
 */
function layoutSubjectGraph(options) {
  const center = options.center
  const neighbors = Array.isArray(options.neighbors) ? options.neighbors : []
  const width = Math.max(320, Math.round(Number(options.width) || 0))
  const height = Math.max(320, Math.round(Number(options.height) || 0))
  const stacked = width < 620
  const centerSize = NODE_SIZE.center
  const neighborSize = NODE_SIZE.neighbor

  const nodes = []
  const centerPos = stacked
    ? { x: width / 2, y: 84 }
    : clampPosition(width / 2, height / 2, width, height, centerSize, 14)
  nodes.push({ id: center.id, node: center, isCenter: true, size: centerSize, x: centerPos.x, y: centerPos.y })

  const zones = { prereq: [], downstream: [], context: [] }
  for (const neighbor of neighbors) {
    zones[relationZone(neighbor)].push(neighbor)
  }

  const placeAt = (item, position, boundsHeight) => {
    const clamped = clampPosition(position.x, position.y, width, boundsHeight || height, neighborSize, 10)
    nodes.push({
      id: item.node.id,
      node: item.node,
      relation: item.relation,
      direction: item.direction,
      isCenter: false,
      size: neighborSize,
      x: clamped.x,
      y: clamped.y,
    })
  }

  let layoutHeight = height
  if (stacked) {
    // 窄屏：中心在上，邻居按分区顺序纵向排列（每行交替左右，避免连线穿过文字）。
    // 关系标签放在各自邻居节点上方，避免多条边的标签在中部互相遮挡。
    const ordered = [...zones.prereq, ...zones.downstream, ...zones.context]
    const top = 84 + centerSize.height / 2 + 48
    const rowHeight = neighborSize.height + 50
    const needed = top + ordered.length * rowHeight + 20
    layoutHeight = Math.max(height, needed)
    ordered.forEach((item, index) => {
      const side = index % 2 === 0 ? 0.32 : 0.68
      const y = top + index * rowHeight + neighborSize.height / 2
      placeAt(item, { x: width * side, y }, layoutHeight)
    })
  } else {
    const leftX = Math.max(neighborSize.width / 2 + 18, width * 0.19)
    const rightX = Math.min(width - neighborSize.width / 2 - 18, width * 0.81)
    for (const entry of placeColumn(zones.prereq, leftX, height, neighborSize)) placeAt(entry.item, entry)
    for (const entry of placeColumn(zones.downstream, rightX, height, neighborSize)) placeAt(entry.item, entry)
    if (zones.context.length) {
      const count = zones.context.length
      const startX = width * 0.16
      const endX = width * 0.84
      zones.context.forEach((item, index) => {
        const x = count === 1 ? width / 2 : startX + ((endX - startX) * index) / (count - 1)
        const y = height - neighborSize.height / 2 - 18
        placeAt(item, { x, y })
      })
    }
  }

  const positions = new Map(nodes.map((entry) => [entry.id, entry]))
  const centerEntry = positions.get(center.id)
  const edges = []
  const labelNodes = []

  for (const neighbor of neighbors) {
    const target = positions.get(neighbor.node.id)
    if (!target || !centerEntry) continue
    const geometry = edgeGeometry(centerEntry, target)
    const label = stacked
      ? {
          labelX: target.x,
          labelY: target.y - target.size.height / 2 - 14,
        }
      : { labelX: geometry.labelX, labelY: geometry.labelY }
    edges.push({
      relation: neighbor.relation,
      direction: neighbor.direction,
      fromCenter: neighbor.direction === 'out',
      path: geometry.path,
      labelX: label.labelX,
      labelY: label.labelY,
    })
    labelNodes.push({
      relation: neighbor.relation,
      direction: neighbor.direction,
      x: label.labelX,
      y: label.labelY,
    })
  }

  // 宽屏标签防重叠：同一水平带的标签按 y 顺序下推 / 上提，仍限制在画布内。
  if (!stacked) resolveLabelCollisions(labelNodes, width, height)

  return { width, height: layoutHeight, nodes, edges, labelNodes, stacked }
}

function resolveLabelCollisions(labelNodes, width, height) {
  const CHIP_H = 30
  const CHIP_W = 120
  const sorted = labelNodes.slice().sort((a, b) => a.y - b.y || a.x - b.x)
  for (let index = 0; index < sorted.length; index++) {
    const current = sorted[index]
    for (let other = 0; other < index; other++) {
      const previous = sorted[other]
      if (Math.abs(previous.x - current.x) > CHIP_W) continue
      if (Math.abs(previous.y - current.y) >= CHIP_H) continue
      current.y = previous.y + CHIP_H
    }
    current.y = Math.min(Math.max(current.y, CHIP_H / 2 + 8), height - CHIP_H / 2 - 8)
    current.x = Math.min(Math.max(current.x, CHIP_W / 2 + 8), width - CHIP_W / 2 - 8)
  }
}

function anchorPoint(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const halfW = from.size.width / 2 + 6
  const halfH = from.size.height / 2 + 6
  const scale = Math.min(
    Math.abs(dx) > 0.001 ? halfW / Math.abs(dx) : Infinity,
    Math.abs(dy) > 0.001 ? halfH / Math.abs(dy) : Infinity,
  )
  const ratio = Math.min(scale, 1)
  return { x: from.x + (dx / length) * length * ratio, y: from.y + (dy / length) * length * ratio }
}

function edgeGeometry(from, to) {
  const start = anchorPoint(from, to)
  const end = anchorPoint(to, from)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const horizontal = Math.abs(dx) >= Math.abs(dy)
  let path
  if (horizontal) {
    const curve = Math.max(18, Math.abs(dx) * 0.45)
    const direction = dx >= 0 ? 1 : -1
    path = `M ${round(start.x)} ${round(start.y)} C ${round(start.x + direction * curve)} ${round(start.y)}, ${round(
      end.x - direction * curve,
    )} ${round(end.y)}, ${round(end.x)} ${round(end.y)}`
  } else {
    const curve = Math.max(16, Math.abs(dy) * 0.4)
    const direction = dy >= 0 ? 1 : -1
    path = `M ${round(start.x)} ${round(start.y)} C ${round(start.x)} ${round(start.y + direction * curve)}, ${round(
      end.x,
    )} ${round(end.y - direction * curve)}, ${round(end.x)} ${round(end.y)}`
  }
  // 曲线中点（三次贝塞尔 t=0.5 的解析解）
  const controlA = horizontal
    ? { x: start.x + (dx >= 0 ? 1 : -1) * Math.max(18, Math.abs(dx) * 0.45), y: start.y }
    : { x: start.x, y: start.y + (dy >= 0 ? 1 : -1) * Math.max(16, Math.abs(dy) * 0.4) }
  const controlB = horizontal
    ? { x: end.x - (dx >= 0 ? 1 : -1) * Math.max(18, Math.abs(dx) * 0.45), y: end.y }
    : { x: end.x, y: end.y - (dy >= 0 ? 1 : -1) * Math.max(16, Math.abs(dy) * 0.4) }
  const labelX = (start.x + 3 * controlA.x + 3 * controlB.x + end.x) / 8
  const labelY = (start.y + 3 * controlA.y + 3 * controlB.y + end.y) / 8
  return { path, labelX, labelY }
}

function round(value) {
  return Math.round(value * 10) / 10
}

/** 供测试/组件用：把关系类型映射到分区名。 */
function zoneForRelationType(type) {
  if (type === 'prerequisite') return 'prereq'
  if (type === 'formal' || type === 'application' || type === 'constraint') return 'downstream'
  return 'context'
}
  return { NODE_SIZE, relationZone, layoutSubjectGraph, zoneForRelationType }
})
__def("views/GraphCanvas.js", function (__req) {
/**
 * 问题尺度图谱画布：HTML 节点（屏幕 px 绝对定位）+ SVG 连线（同 px 坐标，不缩放整图）。
 * 关系标签是可点击、可 Tab 的按钮；连线同样可点。
 */

const { useMemo } = React

const { layoutSubjectGraph, relationZone } = __req("layout/graph.js")
const { relationTypeLabel, nodeKindLabel, nodeEraLabel } = __req("model.js")
const { nextLocalId } = __req("state/hooks.js")
const { classNames, truncate } = __req("util.js")

const DASHED_TYPES = new Set(['historical', 'analogy', 'parallel'])

function GraphCanvas(props) {
  const t = props.t
  const center = props.center
  const neighbors = props.neighbors || []
  const width = props.width || 820
  const height = props.height || 540
  const markerId = useMemo(() => nextLocalId('la-arrow'), [])
  const layout = useMemo(
    () => layoutSubjectGraph({ center, neighbors, width, height }),
    [center, neighbors, width, height],
  )
  const zones = useMemo(() => {
    const set = new Set()
    for (const neighbor of neighbors) set.add(relationZone(neighbor))
    return set
  }, [neighbors])

  if (!center) return null

  return h(
    'div',
    {
      className: classNames('la-canvas', layout.stacked && 'is-stacked'),
      role: 'group',
      'aria-label': t('loop.a11y.graph'),
      style: layout.stacked ? { height: `${layout.height}px`, minHeight: `${layout.height}px` } : undefined,
    },
    h(
      'svg',
      {
        className: 'la-canvas__svg',
        width: layout.width,
        height: layout.height,
        viewBox: `0 0 ${layout.width} ${layout.height}`,
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h(
        'defs',
        null,
        h(
          'marker',
          {
            id: markerId,
            viewBox: '0 0 10 10',
            refX: 9,
            refY: 5,
            markerWidth: 7,
            markerHeight: 7,
            orient: 'auto-start-reverse',
          },
          h('path', { d: 'M 0 1 L 9 5 L 0 9 z', className: 'la-canvas__arrow' }),
        ),
      ),
      layout.edges.map((edge) => {
        const selected = props.selectedRelationId === edge.relation.id
        const dashed = DASHED_TYPES.has(edge.relation.type)
        return h(
          'g',
          { key: edge.relation.id, className: classNames('la-edgegroup', selected && 'is-selected') },
          h('path', {
            className: 'la-edge__hit',
            d: edge.path,
            onClick: (event) => {
              event.stopPropagation()
              props.onSelectRelation(edge.relation.id)
            },
          }),
          h('path', {
            className: classNames('la-edge', `la-edge--${edge.relation.type}`, selected && 'is-selected'),
            d: edge.path,
            strokeDasharray: dashed ? (edge.relation.type === 'historical' ? '2 7' : '6 5') : undefined,
            markerEnd: edge.direction === 'out' ? `url(#${markerId})` : undefined,
            markerStart: edge.direction === 'in' ? `url(#${markerId})` : undefined,
          }),
        )
      }),
      zones.has('prereq')
        ? h('text', { className: 'la-zone__label', x: 14, y: 20 }, t('loop.theory.prereq'))
        : null,
      zones.has('downstream')
        ? h('text', { className: 'la-zone__label', x: layout.width - 14, y: 20, textAnchor: 'end' }, t('loop.theory.tradeoff'))
        : null,
      zones.has('context')
        ? h('text', { className: 'la-zone__label', x: 14, y: layout.height - 52 }, t('loop.theory.historical'))
        : null,
    ),
    layout.nodes.map((entry) => {
      const node = entry.node
      const era = nodeEraLabel(node)
      const isCenter = entry.isCenter
      const kind = nodeKindLabel(t, node.kind)
      const relationsCount = props.relationCountFor ? props.relationCountFor(node.id) : 0
      return h(
        'button',
        {
          key: node.id,
          type: 'button',
          className: classNames(
            'la-gnode',
            isCenter ? 'la-gnode--center' : 'la-gnode--neighbor',
            props.selectedNodeId === node.id && 'is-selected',
          ),
          style: {
            left: `${entry.x}px`,
            top: `${entry.y}px`,
            width: `${entry.size.width}px`,
            height: `${entry.size.height}px`,
            transform: 'translate(-50%, -50%)',
          },
          onClick: () => props.onSelectNode(node.id),
          'aria-current': isCenter ? 'true' : undefined,
          'aria-label': `${isCenter ? t('loop.a11y.current') + '：' : ''}${node.title}${era.text ? ` · ${era.text}` : ''} · ${kind}`,
          title: node.def || node.title,
        },
        h(
          'span',
          { className: 'la-gnode__top' },
          h('span', { className: 'la-gnode__kind' }, kind),
          isCenter ? null : h('span', { className: 'la-gnode__era' }, era.uncertain ? t('loop.subject.eraUnknown') : era.text),
          relationshipsBadge(h, relationsCount),
        ),
        h('span', { className: 'la-gnode__title' }, node.title),
        isCenter
          ? h('span', { className: 'la-gnode__def' }, truncate(node.def || node.mech || node.can || '', 54))
          : null,
      )
    }),
    layout.labelNodes.map((label) => {
      const selected = props.selectedRelationId === label.relation.id
      const arrow = label.direction === 'out' ? '→' : '←'
      return h(
        'button',
        {
          key: `label:${label.relation.id}`,
          type: 'button',
          className: classNames('la-relchip', `la-relchip--${label.relation.type}`, selected && 'is-selected'),
          style: { left: `${label.x}px`, top: `${label.y}px`, transform: 'translate(-50%, -50%)' },
          onClick: (event) => {
            event.stopPropagation()
            props.onSelectRelation(label.relation.id)
          },
          'aria-pressed': selected,
          'aria-label': t('loop.a11y.relation', {
            type: relationTypeLabel(t, label.relation.type),
            from: props.nodeTitle(label.relation.from),
            to: props.nodeTitle(label.relation.to),
          }),
          title: label.relation.claim || relationTypeLabel(t, label.relation.type),
        },
        h('span', { className: 'la-relchip__type' }, relationTypeLabel(t, label.relation.type)),
        h('span', { className: 'la-relchip__arrow', 'aria-hidden': 'true' }, arrow),
      )
    }),
    !neighbors.length
      ? h(
          'div',
          { className: 'la-canvas__empty' },
          h('p', { className: 'la-empty__title' }, t('loop.subject.neighborsEmpty')),
        )
      : null,
  )
}

function relationshipsBadge(h, count) {
  if (!count) return null
  return h('span', { className: 'la-gnode__count', 'aria-hidden': 'true' }, String(count))
}
  return { GraphCanvas }
})
__def("views/SubjectList.js", function (__req) {
/**
 * 列表替代视图：图谱的无障碍替代（可搜索、键盘可选节点/关系）。
 */

const { useMemo, useState } = React

const { Tag } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { nodeEraLabel, nodeKindLabel, relationTypeLabel, relationsForNode, searchContent } = __req("model.js")
const { classNames, truncate } = __req("util.js")

function SubjectList(props) {
  const t = props.t
  const ci = props.ci
  const center = props.center
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const nodeEntries = useMemo(() => {
    if (trimmed) return searchContent(ci, trimmed, 30).nodes.map((node) => ({ node, source: 'search' }))
    const seen = new Set()
    const out = []
    const push = (node, source) => {
      if (!node || seen.has(node.id)) return
      seen.add(node.id)
      out.push({ node, source })
    }
    push(center, 'center')
    for (const neighbor of props.neighbors || []) push(neighbor.node, 'neighbor')
    for (const node of (center && center.groupId && ci.nodesByGroup.get(center.groupId)) || []) push(node, 'group')
    for (const node of ci.nodes) push(node, 'all')
    return out
  }, [ci, center, props.neighbors, trimmed])

  const relationEntries = useMemo(() => {
    if (trimmed) {
      return searchContent(ci, trimmed, 30).relations.map((entry) => ({ relation: entry.relation, from: entry.from, to: entry.to }))
    }
    if (!center) return []
    const visible = new Set([center.id])
    for (const neighbor of props.neighbors || []) visible.add(neighbor.node.id)
    const seen = new Set()
    const out = []
    for (const relation of relationsForNode(ci, center.id)) {
      if (seen.has(relation.id)) continue
      seen.add(relation.id)
      out.push({ relation, from: ci.nodesById.get(relation.from), to: ci.nodesById.get(relation.to) })
    }
    for (const relation of ci.relations) {
      if (seen.has(relation.id)) continue
      if (visible.has(relation.from) && visible.has(relation.to)) {
        seen.add(relation.id)
        out.push({ relation, from: ci.nodesById.get(relation.from), to: ci.nodesById.get(relation.to) })
      }
    }
    return out
  }, [ci, center, props.neighbors, trimmed])

  return h(
    'div',
    { className: 'la-listview', 'aria-label': t('loop.a11y.list') },
    h(
      'div',
      { className: 'la-listview__filter' },
      h(Icon, { name: 'search', size: 16 }),
      h('input', {
        className: 'la-input',
        type: 'search',
        value: query,
        placeholder: t('loop.list.filter'),
        'aria-label': t('loop.list.filter'),
        onChange: (event) => setQuery(event.target.value),
      }),
    ),
    h(
      'div',
      { className: 'la-listview__columns' },
      h(
        'section',
        { className: 'la-listview__column', 'aria-label': t('loop.list.nodes') },
        h('h3', { className: 'la-listview__title' }, `${t('loop.list.nodes')} · ${nodeEntries.length}`),
        h(
          'ul',
          { className: 'la-listview__list' },
          nodeEntries.map(({ node, source }) => {
            const era = nodeEraLabel(node)
            return h(
              'li',
              { key: node.id },
              h(
                'button',
                {
                  type: 'button',
                  className: classNames(
                    'la-listrow',
                    props.selectedNodeId === node.id && center && node.id === center.id && 'is-current',
                  ),
                  onClick: () => props.onSelectNode(node.id),
                  'aria-current': center && node.id === center.id ? 'true' : undefined,
                },
                h(
                  'span',
                  { className: 'la-listrow__main' },
                  h('span', { className: 'la-listrow__title' }, node.title),
                  h('span', { className: 'la-listrow__sub' }, truncate(node.def || node.mech || '', 70)),
                ),
                h(
                  'span',
                  { className: 'la-listrow__side' },
                  source === 'neighbor' ? h(Tag, { tone: 'accent' }, t('loop.list.relations')) : null,
                  h('span', { className: 'la-listrow__kind' }, nodeKindLabel(t, node.kind)),
                  era.text ? h('span', { className: 'la-listrow__era' }, era.uncertain ? t('loop.subject.eraUnknown') : era.text) : null,
                ),
              ),
            )
          }),
        ),
      ),
      h(
        'section',
        { className: 'la-listview__column', 'aria-label': t('loop.list.relations') },
        h('h3', { className: 'la-listview__title' }, `${t('loop.list.relations')} · ${relationEntries.length}`),
        h(
          'ul',
          { className: 'la-listview__list' },
          relationEntries.map(({ relation, from, to }) =>
            h(
              'li',
              { key: relation.id },
              h(
                'button',
                {
                  type: 'button',
                  className: classNames('la-listrow', props.selectedRelationId === relation.id && 'is-selected'),
                  onClick: () => props.onSelectRelation(relation.id),
                  'aria-pressed': props.selectedRelationId === relation.id,
                },
                h(
                  'span',
                  { className: 'la-listrow__main' },
                  h(
                    'span',
                    { className: 'la-listrow__title' },
                    `${from ? from.title : relation.from} → ${to ? to.title : relation.to}`,
                  ),
                  h('span', { className: 'la-listrow__sub' }, truncate(relation.claim || relation.condition || '', 80)),
                ),
                h(
                  'span',
                  { className: 'la-listrow__side' },
                  h(Tag, { tone: 'neutral' }, relationTypeLabel(t, relation.type)),
                ),
              ),
            ),
          ),
          !relationEntries.length ? h('li', { className: 'la-muted' }, t('loop.list.empty')) : null,
        ),
      ),
    ),
    !nodeEntries.length ? h('p', { className: 'la-muted' }, t('loop.list.empty')) : null,
  )
}
  return { SubjectList }
})
__def("views/shared.js", function (__req) {
/**
 * 视图共享件：复制回执、可折叠区块、来源/主张列表、备注元信息。
 */

const { useState, useCallback } = React

const { copyText, formatTime } = __req("util.js")

/** 复制文本并写真实回执（成功/失败都来自 clipboard 的真实结果）。 */
function useCopyText(t, addReceipt) {
  return useCallback(
    async (text) => {
      const result = await copyText(text)
      if (addReceipt) {
        addReceipt({
          kind: result.ok ? 'info' : 'error',
          text: result.ok ? t('loop.common.copied') : `${t('loop.common.copyFailed')}：${result.reason}`,
        })
      }
      return result
    },
    [addReceipt, t],
  )
}

/** 可折叠区块（按钮 + aria-expanded；不是 <details>，样式可控）。 */
function Collapsible(props) {
  const [open, setOpen] = useState(!!props.defaultOpen)
  const controlled = props.open !== undefined
  const isOpen = controlled ? !!props.open : open
  const toggle = () => {
    if (controlled) {
      if (props.onToggle) props.onToggle(!isOpen)
      return
    }
    setOpen((value) => !value)
  }
  return h(
    'div',
    { className: `la-collapsible ${props.className || ''}`.trim() },
    h(
      'button',
      {
        type: 'button',
        className: 'la-collapsible__head',
        onClick: toggle,
        'aria-expanded': isOpen,
      },
      h('span', { className: 'la-collapsible__chevron', 'aria-hidden': 'true' }, isOpen ? '▾' : '▸'),
      h('span', { className: 'la-collapsible__title' }, props.title),
      props.meta ? h('span', { className: 'la-collapsible__meta' }, props.meta) : null,
    ),
    isOpen ? h('div', { className: 'la-collapsible__body' }, props.children) : null,
  )
}

function MetaLine(props) {
  const items = (props.items || []).filter((item) => item !== null && item !== undefined && String(item).length > 0)
  return h(
    'span',
    { className: `la-metaline ${props.className || ''}`.trim() },
    items.map((item, index) =>
      h('span', { key: index, className: 'la-metaline__item' }, index > 0 ? ' · ' : '', item),
    ),
  )
}

function ModelBadge(props) {
  const model = props.model || {}
  if (!model.model && !model.provider) {
    return h('span', { className: 'la-modelbadge' }, props.t('loop.chat.noModel'))
  }
  return h(
    'span',
    { className: 'la-modelbadge', title: `${model.provider || '?'} / ${model.model || '?'}` },
    `${model.provider || '?'} / ${model.model || '?'}`,
  )
}

function TimeLabel(props) {
  if (!props.at) return null
  return h('time', { className: props.className || 'la-time', dateTime: props.at }, formatTime(props.at))
}

function sourceVerifiedTone(verified) {
  if (verified === 'verified') return 'ok'
  if (verified === 'secondary') return 'warn'
  return 'danger'
}

function Paragraphs(props) {
  const text = String(props.text || '')
  if (!text) return null
  return h(
    'div',
    { className: `la-prose ${props.className || ''}`.trim() },
    text.split(/\n{2,}/).map((paragraph, index) => h('p', { key: index }, paragraph)),
  )
}

/** 在文本中渲染“缺口 + 检索路径”的诚实提示。 */
function GapList(props) {
  const gaps = props.gaps || []
  if (!gaps.length) return null
  return h(
    'ul',
    { className: 'la-gaplist' },
    gaps.map((gap, index) =>
      h(
        'li',
        { key: index },
        h('span', { className: 'la-gaplist__item' }, props.t('loop.history.gap', { item: gap.item || gap.why || '' })),
        gap.searchPath
          ? h('span', { className: 'la-gaplist__path' }, props.t('loop.history.searchPath', { path: gap.searchPath }))
          : null,
      ),
    ),
  )
}
  return { useCopyText, Collapsible, MetaLine, ModelBadge, TimeLabel, sourceVerifiedTone, Paragraphs, GapList }
})
__def("views/HistoryView.js", function (__req) {
/**
 * 历史视角：按 eraStart/eraEnd 排列；时间不确定单列一条带；没有资料就显示缺口与检索路径。
 * 不编年表：只展示内容包里有 era 依据的节点与带年份的来源。
 */

const { Tag } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { EmptyState } = __req("components/primitives.js")
const { nodeEraLabel, nodeKindLabel, historyForSubject } = __req("model.js")
const { GapList } = __req("views/shared.js")
const { truncate } = __req("util.js")

function yearText(entry) {
  const { node } = entry
  const era = nodeEraLabel(node)
  return era.text || ''
}

function HistoryView(props) {
  const t = props.t
  const ci = props.ci
  const subject = props.subject
  const data = historyForSubject(ci, subject, 16)
  const hasAny = data.known.length || data.unknown.length || data.sources.length
  return h(
    'section',
    { className: 'la-projection la-projection--history', 'aria-label': t('loop.projection.history') },
    h(
      'div',
      { className: 'la-projection__head' },
      h('h2', { className: 'la-projection__title' }, t('loop.history.title')),
      h('p', { className: 'la-projection__hint' }, t('loop.history.unknownHint')),
    ),
    !hasAny
      ? h(EmptyState, { icon: 'clock', title: t('loop.history.empty') })
      : h(
          'div',
          { className: 'la-timeline' },
          data.known.length
            ? h(
                'ol',
                { className: 'la-timeline__list' },
                data.known.map((entry) => {
                  const era = nodeEraLabel(entry.node)
                  return h(
                    'li',
                    { key: entry.node.id, className: 'la-timeline__item' },
                    h('span', { className: 'la-timeline__year' }, yearText(entry)),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'la-timeline__node',
                        onClick: () => props.onSelectNode(entry.node.id),
                        'aria-label': `${entry.node.title} · ${era.text}`,
                      },
                      h('span', { className: 'la-timeline__nodetitle' }, entry.node.title),
                      h(
                        'span',
                        { className: 'la-timeline__nodemeta' },
                        nodeKindLabel(t, entry.node.kind),
                        ' · ',
                        truncate(entry.node.def || entry.node.hist || '', 80),
                      ),
                    ),
                  )
                }),
              )
            : null,
          data.sources.length
            ? h(
                'div',
                { className: 'la-works' },
                h('h3', { className: 'la-works__title' }, t('loop.history.work')),
                h(
                  'ul',
                  { className: 'la-works__list' },
                  data.sources.map((entry) =>
                    h(
                      'li',
                      { key: entry.source.id },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'la-works__item',
                          onClick: () => props.onOpenSource(entry.source),
                          title: entry.source.title,
                        },
                        h('span', { className: 'la-works__year' }, entry.source.year || t('loop.history.yearUnknown')),
                        h('span', { className: 'la-works__main' }, entry.source.title),
                        h('span', { className: 'la-works__node' }, entry.node ? entry.node.title : ''),
                      ),
                    ),
                  ),
                ),
              )
            : null,
          data.unknown.length
            ? h(
                'div',
                { className: 'la-unknownband' },
                h(
                  'div',
                  { className: 'la-unknownband__head' },
                  h(Tag, { tone: 'warn' }, t('loop.history.unknown')),
                  h('span', { className: 'la-muted' }, t('loop.history.unknownHint')),
                ),
                h(
                  'ul',
                  { className: 'la-unknownband__list' },
                  data.unknown.map((entry) =>
                    h(
                      'li',
                      { key: entry.node.id },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'la-unknownband__node',
                          onClick: () => props.onSelectNode(entry.node.id),
                        },
                        h(Icon, { name: 'clock', size: 14 }),
                        h('span', null, entry.node.title),
                        h('span', { className: 'la-muted' }, entry.node.era || t('loop.subject.eraUnknown')),
                      ),
                    ),
                  ),
                ),
              )
            : null,
          h(GapList, { t, gaps: data.gaps }),
        ),
  )
}
  return { HistoryView }
})
__def("views/PracticeView.js", function (__req) {
/**
 * 实践视角：目标→上下文→行动→观测→验收→修订 的工作回路布局（按 practiceStages）。
 * 只放工程机制；历史类比明确标注不是同一机制。
 */

const { Tag } = __req("components/primitives.js")
const { EmptyState } = __req("components/primitives.js")
const { nodeKindLabel, practiceForSubject } = __req("model.js")
const { classNames } = __req("util.js")

function PracticeView(props) {
  const t = props.t
  const ci = props.ci
  const subject = props.subject
  const data = practiceForSubject(ci, subject)
  const hasNodes = data.stages.some((stage) => stage.nodes.length)
  return h(
    'section',
    { className: 'la-projection la-projection--practice', 'aria-label': t('loop.projection.practice') },
    h(
      'div',
      { className: 'la-projection__head' },
      h('h2', { className: 'la-projection__title' }, t('loop.practice.title')),
      h('p', { className: 'la-projection__hint' }, t('loop.practice.stageHint')),
    ),
    !hasNodes
      ? h(EmptyState, { icon: 'target', title: t('loop.practice.empty') })
      : h(
          'div',
          { className: 'la-practice' },
          data.stages.map((stage, index) =>
            h(
              'section',
              { key: stage.stage, className: 'la-practice__stage', 'aria-label': t(`loop.practice.${stage.stage}`) },
              h(
                'h3',
                { className: 'la-practice__stagetitle' },
                h('span', { className: 'la-practice__stageindex', 'aria-hidden': 'true' }, String(index + 1)),
                t(`loop.practice.${stage.stage}`),
              ),
              stage.nodes.length
                ? h(
                    'ul',
                    { className: 'la-practice__nodes' },
                    stage.nodes.slice(0, 4).map((node) =>
                      h(
                        'li',
                        { key: node.id },
                        h(
                          'button',
                          {
                            type: 'button',
                            className: classNames('la-practice__node', data.centerId === node.id && 'is-current'),
                            onClick: () => props.onSelectNode(node.id),
                            'aria-current': data.centerId === node.id ? 'true' : undefined,
                          },
                          h('span', { className: 'la-practice__nodetitle' }, node.title),
                          h('span', { className: 'la-practice__nodemeta' }, nodeKindLabel(t, node.kind)),
                        ),
                      ),
                    ),
                    stage.nodes.length > 4
                      ? h('li', { className: 'la-practice__more la-muted' }, `+${stage.nodes.length - 4}`)
                      : null,
                  )
                : h('p', { className: 'la-practice__empty' }, '—'),
            ),
          ),
        ),
    data.unmapped.length
      ? h(
          'div',
          { className: 'la-practice__unmapped' },
          h(Tag, { tone: 'neutral' }, t('loop.practice.other')),
          data.unmapped.map((node) =>
            h(
              'button',
              { key: node.id, type: 'button', className: 'la-chip', onClick: () => props.onSelectNode(node.id) },
              node.title,
            ),
          ),
        )
      : null,
    h('p', { className: 'la-projection__foot' }, t('loop.practice.caveat')),
  )
}
  return { PracticeView }
})
__def("views/Claims.js", function (__req) {
/**
 * 主张与来源的只读列表：所有来源都可点开（弹层展示核验程度、URL/DOI、检索路径）。
 */

const { useState } = React

const { Tag } = __req("components/primitives.js")
const { claimKindLabel, verifiedLabel } = __req("model.js")
const { sourceVerifiedTone, MetaLine } = __req("views/shared.js")

function SourceRow(props) {
  const source = props.source
  if (!source) return null
  return h(
    'li',
    { className: 'la-sourcelist__item' },
    h(
      'button',
      {
        type: 'button',
        className: 'la-sourcerow',
        onClick: () => props.onOpenSource && props.onOpenSource(source),
        title: source.title,
      },
      h(
        'span',
        { className: 'la-sourcerow__main' },
        h('span', { className: 'la-sourcerow__title' }, source.title),
        h(MetaLine, {
          className: 'la-sourcerow__meta',
          items: [source.author, source.year, source.ref || source.kind],
        }),
      ),
      h(Tag, { tone: sourceVerifiedTone(source.verified) }, verifiedLabel(props.t, source.verified)),
    ),
  )
}

function SourceList(props) {
  const sources = props.sources || []
  if (!sources.length) {
    return props.emptyText ? h('p', { className: 'la-muted' }, props.emptyText) : null
  }
  return h(
    'ul',
    { className: `la-sourcelist ${props.className || ''}`.trim() },
    sources.map((source) => h(SourceRow, { key: source.id, source, t: props.t, onOpenSource: props.onOpenSource })),
  )
}

function ClaimList(props) {
  const claims = props.claims || []
  const ci = props.ci
  if (!claims.length) {
    return h('p', { className: 'la-muted' }, props.emptyText || props.t('loop.relation.noClaims'))
  }
  return h(
    'div',
    { className: `la-claims ${props.className || ''}`.trim() },
    claims.map((claim) => {
      const sources = (claim.sourceIds || [])
        .map((id) => (ci && ci.sourcesById ? ci.sourcesById.get(id) : null))
        .filter(Boolean)
      return h(
        'div',
        { key: claim.id, className: 'la-claim' },
        h(
          'div',
          { className: 'la-claim__head' },
          h(Tag, { tone: 'neutral' }, claimKindLabel(props.t, claim.kind)),
          h(Tag, { tone: sourceVerifiedTone(claim.verified) }, verifiedLabel(props.t, claim.verified)),
        ),
        h('p', { className: 'la-claim__text' }, claim.text),
        h(SourceList, { t: props.t, sources, onOpenSource: props.onOpenSource }),
      )
    }),
  )
}
  return { SourceRow, SourceList, ClaimList }
})
__def("views/NodeDossier.js", function (__req) {
/**
 * 当前节点档案（阅读面）：定义/机制/边界/反例/检验/历史/迁移/主张来源/关系列表。
 * 正文阅读宽度由 CSS 控制在约 34—42 个汉字。
 */

const { useMemo } = React

const { Button, Tag, EmptyState } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { Collapsible } = __req("views/shared.js")
const { ClaimList, SourceList } = __req("views/Claims.js")
const { claimsForIds, migrateTypeLabel, nodeEraLabel, nodeKindLabel, relationsForNode, relationTypeLabel, sourcesForNode, sourcesForClaims } = __req("model.js")

const TEXT_FIELDS = ['can', 'mech', 'limits', 'counter', 'check', 'hist']

function NodeDossier(props) {
  const t = props.t
  const ci = props.ci
  const node = props.node
  const noteCount = (props.notes || []).length
  const claims = useMemo(() => claimsForIds(ci, node ? node.claimIds : []), [ci, node])
  const claimSources = useMemo(() => sourcesForClaims(ci, claims), [ci, claims])
  const directSources = useMemo(() => (node ? sourcesForNode(ci, node) : []), [ci, node])
  const relations = useMemo(() => (node ? relationsForNode(ci, node.id) : []), [ci, node])
  const era = nodeEraLabel(node)
  const group = node && node.groupId ? ci.groupsById.get(node.groupId) : null
  if (!node) return h(EmptyState, { icon: 'graph', title: t('loop.subject.current') })

  return h(
    'section',
    { className: 'la-dossier', 'aria-label': t('loop.subject.current') },
    h(
      'div',
      { className: 'la-dossier__head' },
      h(
        'div',
        { className: 'la-dossier__kicker' },
        h(Tag, { tone: 'neutral' }, nodeKindLabel(t, node.kind)),
        node.era || era.text
          ? h('span', { className: 'la-dossier__era' }, era.uncertain ? t('loop.subject.eraUnknown') : era.text)
          : null,
        group ? h('span', { className: 'la-dossier__group' }, group.title) : null,
      ),
      h('h2', { className: 'la-dossier__title' }, node.title),
      node.def ? h('p', { className: 'la-dossier__lead' }, node.def) : null,
    ),
    h(
      'div',
      { className: 'la-dossier__actions' },
      h(Button, { variant: 'primary', icon: 'flask', onClick: () => props.onViewEvidence() }, t('loop.subject.viewEvidence')),
      h(Button, { variant: 'ghost', icon: 'notes', onClick: () => props.onOpenNotes() }, t('loop.subject.notesCount', { count: noteCount })),
      h(Button, { variant: 'ghost', icon: 'chat', onClick: () => props.onAsk() }, t('loop.relation.ask')),
    ),
    h(
      'div',
      { className: 'la-dossier__fields' },
      TEXT_FIELDS.filter((field) => node[field]).map((field) =>
        h(
          'div',
          { key: field, className: 'la-dossier__field' },
          h('h3', { className: 'la-dossier__label' }, t(`loop.subject.${field}`)),
          h('p', { className: 'la-dossier__text' }, node[field]),
        ),
      ),
      node.migrate
        ? h(
            'div',
            { className: 'la-dossier__field' },
            h('h3', { className: 'la-dossier__label' }, t('loop.subject.migrate')),
            h('p', { className: 'la-dossier__text' }, node.migrate),
            h(
              'p',
              { className: 'la-dossier__note' },
              h(Tag, { tone: 'warn' }, migrateTypeLabel(t, node.migrateType)),
              t('loop.practice.caveat'),
            ),
          )
        : null,
    ),
    claims.length
      ? h(
          'div',
          { className: 'la-dossier__claims' },
          h('h3', { className: 'la-dossier__label' }, t('loop.subject.claims')),
          h(ClaimList, { t, claims, ci, onOpenSource: props.onOpenSource }),
        )
      : directSources.length
        ? h(
            'div',
            { className: 'la-dossier__claims' },
            h('h3', { className: 'la-dossier__label' }, t('loop.subject.sources')),
            h(SourceList, { t, sources: directSources, onOpenSource: props.onOpenSource }),
          )
        : h(
            'div',
            { className: 'la-dossier__claims' },
            h('h3', { className: 'la-dossier__label' }, t('loop.subject.sources')),
            h('p', { className: 'la-muted' }, t('loop.relation.noClaims')),
          ),
    relations.length
      ? h(Collapsible, { title: `${t('loop.subject.relationsCount', { count: relations.length })}`, defaultOpen: true },
          h(
            'ul',
            { className: 'la-relationlist' },
            relations.map((relation) => {
              const from = ci.nodesById.get(relation.from)
              const to = ci.nodesById.get(relation.to)
              return h(
                'li',
                { key: relation.id },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'la-relationlist__item',
                    onClick: () => props.onSelectRelation(relation.id),
                  },
                  h(Tag, { tone: 'neutral' }, relationTypeLabel(t, relation.type)),
                  h('span', { className: 'la-relationlist__route' }, `${from ? from.title : relation.from} → ${to ? to.title : relation.to}`),
                  h('span', { className: 'la-relationlist__claim' }, relation.claim || relation.condition || ''),
                  h(Icon, { name: 'arrowRight', size: 14 }),
                ),
              )
            }),
          ),
        )
      : null,
  )
}
  return { NodeDossier }
})
__def("views/SubjectScale.js", function (__req) {
/**
 * 问题尺度（默认工作视图）：当前节点 + 3—7 个相关邻居。
 * 宽屏：上方图谱/投影，下方节点档案；窄屏：图/阅读 分段切换。
 */

const { useState } = React

const { Button, Tag, Segmented, EmptyState } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { GraphCanvas } = __req("views/GraphCanvas.js")
const { SubjectList } = __req("views/SubjectList.js")
const { HistoryView } = __req("views/HistoryView.js")
const { PracticeView } = __req("views/PracticeView.js")
const { NodeDossier } = __req("views/NodeDossier.js")
const { useElementSize } = __req("state/hooks.js")
const { classNames } = __req("util.js")

function SubjectScale(props) {
  const t = props.t
  const ci = props.ci
  const view = props.view
  const center = props.center
  const neighbors = props.neighbors
  const totalNeighbors = props.totalNeighbors
  const selectedRelation = props.selectedRelation
  const [listMode, setListMode] = useState(false)
  const [canvasRef, canvasSize] = useElementSize({ width: 0, height: 0 })
  const narrow = props.narrow
  const stage = props.stage

  if (!center) {
    return h(
      'section',
      { className: 'la-scale la-scale--subject' },
      h(EmptyState, {
        icon: 'graph',
        title: t('loop.subject.empty'),
        hint: t('loop.subject.neighborsEmpty'),
      }),
    )
  }

  const showGraph = listMode || !narrow || stage === 'graph'
  const showDossier = !listMode && (!narrow || stage === 'read')
  const group = center.groupId ? ci.groupsById.get(center.groupId) : null

  return h(
    'section',
    { className: classNames('la-scale', 'la-scale--subject', `is-projection-${view.projection}`), 'aria-label': t('loop.scale.subject') },
    h(
      'div',
      { className: 'la-subjecthead' },
      h(
        'div',
        { className: 'la-subjecthead__title' },
        group ? h('span', { className: 'la-subjecthead__group' }, group.title) : null,
        h('h2', { className: 'la-subjecthead__name' }, center.title),
        selectedRelation
          ? h(
              'span',
              { className: 'la-subjecthead__relation' },
              h(Tag, { tone: 'accent' }, t(`loop.relation.type.${selectedRelation.type}`)),
              h(
                'button',
                { type: 'button', className: 'la-linkbtn', onClick: props.onClearRelation },
                t('loop.subject.clearRelation'),
              ),
            )
          : null,
      ),
      h(
        'div',
        { className: 'la-subjecthead__tools' },
        h(
          'span',
          { className: 'la-subjecthead__neighbors' },
          t('loop.subject.neighbors', { count: neighbors.length }),
          totalNeighbors > neighbors.length
            ? ` · ${t('loop.subject.moreNeighbors', { count: totalNeighbors - neighbors.length })}`
            : '',
        ),
        h(Segmented, {
          label: t('loop.list.title'),
          value: listMode ? 'list' : 'graph',
          options: [
            { id: 'graph', label: t('loop.subject.graph') },
            { id: 'list', label: t('loop.subject.list') },
          ],
          onChange: (value) => {
            if (props.onRequestGraph) props.onRequestGraph()
            setListMode(value === 'list')
          },
        }),
      ),
    ),
    showGraph
      ? h(
          'div',
          { className: classNames('la-subjectmain', listMode && 'is-list', narrow && 'is-narrow') },
          listMode
            ? h(SubjectList, {
                t,
                ci,
                center,
                neighbors,
                selectedNodeId: center.id,
                selectedRelationId: view.selectedRelationId,
                onSelectNode: props.onSelectNode,
                onSelectRelation: props.onSelectRelation,
              })
            : view.projection === 'theory'
              ? h(
                  'div',
                  { className: 'la-canvaswrap', ref: canvasRef },
                  h(GraphCanvas, {
                    t,
                    center,
                    neighbors,
                    width: canvasSize.width || 860,
                    height: canvasSize.height || 520,
                    selectedNodeId: center.id,
                    selectedRelationId: view.selectedRelationId,
                    onSelectNode: props.onSelectNode,
                    onSelectRelation: props.onSelectRelation,
                    nodeTitle: (id) => {
                      const node = ci.nodesById.get(id)
                      return node ? node.title : id
                    },
                    relationCountFor: (id) => (ci.relationsByNode.get(id) || []).length,
                  }),
                  neighbors.length
                    ? h('p', { className: 'la-canvas__hint la-muted' }, t('loop.subject.graphHint'))
                    : null,
                )
              : view.projection === 'history'
                ? h(HistoryView, {
                    t,
                    ci,
                    subject: { kind: 'node', id: center.id },
                    onSelectNode: props.onSelectNode,
                    onOpenSource: props.onOpenSource,
                  })
                : h(PracticeView, {
                    t,
                    ci,
                    subject: { kind: 'node', id: center.id },
                    onSelectNode: props.onSelectNode,
                  }),
          showDossier && !narrow ? null : null,
        )
      : null,
    showDossier
      ? h(
          'div',
          { className: classNames('la-readpane', narrow && 'is-narrow') },
          narrow && props.relationInspector
            ? h('div', { className: 'la-readpane__inspector' }, props.relationInspector)
            : null,
          h(NodeDossier, {
            t,
            ci,
            node: center,
            notes: props.notes,
            onOpenSource: props.onOpenSource,
            onViewEvidence: props.onViewEvidence,
            onOpenNotes: props.onOpenNotes,
            onAsk: props.onAsk,
            onSelectRelation: props.onSelectRelation,
          }),
        )
      : null,
  )
}
  return { SubjectScale }
})
__def("views/Experiments.js", function (__req) {
/**
 * 证据尺度内联实验面板：延迟回路 / 代理指标 / 全绿却错。
 * 结果、判定、判据、模型版本全部来自 Host 的 experiment.run 回执（前端不复算公式）。
 */

const { useState, useMemo } = React

const { Button, Tag, FieldLabel } = __req("components/primitives.js")
const { Collapsible } = __req("views/shared.js")
const { experimentKind } = __req("model.js")
const { formatTime } = __req("util.js")

const VERDICTS = [
  'converged',
  'overshoot-settled',
  'oscillating',
  'oscillating-below',
  'drift',
  'diverging',
]

function ExperimentCard(props) {
  const t = props.t
  const experiment = props.experiment
  const kind = experimentKind(experiment)
  const [open, setOpen] = useState(!!props.defaultOpen)
  const runs = props.runs || []
  return h(
    'article',
    { className: `la-expcard ${open ? 'is-open' : ''}`.trim() },
    h(
      'button',
      {
        type: 'button',
        className: 'la-expcard__head',
        onClick: () => setOpen((value) => !value),
        'aria-expanded': open,
      },
      h('span', { className: 'la-expcard__chevron', 'aria-hidden': 'true' }, open ? '▾' : '▸'),
      h(
        'span',
        { className: 'la-expcard__titles' },
        h('span', { className: 'la-expcard__title' }, experiment.title),
        experiment.subtitle ? h('span', { className: 'la-expcard__subtitle' }, experiment.subtitle) : null,
      ),
      h(Tag, { tone: 'neutral' }, experiment.modelId || t('loop.exp.teaching')),
      runs.length ? h(Tag, { tone: 'accent' }, `${runs.length}`) : null,
    ),
    open
      ? h(
          'div',
          { className: 'la-expcard__body' },
          experiment.question ? h('p', { className: 'la-expcard__question' }, experiment.question) : null,
          kind === 'delay'
            ? h(DelayExperiment, { t, experiment, onRun: props.onRun, runs, onPrefillObservation: props.onPrefillObservation })
            : kind === 'proxy'
              ? h(ProxyExperiment, { t, experiment, onRun: props.onRun, runs })
              : h(GreenExperiment, { t, experiment, onRun: props.onRun, runs }),
          experiment.note ? h('p', { className: 'la-expcard__note la-muted' }, experiment.note) : null,
        )
      : null,
  )
}

function useRunState(onRun) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [run, setRun] = useState(null)
  return { busy, setBusy, error, setError, result, setResult, run, setRun, onRun }
}

async function executeRun(options, params, prediction) {
  const { setBusy, setError, setResult, setRun, onRun } = options
  setBusy(true)
  setError('')
  try {
    const response = await onRun({ params, prediction })
    setRun(response.run || null)
    setResult(response.result || null)
    return response
  } catch (rawError) {
    setError(String((rawError && rawError.message) || rawError))
    return null
  } finally {
    setBusy(false)
  }
}

/* ───────────────────────── 延迟回路 ───────────────────────── */

function DelayExperiment(props) {
  const t = props.t
  const experiment = props.experiment
  const [K, setK] = useState(1.2)
  const [D, setD] = useState(0.6)
  const [prediction, setPrediction] = useState('')
  const state = useRunState(props.onRun)
  const { busy, error, result, run } = state

  const runNow = () =>
    executeRun(state, { K: Number(K.toFixed(2)), D: Number(D.toFixed(2)) }, prediction ? t(`loop.exp.verdict.${prediction}`) : '')

  const verdict = result && result.verdict
  const verdictLabel = result && (result.verdictLabel || t(`loop.exp.verdict.${result.verdict}`))
  const matches = prediction && verdict ? prediction === verdict : null

  return h(
    'div',
    { className: 'la-exp' },
    h(
      'div',
      { className: 'la-exp__control' },
      h(
        'label',
        { className: 'la-slider' },
        h('span', { className: 'la-slider__label' }, `${t('loop.exp.delay.K')} = ${Number(K).toFixed(2)}`),
        h('input', {
          type: 'range',
          min: 0,
          max: 5,
          step: 0.05,
          value: K,
          onChange: (event) => {
            setK(Number(event.target.value))
            state.setResult(null)
          },
        }),
      ),
      h(
        'label',
        { className: 'la-slider' },
        h('span', { className: 'la-slider__label' }, `${t('loop.exp.delay.D')} = ${Number(D).toFixed(2)} s`),
        h('input', {
          type: 'range',
          min: 0,
          max: 2,
          step: 0.05,
          value: D,
          onChange: (event) => {
            setD(Number(event.target.value))
            state.setResult(null)
          },
        }),
      ),
      h('p', { className: 'la-exp__formula la-muted' }, t('loop.exp.delay.formula')),
    ),
    h(
      'div',
      { className: 'la-prediction' },
      h(FieldLabel, null, t('loop.exp.predict')),
      h(
        'div',
        { className: 'la-chips' },
        VERDICTS.map((id) =>
          h(
            'button',
            {
              key: id,
              type: 'button',
              className: `la-chip ${prediction === id ? 'is-on' : ''}`.trim(),
              onClick: () => setPrediction((value) => (value === id ? '' : id)),
              'aria-pressed': prediction === id,
            },
            t(`loop.exp.verdict.${id}`),
          ),
        ),
      ),
    ),
    h(
      'div',
      { className: 'la-exp__actions' },
      h(Button, { variant: 'primary', icon: 'flask', loading: busy, onClick: runNow }, busy ? t('loop.exp.running') : t('loop.exp.run')),
      h('span', { className: 'la-muted' }, t('loop.exp.reproducible')),
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, t('loop.exp.failed', { message: error })) : null,
    ),
    result
      ? h(
          'div',
          { className: 'la-expresult' },
          h(
            'div',
            { className: 'la-expresult__verdict' },
            h(FieldLabel, null, t('loop.exp.verdict')),
            h('p', { className: `la-expresult__label verdict-${result.verdict}` }, verdictLabel),
            matches === true
              ? h('p', { className: 'la-expresult__match is-match' }, t('loop.exp.match'))
              : matches === false
                ? h('p', { className: 'la-expresult__match is-miss' }, t('loop.exp.mismatch'))
                : null,
          ),
          result.trace && result.trace.length
            ? h(TraceChart, { t, trace: result.trace, target: result.target })
            : null,
          h(
            'dl',
            { className: 'la-metrics' },
            metric(t, 'final', result.metrics && result.metrics.final),
            metric(t, 'peak', result.metrics && result.metrics.peak),
            metric(t, 'overshoot', result.metrics && result.metrics.overshoot),
            metric(t, 'lastAmplitude', result.metrics && result.metrics.lastAmplitude),
            metric(t, 'drift', result.metrics && result.metrics.drift),
            metric(t, 'crossings', result.metrics && result.metrics.crossings),
          ),
          h(
            'p',
            { className: 'la-expresult__criterion' },
            h('strong', null, `${t('loop.exp.criterion')}：`),
            result.criterion || '—',
          ),
          h(
            'div',
            { className: 'la-expresult__meta' },
            h(
              'span',
              null,
              `${t('loop.exp.model')}：${result.modelId || experiment.modelId} v${result.modelVersion || '—'}`,
            ),
            h('span', null, `${t('loop.exp.params')}：K=${Number(result.params && result.params.K).toFixed(2)} · D=${Number(result.params && result.params.D).toFixed(2)} s`),
            run && run.at ? h('span', null, `${t('loop.exp.recordedAt')}：${formatTime(run.at)}`) : null,
            h('span', null, t('loop.exp.runSaved')),
          ),
          verdict
            ? h(
                'div',
                { className: 'la-expresult__actions' },
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'secondary',
                    icon: 'notes',
                    onClick: () =>
                      props.onPrefillObservation &&
                      props.onPrefillObservation(
                        `观察：K=${Number(result.params && result.params.K).toFixed(2)}，D=${Number(result.params && result.params.D).toFixed(
                          2,
                        )} s 时，判定为「${verdictLabel}」。判据：${result.criterion || '—'}。模型 ${result.modelId} v${result.modelVersion}。`,
                      ),
                  },
                  t('loop.exp.saveObs'),
                ),
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'ghost',
                    onClick: () => {
                      state.setResult(null)
                      setPrediction('')
                    },
                  },
                  t('loop.exp.rerun'),
                ),
              )
            : null,
        )
      : null,
    h(RunHistory, { t, runs: props.runs, experimentId: experiment.id }),
  )
}

function metric(t, key, value) {
  if (value === undefined || value === null) return null
  const labelText = {
    final: '终值',
    peak: '峰值',
    overshoot: '过冲',
    lastAmplitude: '末段振幅',
    drift: '漂移',
    crossings: '穿越目标次数',
  }[key]
  const display = typeof value === 'number' ? (Math.abs(value) < 10 ? value.toFixed(3) : value.toFixed(1)) : String(value)
  return h('div', { className: 'la-metrics__item' }, h('dt', null, labelText), h('dd', null, display))
}

function TraceChart(props) {
  const trace = props.trace || []
  const target = Number.isFinite(props.target) ? props.target : 1
  const width = 620
  const height = 180
  const pad = { left: 36, right: 12, top: 12, bottom: 22 }
  const ys = trace.map((point) => Number(point.y))
  const minY = Math.min(0, target, ...ys)
  const maxY = Math.max(target, ...ys, 0.1)
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const x = (index) => pad.left + (innerW * index) / Math.max(1, trace.length - 1)
  const y = (value) => pad.top + innerH - ((value - minY) / Math.max(0.0001, maxY - minY)) * innerH
  const points = trace.map((point, index) => `${x(index).toFixed(1)},${y(Number(point.y)).toFixed(1)}`).join(' ')
  const targetY = y(target)
  return h(
    'figure',
    { className: 'la-trace' },
    h(
      'svg',
      { viewBox: `0 0 ${width} ${height}`, className: 'la-trace__svg', role: 'img', 'aria-label': props.t('loop.exp.trace') },
      h('line', { className: 'la-trace__axis', x1: pad.left, y1: pad.top, x2: pad.left, y2: height - pad.bottom }),
      h('line', { className: 'la-trace__axis', x1: pad.left, y1: height - pad.bottom, x2: width - pad.right, y2: height - pad.bottom }),
      h('line', { className: 'la-trace__target', x1: pad.left, y1: targetY, x2: width - pad.right, y2: targetY }),
      h('text', { className: 'la-trace__label', x: pad.left + 4, y: targetY - 5 }, props.t('loop.exp.target')),
      h('polyline', { className: 'la-trace__line', points }),
      h('text', { className: 'la-trace__label', x: 2, y: pad.top + 10 }, maxY.toFixed(1)),
      h('text', { className: 'la-trace__label', x: 2, y: height - pad.bottom }, minY.toFixed(1)),
    ),
    h('figcaption', { className: 'la-trace__caption la-muted' }, `${props.t('loop.exp.trace')} · ${trace.length} pts`),
  )
}

/* ───────────────────────── 代理指标 ───────────────────────── */

function ProxyExperiment(props) {
  const t = props.t
  const experiment = props.experiment
  const [e, setE] = useState(1)
  const state = useRunState(props.onRun)
  const { busy, error, result } = state
  const visible = result ? Number(result.visible) : null
  const hidden = result ? Number(result.hidden) : null
  const ratio = result ? Number(result.ratioHiddenToVisible) : null

  return h(
    'div',
    { className: 'la-exp' },
    h(
      'label',
      { className: 'la-slider' },
      h('span', { className: 'la-slider__label' }, `${t('loop.exp.proxy.e')} = ${Number(e).toFixed(2)}`),
      h('input', {
        type: 'range',
        min: 0,
        max: 2.6,
        step: 0.02,
        value: e,
        onChange: (event) => {
          setE(Number(event.target.value))
          state.setResult(null)
        },
      }),
    ),
    h(
      'div',
      { className: 'la-exp__actions' },
      h(Button, { variant: 'primary', icon: 'flask', loading: busy, onClick: () => executeRun(state, { e: Number(e.toFixed(2)) }, '') }, busy ? t('loop.exp.running') : t('loop.exp.run')),
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, t('loop.exp.failed', { message: error })) : null,
    ),
    result
      ? h(
          'div',
          { className: 'la-expresult' },
          h(
            'div',
            { className: 'la-bars' },
            bar(t('loop.exp.proxy.visible'), visible, 'visible'),
            bar(t('loop.exp.proxy.hidden'), hidden, 'hidden'),
          ),
          h(
            'dl',
            { className: 'la-metrics' },
            h('div', { className: 'la-metrics__item' }, h('dt', null, t('loop.exp.proxy.ratio')), h('dd', null, ratio === null ? '—' : ratio.toFixed(2))),
            result.peakHidden
              ? h(
                  'div',
                  { className: 'la-metrics__item' },
                  h('dt', null, t('loop.exp.proxy.peak', { e: Number(result.peakHidden.e).toFixed(2), value: Number(result.peakHidden.value).toFixed(2) })),
                  h('dd', null, ''),
                )
              : null,
            h('div', { className: 'la-metrics__item' }, h('dt', null, t('loop.exp.verdict')), h('dd', null, result.verdictLabel || result.verdict)),
          ),
          h('p', { className: 'la-expresult__criterion' }, h('strong', null, `${t('loop.exp.criterion')}：`), result.criterion || '—'),
          h(
            'div',
            { className: 'la-expresult__meta' },
            h('span', null, `${t('loop.exp.model')}：${result.modelId} v${result.modelVersion}`),
            h('span', null, `${t('loop.exp.params')}：e=${Number(result.params && result.params.e).toFixed(2)}`),
            h('span', null, t('loop.exp.runSaved')),
          ),
          h(
            'div',
            { className: 'la-expresult__actions' },
            h(
              Button,
              {
                size: 'sm',
                variant: 'secondary',
                icon: 'notes',
                onClick: () =>
                  props.onPrefillObservation &&
                  props.onPrefillObservation(
                    `观察：优化力度 e=${Number(result.params && result.params.e).toFixed(2)} 时，可见指标 ${visible.toFixed(
                      1,
                    )}、隐藏指标 ${hidden.toFixed(1)}，隐藏/可见=${ratio.toFixed(2)}，判定「${result.verdictLabel || result.verdict}」。判据：${
                      result.criterion || '—'
                    }。`,
                  ),
              },
              t('loop.exp.saveObs'),
            ),
          ),
        )
      : null,
    h(RunHistory, { t, runs: props.runs, experimentId: experiment.id }),
  )
}

function bar(label, value, tone) {
  const width = Math.max(0, Math.min(100, Number(value) || 0))
  return h(
    'div',
    { className: 'la-bar' },
    h('span', { className: 'la-bar__label' }, `${label} ${Number(value || 0).toFixed(1)}`),
    h('span', { className: 'la-bar__track' }, h('span', { className: `la-bar__fill la-bar__fill--${tone}`, style: { width: `${width}%` } })),
  )
}

/* ───────────────────────── 全绿却错 ───────────────────────── */

function GreenExperiment(props) {
  const t = props.t
  const experiment = props.experiment
  const [enabled, setEnabled] = useState({ p1: true, p2: true, empty: false, beyond: false })
  const state = useRunState(props.onRun)
  const { busy, error, result } = state
  const cases = (result && result.cases) || []

  return h(
    'div',
    { className: 'la-exp' },
    h(
      'div',
      { className: 'la-checks' },
      Object.keys(enabled).map((id) =>
        h(
          'label',
          { key: id, className: 'la-check' },
          h('input', {
            type: 'checkbox',
            checked: !!enabled[id],
            onChange: () => {
              setEnabled((previous) => Object.assign({}, previous, { [id]: !previous[id] }))
              state.setResult(null)
            },
          }),
          h('span', { className: 'la-check__label' }, caseLabel(t, id)),
          h(Tag, { tone: enabled[id] ? 'accent' : 'neutral' }, enabled[id] ? t('loop.exp.green.pass') : t('loop.exp.green.off')),
        ),
      ),
    ),
    h(
      'p',
      { className: 'la-expcard__note' },
      t('loop.exp.green.caveat'),
    ),
    h(
      'div',
      { className: 'la-exp__actions' },
      h(Button, { variant: 'primary', icon: 'flask', loading: busy, onClick: () => executeRun(state, { enabled }, '') }, busy ? t('loop.exp.running') : t('loop.exp.run')),
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, t('loop.exp.failed', { message: error })) : null,
    ),
    result
      ? h(
          'div',
          { className: 'la-expresult' },
          h(
            'p',
            { className: `la-expresult__allgreen ${result.allGreen ? 'is-green' : 'is-red'}` },
            result.allGreen ? t('loop.exp.green.allGreen') : t('loop.exp.verdict.fail'),
          ),
          h(
            'ul',
            { className: 'la-caselist' },
            cases.map((item) =>
              h(
                'li',
                { key: item.id, className: `la-caselist__item is-${item.state}` },
                h('span', { className: 'la-caselist__label' }, item.label || caseLabel(t, item.id)),
                h(
                  'span',
                  null,
                  item.state === 'pass'
                    ? h(Tag, { tone: 'ok' }, t('loop.exp.green.pass'))
                    : item.state === 'fail'
                      ? h(Tag, { tone: 'danger' }, t('loop.exp.green.fail'))
                      : h(Tag, { tone: 'neutral' }, t('loop.exp.green.off')),
                ),
                item.state === 'fail'
                  ? h(
                      'span',
                      { className: 'la-caselist__detail' },
                      `${t('loop.exp.green.actual', { actual: item.detail || '—' })} · ${t('loop.exp.green.expect', {
                        expect: item.expect || '—',
                      })}`,
                    )
                  : h('span', { className: 'la-caselist__detail la-muted' }, t('loop.exp.green.expect', { expect: item.expect || '—' })),
              ),
            ),
          ),
          h('p', { className: 'la-expresult__criterion' }, h('strong', null, `${t('loop.exp.criterion')}：`), result.criterion || t('loop.exp.green.notCorrect')),
          result.caveat ? h('p', { className: 'la-expresult__criterion la-muted' }, result.caveat) : null,
          h(
            'div',
            { className: 'la-expresult__meta' },
            h('span', null, `${t('loop.exp.model')}：${result.modelId} v${result.modelVersion}`),
            h('span', null, t('loop.exp.runSaved')),
          ),
        )
      : null,
    h(RunHistory, { t, runs: props.runs, experimentId: experiment.id }),
  )
}

function caseLabel(t, id) {
  const labels = {
    p1: '第 1 页，每页 10 条',
    p2: '第 2 页，每页 10 条',
    empty: '空集合，第 1 页',
    beyond: '第 99 页（超出范围）',
  }
  return labels[id] || id
}

/* ───────────────────────── 运行记录 ───────────────────────── */

function RunHistory(props) {
  const runs = (props.runs || []).filter((run) => !props.experimentId || run.experimentId === props.experimentId).slice(0, 8)
  if (!runs.length) return null
  return h(
    Collapsible,
    { title: props.t('loop.evidence.runs'), meta: String(runs.length) },
    h(
      'ul',
      { className: 'la-runlist' },
      runs.map((run) =>
        h(
          'li',
          { key: run.id, className: 'la-runlist__item' },
          h('span', { className: 'la-runlist__verdict' }, run.verdict ? props.t(`loop.exp.verdict.${run.verdict}`) : '—'),
          h('span', { className: 'la-runlist__params' }, JSON.stringify(run.params || {})),
          h('span', { className: 'la-runlist__at' }, formatTime(run.at)),
          h(
            'span',
            { className: 'la-runlist__model' },
            `${run.modelId || ''}${run.modelVersion === null ? '' : ` v${run.modelVersion}`}${
              run.subject && run.subject.kind ? ` · ${run.subject.kind}:${run.subject.id}` : ''
            }`,
          ),
          run.result && run.result.metrics
            ? h('span', { className: 'la-runlist__metrics' }, JSON.stringify(run.result.metrics))
            : null,
        ),
      ),
    ),
  )
}
  return { ExperimentCard }
})
__def("views/Predictions.js", function (__req) {
/**
 * 预测：可判定条件、保存、记录判定（支持/反驳/不足以判断）、关联运行与研究问题。
 * 判定是用户自己的判断，不自动替用户下结论。
 */

const { useState } = React

const { Button, Tag, FieldLabel, EmptyState } = __req("components/primitives.js")
const { Collapsible } = __req("views/shared.js")
const { TimeLabel } = __req("views/shared.js")
const { formatTime } = __req("util.js")

const STATUSES = ['open', 'supported', 'refuted', 'inconclusive']
const RESOLVABLE = ['supported', 'refuted', 'inconclusive']

function PredictionsSection(props) {
  const t = props.t
  const storeIndex = props.storeIndex
  const subject = props.subject
  const predictions = storeIndex.predictionsFor(subject)
  const runs = storeIndex.runsFor(subject)
  const investigations = storeIndex.investigationsFor(subject)
  const [creating, setCreating] = useState(false)
  return h(
    'section',
    { className: 'la-evsection', 'aria-label': t('loop.pred.title') },
    h(
      'div',
      { className: 'la-evsection__head' },
      h('h3', { className: 'la-evsection__title' }, `${t('loop.pred.title')} · ${predictions.length}`),
      h(
        Button,
        { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => setCreating((value) => !value) },
        t('loop.pred.new'),
      ),
    ),
    creating
      ? h(PredictionForm, {
          t,
          subject,
          investigations,
          onSubmit: async (payload) => {
            const result = await props.perform('prediction.save', payload, {
              successText: t('loop.pred.saved'),
            })
            setCreating(false)
            return result
          },
        })
      : null,
    !predictions.length
      ? h(EmptyState, { icon: 'target', title: t('loop.pred.empty') })
      : h(
          'ul',
          { className: 'la-predlist' },
          predictions.map((prediction) =>
            h(PredictionCard, {
              key: prediction.id,
              t,
              prediction,
              runs,
              investigations,
              perform: props.perform,
            }),
          ),
        ),
  )
}

function PredictionForm(props) {
  const t = props.t
  const [text, setText] = useState('')
  const [resolveBy, setResolveBy] = useState('')
  const [investigationId, setInvestigationId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const needsResolveBy = !resolveBy.trim()
  return h(
    'div',
    { className: 'la-formcard' },
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, null, t('loop.pred.text')),
      h('textarea', {
        className: 'la-textarea',
        rows: 2,
        value: text,
        placeholder: t('loop.pred.textPlaceholder'),
        onChange: (event) => setText(event.target.value),
      }),
    ),
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, { optional: t('loop.pred.resolveBy') }, t('loop.pred.resolveBy')),
      h('input', {
        className: 'la-input',
        value: resolveBy,
        placeholder: t('loop.pred.resolveByPlaceholder'),
        onChange: (event) => setResolveBy(event.target.value),
      }),
    ),
    props.investigations.length
      ? h(
          'label',
          { className: 'la-field' },
          h(FieldLabel, { optional: t('loop.common.optional') }, t('loop.pred.investigation')),
          h(
            'select',
            { className: 'la-select', value: investigationId, onChange: (event) => setInvestigationId(event.target.value) },
            h('option', { value: '' }, t('loop.pred.noneInvestigation')),
            props.investigations.map((item) => h('option', { key: item.id, value: item.id }, item.title || item.id)),
          ),
        )
      : null,
    h(
      'div',
      { className: 'la-formcard__actions' },
      h(
        Button,
        {
          variant: 'primary',
          size: 'sm',
          loading: busy,
          disabled: !text.trim(),
          onClick: async () => {
            setBusy(true)
            setError('')
            try {
              await props.onSubmit({
                subject: props.subject,
                text: text.trim(),
                resolveBy: resolveBy.trim(),
                investigationId: investigationId || null,
              })
              setText('')
              setResolveBy('')
            } catch (rawError) {
              setError(String((rawError && rawError.message) || rawError))
            } finally {
              setBusy(false)
            }
          },
        },
        t('loop.pred.save'),
      ),
      needsResolveBy ? h('span', { className: 'la-hintwarn' }, t('loop.pred.resolveByPlaceholder')) : null,
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
    ),
  )
}

function PredictionCard(props) {
  const t = props.t
  const prediction = props.prediction
  const [resolving, setResolving] = useState(false)
  const [status, setStatus] = useState('supported')
  const [note, setNote] = useState('')
  const [runId, setRunId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const investigation = prediction.investigationId
    ? props.investigations.find((item) => item.id === prediction.investigationId)
    : null
  const statusTone =
    prediction.status === 'supported' ? 'ok' : prediction.status === 'refuted' ? 'danger' : prediction.status === 'open' ? 'warn' : 'neutral'
  const run = prediction.resolvedByRunId ? props.runs.find((item) => item.id === prediction.resolvedByRunId) : null
  return h(
    'li',
    { className: `la-pred ${prediction.status === 'open' ? 'is-open' : ''}`.trim() },
    h(
      'div',
      { className: 'la-pred__head' },
      h(Tag, { tone: statusTone }, t(`loop.pred.status.${prediction.status}`)),
      prediction.legacy ? h(Tag, { tone: 'neutral', title: t('loop.pred.legacyHint') }, t('loop.pred.legacy')) : null,
      h('span', { className: 'la-pred__grow' }),
      prediction.at ? h(TimeLabel, { at: prediction.at }) : null,
    ),
    h('p', { className: 'la-pred__text' }, prediction.text),
    prediction.resolveBy ? h('p', { className: 'la-pred__resolveby' }, `${t('loop.pred.resolveBy')}：${prediction.resolveBy}`) : null,
    investigation ? h('p', { className: 'la-pred__investigation la-muted' }, `${t('loop.pred.investigation')}：${investigation.title}`) : null,
    run
      ? h(
          'p',
          { className: 'la-pred__run la-muted' },
          `${t('loop.evidence.runs')}：${run.modelId || ''} ${JSON.stringify(run.params || {})} · ${formatTime(run.at)}`,
        )
      : null,
    prediction.resolvedAt ? h('p', { className: 'la-pred__resolved' }, t('loop.pred.resolvedAt', { at: formatTime(prediction.resolvedAt) })) : null,
    prediction.resolutionNote ? h('p', { className: 'la-pred__note' }, prediction.resolutionNote) : null,
    prediction.status === 'open'
      ? h(
          'div',
          { className: 'la-pred__actions' },
          h(
            Button,
            { size: 'sm', variant: 'secondary', icon: 'check', onClick: () => setResolving((value) => !value) },
            t('loop.pred.resolve'),
          ),
          resolving
            ? h(
                'div',
                { className: 'la-pred__form' },
                h(
                  'div',
                  { className: 'la-chips' },
                  RESOLVABLE.map((value) =>
                    h(
                      'button',
                      {
                        key: value,
                        type: 'button',
                        className: `la-chip ${status === value ? 'is-on' : ''}`.trim(),
                        onClick: () => setStatus(value),
                        'aria-pressed': status === value,
                      },
                      t(`loop.pred.resolve.${value}`),
                    ),
                  ),
                ),
                h('input', {
                  className: 'la-input',
                  value: note,
                  placeholder: t('loop.pred.resolutionNotePlaceholder'),
                  'aria-label': t('loop.pred.resolutionNote'),
                  onChange: (event) => setNote(event.target.value),
                }),
                props.runs.length
                  ? h(
                      'select',
                      { className: 'la-select', value: runId, onChange: (event) => setRunId(event.target.value), 'aria-label': t('loop.pred.linkRun') },
                      h('option', { value: '' }, t('loop.pred.noRun')),
                      props.runs.map((item) =>
                        h('option', { key: item.id, value: item.id }, `${item.modelId || ''} ${JSON.stringify(item.params || {})} · ${formatTime(item.at)}`),
                      ),
                    )
                  : null,
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'primary',
                    loading: busy,
                    onClick: async () => {
                      setBusy(true)
                      setError('')
                      try {
                        await props.perform(
                          'prediction.resolve',
                          { id: prediction.id, status, note: note.trim() || null, runId: runId || null },
                          { successText: t('loop.status.saveOk', { what: t('loop.pred.title') }) },
                        )
                        setResolving(false)
                      } catch (rawError) {
                        setError(String((rawError && rawError.message) || rawError))
                      } finally {
                        setBusy(false)
                      }
                    },
                  },
                  t('loop.pred.resolve'),
                ),
                error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
              )
            : null,
        )
      : null,
  )
}
  return { PredictionsSection }
})
__def("views/Investigations.js", function (__req) {
/**
 * 研究问题（Investigation）：主张 / 相反解释 / 下一项检验 / 状态，可挂预测与运行。
 */

const { useState } = React

const { Button, Tag, FieldLabel, EmptyState } = __req("components/primitives.js")
const { TimeLabel } = __req("views/shared.js")

const INV_STATUSES = ['open', 'testing', 'supported', 'revised', 'inconclusive']

function statusTone(status) {
  if (status === 'supported') return 'ok'
  if (status === 'revised') return 'accent'
  if (status === 'testing') return 'warn'
  if (status === 'inconclusive') return 'neutral'
  return 'neutral'
}

function InvestigationsSection(props) {
  const t = props.t
  const storeIndex = props.storeIndex
  const subject = props.subject
  const investigations = storeIndex.investigationsFor(subject)
  const [creating, setCreating] = useState(false)
  return h(
    'section',
    { className: 'la-evsection', 'aria-label': t('loop.inv.title') },
    h(
      'div',
      { className: 'la-evsection__head' },
      h('h3', { className: 'la-evsection__title' }, `${t('loop.inv.title')} · ${investigations.length}`),
      h(
        Button,
        { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => setCreating((value) => !value) },
        t('loop.inv.new'),
      ),
    ),
    creating || !investigations.length
      ? h(InvestigationForm, {
          t,
          subject,
          investigations,
          submitLabel: t('loop.inv.save'),
          onSubmit: async (payload) => {
            const result = await props.perform('investigation.save', payload, {
              successText: t('loop.inv.saved'),
            })
            setCreating(false)
            return result
          },
        })
      : null,
    h(
      'ul',
      { className: 'la-invlist' },
      investigations.map((investigation) =>
        h(InvestigationCard, {
          key: investigation.id,
          t,
          investigation,
          storeIndex,
          perform: props.perform,
          onDiscuss: props.onDiscuss,
        }),
      ),
    ),
  )
}

function InvestigationForm(props) {
  const t = props.t
  const initial = props.initial || {}
  const [title, setTitle] = useState(initial.title || '')
  const [claim, setClaim] = useState(initial.claim || '')
  const [counter, setCounter] = useState(initial.counter || '')
  const [nextTest, setNextTest] = useState(initial.nextTest || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return h(
    'div',
    { className: 'la-formcard' },
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, null, t('loop.inv.titleLabel')),
      h('input', {
        className: 'la-input',
        value: title,
        placeholder: t('loop.inv.titlePlaceholder'),
        onChange: (event) => setTitle(event.target.value),
      }),
    ),
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, null, t('loop.inv.claim')),
      h('textarea', {
        className: 'la-textarea',
        rows: 2,
        value: claim,
        placeholder: t('loop.inv.claimPlaceholder'),
        onChange: (event) => setClaim(event.target.value),
      }),
    ),
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, null, t('loop.inv.counter')),
      h('textarea', {
        className: 'la-textarea',
        rows: 2,
        value: counter,
        placeholder: t('loop.inv.counterPlaceholder'),
        onChange: (event) => setCounter(event.target.value),
      }),
    ),
    h(
      'label',
      { className: 'la-field' },
      h(FieldLabel, { optional: t('loop.common.optional') }, t('loop.inv.nextTest')),
      h('input', {
        className: 'la-input',
        value: nextTest,
        placeholder: t('loop.inv.nextTestPlaceholder'),
        onChange: (event) => setNextTest(event.target.value),
      }),
    ),
    h(
      'div',
      { className: 'la-formcard__actions' },
      h(
        Button,
        {
          variant: 'primary',
          size: 'sm',
          loading: busy,
          disabled: !title.trim(),
          onClick: async () => {
            setBusy(true)
            setError('')
            try {
              await props.onSubmit({
                id: initial.id,
                subject: props.subject,
                title: title.trim(),
                claim: claim.trim(),
                counter: counter.trim(),
                nextTest: nextTest.trim(),
              })
              if (!initial.id) {
                setTitle('')
                setClaim('')
                setCounter('')
                setNextTest('')
              }
            } catch (rawError) {
              setError(String((rawError && rawError.message) || rawError))
            } finally {
              setBusy(false)
            }
          },
        },
        props.submitLabel,
      ),
      h('span', { className: 'la-muted' }, t('loop.inv.nextTestPlaceholder')),
      error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
    ),
  )
}

function InvestigationCard(props) {
  const t = props.t
  const investigation = props.investigation
  const [editing, setEditing] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [status, setStatus] = useState(investigation.status)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const predictions = props.storeIndex.predictionsByInvestigation.get(investigation.id) || []
  const runs = props.storeIndex.runs.filter((run) => run.investigationId === investigation.id)

  return h(
    'li',
    { className: `la-inv ${investigation.status === 'open' || investigation.status === 'testing' ? 'is-active' : ''}`.trim() },
    h(
      'div',
      { className: 'la-inv__head' },
      h(Tag, { tone: statusTone(investigation.status) }, t(`loop.inv.status.${investigation.status}`)),
      h('h4', { className: 'la-inv__title' }, investigation.title || t('loop.inv.title')),
      h('span', { className: 'la-inv__grow' }),
      investigation.updatedAt ? h(TimeLabel, { at: investigation.updatedAt }) : null,
    ),
    investigation.claim ? h('p', { className: 'la-inv__claim' }, h('strong', null, `${t('loop.inv.claim')}：`), investigation.claim) : null,
    investigation.counter
      ? h('p', { className: 'la-inv__counter' }, h('strong', null, `${t('loop.inv.counter')}：`), investigation.counter)
      : null,
    h(
      'p',
      { className: 'la-inv__next' },
      h('strong', null, `${t('loop.inv.nextTestLabel')}：`),
      investigation.nextTest || h('span', { className: 'la-muted' }, t('loop.continue.noNextTest')),
    ),
    h(
      'p',
      { className: 'la-inv__meta la-muted' },
      `${t('loop.inv.predCount', { count: predictions.length })} · ${t('loop.inv.runCount', { count: runs.length })}`,
    ),
    editing
      ? h(
          InvestigationForm,
          {
            t,
            subject: investigation.subject,
            initial: investigation,
            submitLabel: t('loop.inv.save'),
            onSubmit: async (payload) => {
              await props.perform('investigation.save', payload, { successText: t('loop.inv.saved') })
              setEditing(false)
            },
          },
        )
      : h(
          'div',
          { className: 'la-inv__actions' },
          h(
            Button,
            { size: 'sm', variant: 'secondary', icon: 'chat', onClick: () => props.onDiscuss && props.onDiscuss(investigation) },
            t('loop.inv.discuss'),
          ),
          h(Button, { size: 'sm', variant: 'ghost', icon: 'edit', onClick: () => setEditing(true) }, t('loop.common.edit')),
          h(
            Button,
            { size: 'sm', variant: 'ghost', onClick: () => setResolving((value) => !value) },
            t('loop.inv.resolve'),
          ),
          resolving
            ? h(
                'div',
                { className: 'la-inv__form' },
                h(
                  'select',
                  { className: 'la-select', value: status, onChange: (event) => setStatus(event.target.value), 'aria-label': t('loop.inv.statusLabel') },
                  INV_STATUSES.map((value) => h('option', { key: value, value }, t(`loop.inv.status.${value}`))),
                ),
                h('input', {
                  className: 'la-input',
                  value: note,
                  placeholder: t('loop.inv.resolveNote'),
                  'aria-label': t('loop.inv.resolveNote'),
                  onChange: (event) => setNote(event.target.value),
                }),
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'primary',
                    loading: busy,
                    onClick: async () => {
                      setBusy(true)
                      setError('')
                      try {
                        await props.perform(
                          'investigation.resolve',
                          { id: investigation.id, status, note: note.trim() || null },
                          { successText: t('loop.status.saveOk', { what: t('loop.inv.title') }) },
                        )
                        setResolving(false)
                      } catch (rawError) {
                        setError(String((rawError && rawError.message) || rawError))
                      } finally {
                        setBusy(false)
                      }
                    },
                  },
                  t('loop.inv.resolve'),
                ),
                error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
              )
            : null,
        ),
  )
}
  return { InvestigationsSection }
})
__def("components/Dialog.js", function (__req) {
/**
 * 模态弹层：dialog 语义、焦点陷阱、Escape 关闭并把焦点还给触发者。
 * 覆盖层只盖住插件自己的面板区域（不遮挡 Harness 外壳）。
 */

const { useRef, useEffect, useMemo } = React

const { classNames } = __req("util.js")
const { nextLocalId } = __req("state/hooks.js")
const { IconButton, Button } = __req("components/primitives.js")

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * 焦点陷阱 + Escape 关闭 + 关闭后焦点归还。
 * @param {object} options
 * @param {boolean} options.active
 * @param {{current: HTMLElement|null}} options.containerRef
 * @param {() => void} options.onClose
 */
function useFocusTrap(options) {
  const active = !!(options && options.active)
  const containerRef = options && options.containerRef
  const onClose = options && options.onClose
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!active) return undefined
    const container = containerRef && containerRef.current
    if (!container || typeof document === 'undefined') return undefined
    const previous = document.activeElement
    const listFocusable = () =>
      Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
      )
    const items = listFocusable()
    const target = items[0] || container
    try {
      target.focus({ preventScroll: false })
    } catch {
      try {
        target.focus()
      } catch {
        /* 焦点失败不影响弹层可用 */
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        if (closeRef.current) closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = listFocusable()
      if (!focusable.length) {
        event.preventDefault()
        container.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement
      const inside = container.contains(activeElement)
      if (event.shiftKey) {
        if (!inside || activeElement === first) {
          event.preventDefault()
          last.focus()
        }
        return
      }
      if (!inside || activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      if (previous && typeof previous.focus === 'function') {
        try {
          previous.focus({ preventScroll: true })
        } catch {
          /* 触发者已经卸载 */
        }
      }
    }
  }, [active, containerRef])
}

/**
 * 受控模态弹层。
 * props: open, onClose, title, description, children, footer, size('sm'|'md'|'lg'),
 *        closeLabel, initialFocusRef
 */
function Dialog(props) {
  const containerRef = useRef(null)
  const titleId = useMemo(() => nextLocalId('la-dialog-title'), [])
  const descriptionId = useMemo(() => nextLocalId('la-dialog-desc'), [])
  useFocusTrap({ active: !!props.open, containerRef, onClose: props.onClose })
  if (!props.open) return null
  return h(
    'div',
    {
      className: 'la-overlay',
      onMouseDown: (event) => {
        if (event.target === event.currentTarget && props.onClose) props.onClose()
      },
    },
    h(
      'div',
      {
        className: classNames('la-dialog', props.size && `la-dialog--${props.size}`, props.className),
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        'aria-describedby': props.description ? descriptionId : undefined,
        ref: containerRef,
        tabIndex: -1,
      },
      h(
        'div',
        { className: 'la-dialog__head' },
        h(
          'div',
          { className: 'la-dialog__heading' },
          h('h2', { className: 'la-dialog__title', id: titleId }, props.title),
          props.description ? h('p', { className: 'la-dialog__desc', id: descriptionId }, props.description) : null,
        ),
        h(IconButton, { icon: 'close', label: props.closeLabel || '关闭', onClick: props.onClose }),
      ),
      h('div', { className: 'la-dialog__body' }, props.children),
      props.footer ? h('div', { className: 'la-dialog__foot' }, props.footer) : null,
    ),
  )
}

/** 确认弹层：危险操作用 danger 样式，取消/确认按钮都有明确文案。 */
function ConfirmDialog(props) {
  return h(
    Dialog,
    {
      open: !!props.open,
      onClose: props.onCancel,
      title: props.title,
      description: props.description,
      size: 'sm',
      closeLabel: props.cancelLabel,
    },
    h('div', { className: 'la-confirm' }, h('p', { className: 'la-confirm__text' }, props.message)),
    {
      footer: h(
        'div',
        { className: 'la-dialog__actions' },
        h(Button, { variant: 'ghost', onClick: props.onCancel }, props.cancelLabel),
        h(Button, { variant: props.danger ? 'danger' : 'primary', onClick: props.onConfirm }, props.confirmLabel),
      ),
    },
  )
}
  return { useFocusTrap, Dialog, ConfirmDialog }
})
__def("views/NotesSection.js", function (__req) {
/**
 * 笔记：来源标识、编辑/归档/恢复/删除、按 subject 隔离的草稿输入。
 * 用户写的笔记 authorSource:'user'；从 AI 消息采纳的草案是 'ai-draft'/adopted:true。
 */

const { useState } = React

const { Button, Tag, FieldLabel, EmptyState } = __req("components/primitives.js")
const { ConfirmDialog } = __req("components/Dialog.js")
const { TimeLabel } = __req("views/shared.js")
const { formatTime } = __req("util.js")

const NOTE_KINDS = ['理解', '疑问', '证据', '反驳', '实践']

function noteSourceKind(note) {
  if (!note) return 'import'
  if (note.authorSource === 'user') return note.legacyOriginUncertain ? 'legacy' : 'user'
  if (note.authorSource === 'ai-draft') return 'ai-draft'
  return 'import'
}

function NoteSourceBadge(props) {
  const kind = noteSourceKind(props.note)
  const tone = kind === 'user' ? 'accent' : kind === 'ai-draft' ? 'warn' : kind === 'legacy' ? 'danger' : 'neutral'
  return h(Tag, { tone, title: kind === 'legacy' ? props.t('loop.note.legacyHint') : undefined }, props.t(`loop.note.source.${kind}`))
}

function noteKindLabel(t, kind) {
  return NOTE_KINDS.includes(kind) ? t(`loop.note.kind.${kind}`) : String(kind || '')
}

/** 一条笔记：可编辑正文、归档/恢复、删除。 */
function NoteCard(props) {
  const note = props.note
  const t = props.t
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  const saveEdit = async () => {
    const text = draft.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await props.onSaveEdit({ noteId: note.id, kind: note.kind, text, parentRevision: note.revision })
      setEditing(false)
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  const archived = note.status === 'archived'
  return h(
    'article',
    { className: `la-note ${archived ? 'is-archived' : ''}`.trim() },
    h(
      'div',
      { className: 'la-note__head' },
      h(Tag, { tone: 'neutral' }, noteKindLabel(t, note.kind)),
      h(NoteSourceBadge, { note, t }),
      archived ? h(Tag, { tone: 'neutral' }, t('loop.note.archivedLabel')) : null,
      h('span', { className: 'la-note__grow' }),
      h(TimeLabel, { at: note.updatedAt || note.createdAt }),
    ),
    h(
      'div',
      { className: 'la-note__meta' },
      h(
        'span',
        null,
        `${t('loop.note.revision', { n: note.revision })} · ${t('loop.note.savedBy')} ${t(
          `loop.note.savedBy.${note.savedBy === 'agent' ? 'agent' : 'ui'}`,
        )}`,
      ),
      note.adopted ? h(Tag, { tone: 'accent' }, t('loop.note.adopted')) : null,
    ),
    note.legacyOriginUncertain
      ? h('p', { className: 'la-note__warning', role: 'note' }, t('loop.note.legacyHint'))
      : null,
    note.encodingSuspected
      ? h('p', { className: 'la-note__warning', role: 'note' }, t('loop.note.encodingHint'))
      : null,
    editing
      ? h(
          'div',
          { className: 'la-note__editor' },
          h('textarea', {
            className: 'la-textarea',
            value: draft,
            rows: 3,
            onChange: (event) => setDraft(event.target.value),
            'aria-label': t('loop.note.edit'),
          }),
          h(
            'div',
            { className: 'la-inlineactions' },
            h(Button, { size: 'sm', variant: 'primary', loading: busy, disabled: !draft.trim(), onClick: saveEdit }, t('loop.note.saveEdit')),
            h(Button, { size: 'sm', variant: 'ghost', onClick: () => { setEditing(false); setDraft(note.text); setError('') } }, t('loop.note.cancel')),
            error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
          ),
        )
      : h('p', { className: 'la-note__text' }, note.text),
    !editing
      ? h(
          'div',
          { className: 'la-note__actions' },
          h(Button, { size: 'sm', variant: 'ghost', onClick: () => { setEditing(true); setDraft(note.text) } }, t('loop.note.edit')),
          h(
            Button,
            {
              size: 'sm',
              variant: 'ghost',
              onClick: () => props.onArchive(note),
              disabled: props.busyNoteId === note.id,
            },
            archived ? t('loop.note.restore') : t('loop.note.archive'),
          ),
          h(Button, { size: 'sm', variant: 'ghost', onClick: () => setConfirming(true) }, t('loop.note.delete')),
        )
      : null,
    h(ConfirmDialog, {
      open: confirming,
      title: t('loop.note.delete'),
      message: t('loop.note.deleteConfirm'),
      confirmLabel: t('loop.note.delete'),
      cancelLabel: t('loop.common.cancel'),
      danger: true,
      onCancel: () => setConfirming(false),
      onConfirm: async () => {
        setConfirming(false)
        try {
          await props.onDelete(note)
        } catch (rawError) {
          setError(String((rawError && rawError.message) || rawError))
        }
      },
    }),
  )
}

/**
 * 笔记面板（学习伙伴的笔记 tab 与证据尺度复用）。
 * props: t, subject, notes, draft, onDraftChange, onSave, onSaveEdit, onArchive, onDelete
 */
function NotesSection(props) {
  const t = props.t
  const [kind, setKind] = useState('理解')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const notes = props.notes || []
  const active = notes.filter((note) => note.status !== 'archived')
  const archived = notes.filter((note) => note.status === 'archived')
  const draft = props.draft || ''

  const submit = async () => {
    const text = draft.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await props.onSave({
        subject: props.subject,
        kind,
        text,
        authorSource: 'user',
        savedBy: 'ui',
      })
      if (props.onDraftChange) props.onDraftChange('')
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  return h(
    'div',
    { className: `la-notes ${props.className || ''}`.trim() },
    props.showComposer === false
      ? null
      : h(
          'div',
          { className: 'la-notecomposer' },
          h(
            'label',
            { className: 'la-notecomposer__field' },
            h(FieldLabel, null, t('loop.note.title')),
            h('textarea', {
              className: 'la-textarea',
              rows: props.compact ? 2 : 3,
              value: draft,
              placeholder: t('loop.note.placeholder'),
              onChange: (event) => props.onDraftChange && props.onDraftChange(event.target.value),
              onKeyDown: (event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                  event.preventDefault()
                  submit()
                }
              },
            }),
          ),
          h(
            'div',
            { className: 'la-notecomposer__row' },
            h(
              'label',
              { className: 'la-notekind' },
              h('span', { className: 'la-notekind__label' }, t('loop.note.kind')),
              h(
                'select',
                {
                  className: 'la-select la-select--sm',
                  value: kind,
                  onChange: (event) => setKind(event.target.value),
                },
                NOTE_KINDS.map((item) => h('option', { key: item, value: item }, noteKindLabel(t, item))),
              ),
            ),
            h(
              Button,
              { variant: 'primary', size: 'sm', loading: busy, disabled: !draft.trim(), onClick: submit },
              busy ? t('loop.note.saving') : t('loop.note.save'),
            ),
            error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
          ),
        ),
    !notes.length
      ? h(EmptyState, { title: t('loop.note.empty'), icon: 'notes' })
      : h(
          'div',
          { className: 'la-notelist', role: 'list', 'aria-label': t('loop.a11y.notes') },
          active.map((note) =>
            h(NoteCard, {
              key: note.id,
              note,
              t,
              onSaveEdit: props.onSaveEdit,
              onArchive: props.onArchive,
              onDelete: props.onDelete,
              busyNoteId: props.busyNoteId,
            }),
          ),
          archived.length
            ? h(
                'details',
                { className: 'la-archived' },
                h('summary', { className: 'la-archived__summary' }, `${t('loop.note.archivedLabel')} · ${archived.length}`),
                archived.map((note) =>
                  h(NoteCard, {
                    key: note.id,
                    note,
                    t,
                    onSaveEdit: props.onSaveEdit,
                    onArchive: props.onArchive,
                    onDelete: props.onDelete,
                  }),
                ),
              )
            : null,
        ),
  )
}
  return { NOTE_KINDS, noteSourceKind, NoteSourceBadge, noteKindLabel, NoteCard, NotesSection }
})
__def("views/TaskEditor.js", function (__req) {
/**
 * 任务草案：
 * 先问「要改变什么行为」→ ops task.draft（真实模型）→ 三栏可编辑（目标/验收/边界）
 * → 未知项以问题呈现 + 概念/证据关联 → task.save → 版本回看/对比/复制/导出。
 * 不自动发送到任何地方。
 */

const { useState, useMemo } = React

const { Button, Tag, FieldLabel, EmptyState, SectionHeader } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { TimeLabel, useCopyText } = __req("views/shared.js")
const { downloadJson, downloadText, formatTime, truncate } = __req("util.js")

function emptyDraft() {
  return {
    title: '',
    request: '',
    goal: '',
    acceptance: [{ text: '', evidence: '' }],
    boundary: [''],
    unknowns: [{ question: '', answer: null }],
    conceptIds: [],
    evidenceRefs: [],
  }
}

function normalizeDraft(draft) {
  const base = emptyDraft()
  if (!draft || typeof draft !== 'object') return base
  return {
    title: String(draft.title || ''),
    request: String(draft.request || ''),
    goal: String(draft.goal || ''),
    acceptance: Array.isArray(draft.acceptance) && draft.acceptance.length
      ? draft.acceptance.map((item) =>
          typeof item === 'string' ? { text: item, evidence: '' } : { text: String(item.text || ''), evidence: String(item.evidence || '') },
        )
      : [{ text: '', evidence: '' }],
    boundary: Array.isArray(draft.boundary) && draft.boundary.length
      ? draft.boundary.map((item) => (typeof item === 'string' ? item : String(item.text || '')))
      : [''],
    unknowns: Array.isArray(draft.unknowns) && draft.unknowns.length
      ? draft.unknowns.map((item) =>
          typeof item === 'string' ? { question: item, answer: null } : { question: String(item.question || ''), answer: item.answer === undefined ? null : item.answer },
        )
      : [{ question: '', answer: null }],
    conceptIds: Array.isArray(draft.conceptIds) ? draft.conceptIds.map(String) : [],
    evidenceRefs: Array.isArray(draft.evidenceRefs) ? draft.evidenceRefs.filter((item) => item && item.kind && item.id) : [],
  }
}

function taskToMarkdown(t, ci, task) {
  const conceptTitles = (task.conceptIds || [])
    .map((id) => (ci.nodesById.get(id) || {}).title || id)
    .join('、')
  const lines = []
  lines.push(`# ${task.title || t('loop.task.title')}`)
  lines.push('')
  lines.push(`## ${t('loop.task.request')}`)
  lines.push(task.request || '—')
  lines.push('')
  lines.push(`## ${t('loop.task.goal')}`)
  lines.push(task.goal || '—')
  lines.push('')
  lines.push(`## ${t('loop.task.acceptance')}`)
  for (const item of task.acceptance || []) lines.push(`- ${item.text}${item.evidence ? `（${item.evidence}）` : ''}`)
  lines.push('')
  lines.push(`## ${t('loop.task.boundary')}`)
  for (const item of task.boundary || []) lines.push(`- ${item}`)
  lines.push('')
  lines.push(`## ${t('loop.task.unknowns')}`)
  for (const item of task.unknowns || []) lines.push(`- ${item.question}${item.answer ? ` → ${item.answer}` : ''}`)
  if (conceptTitles) {
    lines.push('')
    lines.push(`## ${t('loop.task.concepts')}`)
    lines.push(conceptTitles)
  }
  lines.push('')
  lines.push(t('loop.task.notSent'))
  return lines.join('\n')
}

/* ───────────────────────── 草案列表 ───────────────────────── */

function taskRelatedToSubject(task, subject, ci) {
  if (!subject) return false
  if (subject.kind === 'node' && (task.conceptIds || []).includes(subject.id)) return true
  return (task.evidenceRefs || []).some((ref) => {
    if (subject.kind === 'node' && ref.kind === 'note') return true
    return false
  })
}

function TasksSection(props) {
  const t = props.t
  const storeIndex = props.storeIndex
  const subject = props.subject
  const tasks = storeIndex.tasks
  const related = tasks.filter((task) => taskRelatedToSubject(task, subject, props.ci))
  const list = related.length ? related : tasks
  return h(
    'section',
    { className: 'la-evsection', 'aria-label': t('loop.task.title') },
    h(
      'div',
      { className: 'la-evsection__head' },
      h('h3', { className: 'la-evsection__title' }, `${t('loop.task.title')} · ${list.length}`),
      h(Button, { size: 'sm', variant: 'ghost', icon: 'plus', onClick: props.onNewTask }, t('loop.evidence.newTask')),
    ),
    !list.length
      ? h(EmptyState, { icon: 'notes', title: t('loop.evidence.taskEmpty') })
      : h(
          'ul',
          { className: 'la-tasklist' },
          list.map((task) =>
            h(
              'li',
              { key: task.id, className: 'la-tasklist__item' },
              h(
                'button',
                { type: 'button', className: 'la-tasklist__open', onClick: () => props.onOpenTask(task.id) },
                h(
                  'span',
                  { className: 'la-tasklist__main' },
                  h('span', { className: 'la-tasklist__title' }, task.title || t('loop.task.title')),
                  h('span', { className: 'la-tasklist__sub' }, truncate(task.request || task.goal || '', 90)),
                ),
                h(
                  'span',
                  { className: 'la-tasklist__side' },
                  h(Tag, { tone: task.status === 'archived' ? 'neutral' : task.status === 'draft' ? 'warn' : 'accent' }, t(`loop.task.status.${task.status}`)),
                  h('span', { className: 'la-muted' }, `${t('loop.task.version', { n: task.revision })} · ${formatTime(task.updatedAt)}`),
                ),
              ),
            ),
          ),
        ),
  )
}

/* ───────────────────────── 编辑器 ───────────────────────── */

function TaskEditor(props) {
  const t = props.t
  const ci = props.ci
  const storeIndex = props.storeIndex
  const copy = useCopyText(t, props.addReceipt)
  const initialTask = props.initialTaskId ? storeIndex.tasksById.get(props.initialTaskId) : null
  const [phase, setPhase] = useState(initialTask ? 'saved' : 'request')
  const [requestText, setRequestText] = useState(initialTask ? initialTask.request : '')
  const [draft, setDraft] = useState(initialTask ? taskToDraft(initialTask) : emptyDraft())
  const [draftMeta, setDraftMeta] = useState(initialTask ? { model: initialTask.model } : null)
  const [savedTask, setSavedTask] = useState(initialTask)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [compareRevision, setCompareRevision] = useState('')

  const subject = props.subject
  const evidenceOptions = useMemo(() => {
    const options = []
    if (!subject) return options
    for (const note of storeIndex.notesFor(subject).slice(0, 6)) {
      options.push({ kind: 'note', id: note.id, label: `${t('loop.common.notes')}：${truncate(note.text, 48)}` })
    }
    for (const run of storeIndex.runsFor(subject).slice(0, 4)) {
      options.push({ kind: 'experiment', id: run.id, label: `${t('loop.evidence.runs')}：${run.modelId} ${JSON.stringify(run.params || {})}` })
    }
    for (const prediction of storeIndex.predictionsFor(subject).slice(0, 4)) {
      options.push({ kind: 'prediction', id: prediction.id, label: `${t('loop.pred.title')}：${truncate(prediction.text, 48)}` })
    }
    return options
  }, [storeIndex, subject, t])

  if (phase === 'saved' && savedTask) {
    return h(SavedTaskView, {
      t,
      ci,
      storeIndex,
      task: savedTask,
      copy,
      onBack: props.onBack,
      onEdit: () => {
        setDraft(taskToDraft(savedTask))
        setPhase('edit')
        setSavedTask(null)
        setError('')
      },
      onArchive: async () => {
        setBusy(true)
        setError('')
        try {
          await props.perform('task.archive', { id: savedTask.id, status: 'archived' }, {
            successText: t('loop.status.saveOk', { what: t('loop.task.title') }),
          })
        } catch (rawError) {
          setError(String((rawError && rawError.message) || rawError))
        } finally {
          setBusy(false)
        }
      },
      busy,
      error,
    })
  }

  const updateDraft = (patch) => setDraft((previous) => Object.assign({}, previous, patch))

  const generate = async () => {
    const text = requestText.trim()
    if (!text) {
      setError(t('loop.task.needRequest'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await props.perform(
        'task.draft',
        { requestText: text, subject: subject || null, evidenceRefs: evidenceOptions.slice(0, 4).map((option) => ({ kind: option.kind, id: option.id })) },
        { receipt: false, reload: false },
      )
      setDraft(normalizeDraft(response.draft))
      setDraftMeta({ model: response.model, usage: response.usage })
      setPhase('edit')
      if (props.addReceipt) props.addReceipt({ kind: 'info', text: t('loop.task.draftReady') })
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const payload = Object.assign({}, draft, {
        id: savedTask && savedTask.id ? savedTask.id : undefined,
        request: requestText.trim() || draft.request,
        status: 'saved',
      })
      const response = await props.perform('task.save', payload, {
        successText: t('loop.task.saved'),
      })
      setSavedTask(response.task || null)
      setPhase('saved')
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  const exportTask = () => {
    const markdown = taskToMarkdown(t, ci, Object.assign({}, draft, { request: requestText }))
    const result = downloadText(`loop-task-${new Date().toISOString().slice(0, 10)}.md`, markdown, 'text/markdown')
    if (props.addReceipt) {
      props.addReceipt(
        result.ok
          ? { kind: 'info', text: t('loop.task.exportDone') }
          : { kind: 'error', text: `${t('loop.common.copyFailed')}：${result.reason}` },
      )
    }
  }

  const currentConcepts = (draft.conceptIds || []).map((id) => ci.nodesById.get(id) || { id, title: id })
  const availableConcepts = ci.nodes.filter((node) => !(draft.conceptIds || []).includes(node.id))

  return h(
    'div',
    { className: 'la-taskeditor' },
    h(
      'div',
      { className: 'la-taskeditor__head' },
      h(Button, { size: 'sm', variant: 'ghost', icon: 'chevronLeft', onClick: props.onBack }, t('loop.task.back')),
      h('h2', { className: 'la-taskeditor__title' }, t('loop.task.editorTitle')),
      h('span', { className: 'la-muted' }, t('loop.task.notSent')),
    ),
    h(
      'p',
      { className: 'la-taskeditor__notsent' },
      h(Icon, { name: 'info', size: 16 }),
      t('loop.task.notSent'),
    ),
    phase === 'request'
      ? h(
          'div',
          { className: 'la-taskstart' },
          h('h3', { className: 'la-taskstart__title' }, t('loop.task.startTitle')),
          h(
            'label',
            { className: 'la-field' },
            h(FieldLabel, null, t('loop.task.request')),
            h('textarea', {
              className: 'la-textarea',
              rows: 4,
              value: requestText,
              placeholder: t('loop.task.requestPlaceholder'),
              onChange: (event) => setRequestText(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'la-taskstart__actions' },
            h(Button, { variant: 'primary', icon: 'flask', loading: busy, disabled: !requestText.trim(), onClick: generate }, busy ? t('loop.task.generating') : t('loop.task.generate')),
            h(
              Button,
              {
                variant: 'ghost',
                onClick: () => {
                  setDraft(emptyDraft())
                  setDraftMeta(null)
                  setPhase('edit')
                },
              },
              t('loop.common.edit'),
            ),
            error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
          ),
        )
      : h(
          'div',
          { className: 'la-taskform' },
          h(
            'label',
            { className: 'la-field' },
            h(FieldLabel, null, t('loop.task.request')),
            h('textarea', {
              className: 'la-textarea',
              rows: 3,
              value: requestText,
              placeholder: t('loop.task.requestPlaceholder'),
              onChange: (event) => setRequestText(event.target.value),
            }),
          ),
          h(
            'label',
            { className: 'la-field' },
            h(FieldLabel, null, t('loop.task.title')),
            h('input', {
              className: 'la-input',
              value: draft.title,
              onChange: (event) => updateDraft({ title: event.target.value }),
            }),
          ),
          h(
            'div',
            { className: 'la-taskcolumns' },
            h(
              'section',
              { className: 'la-taskcol', 'aria-label': t('loop.task.goal') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.goal')),
              h('textarea', {
                className: 'la-textarea',
                rows: 4,
                value: draft.goal,
                onChange: (event) => updateDraft({ goal: event.target.value }),
                'aria-label': t('loop.task.goal'),
              }),
            ),
            h(
              'section',
              { className: 'la-taskcol', 'aria-label': t('loop.task.acceptance') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.acceptance')),
              draft.acceptance.map((item, index) =>
                h(
                  'div',
                  { key: index, className: 'la-taskitem' },
                  h('input', {
                    className: 'la-input',
                    value: item.text,
                    placeholder: t('loop.task.acceptance'),
                    'aria-label': `${t('loop.task.acceptance')} ${index + 1}`,
                    onChange: (event) => {
                      const next = draft.acceptance.slice()
                      next[index] = Object.assign({}, next[index], { text: event.target.value })
                      updateDraft({ acceptance: next })
                    },
                  }),
                  h('input', {
                    className: 'la-input la-input--sm',
                    value: item.evidence,
                    placeholder: t('loop.task.evidence'),
                    'aria-label': `${t('loop.task.evidence')} ${index + 1}`,
                    onChange: (event) => {
                      const next = draft.acceptance.slice()
                      next[index] = Object.assign({}, next[index], { evidence: event.target.value })
                      updateDraft({ acceptance: next })
                    },
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'la-iconbtn la-iconbtn--sm',
                      label: t('loop.task.remove'),
                      'aria-label': t('loop.task.remove'),
                      onClick: () => updateDraft({ acceptance: draft.acceptance.filter((_, position) => position !== index) }),
                    },
                    h(Icon, { name: 'close', size: 14 }),
                  ),
                ),
              ),
              h(
                Button,
                { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => updateDraft({ acceptance: draft.acceptance.concat([{ text: '', evidence: '' }]) }) },
                t('loop.task.addAcceptance'),
              ),
              !draft.acceptance.some((item) => item.text.trim())
                ? h('p', { className: 'la-hintwarn' }, t('loop.task.acceptanceEmpty'))
                : null,
            ),
            h(
              'section',
              { className: 'la-taskcol', 'aria-label': t('loop.task.boundary') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.boundary')),
              draft.boundary.map((item, index) =>
                h(
                  'div',
                  { key: index, className: 'la-taskitem' },
                  h('input', {
                    className: 'la-input',
                    value: item,
                    placeholder: t('loop.task.boundary'),
                    'aria-label': `${t('loop.task.boundary')} ${index + 1}`,
                    onChange: (event) => {
                      const next = draft.boundary.slice()
                      next[index] = event.target.value
                      updateDraft({ boundary: next })
                    },
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'la-iconbtn la-iconbtn--sm',
                      'aria-label': t('loop.task.remove'),
                      onClick: () => updateDraft({ boundary: draft.boundary.filter((_, position) => position !== index) }),
                    },
                    h(Icon, { name: 'close', size: 14 }),
                  ),
                ),
              ),
              h(Button, { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => updateDraft({ boundary: draft.boundary.concat(['']) }) }, t('loop.task.addBoundary')),
            ),
          ),
          h(
            'section',
            { className: 'la-taskblock', 'aria-label': t('loop.task.unknowns') },
            h('h3', { className: 'la-taskcol__title' }, t('loop.task.unknowns')),
            draft.unknowns.map((item, index) =>
              h(
                'div',
                { key: index, className: 'la-taskitem' },
                h('input', {
                  className: 'la-input',
                  value: item.question,
                  placeholder: t('loop.task.unknowns'),
                  'aria-label': `${t('loop.task.unknowns')} ${index + 1}`,
                  onChange: (event) => {
                    const next = draft.unknowns.slice()
                    next[index] = Object.assign({}, next[index], { question: event.target.value })
                    updateDraft({ unknowns: next })
                  },
                }),
                h('input', {
                  className: 'la-input la-input--sm',
                  value: item.answer || '',
                  placeholder: t('loop.task.answerPlaceholder'),
                  onChange: (event) => {
                    const next = draft.unknowns.slice()
                    next[index] = Object.assign({}, next[index], { answer: event.target.value || null })
                    updateDraft({ unknowns: next })
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'la-iconbtn la-iconbtn--sm',
                    'aria-label': t('loop.task.remove'),
                    onClick: () => updateDraft({ unknowns: draft.unknowns.filter((_, position) => position !== index) }),
                  },
                  h(Icon, { name: 'close', size: 14 }),
                ),
              ),
            ),
            h(
              Button,
              { size: 'sm', variant: 'ghost', icon: 'plus', onClick: () => updateDraft({ unknowns: draft.unknowns.concat([{ question: '', answer: null }]) }) },
              t('loop.task.addUnknown'),
            ),
          ),
          h(
            'div',
            { className: 'la-taskmeta' },
            h(
              'section',
              { className: 'la-taskblock', 'aria-label': t('loop.task.concepts') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.concepts')),
              h(
                'div',
                { className: 'la-chips' },
                currentConcepts.map((node) =>
                  h(
                    'button',
                    {
                      key: node.id,
                      type: 'button',
                      className: 'la-chip is-on',
                      title: t('loop.task.remove'),
                      onClick: () => updateDraft({ conceptIds: draft.conceptIds.filter((id) => id !== node.id) }),
                    },
                    node.title,
                  ),
                ),
              ),
              h(
                'select',
                {
                  className: 'la-select',
                  value: '',
                  'aria-label': t('loop.task.concepts'),
                  onChange: (event) => {
                    if (!event.target.value) return
                    updateDraft({ conceptIds: draft.conceptIds.concat([event.target.value]) })
                  },
                },
                h('option', { value: '' }, `+ ${t('loop.task.concepts')}`),
                availableConcepts.map((node) => h('option', { key: node.id, value: node.id }, node.title)),
              ),
            ),
            h(
              'section',
              { className: 'la-taskblock', 'aria-label': t('loop.task.evidence') },
              h('h3', { className: 'la-taskcol__title' }, t('loop.task.evidence')),
              h(
                'ul',
                { className: 'la-taskevidence' },
                draft.evidenceRefs.map((ref) =>
                  h(
                    'li',
                    { key: `${ref.kind}:${ref.id}` },
                    h('span', null, evidenceLabel(t, storeIndex, ref)),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'la-iconbtn la-iconbtn--sm',
                        'aria-label': t('loop.task.remove'),
                        onClick: () =>
                          updateDraft({
                            evidenceRefs: draft.evidenceRefs.filter((item) => !(item.kind === ref.kind && item.id === ref.id)),
                          }),
                      },
                      h(Icon, { name: 'close', size: 14 }),
                    ),
                  ),
                ),
              ),
              h(
                'select',
                {
                  className: 'la-select',
                  value: '',
                  'aria-label': t('loop.task.evidence'),
                  onChange: (event) => {
                    const value = event.target.value
                    if (!value) return
                    const [kind, id] = value.split('::')
                    updateDraft({ evidenceRefs: draft.evidenceRefs.concat([{ kind, id }]) })
                  },
                },
                h('option', { value: '' }, `+ ${t('loop.task.evidence')}`),
                evidenceOptions
                  .filter((option) => !draft.evidenceRefs.some((ref) => ref.kind === option.kind && ref.id === option.id))
                  .map((option) => h('option', { key: `${option.kind}::${option.id}`, value: `${option.kind}::${option.id}` }, option.label)),
              ),
              !evidenceOptions.length ? h('p', { className: 'la-muted' }, t('loop.task.evidenceEmpty')) : null,
            ),
          ),
          draftMeta && draftMeta.model
            ? h(
                'p',
                { className: 'la-muted' },
                `${t('loop.task.model')}：${draftMeta.model.provider || '?'} / ${draftMeta.model.model || '?'}${
                  draftMeta.model.reasoningEffort ? `（${draftMeta.model.reasoningEffort}）` : ''
                }`,
              )
            : null,
          h(
            'div',
            { className: 'la-taskform__actions' },
            h(Button, { variant: 'primary', icon: 'check', loading: busy, onClick: save }, t('loop.task.save')),
            h(Button, { variant: 'ghost', icon: 'copy', onClick: () => copy(taskToMarkdown(t, ci, Object.assign({}, draft, { request: requestText }))) }, t('loop.task.copy')),
            h(Button, { variant: 'ghost', icon: 'external', onClick: exportTask }, t('loop.task.export')),
            error ? h('span', { className: 'la-inlineerror', role: 'alert' }, error) : null,
          ),
        ),
  )
}

function taskToDraft(task) {
  return normalizeDraft({
    title: task.title,
    request: task.request,
    goal: task.goal,
    acceptance: task.acceptance,
    boundary: task.boundary,
    unknowns: task.unknowns,
    conceptIds: task.conceptIds,
    evidenceRefs: task.evidenceRefs,
  })
}

function evidenceLabel(t, storeIndex, ref) {
  if (ref.kind === 'note') {
    const note = storeIndex.notesById.get(ref.id)
    return `${t('loop.common.notes')}：${note ? truncate(note.text, 60) : ref.id}`
  }
  if (ref.kind === 'experiment') {
    const run = storeIndex.runs.find((item) => item.id === ref.id)
    return `${t('loop.evidence.runs')}：${run ? `${run.modelId} ${JSON.stringify(run.params || {})}` : ref.id}`
  }
  if (ref.kind === 'prediction') {
    const prediction = storeIndex.predictions.find((item) => item.id === ref.id)
    return `${t('loop.pred.title')}：${prediction ? truncate(prediction.text, 60) : ref.id}`
  }
  return `${ref.kind}:${ref.id}`
}

/* ───────────────────────── 已保存视图 ───────────────────────── */

function SavedTaskView(props) {
  const t = props.t
  const ci = props.ci
  const task = props.task
  const revisions = task.revisions || []
  const [compareRevision, setCompareRevision] = useState('')
  const compareSnapshot = useMemo(() => {
    if (!compareRevision) return null
    const revision = revisions.find((item) => String(item.revision) === String(compareRevision))
    return revision ? revision.snapshot : null
  }, [compareRevision, revisions])
  const taskText = taskToMarkdown(t, ci, task)
  return h(
    'div',
    { className: 'la-taskeditor la-taskeditor--saved' },
    h(
      'div',
      { className: 'la-taskeditor__head' },
      h(Button, { size: 'sm', variant: 'ghost', icon: 'chevronLeft', onClick: props.onBack }, t('loop.task.back')),
      h('h2', { className: 'la-taskeditor__title' }, task.title || t('loop.task.title')),
      h(Tag, { tone: 'accent' }, t(`loop.task.status.${task.status}`)),
      h('span', { className: 'la-muted' }, t('loop.task.version', { n: task.revision })),
      h('span', { className: 'la-muted' }, formatTime(task.updatedAt)),
    ),
    h(
      'div',
      { className: 'la-taskeditor__actions' },
      h(Button, { size: 'sm', variant: 'secondary', icon: 'edit', onClick: props.onEdit }, t('loop.common.edit')),
      h(Button, { size: 'sm', variant: 'ghost', icon: 'archive', loading: props.busy, onClick: props.onArchive }, t('loop.task.archive')),
      h(Button, { size: 'sm', variant: 'ghost', icon: 'copy', onClick: () => props.copy(taskText) }, t('loop.task.copy')),
      h(
        Button,
        {
          size: 'sm',
          variant: 'ghost',
          icon: 'external',
          onClick: () => downloadText(`loop-task-${task.id}.md`, taskText, 'text/markdown'),
        },
        t('loop.task.export'),
      ),
      revisions.length
        ? h(
            'label',
            { className: 'la-taskversions' },
            h('span', { className: 'la-muted' }, t('loop.task.versions')),
            h(
              'select',
              {
                className: 'la-select la-select--sm',
                value: compareRevision,
                onChange: (event) => setCompareRevision(event.target.value),
                'aria-label': t('loop.task.compare'),
              },
              h('option', { value: '' }, t('loop.task.compare')),
              revisions.map((item) =>
                h('option', { key: item.revision, value: String(item.revision) }, `${t('loop.task.version', { n: item.revision })} · ${formatTime(item.at)}`),
              ),
            ),
          )
        : null,
      props.error ? h('span', { className: 'la-inlineerror', role: 'alert' }, props.error) : null,
    ),
    compareSnapshot
      ? h(
          'div',
          { className: 'la-taskcompare' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.compareTitle')),
          h(CompareColumns, { t, left: compareSnapshot, right: task, leftLabel: `${t('loop.task.version', { n: compareRevision })}`, rightLabel: t('loop.task.version', { n: task.revision }) }),
        )
      : null,
    h(
      'div',
      { className: 'la-tasksaved' },
      h(
        'section',
        { className: 'la-tasksaved__block' },
        h('h3', { className: 'la-taskcol__title' }, t('loop.task.request')),
        h('p', { className: 'la-tasksaved__text' }, task.request || '—'),
      ),
      h(
        'section',
        { className: 'la-tasksaved__block' },
        h('h3', { className: 'la-taskcol__title' }, t('loop.task.goal')),
        h('p', { className: 'la-tasksaved__text' }, task.goal || '—'),
      ),
      h(
        'div',
        { className: 'la-taskcolumns' },
        h(
          'section',
          { className: 'la-taskcol' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.acceptance')),
          (task.acceptance || []).length
            ? h(
                'ul',
                { className: 'la-tasksaved__list' },
                task.acceptance.map((item, index) =>
                  h('li', { key: index }, h('span', null, item.text), item.evidence ? h('span', { className: 'la-muted' }, `（${item.evidence}）`) : null),
                ),
              )
            : h('p', { className: 'la-hintwarn' }, t('loop.task.acceptanceEmpty')),
        ),
        h(
          'section',
          { className: 'la-taskcol' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.boundary')),
          h(
            'ul',
            { className: 'la-tasksaved__list' },
            (task.boundary || []).map((item, index) => h('li', { key: index }, item)),
          ),
        ),
        h(
          'section',
          { className: 'la-taskcol' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.unknowns')),
          h(
            'ul',
            { className: 'la-tasksaved__list' },
            (task.unknowns || []).map((item, index) =>
              h('li', { key: index }, h('strong', null, `${item.question}`), item.answer ? ` → ${item.answer}` : h('span', { className: 'la-muted' }, ' · —')),
            ),
          ),
        ),
      ),
      h(
        'div',
        { className: 'la-taskmeta' },
        h(
          'section',
          { className: 'la-taskblock' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.concepts')),
          h(
            'div',
            { className: 'la-chips' },
            (task.conceptIds || []).map((id) =>
              h(Tag, { key: id, tone: 'neutral' }, (ci.nodesById.get(id) || {}).title || id),
            ),
          ),
        ),
        h(
          'section',
          { className: 'la-taskblock' },
          h('h3', { className: 'la-taskcol__title' }, t('loop.task.evidence')),
          h(
            'ul',
            { className: 'la-tasksaved__list' },
            (task.evidenceRefs || []).map((ref) => h('li', { key: `${ref.kind}:${ref.id}` }, evidenceLabel(t, props.storeIndex, ref))),
          ),
        ),
        task.model && task.model.model
          ? h('p', { className: 'la-muted' }, `${t('loop.task.model')}：${task.model.provider || '?'} / ${task.model.model}`)
          : null,
      ),
      h('p', { className: 'la-taskeditor__notsent' }, taskText.split('\n').filter(Boolean).slice(-1)[0]),
    ),
  )
}

function CompareColumns(props) {
  const t = props.t
  const fields = [
    ['goal', t('loop.task.goal')],
    ['acceptance', t('loop.task.acceptance')],
    ['boundary', t('loop.task.boundary')],
    ['unknowns', t('loop.task.unknowns')],
  ]
  const renderValue = (value) => {
    if (Array.isArray(value)) {
      return h(
        'ul',
        null,
        value.map((item, index) => h('li', { key: index }, typeof item === 'string' ? item : item.text || item.question || '')),
      )
    }
    return String(value || '—')
  }
  return h(
    'div',
    { className: 'la-taskcompare__cols' },
    h('span', { className: 'la-muted' }, props.leftLabel),
    h('span', { className: 'la-muted' }, props.rightLabel),
    fields.map(([field, label]) => {
      const leftValue = JSON.stringify(props.left[field] || '')
      const rightValue = JSON.stringify(props.right[field] || '')
      const changed = leftValue !== rightValue
      return h(
        'div',
        { key: field, className: `la-taskcompare__row ${changed ? 'is-changed' : ''}`.trim() },
        h('span', { className: 'la-taskcompare__label' }, label),
        h('span', { className: 'la-taskcompare__cell' }, renderValue(props.left[field])),
        h('span', { className: 'la-taskcompare__cell' }, renderValue(props.right[field])),
      )
    }),
  )
}
  return { TasksSection, TaskEditor }
})
__def("views/EvidenceScale.js", function (__req) {
/**
 * 证据尺度：当前 subject 的实验 / 预测 / 研究问题 / 证据笔记 / 任务草案入口。
 * 实验内联展开，不用全屏模态；地图与返回路径保留在顶栏（尺度切换）。
 */

const { useState } = React

const { Button, Tag, EmptyState, SectionHeader } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { Collapsible, TimeLabel } = __req("views/shared.js")
const { experimentsForSubject, sourceSummary, subjectLabel } = __req("model.js")
const { ExperimentCard } = __req("views/Experiments.js")
const { PredictionsSection } = __req("views/Predictions.js")
const { InvestigationsSection } = __req("views/Investigations.js")
const { NotesSection } = __req("views/NotesSection.js")
const { TasksSection, TaskEditor } = __req("views/TaskEditor.js")
const { formatTime } = __req("util.js")

function EvidenceScale(props) {
  const t = props.t
  const ci = props.ci
  const storeIndex = props.storeIndex
  const subject = props.subject
  const [taskMode, setTaskMode] = useState(null) // null | { id?: string }
  const experiments = subject ? experimentsForSubject(ci, subject) : []
  const runs = subject ? storeIndex.runsFor(subject) : []
  const sources = subject ? sourceSummary(ci, subject) : { sources: 0, unverified: 0 }
  const investigations = subject ? storeIndex.investigationsFor(subject) : []
  const activeInvestigation = investigations.find((item) => item.status === 'open' || item.status === 'testing') || investigations[0] || null

  if (taskMode) {
    return h(TaskEditor, {
      t,
      ci,
      storeIndex,
      subject,
      perform: props.perform,
      addReceipt: props.addReceipt,
      initialTaskId: taskMode.id,
      onBack: () => setTaskMode(null),
    })
  }

  if (!subject) {
    return h(
      'section',
      { className: 'la-scale la-scale--evidence' },
      h(EmptyState, {
        icon: 'flask',
        title: t('loop.evidence.noSubject'),
        action: h(Button, { variant: 'primary', onClick: props.onGoSubject }, t('loop.evidence.pickSubject')),
      }),
    )
  }

  return h(
    'section',
    { className: 'la-scale la-scale--evidence', 'aria-label': t('loop.evidence.title') },
    h(
      'div',
      { className: 'la-scalehead' },
      h('h2', { className: 'la-scalehead__title' }, t('loop.evidence.title')),
      h(
        'p',
        { className: 'la-scalehead__hint' },
        `${subjectLabel(ci, subject, storeIndex.raw, t)} · ${t('loop.evidence.subjectSources', {
          sources: sources.sources,
          unverified: sources.unverified,
        })}`,
      ),
    ),
    activeInvestigation && activeInvestigation.nextTest
      ? h(
          'div',
          { className: 'la-nexttest' },
          h(Icon, { name: 'target', size: 18 }),
          h(
            'div',
            { className: 'la-nexttest__body' },
            h('span', { className: 'la-nexttest__label' }, t('loop.continue.nextTest')),
            h('p', { className: 'la-nexttest__text' }, activeInvestigation.nextTest),
          ),
          h(Tag, { tone: 'warn' }, t(`loop.inv.status.${activeInvestigation.status}`)),
        )
      : null,
    h(
      'div',
      { className: 'la-evidencegrid' },
      h(
        'section',
        { className: 'la-evpanel la-evpanel--experiments', 'aria-label': t('loop.evidence.experiments') },
        h(
          'div',
          { className: 'la-evsection__head' },
          h('h3', { className: 'la-evsection__title' }, t('loop.evidence.experiments')),
          h('span', { className: 'la-muted' }, t('loop.evidence.experimentHint')),
        ),
        experiments.length
          ? experiments.map((experiment) =>
              h(ExperimentCard, {
                key: experiment.id,
                t,
                experiment,
                runs,
                defaultOpen: experiments.length === 1,
                onPrefillObservation: (text) => props.onPrefillNote(text),
                onRun: (payload) =>
                  props.perform(
                    'experiment.run',
                    {
                      experimentId: experiment.id,
                      params: payload.params,
                      prediction: payload.prediction || null,
                      subject,
                    },
                    { successText: t('loop.exp.runSaved'), receipt: false },
                  ),
              }),
            )
          : h('p', { className: 'la-muted' }, t('loop.evidence.noExperiments')),
      ),
      h(
        'section',
        { className: 'la-evpanel', 'aria-label': t('loop.evidence.notes') },
        h(NotesSection, {
          t,
          subject,
          notes: storeIndex.notesFor(subject),
          draft: props.noteDraft,
          onDraftChange: props.onNoteDraftChange,
          onSave: props.onSaveNote,
          onSaveEdit: props.onSaveNoteEdit,
          onArchive: props.onArchiveNote,
          onDelete: props.onDeleteNote,
          className: 'la-notes--evidence',
        }),
      ),
      h(PredictionsSection, {
        t,
        storeIndex,
        subject,
        perform: props.perform,
      }),
      h(InvestigationsSection, {
        t,
        storeIndex,
        subject,
        perform: props.perform,
        onDiscuss: props.onDiscussInvestigation,
      }),
      h(TasksSection, {
        t,
        ci,
        storeIndex,
        subject,
        onNewTask: () => setTaskMode({}),
        onOpenTask: (id) => setTaskMode({ id }),
      }),
      h(
        'section',
        { className: 'la-evpanel', 'aria-label': t('loop.evidence.runs') },
        h(
          'div',
          { className: 'la-evsection__head' },
          h('h3', { className: 'la-evsection__title' }, `${t('loop.evidence.runs')} · ${runs.length}`),
        ),
        runs.length
          ? h(
              'ul',
              { className: 'la-runlist' },
              runs
                .slice(0, 12)
                .map((run) =>
                  h(
                    'li',
                    { key: run.id, className: 'la-runlist__item' },
                    h(
                      'span',
                      { className: 'la-runlist__verdict' },
                      run.verdict ? t(`loop.exp.verdict.${run.verdict}`) : '—',
                    ),
                    h('span', { className: 'la-runlist__params' }, JSON.stringify(run.params || {})),
                    h('span', { className: 'la-runlist__at' }, formatTime(run.at)),
                    h(
                      'span',
                      { className: 'la-runlist__model' },
                      `${run.modelId || ''}${run.modelVersion === null ? '' : ` v${run.modelVersion}`}`,
                    ),
                    run.criterion ? h('span', { className: 'la-runlist__criterion' }, run.criterion) : null,
                  ),
                ),
            )
          : h('p', { className: 'la-muted' }, t('loop.evidence.noRuns')),
      ),
    ),
  )
}
  return { EvidenceScale }
})
__def("views/ChatPanel.js", function (__req) {
/**
 * 对话面板：消息流、流式输出、停止、失败原因 + 重试、重开恢复、AI 回复存为草案。
 * 回答归属发送时的 subject；面板只显示传入 subject 的历史。
 */

const { useState, useEffect, useRef } = React

const { Button, Tag, Notice } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { Collapsible, MetaLine, TimeLabel, useCopyText } = __req("views/shared.js")
const { formatTime } = __req("util.js")

function roleLabel(t, message) {
  return message.role === 'assistant' ? t('loop.chat.ai') : t('loop.chat.you')
}

function messageStatusTag(t, message) {
  if (message.status === 'failed') return h(Tag, { tone: 'danger' }, t('loop.chat.failed'))
  if (message.status === 'cancelled') return h(Tag, { tone: 'warn' }, t('loop.chat.cancelled'))
  if (message.status === 'streaming') return h(Tag, { tone: 'warn' }, t('loop.chat.streaming'))
  return null
}

function ChatPanel(props) {
  const t = props.t
  const subject = props.subject
  const dialog = props.dialog
  const stream = props.stream
  const messages = dialog ? dialog.messages : []
  const [draft, setDraft] = useState(props.draft || '')
  const [adoptingId, setAdoptingId] = useState('')
  const listRef = useRef(null)
  const copy = useCopyText(t, props.addReceipt)
  const modelAvailable = props.modelAvailable !== false
  const modelReason = props.modelReason || t('loop.chat.noModel')
  const streaming = !!stream && (stream.phase === 'streaming' || stream.phase === 'stopping' || stream.phase === 'finishing')
  const streamText = stream ? stream.text : ''
  const streamError = stream && stream.phase === 'error' ? stream.error : null

  useEffect(() => {
    setDraft(props.draft || '')
  }, [props.draft, props.subjectKey])

  useEffect(() => {
    const element = listRef.current
    if (!element) return
    element.scrollTop = element.scrollHeight
  }, [messages.length, streamText])

  const submit = async () => {
    const text = draft.trim()
    if (!text || streaming) return
    if (props.onDraftChange) props.onDraftChange('')
    setDraft('')
    await props.onSend(text)
  }

  const retryMessage = async (message) => {
    if (!message.requestId) return
    await props.onRetry(message.requestId)
  }

  const adopt = async (message) => {
    setAdoptingId(message.id)
    try {
      await props.onAdoptDraft(message)
    } finally {
      setAdoptingId('')
    }
  }

  const isAdopted = (message) => typeof props.isAdopted === 'function' && props.isAdopted(message)

  return h(
    'div',
    { className: 'la-chat' },
    !modelAvailable
      ? h(Notice, { tone: 'warn' }, t('loop.chat.modelUnavailable', { reason: modelReason }))
      : null,
    h(
      'div',
      { className: 'la-chat__list', ref: listRef, role: 'log', 'aria-label': t('loop.a11y.chat'), 'aria-live': 'polite' },
      !messages.length && !streaming
        ? h('p', { className: 'la-chat__empty' }, t('loop.chat.empty'))
        : null,
      messages.map((message) => {
        const isAssistant = message.role === 'assistant'
        const interrupted = message.status === 'streaming'
        const retryable = (message.status === 'failed' || message.status === 'cancelled' || interrupted) && message.requestId
        return h(
          'article',
          { key: message.id, className: `la-msg la-msg--${message.role}` },
          h(
            'div',
            { className: 'la-msg__head' },
            h('span', { className: 'la-msg__role' }, roleLabel(t, message)),
            messageStatusTag(t, message),
            h(TimeLabel, { at: message.at }),
            isAssistant && message.model && message.model.model
              ? h('span', { className: 'la-muted' }, `${message.model.provider || '?'}/${message.model.model}`)
              : null,
          ),
          h('div', { className: 'la-msg__text' }, message.text || (interrupted ? t('loop.chat.partial') : '')),
          message.error
            ? h(
                'div',
                { className: 'la-msg__error', role: 'alert' },
                h('p', null, `${message.error.code ? `[${message.error.code}] ` : ''}${message.error.message || t('loop.chat.failed')}`),
                retryable
                  ? h(Button, { size: 'sm', variant: 'secondary', icon: 'refresh', onClick: () => retryMessage(message) }, t('loop.chat.retry'))
                  : null,
              )
            : null,
          interrupted
            ? h(
                'div',
                { className: 'la-msg__error' },
                h('p', null, t('loop.chat.interrupted')),
                message.requestId
                  ? h(Button, { size: 'sm', variant: 'secondary', icon: 'refresh', onClick: () => retryMessage(message) }, t('loop.chat.retry'))
                  : null,
              )
            : null,
          isAssistant && message.text && message.status === 'completed'
            ? h(
                'div',
                { className: 'la-msg__actions' },
                h(
                  Button,
                  {
                    size: 'sm',
                    variant: isAdopted(message) ? 'ghost' : 'secondary',
                    icon: isAdopted(message) ? 'check' : 'notes',
                    disabled: isAdopted(message) || adoptingId === message.id,
                    loading: adoptingId === message.id,
                    onClick: () => adopt(message),
                    title: t('loop.note.draftHint'),
                  },
                  isAdopted(message) ? t('loop.note.adoptedDraft') : t('loop.note.adoptDraft'),
                ),
                h(
                  'button',
                  { type: 'button', className: 'la-linkbtn', onClick: () => copy(message.text) },
                  t('loop.chat.copy'),
                ),
              )
            : null,
        )
      }),
      streaming
        ? h(
            'article',
            { className: 'la-msg la-msg--assistant is-streaming' },
            h(
              'div',
              { className: 'la-msg__head' },
              h('span', { className: 'la-msg__role' }, t('loop.chat.ai')),
              h(Tag, { tone: 'warn' }, stream.phase === 'stopping' ? t('loop.chat.stopping') : t('loop.chat.streaming')),
            ),
            h('div', { className: 'la-msg__text' }, streamText || '…'),
          )
        : null,
      streamError
        ? h(
            'article',
            { className: 'la-msg la-msg--assistant is-error', role: 'alert' },
            h(
              'div',
              { className: 'la-msg__head' },
              h('span', { className: 'la-msg__role' }, t('loop.chat.ai')),
              h(Tag, { tone: 'danger' }, t('loop.chat.failed')),
            ),
            h('div', { className: 'la-msg__error' }, h('p', null, `[${streamError.code}] ${streamError.message}`)),
            h(
              'div',
              { className: 'la-msg__actions' },
              stream.requestId
                ? h(Button, { size: 'sm', variant: 'secondary', icon: 'refresh', onClick: () => props.onRetry(stream.requestId) }, t('loop.chat.retry'))
                : stream.sentText
                  ? h(
                      Button,
                      {
                        size: 'sm',
                        variant: 'secondary',
                        icon: 'refresh',
                        onClick: () => props.onResend(stream.sentText),
                      },
                      t('loop.chat.retry'),
                    )
                  : null,
              h('button', { type: 'button', className: 'la-linkbtn', onClick: () => props.onDismissError() }, t('loop.common.dismiss')),
            ),
          )
        : null,
    ),
    subject
      ? h(
          'div',
          { className: 'la-chat__composer' },
          h('textarea', {
            className: 'la-textarea la-chat__input',
            rows: 3,
            value: draft,
            placeholder: t('loop.chat.placeholder'),
            'aria-label': t('loop.chat.placeholder'),
            disabled: !modelAvailable,
            onChange: (event) => {
              setDraft(event.target.value)
              if (props.onDraftChange) props.onDraftChange(event.target.value)
            },
            onKeyDown: (event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            },
          }),
          h(
            'div',
            { className: 'la-chat__actions' },
            h('span', { className: 'la-chat__hint la-muted' }, t('loop.chat.draftHint')),
            streaming
              ? h(
                  Button,
                  {
                    variant: 'danger',
                    size: 'sm',
                    icon: 'stop',
                    loading: stream.phase === 'stopping',
                    onClick: () => props.onStop(),
                  },
                  stream.phase === 'stopping' ? t('loop.chat.stopping') : t('loop.chat.stop'),
                )
              : h(
                  Button,
                  {
                    variant: 'primary',
                    size: 'sm',
                    icon: 'send',
                    disabled: !draft.trim() || !modelAvailable,
                    onClick: submit,
                  },
                  t('loop.chat.send'),
                ),
          ),
          h(
            'p',
            { className: 'la-chat__footnote' },
            t('loop.chat.subjectNote'),
          ),
        )
      : null,
  )
}
  return { ChatPanel }
})
__def("views/RelationInspector.js", function (__req) {
/**
 * 关系详情（右侧）：类型、主张、条件、代价、主张级来源、个人批注与状态、相关证据。
 * 批注是用户自己的判断；保存回执只来自 Host。
 */

const { useState, useMemo, useEffect } = React

const { Button, Tag, FieldLabel, EmptyState } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { ClaimList } = __req("views/Claims.js")
const { Collapsible, TimeLabel } = __req("views/shared.js")
const { claimsForIds, relationTypeLabel } = __req("model.js")

function RelationInspector(props) {
  const t = props.t
  const ci = props.ci
  const relation = props.relation
  const record = props.record
  const notes = props.notes || []
  const [annotation, setAnnotation] = useState(record ? record.annotation : '')
  const [status, setStatus] = useState(record ? record.status : 'open')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setAnnotation(record ? record.annotation : '')
    setStatus(record ? record.status : 'open')
    setError('')
  }, [relation && relation.id, record && record.version, record && record.annotation, record && record.status])

  const claims = useMemo(() => (relation ? claimsForIds(ci, relation.claimIds) : []), [ci, relation])
  const evidenceIds = new Set(record ? record.evidenceNoteIds : [])
  if (!relation) {
    return h(EmptyState, { icon: 'graph', title: t('loop.relation.selectHint') })
  }
  const from = ci.nodesById.get(relation.from)
  const to = ci.nodesById.get(relation.to)

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await props.onSaveAnnotation({ annotation, status })
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy(false)
    }
  }

  const toggleEvidence = async (note) => {
    const next = evidenceIds.has(note.id)
      ? (record ? record.evidenceNoteIds : []).filter((id) => id !== note.id)
      : [...(record ? record.evidenceNoteIds : []), note.id]
    try {
      await props.onSaveAnnotation({
        annotation: record ? record.annotation : annotation,
        status: record ? record.status : status,
        evidenceNoteIds: next,
      })
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    }
  }

  return h(
    'section',
    { className: 'la-inspector', 'aria-label': t('loop.relation.detail') },
    h(
      'div',
      { className: 'la-inspector__head' },
      h(Tag, { tone: 'accent' }, relationTypeLabel(t, relation.type)),
      record && record.version ? h('span', { className: 'la-muted' }, `${t('loop.common.revision')} ${record.version}`) : null,
      h('span', { className: 'la-inspector__grow' }),
      h(
        'button',
        { type: 'button', className: 'la-linkbtn', onClick: props.onClearRelation, title: t('loop.subject.clearRelation') },
        t('loop.subject.clearRelation'),
      ),
    ),
    h('h3', { className: 'la-inspector__route' }, `${from ? from.title : relation.from} → ${to ? to.title : relation.to}`),
    h(
      'div',
      { className: 'la-inspector__block' },
      h(FieldLabel, null, t('loop.relation.claim')),
      h('p', { className: 'la-inspector__text' }, relation.claim || h('span', { className: 'la-muted' }, t('loop.relation.noClaim') || '—')),
      h(FieldLabel, null, t('loop.relation.condition')),
      h(
        'p',
        { className: 'la-inspector__text' },
        relation.condition || h('span', { className: 'la-warnText' }, t('loop.relation.noCondition')),
      ),
      h(FieldLabel, null, t('loop.relation.cost')),
      h('p', { className: 'la-inspector__text' }, relation.cost || h('span', { className: 'la-warnText' }, t('loop.relation.noCost'))),
    ),
    claims.length
      ? h(Collapsible, { title: t('loop.relation.claims'), defaultOpen: true },
          h(ClaimList, { t, claims, ci, onOpenSource: props.onOpenSource }),
        )
      : h(Collapsible, { title: t('loop.relation.claims') }, h('p', { className: 'la-muted' }, t('loop.relation.noClaims'))),
    h(
      'div',
      { className: 'la-annotation' },
      h(FieldLabel, null, t('loop.relation.annotation')),
      h('textarea', {
        className: 'la-textarea',
        rows: 3,
        value: annotation,
        placeholder: t('loop.relation.annotationPlaceholder'),
        onChange: (event) => setAnnotation(event.target.value),
        'aria-label': t('loop.relation.annotation'),
      }),
      h(
        'div',
        { className: 'la-annotation__row' },
        h(
          'label',
          { className: 'la-notekind' },
          h('span', { className: 'la-notekind__label' }, t('loop.relation.status')),
          h(
            'select',
            {
              className: 'la-select la-select--sm',
              value: status,
              onChange: (event) => setStatus(event.target.value),
            },
            ['open', 'supported', 'challenged'].map((value) =>
              h('option', { key: value, value }, t(`loop.relation.status.${value}`)),
            ),
          ),
        ),
        h(Button, { variant: 'primary', size: 'sm', loading: busy, onClick: save }, t('loop.relation.saveAnnotation')),
      ),
      error ? h('p', { className: 'la-inlineerror', role: 'alert' }, error) : null,
      record && record.updatedAt
        ? h('p', { className: 'la-muted la-inspector__savedat' }, `${t('loop.status.ok')}：`, h(TimeLabel, { at: record.updatedAt }))
        : null,
    ),
    h(
      'div',
      { className: 'la-evidence' },
      h(FieldLabel, null, t('loop.relation.evidence', { count: notes.length })),
      notes.length
        ? h(
            'ul',
            { className: 'la-evidence__list' },
            notes.map((note) =>
              h(
                'li',
                { key: note.id, className: 'la-evidence__item' },
                h('p', { className: 'la-evidence__text' }, note.text),
                h(
                  'div',
                  { className: 'la-evidence__meta' },
                  h('span', { className: 'la-muted' }, `${t(`loop.note.source.${note.authorSource === 'user' ? 'user' : 'ai-draft'}`)}`),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: `la-chip ${evidenceIds.has(note.id) ? 'is-on' : ''}`,
                      onClick: () => toggleEvidence(note),
                      'aria-pressed': evidenceIds.has(note.id),
                    },
                    evidenceIds.has(note.id) ? t('loop.relation.detach') : t('loop.relation.attach'),
                  ),
                ),
              ),
            ),
          )
        : h('p', { className: 'la-muted' }, t('loop.relation.evidenceEmpty')),
    ),
    h(
      'div',
      { className: 'la-inspector__actions' },
      h(Button, { variant: 'secondary', icon: 'chat', onClick: props.onAsk }, t('loop.relation.ask')),
    ),
  )
}
  return { RelationInspector }
})
__def("views/Partner.js", function (__req) {
/**
 * 右侧学习伙伴：当前主题 + 来源摘要 + 真实模型状态 + 关系详情 + 对话/笔记 tab。
 * 宽度由外层 CSS 变量控制；窄屏时作为"对话"分段出现。
 */

const { useState, useMemo } = React

const { Tag, StatusDot, EmptyState, IconButton } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { subjectLabel, subjectTypeLabel, sourceSummary } = __req("model.js")
const { subjectKey } = __req("util.js")
const { ChatPanel } = __req("views/ChatPanel.js")
const { NotesSection } = __req("views/NotesSection.js")
const { RelationInspector } = __req("views/RelationInspector.js")

function TabButton(props) {
  return h(
    'button',
    {
      type: 'button',
      role: 'tab',
      id: props.id,
      'aria-selected': props.active,
      'aria-controls': props.controls,
      tabIndex: props.active ? 0 : -1,
      className: `la-partnertab ${props.active ? 'is-active' : ''}`.trim(),
      onClick: props.onClick,
      onKeyDown: props.onKeyDown,
    },
    props.icon ? h('span', { className: 'la-partnertab__icon' }, props.icon) : null,
    props.label,
    props.count !== undefined ? h('span', { className: 'la-partnertab__count' }, String(props.count)) : null,
  )
}

function Partner(props) {
  const t = props.t
  const ci = props.ci
  const storeIndex = props.storeIndex
  const subject = props.subject
  const selectedRelation = props.selectedRelation
  const relationRecord = selectedRelation ? storeIndex.relationFor(selectedRelation.id) : null
  const notes = useMemo(() => (subject ? storeIndex.notesFor(subject) : []), [storeIndex, subject])
  const [internalTab, setInternalTab] = useState('chat')
  const tab = props.tab || internalTab
  const setTab = props.onTabChange || setInternalTab
  const summary = useMemo(() => (subject ? sourceSummary(ci, subject) : { sources: 0, unverified: 0 }), [ci, subject])
  const dialog = subject ? storeIndex.getDialog(subject) : null
  const chat = props.chat
  const modelAvailable = props.modelAvailable !== false
  const modelReason = props.modelReason || t('loop.chat.noModel')

  const relationNotes = selectedRelation
    ? storeIndex.notesFor({ kind: 'relation', id: selectedRelation.id })
    : []

  const onTabKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setTab((current) => (current === 'chat' ? 'notes' : 'chat'))
  }

  return h(
    'aside',
    { className: 'la-partner', 'aria-label': t('loop.partner.title') },
    h(
      'div',
      { className: 'la-partner__head' },
      h(
        'div',
        { className: 'la-partner__subject' },
        subject
          ? h(
              'div',
              { className: 'la-partner__subjectrow' },
              h(Tag, { tone: 'accent' }, subjectTypeLabel(t, subject)),
              h('h2', { className: 'la-partner__subjectname' }, subjectLabel(ci, subject, storeIndex.raw, t)),
            )
          : h('h2', { className: 'la-partner__subjectname' }, t('loop.partner.title')),
        subject
          ? h(
              'p',
              { className: 'la-partner__sources' },
              t('loop.chat.sourcesSummary', { sources: summary.sources, unverified: summary.unverified }),
            )
          : null,
        h(
          'p',
          { className: 'la-partner__model' },
          h(StatusDot, { tone: modelAvailable ? 'ok' : 'danger' }),
          props.model && props.model.model
            ? `${t('loop.partner.model')}：${props.model.provider || '?'} / ${props.model.model}`
            : t('loop.chat.noModel'),
          modelAvailable ? null : h(Tag, { tone: 'danger' }, t('loop.partner.model.unavailable')),
        ),
      ),
      h(IconButton, { icon: 'collapseRight', label: t('loop.partner.hide'), onClick: props.onCollapse }),
    ),
    !subject
      ? h(EmptyState, { icon: 'chat', title: t('loop.evidence.noSubject') })
      : h(
          'div',
          { className: 'la-partner__body' },
          selectedRelation
            ? h(
                'div',
                { className: 'la-partner__inspector' },
                h(RelationInspector, {
                  t,
                  ci,
                  relation: selectedRelation,
                  record: relationRecord,
                  notes: relationNotes,
                  onOpenSource: props.onOpenSource,
                  onClearRelation: props.onClearRelation,
                  onAsk: () => setTab('chat'),
                  onSaveAnnotation: (payload) =>
                    props.perform('relation.annotate', Object.assign({ edgeId: selectedRelation.id }, payload), {
                      successText: t('loop.relation.saved'),
                    }),
                }),
              )
            : null,
          h(
            'div',
            { className: 'la-partner__tabs', role: 'tablist', 'aria-label': t('loop.partner.title') },
            h(TabButton, {
              id: 'la-tab-chat',
              controls: 'la-panel-chat',
              active: tab === 'chat',
              label: t('loop.partner.tab.chat'),
              icon: h(Icon, { name: 'chat', size: 16 }),
              onClick: () => setTab('chat'),
              onKeyDown: onTabKeyDown,
            }),
            h(TabButton, {
              id: 'la-tab-notes',
              controls: 'la-panel-notes',
              active: tab === 'notes',
              label: t('loop.partner.tab.notes'),
              count: notes.length,
              icon: h(Icon, { name: 'notes', size: 16 }),
              onClick: () => setTab('notes'),
              onKeyDown: onTabKeyDown,
            }),
          ),
          tab === 'chat'
            ? h(
                'div',
                { className: 'la-partner__panel', role: 'tabpanel', id: 'la-panel-chat', 'aria-labelledby': 'la-tab-chat' },
                h(ChatPanel, {
                  t,
                  subject,
                  subjectKey: subjectKey(subject),
                  dialog,
                  stream: chat.streamFor(subject),
                  draft: chat.draftFor(subject),
                  addReceipt: props.addReceipt,
                  modelAvailable,
                  modelReason,
                  onDraftChange: (text) => chat.setDraft(subject, text),
                  onSend: (text) => chat.send(subject, text),
                  onRetry: (requestId) => chat.retry(subject, requestId),
                  onResend: (text) => chat.resend(subject, text),
                  onStop: () => chat.stop(subject),
                  onDismissError: () => chat.dismissError(subject),
                  onAdoptDraft: props.onAdoptDraft,
                  isAdopted: props.isAdopted,
                }),
              )
            : h(
                'div',
                { className: 'la-partner__panel', role: 'tabpanel', id: 'la-panel-notes', 'aria-labelledby': 'la-tab-notes' },
                h(NotesSection, {
                  t,
                  subject,
                  notes,
                  compact: true,
                  draft: props.noteDraft,
                  onDraftChange: props.onNoteDraftChange,
                  onSave: props.onSaveNote,
                  onSaveEdit: props.onSaveNoteEdit,
                  onArchive: props.onArchiveNote,
                  onDelete: props.onDeleteNote,
                }),
              ),
        ),
  )
}
  return { Partner }
})
__def("views/ResourcesDialog.js", function (__req) {
/**
 * 资料与备份：数据路径、备份、导出、导入（先预览冲突再确认）、迁移报告、导入历史。
 * 所有成功提示都来自 Host 真实回执；导入冲突必须显式展示。
 */

const { useState, useRef } = React

const { Dialog } = __req("components/Dialog.js")
const { Button, Tag, Notice, FieldLabel, EmptyState } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { formatBytes, formatTime, downloadJson } = __req("util.js")

const MAX_PACK_BYTES = 8 * 1024 * 1024

function summarizeCounts(counts) {
  if (!counts || typeof counts !== 'object') return '—'
  return Object.entries(counts)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => `${key} ${value}`)
    .join(' · ')
}

function ResourcesDialog(props) {
  const t = props.t
  const data = props.data || {}
  const meta = (data.store && data.store.meta) || {}
  const fileRef = useRef(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [pack, setPack] = useState(null)
  const [mode, setMode] = useState('merge')
  const [replaceConfirmed, setReplaceConfirmed] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [migration, setMigration] = useState(data.migrationReport || null)
  const notices = []
  for (const notice of data.notices || []) notices.push(notice)
  for (const notice of meta.notices || []) notices.push(notice)

  const setBusyNamed = (name) => setBusy(name)

  const runBusy = async (name, task) => {
    setBusy(name)
    setError('')
    try {
      await task()
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusy('')
    }
  }

  const backup = () =>
    runBusy('backup', async () => {
      await props.perform('backup.create', {}, {
        successText: (result) => t('loop.res.backupDone', { path: (result && result.path) || '—' }),
      })
    })

  const exportPack = () =>
    runBusy('export', async () => {
      const result = await props.perform('package.export', {}, { receipt: false })
      const packData = result && result.pack ? result.pack : null
      if (!packData) throw new Error(t('loop.res.invalidPack'))
      const filename = `loop-atlas-${new Date().toISOString().slice(0, 10)}.json`
      const written = downloadJson(filename, packData)
      if (!written.ok) throw new Error(`${t('loop.common.copyFailed')}：${written.reason}`)
      if (props.addReceipt) props.addReceipt({ kind: 'ok', text: t('loop.res.exportDone') })
    })

  const pickFile = () => {
    setError('')
    setPreview(null)
    setPack(null)
    setImportResult(null)
    if (fileRef.current) fileRef.current.click()
  }

  const onFile = async (event) => {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (!file) return
    setBusyNamed('preview')
    setError('')
    setPreview(null)
    setPack(null)
    setImportResult(null)
    try {
      if (file.size > MAX_PACK_BYTES) {
        throw new Error(t('loop.res.packTooLarge', { size: formatBytes(file.size) }))
      }
      const text = await file.text()
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch (parseError) {
        throw new Error(t('loop.res.parseError', { reason: String((parseError && parseError.message) || parseError) }))
      }
      if (!parsed || parsed.kind !== 'loop-atlas-user-package') {
        throw new Error(t('loop.res.invalidPack'))
      }
      const response = await props.perform('package.preview', { pack: parsed }, { receipt: false, reload: false })
      setPack(parsed)
      setPreview(response.preview || {})
      setMode('merge')
      setReplaceConfirmed(false)
    } catch (rawError) {
      setError(String((rawError && rawError.message) || rawError))
    } finally {
      setBusyNamed('')
    }
  }

  const confirmImport = () =>
    runBusy('import', async () => {
      if (!pack) return
      if (mode === 'replace' && !replaceConfirmed) {
        throw new Error(t('loop.res.replaceConfirm'))
      }
      const response = await props.perform(
        'package.import',
        { pack, mode, confirm: mode === 'replace' ? replaceConfirmed : undefined },
        { receipt: false },
      )
      const conflicts = response.conflicts || []
      setImportResult({
        applied: response.applied === undefined ? null : response.applied,
        counts: response.counts || null,
        conflicts,
      })
      if (props.addReceipt) {
        props.addReceipt({
          kind: conflicts.length ? 'error' : 'ok',
          text: conflicts.length
            ? `${t('loop.res.conflicts', { count: conflicts.length })}`
            : t('loop.res.importDone', { summary: summarizeCounts(response.counts || response.applied) }),
        })
      }
      if (!conflicts.length) {
        setPreview(null)
        setPack(null)
      }
    })

  const loadMigration = () =>
    runBusy('migration', async () => {
      const response = await props.perform('migration.report', {}, { receipt: false, reload: false })
      setMigration(response.report || null)
    })

  const previewCounts = preview ? preview.counts || {} : {}
  const previewConflicts = preview ? preview.conflicts || [] : []
  const previewErrors = preview ? preview.errors || [] : []

  return h(
    Dialog,
    {
      open: props.open,
      onClose: props.onClose,
      title: t('loop.res.title'),
      description: t('loop.common.optional'),
      size: 'lg',
      closeLabel: t('loop.common.close'),
      footer: h(
        'div',
        { className: 'la-dialog__actions' },
        h(Button, { variant: 'ghost', onClick: props.onClose }, t('loop.common.close')),
      ),
    },
    h(
      'div',
      { className: 'la-resources' },
      error ? h(Notice, { tone: 'error' }, error) : null,
      h(
        'section',
        { className: 'la-resblock' },
        h(FieldLabel, null, t('loop.res.dataPath')),
        h(
          'div',
          { className: 'la-respath' },
          h(Icon, { name: 'folder', size: 16 }),
          h('code', { className: 'la-respath__text' }, data.dataPath || '—'),
          h(
            Button,
            {
              size: 'sm',
              variant: 'ghost',
              onClick: async () => {
                if (!props.copyText) return
                await props.copyText(data.dataPath || '')
              },
            },
            t('loop.res.copyPath'),
          ),
        ),
        h(
          'div',
          { className: 'la-resrow' },
          h(Button, { variant: 'secondary', icon: 'archive', loading: busy === 'backup', onClick: backup }, t('loop.res.backup')),
          h(Button, { variant: 'secondary', icon: 'external', loading: busy === 'export', onClick: exportPack }, t('loop.res.export')),
          h(
            Button,
            { variant: 'secondary', icon: 'notes', loading: busy === 'migration', onClick: loadMigration },
            t('loop.res.migration'),
          ),
          h(Button, { variant: 'secondary', icon: 'folder', onClick: pickFile }, t('loop.res.import')),
          h('input', {
            ref: fileRef,
            type: 'file',
            accept: 'application/json,.json',
            style: { display: 'none' },
            onChange: onFile,
            tabIndex: -1,
            'aria-hidden': 'true',
          }),
        ),
        h('p', { className: 'la-muted' }, t('loop.res.importIdempotent')),
      ),
      preview
        ? h(
            'section',
            { className: 'la-resblock' },
            h(FieldLabel, null, t('loop.res.preview')),
            h(
              'p',
              { className: 'la-respreview__line' },
              `${t('loop.res.counts', { summary: summarizeCounts(previewCounts) })} · ${
                preview.version ? `v${preview.version}` : ''
              }${preview.schema ? ` · schema ${preview.schema}` : ''}`,
            ),
            previewErrors.length
              ? h(
                  'div',
                  { className: 'la-respreview__errors' },
                  h(Tag, { tone: 'danger' }, t('loop.res.errors', { count: previewErrors.length })),
                  h(
                    'ul',
                    { className: 'la-reslist' },
                    previewErrors.slice(0, 20).map((item, index) =>
                      h('li', { key: index }, typeof item === 'string' ? item : item.message || JSON.stringify(item)),
                    ),
                  ),
                  h('p', { className: 'la-hintwarn' }, t('loop.res.blocked')),
                )
              : null,
            previewConflicts.length
              ? h(
                  'div',
                  { className: 'la-respreview__conflicts' },
                  h(Tag, { tone: 'warn' }, t('loop.res.conflicts', { count: previewConflicts.length })),
                  h(
                    'ul',
                    { className: 'la-reslist' },
                    previewConflicts.slice(0, 20).map((item, index) =>
                      h('li', { key: index }, typeof item === 'string' ? item : item.id || item.message || JSON.stringify(item)),
                    ),
                  ),
                )
              : null,
            h(
              'div',
              { className: 'la-resmodes', role: 'radiogroup', 'aria-label': t('loop.res.mode') },
              h('span', { className: 'la-fieldlabel' }, t('loop.res.mode')),
              ['merge', 'skip', 'replace'].map((value) =>
                h(
                  'label',
                  { key: value, className: 'la-radio' },
                  h('input', {
                    type: 'radio',
                    name: 'la-import-mode',
                    value,
                    checked: mode === value,
                    onChange: () => setMode(value),
                  }),
                  h('span', null, t(`loop.res.mode.${value}`)),
                ),
              ),
            ),
            mode === 'replace'
              ? h(
                  'label',
                  { className: 'la-check' },
                  h('input', {
                    type: 'checkbox',
                    checked: replaceConfirmed,
                    onChange: (event) => setReplaceConfirmed(event.target.checked),
                  }),
                  h('span', null, t('loop.res.replaceConfirm')),
                )
              : null,
            h(
              'div',
              { className: 'la-resrow' },
              h(
                Button,
                {
                  variant: 'primary',
                  icon: 'check',
                  loading: busy === 'import',
                  disabled: previewErrors.length > 0 || (mode === 'replace' && !replaceConfirmed),
                  onClick: confirmImport,
                },
                t('loop.res.confirmImport'),
              ),
              h(Button, { variant: 'ghost', onClick: pickFile }, t('loop.res.importPick')),
            ),
          )
        : null,
      importResult
        ? h(
            'section',
            { className: 'la-resblock' },
            h(FieldLabel, null, t('loop.res.import')),
            importResult.conflicts.length
              ? h(
                  'div',
                  null,
                  h(Tag, { tone: 'danger' }, t('loop.res.conflictList')),
                  h(
                    'ul',
                    { className: 'la-reslist' },
                    importResult.conflicts.slice(0, 20).map((item, index) =>
                      h('li', { key: index }, typeof item === 'string' ? item : item.id || JSON.stringify(item)),
                    ),
                  ),
                )
              : h('p', { className: 'la-okText' }, t('loop.res.importDone', { summary: summarizeCounts(importResult.counts || importResult.applied) })),
          )
        : null,
      h(
        'section',
        { className: 'la-resblock' },
        h(FieldLabel, null, t('loop.res.migration')),
        migration
          ? h(
              'div',
              { className: 'la-migration' },
              h(
                'dl',
                { className: 'la-migration__list' },
                Object.entries(migration)
                  .filter(([, value]) => value === null || ['string', 'number', 'boolean'].includes(typeof value))
                  .map(([key, value]) => h('div', { key, className: 'la-migration__row' }, h('dt', null, key), h('dd', null, String(value)))),
              ),
              h('pre', { className: 'la-pre' }, JSON.stringify(migration, null, 2)),
            )
          : h('p', { className: 'la-muted' }, t('loop.res.migrationEmpty')),
      ),
      notices.length
        ? h(
            'section',
            { className: 'la-resblock' },
            h(FieldLabel, null, t('loop.res.notices')),
            notices.map((notice, index) =>
              h(
                'p',
                { key: index, className: `la-notice la-notice--${notice.level === 'warn' ? 'warn' : 'info'}` },
                h(Icon, { name: notice.level === 'warn' ? 'warning' : 'info', size: 16 }),
                h('span', null, notice.text || JSON.stringify(notice)),
              ),
            ),
          )
        : null,
      (data.store && data.store.importLog && data.store.importLog.length) || (props.storeIndex && props.storeIndex.importLog.length)
        ? h(
            'section',
            { className: 'la-resblock' },
            h(FieldLabel, null, t('loop.res.importLog')),
            h(
              'ul',
              { className: 'la-reslist' },
              (data.store.importLog || []).slice(0, 10).map((entry, index) =>
                h(
                  'li',
                  { key: index },
                  `${formatTime(entry.at)} · ${entry.mode || ''} · ${summarizeCounts(entry.counts || {})} · ${
                    t('loop.res.conflicts', { count: entry.conflicts || 0 })
                  }`,
                ),
              ),
            ),
          )
        : null,
    ),
  )
}
  return { ResourcesDialog }
})
__def("views/ContinueDialog.js", function (__req) {
/**
 * "继续研究"：上次阅读、进行中的研究问题（含下一项检验）、待验证预测、最近运行。
 * 全部来自真实 state，不编造进度。
 */

const { Dialog } = __req("components/Dialog.js")
const { Button, Tag, EmptyState, FieldLabel } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { TimeLabel } = __req("views/shared.js")
const { subjectFromView, subjectLabel } = __req("model.js")
const { formatTime } = __req("util.js")

function ContinueDialog(props) {
  const t = props.t
  const ci = props.ci
  const storeIndex = props.storeIndex
  const view = props.view
  const lastSubject = subjectFromView(view)
  const investigations = storeIndex.openInvestigations().slice(0, 6)
  const predictions = storeIndex.openPredictions().slice(0, 6)
  const runs = storeIndex.runs.slice(0, 5)
  const empty = !lastSubject && !investigations.length && !predictions.length && !runs.length

  return h(
    Dialog,
    {
      open: props.open,
      onClose: props.onClose,
      title: t('loop.continue.title'),
      size: 'md',
      closeLabel: t('loop.common.close'),
      footer: h('div', { className: 'la-dialog__actions' }, h(Button, { variant: 'ghost', onClick: props.onClose }, t('loop.common.close'))),
    },
    h(
      'div',
      { className: 'la-continue' },
      empty ? h(EmptyState, { icon: 'clock', title: t('loop.continue.empty') }) : null,
      lastSubject
        ? h(
            'section',
            { className: 'la-continue__block' },
            h(FieldLabel, null, t('loop.continue.lastSubject')),
            h(
              'button',
              { type: 'button', className: 'la-continue__row', onClick: () => props.onGoSubject(lastSubject) },
              h(Icon, { name: 'target', size: 16 }),
              h(
                'span',
                { className: 'la-continue__main' },
                h('span', { className: 'la-continue__title' }, subjectLabel(ci, lastSubject, storeIndex.raw, t)),
                h('span', { className: 'la-muted' }, `${t('loop.scale.subject')} · ${view.scale}`),
              ),
              h(Tag, { tone: 'accent' }, t('loop.continue.open')),
            ),
          )
        : null,
      investigations.length
        ? h(
            'section',
            { className: 'la-continue__block' },
            h(FieldLabel, null, t('loop.continue.investigations')),
            investigations.map((investigation) =>
              h(
                'button',
                {
                  key: investigation.id,
                  type: 'button',
                  className: 'la-continue__row',
                  onClick: () => props.onGoInvestigation(investigation),
                },
                h(Icon, { name: 'flask', size: 16 }),
                h(
                  'span',
                  { className: 'la-continue__main' },
                  h('span', { className: 'la-continue__title' }, investigation.title || t('loop.inv.title')),
                  h(
                    'span',
                    { className: 'la-muted' },
                    `${t('loop.continue.nextTest')}：${investigation.nextTest || t('loop.continue.noNextTest')}`,
                  ),
                ),
                h(Tag, { tone: 'warn' }, t(`loop.inv.status.${investigation.status}`)),
              ),
            ),
          )
        : null,
      predictions.length
        ? h(
            'section',
            { className: 'la-continue__block' },
            h(FieldLabel, null, t('loop.continue.predictions')),
            predictions.map((prediction) =>
              h(
                'button',
                {
                  key: prediction.id,
                  type: 'button',
                  className: 'la-continue__row',
                  onClick: () => props.onGoSubject(prediction.subject, 'evidence'),
                },
                h(Icon, { name: 'target', size: 16 }),
                h(
                  'span',
                  { className: 'la-continue__main' },
                  h('span', { className: 'la-continue__title' }, prediction.text),
                  h('span', { className: 'la-muted' }, prediction.resolveBy ? `${t('loop.pred.resolveBy')}：${prediction.resolveBy}` : ''),
                ),
                h(Tag, { tone: 'warn' }, t('loop.pred.status.open')),
              ),
            ),
          )
        : null,
      runs.length
        ? h(
            'section',
            { className: 'la-continue__block' },
            h(FieldLabel, null, t('loop.continue.runs')),
            runs.map((run) =>
              h(
                'button',
                {
                  key: run.id,
                  type: 'button',
                  className: 'la-continue__row',
                  onClick: () => props.onGoRun(run),
                },
                h(Icon, { name: 'flask', size: 16 }),
                h(
                  'span',
                  { className: 'la-continue__main' },
                  h(
                    'span',
                    { className: 'la-continue__title' },
                    `${run.modelId || ''} ${JSON.stringify(run.params || {})} · ${
                      run.verdict ? t(`loop.exp.verdict.${run.verdict}`) : '—'
                    }`,
                  ),
                  h('span', { className: 'la-muted' }, `${formatTime(run.at)}${run.criterion ? ` · ${run.criterion}` : ''}`),
                ),
                h(Tag, { tone: 'neutral' }, run.subject ? `${run.subject.kind}:${run.subject.id}` : '—'),
              ),
            ),
          )
        : null,
    ),
  )
}
  return { ContinueDialog }
})
__def("views/SourceDialog.js", function (__req) {
/**
 * 来源详情：标题/作者/年份/出处/URL/DOI/核验程度/检索路径。
 * 不能打开原文就保留 unverified，不编造页码与引文。
 */

const { Dialog } = __req("components/Dialog.js")
const { Button, Tag, FieldLabel } = __req("components/primitives.js")
const { verifiedLabel } = __req("model.js")
const { sourceVerifiedTone } = __req("views/shared.js")

function SourceDialog(props) {
  const t = props.t
  const source = props.source
  if (!source) return null
  const copyCitation = () => {
    const citation = [source.author, source.title, source.ref || '', source.year || '', source.url || source.doi || '']
      .filter(Boolean)
      .join(' · ')
    if (props.onCopy) props.onCopy(citation)
  }
  return h(
    Dialog,
    {
      open: props.open,
      onClose: props.onClose,
      title: source.title,
      description: [source.author, source.year, source.kind].filter(Boolean).join(' · '),
      size: 'sm',
      closeLabel: t('loop.common.close'),
      footer: h(
        'div',
        { className: 'la-dialog__actions' },
        h(Button, { variant: 'ghost', icon: 'copy', onClick: copyCitation }, t('loop.common.copy')),
        h(Button, { variant: 'secondary', onClick: props.onClose }, t('loop.common.close')),
      ),
    },
    h(
      'dl',
      { className: 'la-sourcedetail' },
      h('div', { className: 'la-sourcedetail__row' }, h('dt', null, t('loop.relation.verified.verified')), h('dd', null, h(Tag, { tone: sourceVerifiedTone(source.verified) }, verifiedLabel(t, source.verified)))),
      source.ref ? h('div', { className: 'la-sourcedetail__row' }, h('dt', null, t('loop.subject.sources')), h('dd', null, source.ref)) : null,
      source.url
        ? h(
            'div',
            { className: 'la-sourcedetail__row' },
            h('dt', null, 'URL'),
            h(
              'dd',
              null,
              h('a', { className: 'la-link', href: source.url, target: '_blank', rel: 'noreferrer noopener' }, source.url),
            ),
          )
        : null,
      source.doi ? h('div', { className: 'la-sourcedetail__row' }, h('dt', null, 'DOI'), h('dd', null, source.doi)) : null,
      source.verifiedAt ? h('div', { className: 'la-sourcedetail__row' }, h('dt', null, t('loop.exp.recordedAt')), h('dd', null, source.verifiedAt)) : null,
      source.note ? h('div', { className: 'la-sourcedetail__row' }, h('dt', null, t('loop.res.notices')), h('dd', null, source.note)) : null,
      source.legacy ? h('p', { className: 'la-hintwarn' }, t('loop.note.legacyHint')) : null,
    ),
  )
}
  return { SourceDialog }
})
__def("views/ReceiptsDialog.js", function (__req) {
/**
 * 回执与提示：最近写操作的真实回执（含 code）与数据迁移提示。
 */

const { Dialog } = __req("components/Dialog.js")
const { Button, EmptyState, FieldLabel } = __req("components/primitives.js")
const { formatTime } = __req("util.js")

function ReceiptsDialog(props) {
  const t = props.t
  const receipts = props.receipts || []
  const notices = props.notices || []
  return h(
    Dialog,
    {
      open: props.open,
      onClose: props.onClose,
      title: t('loop.status.receipts'),
      description: t('loop.status.receiptFromHost'),
      size: 'md',
      closeLabel: t('loop.common.close'),
      footer: h(
        'div',
        { className: 'la-dialog__actions' },
        receipts.length ? h(Button, { variant: 'ghost', onClick: props.onClear }, t('loop.status.dismiss')) : null,
        h(Button, { variant: 'secondary', onClick: props.onClose }, t('loop.common.close')),
      ),
    },
    h(
      'div',
      { className: 'la-receipts' },
      notices.length
        ? h(
            'section',
            { className: 'la-receipts__block' },
            h(FieldLabel, null, t('loop.res.notices')),
            notices.map((notice, index) =>
              h(
                'p',
                { key: index, className: `la-receipt la-receipt--${notice.level === 'warn' ? 'warn' : 'info'}` },
                h('span', { className: 'la-receipt__kind' }, notice.level === 'warn' ? t('loop.status.warning') : t('loop.status.notice')),
                h('span', null, notice.text || JSON.stringify(notice)),
              ),
            ),
          )
        : null,
      !receipts.length && !notices.length ? h(EmptyState, { icon: 'info', title: t('loop.status.noReceipts') }) : null,
      receipts.length
        ? h(
            'ul',
            { className: 'la-receipts__list' },
            receipts.map((receipt) =>
              h(
                'li',
                { key: receipt.id, className: `la-receipt la-receipt--${receipt.kind}` },
                h(
                  'span',
                  { className: 'la-receipt__kind' },
                  receipt.kind === 'ok'
                    ? t('loop.status.ok')
                    : receipt.kind === 'error'
                      ? t('loop.status.error')
                      : t('loop.status.notice'),
                ),
                h('span', { className: 'la-receipt__text' }, receipt.text),
                receipt.code ? h('span', { className: 'la-receipt__code' }, receipt.code) : null,
                h('span', { className: 'la-receipt__time' }, formatTime(receipt.at)),
              ),
            ),
          )
        : null,
    ),
  )
}
  return { ReceiptsDialog }
})
__def("styles/base.js", function (__req) {
/**
 * 基础层：宿主 token 映射、排版、按钮/标签/输入/提示等基础控件。
 * 只使用宿主 --dsw-alias-* / --dsw-specific-* / --dsw-radius-* / --ds-transition-duration 变量，
 * 不写死浅色或深色。所有选择器以 .la- 前缀限定在插件面板内。
 */

const BASE_CSS = `
.la-root{
  --la-bg:var(--dsw-alias-bg-base);
  --la-surface:var(--dsw-alias-bg-layer-1);
  --la-surface-2:var(--dsw-alias-bg-layer-2);
  --la-overlay:var(--dsw-alias-bg-overlay);
  --la-sidebar:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-layer-1));
  --la-line:var(--dsw-alias-border-l1);
  --la-line-2:var(--dsw-alias-border-l2);
  --la-ink:var(--dsw-alias-label-primary);
  --la-ink-2:var(--dsw-alias-label-secondary);
  --la-brand:var(--dsw-alias-brand-primary);
  --la-danger:var(--dsw-alias-state-error-primary);
  --la-warn:var(--dsw-alias-state-warn-primary);
  --la-ok:var(--dsw-alias-state-success-primary);
  --la-idle:var(--dsw-alias-state-idle-primary);
  --la-radius-xs:var(--dsw-radius-xs,3px);
  --la-radius-sm:var(--dsw-radius-sm,6px);
  --la-radius-md:var(--dsw-radius-md,8px);
  --la-radius-lg:var(--dsw-radius-lg,12px);
  --la-radius-xl:var(--dsw-radius-xl,16px);
  --la-motion:var(--ds-transition-duration,150ms);
  --la-measure:640px;
  position:relative;
  display:flex;
  flex-direction:column;
  height:100%;
  min-height:0;
  overflow:hidden;
  background:var(--la-bg);
  color:var(--la-ink);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Segoe UI","Noto Sans SC",sans-serif;
  font-size:14px;
  line-height:1.6;
  text-align:left;
  -webkit-font-smoothing:antialiased;
}
.la-root *,.la-root *::before,.la-root *::after{box-sizing:border-box}
.la-root button,.la-root input,.la-root select,.la-root textarea{font-family:inherit}
.la-root ::selection{background:var(--la-surface-2);color:var(--la-ink)}
.la-root :focus-visible{outline:2px solid var(--la-brand);outline-offset:2px;border-radius:2px}
.la-root h1,.la-root h2,.la-root h3,.la-root h4,.la-root p,.la-root ul,.la-root ol,.la-root dl,.la-root dd{margin:0}
.la-root ul,.la-root ol{padding:0;list-style:none}
.la-muted{color:var(--la-ink-2)}
.la-inlineerror{color:var(--la-danger);font-size:12.5px;line-height:1.5}
.la-hintwarn{color:var(--la-warn);font-size:12.5px;line-height:1.5}
.la-okText{color:var(--la-ok);font-size:13px}
.la-warnText{color:var(--la-warn)}
.la-pre{
  background:var(--la-bg);border:1px solid var(--la-line);border-radius:var(--la-radius-sm);
  padding:10px 12px;font-family:ui-monospace,Consolas,"Cascadia Mono",monospace;font-size:12px;
  line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:240px;overflow:auto;color:var(--la-ink-2)
}
.la-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.la-time{font-size:12px;color:var(--la-ink-2);white-space:nowrap}
.la-metaline{font-size:12px;color:var(--la-ink-2)}
.la-prose{max-width:var(--la-measure);font-size:16px;line-height:1.7}
.la-prose p+p{margin-top:10px}
.la-link{color:var(--la-brand);text-decoration:underline;text-underline-offset:2px;word-break:break-all}
.la-linkbtn{
  background:none;border:0;padding:0;color:var(--la-ink-2);font-size:12.5px;cursor:pointer;
  text-decoration:underline;text-underline-offset:2px;min-height:28px
}
.la-linkbtn:hover{color:var(--la-ink)}

/* 按钮 */
.la-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:40px;padding:6px 14px;border-radius:var(--la-radius-sm);
  border:1px solid transparent;font-size:14px;line-height:1.2;cursor:pointer;white-space:nowrap;
  transition:background-color var(--la-motion) ease,border-color var(--la-motion) ease,color var(--la-motion) ease;
  color:var(--la-ink);background:transparent
}
.la-btn:disabled{opacity:.55;cursor:not-allowed}
.la-btn--block{width:100%}
.la-btn--sm{min-height:32px;padding:4px 10px;font-size:13px;gap:4px}
.la-btn--primary{background:var(--la-brand);border-color:var(--la-brand);color:var(--la-bg)}
.la-btn--primary:hover:not(:disabled){filter:brightness(1.05)}
.la-btn--secondary{background:var(--la-surface-2);border-color:var(--la-line);color:var(--la-ink)}
.la-btn--secondary:hover:not(:disabled){background:var(--la-surface)}
.la-btn--ghost{background:transparent;border-color:transparent;color:var(--la-ink-2)}
.la-btn--ghost:hover:not(:disabled){background:var(--la-surface-2);color:var(--la-ink)}
.la-btn--danger{background:var(--la-danger);border-color:var(--la-danger);color:var(--la-bg)}
.la-btn__label{display:inline-flex;align-items:center;gap:4px}
.la-iconbtn{
  display:inline-flex;align-items:center;justify-content:center;flex:none;
  width:40px;height:40px;border-radius:var(--la-radius-sm);
  border:1px solid transparent;background:transparent;color:var(--la-ink-2);cursor:pointer;
  transition:background-color var(--la-motion) ease,color var(--la-motion) ease
}
.la-iconbtn:hover:not(:disabled){background:var(--la-surface-2);color:var(--la-ink)}
.la-iconbtn:disabled{opacity:.5;cursor:not-allowed}
.la-iconbtn--sm{width:28px;height:28px;border-radius:var(--la-radius-xs)}
.la-spinner{
  display:inline-block;width:14px;height:14px;border-radius:50%;
  border:2px solid currentColor;border-right-color:transparent;
  animation:la-spin .8s linear infinite
}
@keyframes la-spin{to{transform:rotate(360deg)}}

/* 标签 */
.la-tag{
  display:inline-flex;align-items:center;gap:4px;flex:none;
  font-size:12px;line-height:1.5;padding:1px 8px;border-radius:999px;
  border:1px solid var(--la-line-2);color:var(--la-ink-2);background:transparent;white-space:nowrap
}
.la-tag--accent{border-color:var(--la-brand);color:var(--la-brand)}
.la-tag--warn{border-color:var(--la-warn);color:var(--la-warn)}
.la-tag--ok{border-color:var(--la-ok);color:var(--la-ok)}
.la-tag--danger{border-color:var(--la-danger);color:var(--la-danger)}
.la-count{
  display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;
  border-radius:999px;background:var(--la-surface-2);color:var(--la-ink-2);font-size:12px
}
.la-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--la-idle);flex:none}
.la-dot--ok{background:var(--la-ok)}
.la-dot--warn{background:var(--la-warn)}
.la-dot--danger{background:var(--la-danger)}
.la-dot--idle{background:var(--la-idle)}
.la-fieldlabel{
  display:block;font-size:12px;line-height:1.6;color:var(--la-ink-2);
  letter-spacing:.02em;margin-bottom:4px
}
.la-fieldlabel__optional{color:var(--la-ink-2);opacity:1;font-weight:400}
.la-field{display:block;margin-bottom:12px}
.la-field:last-child{margin-bottom:0}
.la-select{
  min-height:36px;padding:5px 28px 5px 10px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-bg);color:var(--la-ink);font-size:13.5px;
  max-width:100%;appearance:none;
  background-image:linear-gradient(45deg,transparent 50%,var(--la-ink-2) 50%),linear-gradient(135deg,var(--la-ink-2) 50%,transparent 50%);
  background-position:calc(100% - 14px) calc(50% + 1px),calc(100% - 9px) calc(50% + 1px);
  background-size:5px 5px,5px 5px;background-repeat:no-repeat
}
.la-select option{background:var(--la-bg);color:var(--la-ink)}
.la-select--sm{min-height:32px;font-size:12.5px}
.la-input{
  width:100%;min-height:38px;padding:7px 10px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-bg);color:var(--la-ink);font-size:14px
}
.la-input--sm{min-height:32px;font-size:13px}
.la-input::placeholder,.la-textarea::placeholder{color:var(--la-ink-2)}
.la-textarea{
  width:100%;min-height:72px;padding:8px 10px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-bg);color:var(--la-ink);font-size:14px;line-height:1.65;
  resize:vertical
}
.la-select:focus,.la-input:focus,.la-textarea:focus{outline:2px solid var(--la-brand);outline-offset:0;border-color:transparent}
.la-notice{
  display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-surface);font-size:13px;line-height:1.55;color:var(--la-ink)
}
.la-notice--error{border-color:var(--la-danger)}
.la-notice--error>.la-icon{color:var(--la-danger)}
.la-notice--warn{border-color:var(--la-warn)}
.la-notice--warn>.la-icon{color:var(--la-warn)}
.la-notice--info>.la-icon{color:var(--la-ink-2)}
.la-notice__body{flex:1;min-width:0}
.la-empty{
  display:flex;flex-direction:column;align-items:flex-start;gap:8px;
  padding:20px;border:1px dashed var(--la-line-2);border-radius:var(--la-radius-md);color:var(--la-ink-2)
}
.la-empty .la-icon{color:var(--la-ink-2)}
.la-empty__title{font-size:14px;color:var(--la-ink)}
.la-empty__hint{font-size:13px;line-height:1.6}
.la-collapsible{border-top:1px solid var(--la-line);padding-top:2px;margin-top:12px}
.la-collapsible__head{
  display:flex;align-items:center;gap:8px;width:100%;padding:8px 0;min-height:36px;
  background:none;border:0;color:var(--la-ink);font-size:13.5px;cursor:pointer;text-align:left
}
.la-collapsible__head:hover{color:var(--la-brand)}
.la-collapsible__chevron{color:var(--la-ink-2);font-size:12px;width:12px;flex:none}
.la-collapsible__title{font-weight:500}
.la-collapsible__meta{margin-left:auto;font-size:12px;color:var(--la-ink-2)}
.la-collapsible__body{padding:2px 0 8px}
.la-seg{
  display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:var(--la-radius-sm);
  background:var(--la-surface-2);border:1px solid var(--la-line)
}
.la-seg__item{
  min-height:30px;padding:3px 10px;border:0;border-radius:var(--la-radius-xs);
  background:transparent;color:var(--la-ink-2);font-size:13px;cursor:pointer;white-space:nowrap
}
.la-seg__item:hover:not(:disabled){color:var(--la-ink)}
.la-seg__item.is-active{background:var(--la-bg);color:var(--la-ink);border:1px solid var(--la-line);padding:2px 9px}
.la-seg__item:disabled{opacity:.45;cursor:not-allowed}
.la-divider{border:0;border-top:1px solid var(--la-line);margin:12px 0}
.la-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}
.la-chip{
  display:inline-flex;align-items:center;gap:4px;min-height:32px;padding:4px 12px;
  border-radius:999px;border:1px solid var(--la-line-2);background:transparent;color:var(--la-ink-2);
  font-size:13px;cursor:pointer;transition:border-color var(--la-motion) ease,color var(--la-motion) ease
}
.la-chip:hover{border-color:var(--la-brand);color:var(--la-ink)}
.la-chip.is-on{border-color:var(--la-brand);color:var(--la-brand);background:transparent}
.la-check{display:flex;align-items:center;gap:8px;min-height:36px;font-size:13px;color:var(--la-ink)}
.la-check input{width:16px;height:16px;accent-color:var(--la-brand)}
.la-radio{display:flex;align-items:center;gap:8px;font-size:13px;min-height:32px;cursor:pointer}
.la-radio input{accent-color:var(--la-brand)}
.la-bars{display:flex;flex-direction:column;gap:10px;margin:8px 0}
.la-bar{display:flex;flex-direction:column;gap:4px}
.la-bar__label{font-size:12.5px;color:var(--la-ink-2)}
.la-bar__track{height:12px;border-radius:999px;background:var(--la-surface-2);overflow:hidden}
.la-bar__fill{display:block;height:100%;background:var(--la-brand);transition:width var(--la-motion) ease}
.la-bar__fill--hidden{background:var(--la-ink-2)}
.la-slider{display:flex;flex-direction:column;gap:6px;margin:10px 0}
.la-slider__label{font-size:13px;color:var(--la-ink-2);font-variant-numeric:tabular-nums}
.la-slider input[type="range"]{width:100%;accent-color:var(--la-brand);min-height:28px}
@media (prefers-reduced-motion: reduce){
  .la-root *,.la-root *::before,.la-root *::after{animation-duration:0.001ms !important;transition-duration:0.001ms !important}
}
`
  return { BASE_CSS }
})
__def("styles/shell.js", function (__req) {
/**
 * 外壳层：状态页、顶栏与搜索、单元目录、三栏主体、状态条、窄屏分段、弹层。
 */

const SHELL_CSS = `
/* 起始/错误状态页 */
.la-root--state{align-items:center;justify-content:center;padding:32px}
.la-statepane{
  display:flex;flex-direction:column;align-items:flex-start;gap:10px;max-width:560px;
  padding:24px;border:1px solid var(--la-line);border-radius:var(--la-radius-lg);background:var(--la-surface)
}
.la-statepane .la-icon{color:var(--la-ink-2)}
.la-statepane__title{font-size:18px;font-weight:600}
.la-statepane__message{font-size:14px;color:var(--la-danger)}
.la-statepane__hint{font-size:13px;line-height:1.7}

/* 顶栏 */
.la-topbar{
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;row-gap:8px;
  padding:10px 16px;border-bottom:1px solid var(--la-line);background:var(--la-bg);flex:none;z-index:3
}
.la-brand{display:flex;flex-direction:column;min-width:0;margin-right:2px}
.la-brand__name{font-size:18px;font-weight:600;letter-spacing:.08em;line-height:1.2}
.la-brand__sub{font-size:12px;color:var(--la-ink-2);white-space:nowrap}
.la-topbar__cluster{display:flex;align-items:center;gap:6px}
.la-topbar__label{font-size:12px;color:var(--la-ink-2);white-space:nowrap}
.la-topbar__spacer{flex:1;display:flex;justify-content:flex-end;min-width:160px}
.la-topbar__actions{display:flex;align-items:center;gap:4px}
.la-topbar__menu{display:none}

/* 搜索 */
.la-search{position:relative;display:flex;align-items:center;width:min(320px,100%)}
.la-search__icon{position:absolute;left:10px;color:var(--la-ink-2);pointer-events:none}
.la-search__input{
  width:100%;min-height:36px;padding:6px 10px 6px 34px;border-radius:var(--la-radius-sm);
  border:1px solid var(--la-line);background:var(--la-surface);color:var(--la-ink);font-size:13.5px
}
.la-search__input:focus{outline:2px solid var(--la-brand);outline-offset:0}
.la-search__popover{
  position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;
  background:var(--la-overlay);border:1px solid var(--la-line);border-radius:var(--la-radius-md);
  box-shadow:0 12px 32px rgba(0,0,0,.18);overflow:hidden
}
.la-search__list{max-height:340px;overflow:auto}
.la-search__result{
  display:flex;align-items:flex-start;gap:8px;width:100%;padding:8px 10px;border:0;background:transparent;
  color:var(--la-ink);cursor:pointer;text-align:left;min-height:44px
}
.la-search__result:hover,.la-search__result.is-active{background:var(--la-surface-2)}
.la-search__result-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.la-search__result-main>span:first-child{font-size:13.5px}
.la-search__result-sub{font-size:12px;color:var(--la-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.la-search__result-kind{font-size:12px;color:var(--la-ink-2);border:1px solid var(--la-line-2);border-radius:999px;padding:0 6px;white-space:nowrap;margin-top:2px}
.la-search__empty{padding:12px;font-size:13px;color:var(--la-ink-2)}
.la-search__hint{padding:6px 10px;font-size:12px;color:var(--la-ink-2);border-top:1px solid var(--la-line)}

/* 单元目录 */
.la-dir{
  display:flex;flex-direction:column;min-height:0;height:100%;
  background:var(--la-sidebar);border-right:1px solid var(--la-line);overflow:hidden;z-index:12
}
.la-dir__head{display:flex;align-items:center;justify-content:space-between;padding:10px 10px 6px 14px}
.la-dir__title{font-size:13px;font-weight:600;color:var(--la-ink-2);letter-spacing:.04em}
.la-dir__overview{
  display:flex;align-items:center;gap:8px;margin:2px 8px 8px;padding:8px 10px;min-height:40px;
  border:1px solid transparent;border-radius:var(--la-radius-sm);background:transparent;
  color:var(--la-ink-2);font-size:13.5px;cursor:pointer;text-align:left
}
.la-dir__overview:hover{background:var(--la-surface-2);color:var(--la-ink)}
.la-dir__overview.is-active{border-color:var(--la-brand);color:var(--la-brand)}
.la-dir__list{flex:1;min-height:0;overflow:auto;padding:0 8px 8px;display:flex;flex-direction:column;gap:2px}
.la-dir__item{
  display:flex;align-items:flex-start;gap:8px;width:100%;padding:8px 10px;min-height:48px;
  border:1px solid transparent;border-radius:var(--la-radius-sm);background:transparent;
  color:var(--la-ink);cursor:pointer;text-align:left
}
.la-dir__item:hover{background:var(--la-surface-2)}
.la-dir__item.is-active{background:var(--la-surface);border-color:var(--la-line);box-shadow:inset 2px 0 0 var(--la-brand)}
.la-dir__index{font-size:12px;color:var(--la-ink-2);font-variant-numeric:tabular-nums;padding-top:3px;flex:none}
.la-dir__text{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.la-dir__name{font-size:13.5px;line-height:1.4}
.la-dir__question{font-size:12px;color:var(--la-ink-2);line-height:1.45}
.la-dir__meta{font-size:12px;color:var(--la-ink-2);line-height:1.5}
.la-dir__foot{padding:8px 14px;border-top:1px solid var(--la-line);font-size:12px;color:var(--la-ink-2)}
.la-dir__footline{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* 三栏主体 */
.la-body{
  position:relative;flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr);overflow:hidden
}
.la-body.has-dir{grid-template-columns:216px minmax(0,1fr)}
.la-body.has-right{grid-template-columns:minmax(0,1fr) var(--la-right-width,352px)}
.la-body.has-dir.has-right{grid-template-columns:216px minmax(0,1fr) var(--la-right-width,352px)}
.la-mainpane{display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;position:relative}
.la-splitter{
  position:absolute;top:0;bottom:0;right:var(--la-right-width,352px);width:7px;z-index:8;
  display:flex;justify-content:center;cursor:col-resize
}
.la-splitter__handle{width:3px;height:100%;border-radius:2px;background:transparent}
.la-splitter:hover .la-splitter__handle,.la-splitter__handle:focus-visible{background:var(--la-brand)}
.la-backdrop{display:none}

/* 横幅 */
.la-banner{padding:8px 16px;border-bottom:1px solid var(--la-line);flex:none}

/* 状态条 */
.la-statusbar{
  display:flex;align-items:center;gap:14px;flex:none;min-height:40px;padding:4px 12px;
  border-top:1px solid var(--la-line);font-size:12px;color:var(--la-ink-2);background:var(--la-bg)
}
.la-statusbar__path{
  display:flex;align-items:center;gap:6px;min-height:32px;max-width:32%;padding:4px 8px;
  border:0;border-radius:var(--la-radius-xs);background:transparent;color:var(--la-ink-2);cursor:pointer;font-size:12px
}
.la-statusbar__path:hover{background:var(--la-surface-2);color:var(--la-ink)}
.la-statusbar__pathtext{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:ui-monospace,Consolas,monospace}
.la-statusbar__model{display:flex;align-items:center;gap:6px;white-space:nowrap;max-width:28%;overflow:hidden}
.la-statusbar__model>span:nth-child(2){overflow:hidden;text-overflow:ellipsis}
.la-statusbar__alert{max-width:28%}
.la-statusbar__alert .la-notice{min-height:28px;padding:3px 8px;font-size:12px;background:transparent}
.la-statusbar__receipt{
  display:flex;align-items:center;gap:6px;flex:1;min-width:120px;min-height:32px;padding:4px 8px;
  border:1px solid transparent;border-radius:var(--la-radius-xs);background:transparent;color:var(--la-ink-2);
  font-size:12px;cursor:pointer;text-align:left
}
.la-statusbar__receipt:hover{background:var(--la-surface-2)}
.la-statusbar__receipt.is-ok{color:var(--la-ok)}
.la-statusbar__receipt.is-error{color:var(--la-danger)}
.la-statusbar__receipttext{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.la-statusbar__code{opacity:1;font-family:ui-monospace,Consolas,monospace}
.la-statusbar__receiptcount{
  flex:none;min-width:18px;height:18px;border-radius:999px;background:var(--la-surface-2);
  color:var(--la-ink-2);display:inline-flex;align-items:center;justify-content:center;font-size:12px
}
.la-statusbar__right{display:flex;align-items:center;gap:4px;flex:none}
.la-statusbar__notices{
  display:flex;align-items:center;gap:4px;border:0;background:var(--la-surface-2);color:var(--la-ink-2);
  border-radius:999px;padding:2px 8px;font-size:12px;cursor:pointer;min-height:26px
}
.la-statusbar__notices:hover{color:var(--la-ink)}
.la-statusbar__refreshing{color:var(--la-ink-2)}

/* 窄屏分段 */
.la-mobilestage{
  display:none;flex:none;gap:4px;padding:6px;border-top:1px solid var(--la-line);background:var(--la-bg)
}
.la-mobilestage__item{
  flex:1;min-height:40px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);
  background:transparent;color:var(--la-ink-2);font-size:13px;cursor:pointer
}
.la-mobilestage__item.is-active{background:var(--la-brand);border-color:var(--la-brand);color:var(--la-bg)}

/* 弹层 */
.la-overlay{
  position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:20px;
  background:var(--la-overlay);background:color-mix(in srgb,var(--la-bg) 74%,transparent)
}
.la-dialog{
  display:flex;flex-direction:column;width:min(680px,100%);max-height:calc(100% - 8px);
  border:1px solid var(--la-line);border-radius:var(--la-radius-lg);background:var(--la-overlay);
  box-shadow:0 24px 64px rgba(0,0,0,.28);overflow:hidden
}
.la-dialog--sm{width:min(440px,100%)}
.la-dialog--lg{width:min(860px,100%)}
.la-dialog__head{
  display:flex;align-items:flex-start;gap:12px;padding:16px 16px 10px;border-bottom:1px solid var(--la-line)
}
.la-dialog__heading{flex:1;min-width:0}
.la-dialog__title{font-size:17px;font-weight:600;line-height:1.35}
.la-dialog__desc{margin-top:4px;font-size:12.5px;color:var(--la-ink-2);line-height:1.6}
.la-dialog__body{padding:16px;overflow:auto;min-height:0;font-size:14px;line-height:1.7}
.la-dialog__foot{padding:10px 16px;border-top:1px solid var(--la-line);background:var(--la-surface)}
.la-dialog__actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.la-confirm__text{font-size:14px;line-height:1.7}
.la-confirm .la-confirm__text{margin-bottom:0}

@media (max-width:1180px){
  .la-brand__sub{display:none}
  .la-topbar__cluster--view .la-topbar__label{display:none}
  .la-statusbar__path{max-width:26%}
}
@media (max-width:919px){
  .la-body{display:block;overflow:auto}
  .la-mainpane{height:100%;min-height:0}
  .la-body.is-chatstage .la-mainpane{height:100%}
  .la-dir{
    position:absolute;left:0;top:0;bottom:0;width:min(300px,86%);height:auto;border-right:1px solid var(--la-line-2);
    box-shadow:0 12px 40px rgba(0,0,0,.24)
  }
  .la-backdrop{display:block;position:absolute;inset:0;z-index:10;background:var(--la-overlay);background:color-mix(in srgb,var(--la-bg) 60%,transparent)}
  .la-topbar{padding:8px 12px;gap:10px}
  .la-topbar__label{display:none}
  .la-topbar__spacer{order:5;flex-basis:100%;min-width:0}
  .la-search{width:100%}
  .la-topbar__menu{display:inline-flex}
  .la-mobilestage{display:flex}
  .la-splitter{display:none}
  .la-statusbar{flex-wrap:wrap;row-gap:2px;min-height:36px;padding:2px 8px;gap:8px}
  .la-statusbar__path{max-width:60%}
  .la-statusbar__model{max-width:40%}
  .la-statusbar__alert{display:none}
  .la-statusbar__receipt{order:5;flex-basis:100%}
}
`
  return { SHELL_CSS }
})
__def("styles/views.js", function (__req) {
/**
 * 视图层：领域卡片、问题尺度图谱/档案、三种视角、学习伙伴、证据尺度、任务草案、资料弹层。
 */

const VIEWS_CSS = `
/* 通用尺度容器 */
.la-scale{display:flex;flex-direction:column;height:100%;min-height:0;overflow:auto;padding:18px 22px 24px}
.la-scalehead{margin-bottom:14px;max-width:860px}
.la-scalehead__title{font-size:20px;font-weight:600;line-height:1.35}
.la-scalehead__hint{margin-top:4px;font-size:13px;color:var(--la-ink-2);line-height:1.7}
.la-sectionhead{display:flex;align-items:flex-start;gap:12px;justify-content:space-between;margin-bottom:10px}
.la-sectionhead__text{min-width:0}
.la-sectionhead__title{font-size:15px;font-weight:600}
.la-sectionhead__hint{font-size:12.5px;color:var(--la-ink-2);margin-top:2px}

/* 领域尺度 */
.la-domaingrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;max-width:1280px}
.la-domaincard{
  display:flex;flex-direction:column;gap:8px;text-align:left;padding:16px;min-height:190px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-md);background:var(--la-surface);
  color:var(--la-ink);cursor:pointer;transition:border-color var(--la-motion) ease,background-color var(--la-motion) ease
}
.la-domaincard:hover{border-color:var(--la-brand);background:var(--la-surface-2)}
.la-domaincard.is-recommended{border-color:var(--la-brand);box-shadow:inset 0 0 0 1px var(--la-brand)}
.la-domaincard__top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.la-domaincard__index{font-size:12px;color:var(--la-ink-2);font-variant-numeric:tabular-nums;letter-spacing:.08em}
.la-domaincard__title{font-size:17px;font-weight:600;line-height:1.35}
.la-domaincard__row{display:flex;flex-direction:column;gap:1px}
.la-domaincard__label{font-size:12px;color:var(--la-ink-2);letter-spacing:.04em}
.la-domaincard__question{font-size:13.5px;line-height:1.55}
.la-domaincard__capability{font-size:12.5px;line-height:1.55;color:var(--la-ink-2)}
.la-domaincard__foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--la-ink-2)}
.la-domaincard__entry{display:flex;align-items:center;gap:4px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* 问题尺度 */
.la-scale--subject{padding:0;overflow:hidden;display:flex;flex-direction:column;height:100%;min-height:0}
.la-subjecthead{
  display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;
  padding:12px 18px;border-bottom:1px solid var(--la-line);flex:none
}
.la-subjecthead__title{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}
.la-subjecthead__group{font-size:12px;color:var(--la-ink-2);letter-spacing:.04em}
.la-subjecthead__name{font-size:17px;font-weight:600;line-height:1.3}
.la-subjecthead__relation{display:flex;align-items:center;gap:6px}
.la-subjecthead__tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.la-subjecthead__neighbors{font-size:12px;color:var(--la-ink-2)}
.la-subjectmain{flex:1;min-height:260px;display:flex;position:relative;overflow:hidden}
.la-subjectmain.is-list{overflow:auto;display:block}
.la-canvaswrap{position:relative;flex:1;min-height:0;min-width:0;overflow:auto}
.la-readpane{border-top:1px solid var(--la-line);overflow:auto;padding:16px 20px 24px;max-height:46%;flex:none;background:var(--la-bg)}
.is-projection-history .la-readpane,.is-projection-practice .la-readpane{max-height:30%}
.la-practice__more{font-size:12px;padding:2px 4px}
.la-scale--subject.is-narrow .la-readpane,
.is-narrow .la-readpane{max-height:none;flex:1;border-top:0}
.la-subjectmain.is-narrow{flex:1}

/* 图谱画布 */
.la-canvas{position:relative;width:100%;height:100%;min-height:340px;overflow:hidden}
.la-canvas__svg{position:absolute;inset:0;display:block}
.la-canvas__arrow{fill:var(--la-ink-2)}
.la-canvas__hint{position:absolute;left:16px;bottom:10px;font-size:12px;max-width:70%}
.la-canvas__empty{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,80%);
  padding:16px;border:1px dashed var(--la-line-2);border-radius:var(--la-radius-md);background:var(--la-surface)
}
.la-edge{fill:none;stroke:var(--la-line-2);stroke-width:1.5;transition:stroke var(--la-motion) ease,stroke-width var(--la-motion) ease}
.la-edge.is-selected{stroke:var(--la-brand);stroke-width:2.5}
.la-edge__hit{fill:none;stroke:transparent;stroke-width:20;cursor:pointer;pointer-events:stroke}
.la-edgegroup:hover .la-edge{stroke:var(--la-ink-2)}
.la-edgegroup.is-selected .la-edge{stroke:var(--la-brand)}
.la-zone__label{fill:var(--la-ink-2);font-size:12px;letter-spacing:.04em}
.la-gnode{
  position:absolute;display:flex;flex-direction:column;justify-content:center;gap:2px;
  padding:8px 12px;border:1px solid var(--la-line);border-radius:var(--la-radius-md);
  background:var(--la-surface);color:var(--la-ink);cursor:pointer;text-align:left;
  transition:border-color var(--la-motion) ease,background-color var(--la-motion) ease;
  box-shadow:0 1px 2px rgba(0,0,0,.06)
}
.la-gnode:hover{border-color:var(--la-brand);background:var(--la-surface-2)}
.la-gnode--center{border-color:var(--la-brand);border-width:2px;background:var(--la-surface-2);box-shadow:0 4px 14px rgba(0,0,0,.08)}
.la-gnode.is-selected{border-color:var(--la-brand)}
.la-gnode__top{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--la-ink-2);line-height:1.3}
.la-gnode__kind{color:var(--la-ink-2)}
.la-gnode__era{font-variant-numeric:tabular-nums}
.la-gnode__count{
  margin-left:auto;min-width:16px;height:16px;border-radius:999px;background:var(--la-surface-2);
  display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:var(--la-ink-2)
}
.la-gnode__title{font-size:15px;font-weight:500;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.la-gnode--center .la-gnode__title{font-size:16px;font-weight:600}
.la-gnode__def{font-size:12px;line-height:1.45;color:var(--la-ink-2);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.la-relchip{
  position:absolute;display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:2px 9px;
  border:1px solid var(--la-line-2);border-radius:999px;background:var(--la-bg);color:var(--la-ink-2);
  font-size:12px;cursor:pointer;white-space:nowrap;z-index:2;
  transition:border-color var(--la-motion) ease,color var(--la-motion) ease
}
.la-relchip:hover{border-color:var(--la-brand);color:var(--la-ink)}
.la-relchip.is-selected{border-color:var(--la-brand);color:var(--la-brand);background:var(--la-bg);font-weight:500}
.la-relchip__arrow{color:var(--la-ink-2);font-size:12px}
.la-relchip.is-selected .la-relchip__arrow{color:var(--la-brand)}

/* 列表视图 */
.la-listview{display:flex;flex-direction:column;height:100%;min-height:0;padding:12px 16px 16px;gap:10px}
.la-listview__filter{display:flex;align-items:center;gap:8px;flex:none}
.la-listview__filter .la-icon{color:var(--la-ink-2)}
.la-listview__columns{display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;min-height:0;overflow:auto}
.la-listview__column{display:flex;flex-direction:column;min-height:0;gap:8px}
.la-listview__title{font-size:13px;color:var(--la-ink-2);font-weight:600;letter-spacing:.04em;flex:none}
.la-listview__list{display:flex;flex-direction:column;gap:4px;overflow:auto;min-height:0}
.la-listrow{
  display:flex;align-items:flex-start;gap:10px;width:100%;padding:9px 10px;min-height:48px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);
  color:var(--la-ink);cursor:pointer;text-align:left
}
.la-listrow:hover{border-color:var(--la-brand)}
.la-listrow.is-current{border-color:var(--la-brand);box-shadow:inset 2px 0 0 var(--la-brand)}
.la-listrow.is-selected{border-color:var(--la-brand);background:var(--la-surface-2)}
.la-listrow__main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.la-listrow__title{font-size:14px;line-height:1.4}
.la-listrow__sub{font-size:12px;color:var(--la-ink-2);line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.la-listrow__side{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none}
.la-listrow__kind,.la-listrow__era{font-size:12px;color:var(--la-ink-2);white-space:nowrap}

/* 历史视角 */
.la-projection{display:flex;flex-direction:column;gap:12px;padding:18px 22px 24px;height:100%;min-height:0;overflow:auto;flex:1 1 auto;width:100%;min-width:0}
.la-projection__head{max-width:var(--la-measure)}
.la-projection__title{font-size:17px;font-weight:600;line-height:1.4}
.la-projection__hint{margin-top:4px;font-size:12.5px;color:var(--la-ink-2);line-height:1.6}
.la-projection__foot{font-size:12px;color:var(--la-ink-2);line-height:1.6;max-width:var(--la-measure)}
.la-timeline{display:flex;flex-direction:column;gap:16px;max-width:900px}
.la-timeline__list{display:flex;flex-direction:column;gap:2px;border-left:2px solid var(--la-line);margin-left:6px;padding-left:0}
.la-timeline__item{display:flex;align-items:flex-start;gap:12px;position:relative;padding:6px 0 6px 16px}
.la-timeline__item::before{
  content:"";position:absolute;left:-7px;top:14px;width:10px;height:10px;border-radius:50%;
  background:var(--la-bg);border:2px solid var(--la-brand)
}
.la-timeline__year{flex:none;width:92px;font-size:13px;font-variant-numeric:tabular-nums;color:var(--la-ink-2);padding-top:6px}
.la-timeline__node{
  display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;padding:6px 10px;text-align:left;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);
  color:var(--la-ink);cursor:pointer;min-height:44px
}
.la-timeline__node:hover{border-color:var(--la-brand)}
.la-timeline__nodetitle{font-size:14px}
.la-timeline__nodemeta{font-size:12px;color:var(--la-ink-2);line-height:1.5}
.la-works{display:flex;flex-direction:column;gap:6px}
.la-works__title{font-size:13px;color:var(--la-ink-2);font-weight:600;letter-spacing:.04em}
.la-works__list{display:flex;flex-wrap:wrap;gap:6px}
.la-works__item{
  display:flex;align-items:baseline;gap:8px;padding:6px 10px;min-height:36px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:transparent;
  color:var(--la-ink);cursor:pointer;font-size:13px;text-align:left
}
.la-works__item:hover{border-color:var(--la-brand)}
.la-works__year{font-size:12px;color:var(--la-ink-2);font-variant-numeric:tabular-nums}
.la-works__node{font-size:12px;color:var(--la-ink-2)}
.la-unknownband{
  display:flex;flex-direction:column;gap:8px;padding:12px;border:1px dashed var(--la-line-2);
  border-radius:var(--la-radius-md);background:var(--la-surface)
}
.la-unknownband__head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px}
.la-unknownband__list{display:flex;flex-wrap:wrap;gap:6px}
.la-unknownband__node{
  display:flex;align-items:center;gap:6px;padding:6px 10px;min-height:36px;border:1px solid var(--la-line);
  border-radius:999px;background:transparent;color:var(--la-ink);font-size:13px;cursor:pointer
}
.la-unknownband__node:hover{border-color:var(--la-brand)}
.la-gaplist{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--la-ink-2);line-height:1.6;max-width:var(--la-measure)}
.la-gaplist__item{color:var(--la-warn)}
.la-gaplist__path{display:block}

/* 实践视角 */
.la-practice{display:grid;grid-template-columns:repeat(auto-fit,minmax(178px,1fr));gap:10px;align-items:start}
.la-practice__stage{
  display:flex;flex-direction:column;gap:6px;min-height:120px;padding:10px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-md);background:var(--la-surface)
}
.la-practice__stagetitle{font-size:13px;font-weight:600;color:var(--la-ink-2);letter-spacing:.04em;display:flex;align-items:center;gap:6px}
.la-practice__stageindex{
  display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex:none;
  border-radius:50%;border:1px solid var(--la-line-2);font-size:12px;color:var(--la-ink-2);font-weight:400
}
.la-practice__nodes{display:flex;flex-direction:column;gap:4px}
.la-practice__node{
  display:flex;flex-direction:column;gap:1px;padding:6px 8px;border:1px solid var(--la-line);
  border-radius:var(--la-radius-sm);background:var(--la-bg);color:var(--la-ink);cursor:pointer;text-align:left;min-height:40px
}
.la-practice__node:hover{border-color:var(--la-brand)}
.la-practice__node.is-current{border-color:var(--la-brand);box-shadow:inset 2px 0 0 var(--la-brand)}
.la-practice__nodetitle{font-size:13px;line-height:1.35}
.la-practice__nodemeta{font-size:12px;color:var(--la-ink-2)}
.la-practice__empty{color:var(--la-ink-2);font-size:13px}
.la-practice__unmapped{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;color:var(--la-ink-2)}

/* 节点档案 */
.la-dossier{max-width:var(--la-measure);display:flex;flex-direction:column;gap:12px}
.la-dossier__head{display:flex;flex-direction:column;gap:6px}
.la-dossier__kicker{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--la-ink-2)}
.la-dossier__title{font-size:22px;font-weight:600;line-height:1.3}
.la-dossier__lead{font-size:16px;line-height:1.7;padding-left:12px;border-left:2px solid var(--la-brand)}
.la-dossier__actions{display:flex;gap:8px;flex-wrap:wrap}
.la-dossier__fields{display:flex;flex-direction:column;gap:14px}
.la-dossier__label{font-size:12px;color:var(--la-ink-2);font-weight:600;letter-spacing:.04em;margin-bottom:4px}
.la-dossier__text{font-size:16px;line-height:1.7}
.la-dossier__field{display:flex;flex-direction:column}
.la-dossier__note{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--la-ink-2);margin-top:4px;flex-wrap:wrap}
.la-dossier__claims{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--la-line);padding-top:12px}

/* 主张与来源 */
.la-claims{display:flex;flex-direction:column;gap:10px}
.la-claim{padding:10px 12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-claim__head{display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap}
.la-claim__text{font-size:14px;line-height:1.65}
.la-sourcelist{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.la-sourcerow{
  display:flex;align-items:center;gap:8px;width:100%;padding:5px 8px;min-height:36px;
  border:1px solid transparent;border-radius:var(--la-radius-xs);background:transparent;color:var(--la-ink);
  font-size:12.5px;cursor:pointer;text-align:left
}
.la-sourcerow:hover{border-color:var(--la-line);background:var(--la-surface-2)}
.la-sourcerow__main{display:flex;flex-direction:column;gap:0;min-width:0;flex:1}
.la-sourcerow__title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.la-sourcerow__meta{font-size:12px;color:var(--la-ink-2)}
.la-relationlist{display:flex;flex-direction:column;gap:4px}
.la-relationlist__item{
  display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;min-height:44px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);
  color:var(--la-ink);cursor:pointer;text-align:left;font-size:13px
}
.la-relationlist__item:hover{border-color:var(--la-brand)}
.la-relationlist__route{white-space:nowrap}
.la-relationlist__claim{flex:1;min-width:0;color:var(--la-ink-2);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* 学习伙伴 */
.la-partner{
  display:flex;flex-direction:column;min-width:0;min-height:0;height:100%;
  border-left:1px solid var(--la-line);background:var(--la-sidebar)
}
.la-partner__head{display:flex;align-items:flex-start;gap:8px;padding:12px 14px 8px;border-bottom:1px solid var(--la-line);flex:none}
.la-partner__subject{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.la-partner__subjectrow{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.la-partner__subjectname{font-size:15px;font-weight:600;line-height:1.4;overflow:hidden;text-overflow:ellipsis}
.la-partner__sources{font-size:12px;color:var(--la-ink-2)}
.la-partner__model{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--la-ink-2);flex-wrap:wrap}
.la-partner__body{display:flex;flex-direction:column;flex:1;min-height:0}
.la-partner__inspector{max-height:46%;overflow:auto;border-bottom:1px solid var(--la-line);padding:10px 14px 12px;flex:none}
.la-partner__tabs{display:flex;gap:2px;padding:6px 8px 0;border-bottom:1px solid var(--la-line);flex:none}
.la-partnertab{
  display:inline-flex;align-items:center;gap:6px;padding:6px 10px;min-height:36px;
  border:0;border-bottom:2px solid transparent;background:transparent;color:var(--la-ink-2);
  font-size:13px;cursor:pointer
}
.la-partnertab:hover{color:var(--la-ink)}
.la-partnertab.is-active{color:var(--la-ink);border-bottom-color:var(--la-brand)}
.la-partnertab__count{
  min-width:16px;height:16px;border-radius:999px;background:var(--la-surface-2);color:var(--la-ink-2);
  display:inline-flex;align-items:center;justify-content:center;font-size:12px;padding:0 4px
}
.la-partner__panel{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}

/* 关系详情 */
.la-inspector{display:flex;flex-direction:column;gap:8px;min-width:0}
.la-inspector__head{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:var(--la-ink-2)}
.la-inspector__grow{flex:1}
.la-inspector__route{font-size:14px;font-weight:600;line-height:1.4}
.la-inspector__block{display:flex;flex-direction:column;gap:2px}
.la-inspector__text{font-size:13.5px;line-height:1.65}
.la-inspector__actions{display:flex;gap:8px;flex-wrap:wrap}
.la-inspector__savedat{font-size:12px}
.la-annotation{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--la-line);padding-top:8px}
.la-annotation__row{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;flex-wrap:wrap}
.la-notekind{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--la-ink-2)}
.la-notekind__label{white-space:nowrap}
.la-evidence{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--la-line);padding-top:8px}
.la-evidence__list{display:flex;flex-direction:column;gap:6px}
.la-evidence__item{padding:8px 10px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-evidence__text{font-size:13px;line-height:1.6;white-space:pre-wrap}
.la-evidence__meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px;font-size:12px}

/* 对话 */
.la-chat{display:flex;flex-direction:column;height:100%;min-height:0;padding:8px 12px 10px;gap:8px}
.la-chat__list{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding-right:2px}
.la-chat__empty{font-size:13px;color:var(--la-ink-2);line-height:1.7;padding:8px 2px}
.la-msg{display:flex;flex-direction:column;gap:4px;padding:8px 10px;border-radius:var(--la-radius-md);border:1px solid var(--la-line);background:var(--la-surface)}
.la-msg--user{background:var(--la-surface-2)}
.la-msg.is-streaming{border-style:dashed}
.la-msg.is-error{border-color:var(--la-danger)}
.la-msg__head{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:var(--la-ink-2)}
.la-msg__role{font-weight:600;color:var(--la-ink)}
.la-msg__text{font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.la-msg__error{display:flex;flex-direction:column;gap:6px;padding:6px 8px;border-left:2px solid var(--la-danger);font-size:12.5px;color:var(--la-danger);line-height:1.55}
.la-msg__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px}
.la-chat__composer{display:flex;flex-direction:column;gap:6px;flex:none;border-top:1px solid var(--la-line);padding-top:8px}
.la-chat__input{min-height:64px}
.la-chat__actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.la-chat__hint{font-size:12px;flex:1;min-width:110px}
.la-chat__footnote{font-size:12px;color:var(--la-ink-2);line-height:1.5}

/* 笔记 */
.la-notes{display:flex;flex-direction:column;gap:10px;height:100%;min-height:0;overflow:auto;padding:8px 12px 12px}
.la-notecomposer{display:flex;flex-direction:column;gap:6px;flex:none}
.la-notecomposer__field{display:flex;flex-direction:column}
.la-notecomposer__row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-notelist{display:flex;flex-direction:column;gap:8px}
.la-note{padding:10px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-note.is-archived{border-style:dashed;background:transparent}
.la-note__head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.la-note__grow{flex:1}
.la-note__meta{display:flex;align-items:center;gap:6px;margin-top:2px;font-size:12px;color:var(--la-ink-2);flex-wrap:wrap}
.la-note__warning{font-size:12px;color:var(--la-warn);line-height:1.5;margin-top:4px}
.la-note__text{margin-top:6px;font-size:13.5px;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.la-note__editor{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.la-note__actions{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:6px}
.la-inlineactions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-archived{margin-top:8px}
.la-archived__summary{cursor:pointer;font-size:12.5px;color:var(--la-ink-2);padding:4px 0;min-height:32px}
.la-archived .la-note{margin-top:6px}

/* 证据尺度 */
.la-scale--evidence{padding:16px 18px 24px;overflow:auto}
.la-evidencegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start;max-width:1320px}
.la-evpanel{
  display:flex;flex-direction:column;gap:8px;min-width:0;padding:14px;border:1px solid var(--la-line);
  border-radius:var(--la-radius-md);background:var(--la-surface)
}
.la-evpanel--experiments{grid-column:1 / -1}
.la-evsection{display:flex;flex-direction:column;gap:8px;min-width:0;padding:14px;border:1px solid var(--la-line);border-radius:var(--la-radius-md);background:var(--la-surface)}
.la-evpanel .la-evsection,.la-evpanel .la-notes{padding:0;border:0;background:transparent}
.la-evsection__head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.la-evsection__title{font-size:14px;font-weight:600}
.la-evpanel .la-evsection__hint,.la-evsection__hint{font-size:12px;color:var(--la-ink-2);line-height:1.6}
.la-nexttest{
  display:flex;align-items:flex-start;gap:10px;padding:12px 14px;margin-bottom:12px;
  border:1px solid var(--la-warn);border-radius:var(--la-radius-md);background:var(--la-surface);max-width:1320px
}
.la-nexttest .la-icon{color:var(--la-warn);margin-top:2px}
.la-nexttest__body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.la-nexttest__label{font-size:12px;letter-spacing:.04em;color:var(--la-warn)}
.la-nexttest__text{font-size:14px;line-height:1.6}
.la-formcard{display:flex;flex-direction:column;gap:2px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg)}
.la-formcard__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}

/* 实验卡片 */
.la-expcard{border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg);overflow:hidden}
.la-expcard__head{
  display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;min-height:48px;border:0;
  background:transparent;color:var(--la-ink);cursor:pointer;text-align:left
}
.la-expcard__head:hover{background:var(--la-surface-2)}
.la-expcard__chevron{color:var(--la-ink-2);font-size:12px;width:12px;flex:none}
.la-expcard__titles{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}
.la-expcard__title{font-size:14px;font-weight:500}
.la-expcard__subtitle{font-size:12px;color:var(--la-ink-2)}
.la-expcard__body{display:flex;flex-direction:column;gap:10px;padding:4px 12px 12px;border-top:1px solid var(--la-line)}
.la-expcard__question{font-size:13.5px;line-height:1.6;padding-top:8px}
.la-expcard__note{font-size:12px;line-height:1.6}
.la-exp{display:flex;flex-direction:column;gap:8px}
.la-exp__control{display:flex;flex-direction:column;gap:2px}
.la-exp__formula{font-size:12px;line-height:1.6}
.la-exp__actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.la-prediction{display:flex;flex-direction:column;gap:4px}
.la-expresult{display:flex;flex-direction:column;gap:8px;padding:10px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-expresult__verdict{display:flex;flex-direction:column;gap:2px}
.la-expresult__label{font-size:16px;font-weight:600}
.la-expresult__label.verdict-oscillating,.la-expresult__label.verdict-oscillating-below,.la-expresult__label.verdict-diverging{color:var(--la-danger)}
.la-expresult__label.verdict-converged,.la-expresult__label.verdict-overshoot-settled{color:var(--la-ok)}
.la-expresult__label.verdict-drift{color:var(--la-warn)}
.la-expresult__match{font-size:12.5px;line-height:1.5}
.la-expresult__match.is-match{color:var(--la-ok)}
.la-expresult__match.is-miss{color:var(--la-warn)}
.la-expresult__criterion{font-size:12.5px;line-height:1.6;color:var(--la-ink-2)}
.la-expresult__meta{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--la-ink-2);font-variant-numeric:tabular-nums}
.la-expresult__actions{display:flex;gap:8px;flex-wrap:wrap}
.la-expresult__allgreen{font-size:14px;font-weight:600}
.la-expresult__allgreen.is-green{color:var(--la-ok)}
.la-expresult__allgreen.is-red{color:var(--la-danger)}
.la-metrics{display:flex;flex-wrap:wrap;gap:6px 16px}
.la-metrics__item{display:flex;flex-direction:column;gap:0;min-width:70px}
.la-metrics__item dt{font-size:12px;color:var(--la-ink-2)}
.la-metrics__item dd{font-size:13px;font-variant-numeric:tabular-nums}
.la-trace{margin:0;display:flex;flex-direction:column;gap:4px}
.la-trace__svg{width:100%;height:auto;background:var(--la-bg);border:1px solid var(--la-line);border-radius:var(--la-radius-xs)}
.la-trace__axis{stroke:var(--la-line-2);stroke-width:1}
.la-trace__target{stroke:var(--la-warn);stroke-width:1;stroke-dasharray:3 4}
.la-trace__line{fill:none;stroke:var(--la-brand);stroke-width:1.8}
.la-trace__label{fill:var(--la-ink-2);font-size:12px}
.la-trace__caption{font-size:12px}
.la-checks{display:flex;flex-direction:column;gap:2px}
.la-case__item,.la-caselist__item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--la-line);flex-wrap:wrap}
.la-caselist{display:flex;flex-direction:column;gap:0}
.la-caselist__label{min-width:160px;font-size:13px}
.la-caselist__detail{font-size:12px;color:var(--la-ink-2);flex-basis:100%;padding-left:4px}
.la-caselist__item.is-fail .la-caselist__detail{color:var(--la-danger)}
.la-runlist{display:flex;flex-direction:column;gap:4px}
.la-runlist__item{
  display:flex;align-items:baseline;gap:4px 12px;flex-wrap:wrap;padding:6px 8px;border:1px solid var(--la-line);
  border-radius:var(--la-radius-xs);font-size:12px;color:var(--la-ink-2);background:var(--la-bg)
}
.la-runlist__verdict{font-size:12.5px;color:var(--la-ink)}
.la-runlist__params,.la-runlist__model{font-family:ui-monospace,Consolas,monospace}
.la-runlist__criterion{flex-basis:100%}

/* 预测 / 研究问题 */
.la-predlist,.la-invlist{display:flex;flex-direction:column;gap:8px}
.la-pred,.la-inv{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg)}
.la-pred.is-open{border-left:2px solid var(--la-warn)}
.la-inv.is-active{border-left:2px solid var(--la-brand)}
.la-pred__head,.la-inv__head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.la-pred__grow,.la-inv__grow{flex:1}
.la-pred__text{font-size:14px;line-height:1.6}
.la-pred__resolveby{font-size:12px;color:var(--la-ink-2);line-height:1.55}
.la-pred__investigation,.la-pred__run{font-size:12px}
.la-pred__resolved{font-size:12px;color:var(--la-ok)}
.la-pred__note{font-size:12.5px;line-height:1.6;color:var(--la-ink-2)}
.la-pred__actions{display:flex;flex-direction:column;gap:6px;margin-top:4px}
.la-pred__form,.la-inv__form{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px;border:1px solid var(--la-line);border-radius:var(--la-radius-xs);background:var(--la-surface)}
.la-pred__form .la-input,.la-inv__form .la-input{flex:1;min-width:140px}
.la-inv__title{font-size:14px;font-weight:600;min-width:0;flex:1}
.la-inv__claim,.la-inv__counter,.la-inv__next{font-size:13px;line-height:1.65}
.la-inv__next{color:var(--la-ink)}
.la-inv__meta{font-size:12px}
.la-inv__actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}

/* 任务草案 */
.la-tasklist{display:flex;flex-direction:column;gap:6px}
.la-tasklist__open{
  display:flex;align-items:flex-start;gap:10px;width:100%;padding:9px 10px;min-height:48px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg);
  color:var(--la-ink);cursor:pointer;text-align:left
}
.la-tasklist__open:hover{border-color:var(--la-brand)}
.la-tasklist__main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.la-tasklist__title{font-size:14px}
.la-tasklist__sub{font-size:12px;color:var(--la-ink-2);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.la-tasklist__side{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none;font-size:12px}
.la-taskeditor{display:flex;flex-direction:column;gap:12px;padding:16px 18px 24px;height:100%;min-height:0;overflow:auto}
.la-taskeditor__head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.la-taskeditor__title{font-size:18px;font-weight:600}
.la-taskeditor__notsent{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--la-ink-2);line-height:1.5}
.la-taskeditor__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-taskstart{display:flex;flex-direction:column;gap:10px;max-width:var(--la-measure)}
.la-taskstart__title{font-size:17px;font-weight:600}
.la-taskstart__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-taskform{display:flex;flex-direction:column;gap:12px;max-width:1180px}
.la-taskcolumns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start}
.la-taskcol{display:flex;flex-direction:column;gap:6px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);min-width:0}
.la-taskcol__title{font-size:13px;font-weight:600;color:var(--la-ink)}
.la-taskcol .la-textarea{min-height:120px}
.la-taskitem{display:flex;flex-direction:column;gap:4px;position:relative;padding-right:30px}
.la-taskitem .la-iconbtn{position:absolute;right:0;top:4px}
.la-taskblock{display:flex;flex-direction:column;gap:6px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface);min-width:0}
.la-taskmeta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}
.la-taskevidence{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--la-ink-2)}
.la-taskevidence li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--la-line)}
.la-taskform__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:4px}
.la-tasksaved{display:flex;flex-direction:column;gap:14px;max-width:1180px}
.la-tasksaved__block{display:flex;flex-direction:column;gap:2px}
.la-tasksaved__text{font-size:15px;line-height:1.7;white-space:pre-wrap}
.la-tasksaved__list{display:flex;flex-direction:column;gap:4px;font-size:13.5px;line-height:1.6}
.la-taskversions{display:flex;align-items:center;gap:6px;font-size:12px}
.la-taskcompare{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-taskcompare__cols{display:grid;grid-template-columns:120px minmax(0,1fr) minmax(0,1fr);gap:8px;font-size:13px}
.la-taskcompare__row{display:contents}
.la-taskcompare__label{color:var(--la-ink-2);font-size:12px;padding-top:2px}
.la-taskcompare__cell{min-width:0;line-height:1.6}
.la-taskcompare__row.is-changed .la-taskcompare__cell{color:var(--la-warn)}
.la-taskcompare__cols>.la-muted{font-size:12px}

/* 资料与备份 */
.la-resources{display:flex;flex-direction:column;gap:14px}
.la-resblock{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-surface)}
.la-resrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.la-respath{display:flex;align-items:center;gap:8px;min-width:0}
.la-respath .la-icon{color:var(--la-ink-2);flex:none}
.la-respath__text{
  flex:1;min-width:0;padding:6px 8px;border:1px solid var(--la-line);border-radius:var(--la-radius-xs);
  background:var(--la-bg);font-family:ui-monospace,Consolas,monospace;font-size:12px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap
}
.la-respreview__line{font-size:13px}
.la-respreview__errors,.la-respreview__conflicts{display:flex;flex-direction:column;gap:4px}
.la-reslist{display:flex;flex-direction:column;gap:3px;font-size:12.5px;color:var(--la-ink-2);max-height:180px;overflow:auto}
.la-resmodes{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.la-migration{display:flex;flex-direction:column;gap:8px}
.la-migration__list{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:12.5px}
.la-migration__row{display:flex;gap:8px}
.la-migration__row dt{color:var(--la-ink-2)}
.la-migration__row dd{color:var(--la-ink)}

/* 继续研究 */
.la-continue{display:flex;flex-direction:column;gap:14px}
.la-continue__block{display:flex;flex-direction:column;gap:6px}
.la-continue__row{
  display:flex;align-items:flex-start;gap:10px;width:100%;padding:9px 10px;min-height:48px;
  border:1px solid var(--la-line);border-radius:var(--la-radius-sm);background:var(--la-bg);
  color:var(--la-ink);cursor:pointer;text-align:left
}
.la-continue__row:hover{border-color:var(--la-brand)}
.la-continue__row .la-icon{color:var(--la-ink-2);margin-top:2px}
.la-continue__main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;font-size:13.5px}
.la-continue__title{font-size:14px;line-height:1.45}

/* 来源详情 / 回执 */
.la-sourcedetail{display:flex;flex-direction:column;gap:8px}
.la-sourcedetail__row{display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;font-size:13px;line-height:1.6}
.la-sourcedetail__row dt{color:var(--la-ink-2);font-size:12px}
.la-sourcedetail__row dd{word-break:break-word}
.la-receipts{display:flex;flex-direction:column;gap:14px}
.la-receipts__block{display:flex;flex-direction:column;gap:6px}
.la-receipts__list{display:flex;flex-direction:column;gap:6px}
.la-receipt{display:flex;align-items:flex-start;gap:8px;padding:7px 9px;border:1px solid var(--la-line);border-radius:var(--la-radius-xs);font-size:12.5px;line-height:1.55;flex-wrap:wrap}
.la-receipt__kind{flex:none;font-weight:600;color:var(--la-ink-2)}
.la-receipt--ok .la-receipt__kind{color:var(--la-ok)}
.la-receipt--error .la-receipt__kind,.la-receipt--error .la-receipt__text{color:var(--la-danger)}
.la-receipt--error{border-color:var(--la-danger)}
.la-receipt--warn{border-color:var(--la-warn)}
.la-receipt__text{flex:1;min-width:0;word-break:break-word}
.la-receipt__code{font-family:ui-monospace,Consolas,monospace;color:var(--la-ink-2);font-size:12px}
.la-receipt__time{font-size:12px;color:var(--la-ink-2)}

@media (max-width:1180px){
  .la-evidencegrid{grid-template-columns:minmax(0,1fr)}
  .la-listview__columns{grid-template-columns:minmax(0,1fr)}
  .la-taskcolumns{grid-template-columns:minmax(0,1fr)}
  .la-taskmeta{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:919px){
  .la-scale{padding:14px 12px 20px}
  .la-scale--subject{padding:0}
  .la-scale--evidence{padding:12px 10px 18px}
  .la-projection{padding:14px 12px 20px}
  .la-practice{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
  .la-timeline__year{width:68px;font-size:12px}
  .la-domaingrid{grid-template-columns:minmax(0,1fr)}
  .la-subjecthead{padding:10px 12px}
  .la-readpane{padding:12px 12px 20px}
  .la-partner{border-left:0}
  .la-dossier__title{font-size:19px}
  .la-taskeditor{padding:12px 10px 20px}
  .la-taskcompare__cols{grid-template-columns:80px minmax(0,1fr) minmax(0,1fr)}
  .la-overlay{padding:8px}
}
`
  return { VIEWS_CSS }
})
__def("styles/index.js", function (__req) {
/**
 * 样式入口：基础层 + 外壳层 + 视图层，按顺序拼接为一段 CSS。
 */

const { BASE_CSS } = __req("styles/base.js")
const { SHELL_CSS } = __req("styles/shell.js")
const { VIEWS_CSS } = __req("styles/views.js")

const CSS = [BASE_CSS, SHELL_CSS, VIEWS_CSS].join('\n')
  return { CSS }
})
__def("App.js", function (__req) {
/**
 * 应用外壳：顶栏 / 目录 / 主视图 / 学习伙伴 / 状态条 / 弹层，以及 1440/1024/窄屏布局。
 * 插件只占宿主 main 槽分配的区域，不重做 Harness 外壳。
 */

const { useState, useEffect, useMemo, useCallback, useRef } = React

const { createTranslator, FALLBACK_ZH, FALLBACK_EN } = __req("i18n.js")
const { classNames, clamp, subjectKey, copyText } = __req("util.js")
const { indexCore, neighborsOf } = __req("model.js")
const { indexStore } = __req("store.js")
const { useAppState, useView } = __req("state/app.js")
const { useLocaleRevision, useKeyedDrafts, useMediaQuery, useFillViewportHeight } = __req("state/hooks.js")
const { useChat } = __req("state/dialog.js")
const { Button, Notice, EmptyState } = __req("components/primitives.js")
const { Icon } = __req("components/Icons.js")
const { TopBar } = __req("views/TopBar.js")
const { Directory } = __req("views/Directory.js")
const { StatusBar } = __req("views/StatusBar.js")
const { DomainScale } = __req("views/DomainScale.js")
const { SubjectScale } = __req("views/SubjectScale.js")
const { EvidenceScale } = __req("views/EvidenceScale.js")
const { Partner } = __req("views/Partner.js")
const { RelationInspector } = __req("views/RelationInspector.js")
const { ResourcesDialog } = __req("views/ResourcesDialog.js")
const { ContinueDialog } = __req("views/ContinueDialog.js")
const { SourceDialog } = __req("views/SourceDialog.js")
const { ReceiptsDialog } = __req("views/ReceiptsDialog.js")
const { useCopyText } = __req("views/shared.js")
const { CSS } = __req("styles/index.js")

const FALLBACK_DICTS = { zh: FALLBACK_ZH, en: FALLBACK_EN }

function App(props) {
  const ctx = props && props.ctx
  const locale = ctx && ctx.locale
  useLocaleRevision(locale)
  const localeDict = props && props.localeDict
  const t = useMemo(() => {
    if (locale && typeof locale.bind === 'function') {
      try {
        return locale.bind('loop')
      } catch {
        /* 回退到内置字典 */
      }
    }
    return createTranslator(localeDict || FALLBACK_DICTS)
  }, [locale, localeDict])
  const app = useAppState(t)

  if (app.phase === 'loading') {
    return h(
      'div',
      { className: 'la-root la-root--state' },
      h('style', null, CSS),
      h(
        'div',
        { className: 'la-statepane', role: 'status' },
        h(Icon, { name: 'refresh', size: 20 }),
        h('p', null, t('loop.app.loading')),
      ),
    )
  }

  if (app.phase === 'error' || !app.data) {
    return h(
      'div',
      { className: 'la-root la-root--state' },
      h('style', null, CSS),
      h(
        'div',
        { className: 'la-statepane', role: 'alert' },
        h(Icon, { name: 'error', size: 22 }),
        h('h1', { className: 'la-statepane__title' }, t('loop.app.loadError')),
        h('p', { className: 'la-statepane__message' }, app.error ? String(app.error.message) : ''),
        app.error && app.error.code ? h('p', { className: 'la-muted' }, `[${app.error.code}]`) : null,
        h('p', { className: 'la-statepane__hint la-muted' }, t('loop.app.errorHint')),
        h(Button, { variant: 'primary', icon: 'refresh', onClick: () => app.load({}) }, t('loop.app.retry')),
      ),
    )
  }

  return h(Panel, { app, t, ctx, localeDict })
}

function Panel(props) {
  const t = props.t
  const app = props.app
  const data = app.data
  const ci = useMemo(() => indexCore(data && data.core), [data])
  const storeIndex = useMemo(() => indexStore(data && data.store), [data])

  const addReceipt = app.addReceipt
  const onPersistError = useCallback(
    (error) => {
      addReceipt({
        kind: 'error',
        text: t('loop.status.viewSaveFailed', { message: error.message }),
        code: error.code,
      })
    },
    [addReceipt, t],
  )
  const [view, updateView] = useView(data.store && data.store.view, onPersistError)
  const narrow = useMediaQuery('(max-width: 919px)')
  const [rootRef, fillHeight] = useFillViewportHeight()
  const [narrowStage, setNarrowStage] = useState('graph')
  const [partnerTab, setPartnerTab] = useState('chat')
  const [chatOverride, setChatOverride] = useState(null)
  const noteDrafts = useKeyedDrafts()
  const [sourceDialog, setSourceDialog] = useState(null)
  const [continueOpen, setContinueOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [receiptsOpen, setReceiptsOpen] = useState(false)
  const [rightWidth, setRightWidth] = useState(() => {
    try {
      const stored = Number(window.localStorage.getItem('loop.partnerWidth'))
      if (stored >= 300 && stored <= 460) return stored
    } catch {
      /* 隐私模式没有 localStorage */
    }
    return 352
  })
  const rightWidthRef = useRef(rightWidth)
  rightWidthRef.current = rightWidth
  const dragState = useRef(null)

  const copy = useCopyText(t, addReceipt)

  const chat = useChat({
    reload: () => app.load({ quiet: true }),
    addReceipt,
    t,
  })

  useEffect(() => {
    try {
      window.localStorage.setItem('loop.partnerWidth', String(rightWidth))
    } catch {
      /* 忽略持久化失败：宽度只是本地偏好 */
    }
  }, [rightWidth])

  useEffect(() => {
    if (!narrow) return
    if (view.rightOpen) updateView({ rightOpen: false })
    if (view.directoryOpen) updateView({ directoryOpen: false })
    // 只在进入窄屏时收一次，之后由用户自己开关。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow])

  useEffect(() => {
    if (!ci.hasContent) return
    const hasRelation = view.selectedRelationId && ci.relationsById.has(view.selectedRelationId)
    const hasNode = view.selectedNodeId && ci.nodesById.has(view.selectedNodeId)
    if (hasRelation || hasNode) return
    const firstGroup = ci.groups[0]
    const entry = firstGroup && firstGroup.entryNodeId ? ci.nodesById.get(firstGroup.entryNodeId) : null
    const fallback = entry || ci.nodes[0]
    if (fallback) updateView({ selectedNodeId: fallback.id })
  }, [ci, view.selectedNodeId, view.selectedRelationId, updateView])

  const subject = useMemo(() => {
    if (view.selectedRelationId && ci.relationsById.has(view.selectedRelationId)) {
      return { kind: 'relation', id: view.selectedRelationId }
    }
    if (view.selectedNodeId && ci.nodesById.has(view.selectedNodeId)) {
      return { kind: 'node', id: view.selectedNodeId }
    }
    if (view.activeInvestigationId && storeIndex.investigations.some((item) => item.id === view.activeInvestigationId)) {
      return { kind: 'investigation', id: view.activeInvestigationId }
    }
    return null
  }, [ci, view.selectedRelationId, view.selectedNodeId, view.activeInvestigationId, storeIndex])

  const centerNode = useMemo(() => {
    if (!subject) return null
    if (subject.kind === 'node') return ci.nodesById.get(subject.id) || null
    if (subject.kind === 'relation') {
      const relation = ci.relationsById.get(subject.id)
      if (!relation) return null
      return ci.nodesById.get(relation.from) || ci.nodesById.get(relation.to) || null
    }
    return null
  }, [ci, subject])

  const neighborData = useMemo(
    () => (centerNode ? neighborsOf(ci, centerNode.id, 7) : { neighbors: [], total: 0 }),
    [ci, centerNode],
  )
  const selectedRelation = view.selectedRelationId ? ci.relationsById.get(view.selectedRelationId) || null : null
  const ck = subject ? subjectKey(subject) : ''
  const activeGroupId = centerNode && centerNode.groupId ? centerNode.groupId : null
  const partnerSubject = chatOverride || subject
  const noteDraft = noteDrafts.getDraft(ck)
  const recommendedGroupId = useMemo(() => {
    const hasUserData =
      storeIndex.notes.length > 0 || storeIndex.investigations.length > 0 || storeIndex.runs.length > 0
    if (hasUserData) return null
    const goalGroup = ci.groups.find((group) => (ci.nodesByGroup.get(group.id) || []).some((node) => node.id === 'goal'))
    return goalGroup ? goalGroup.id : ci.groups[0] ? ci.groups[0].id : null
  }, [ci, storeIndex])

  const modelAvailable = data.modelAvailable !== false && !(data.model && data.model.available === false)
  const modelReason = data.modelReason || (data.model && data.model.reason) || t('loop.chat.noModel')
  const notices = data.notices || []

  /* ── 键盘：Escape 取消关系选择 / 窄屏回到图 ─────────────── */
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      const target = event.target
      const tag = target && target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target && target.isContentEditable)) return
      if (sourceDialog || continueOpen || resourcesOpen || receiptsOpen) return
      if (view.selectedRelationId) {
        updateView({ selectedRelationId: null })
        return
      }
      if (narrow && narrowStage !== 'graph') setNarrowStage('graph')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [
    view.selectedRelationId,
    sourceDialog,
    continueOpen,
    resourcesOpen,
    receiptsOpen,
    narrow,
    narrowStage,
    updateView,
  ])

  /* ── 选择与导航 ─────────────────────────────────────────── */
  const onSelectNode = useCallback(
    (id, options) => {
      const opts = options || {}
      if (!ci.nodesById.has(id)) return
      setChatOverride(null)
      updateView({
        selectedNodeId: id,
        selectedRelationId: null,
        activeInvestigationId: null,
        scale: opts.scale || 'subject',
      })
      if (narrow) setNarrowStage('graph')
    },
    [ci, narrow, updateView],
  )

  const onSelectRelation = useCallback(
    (id, options) => {
      const relation = ci.relationsById.get(id)
      if (!relation) return
      const opts = options || {}
      setChatOverride(null)
      updateView({
        selectedRelationId: id,
        selectedNodeId: relation.from,
        activeInvestigationId: null,
        scale: opts.scale || 'subject',
      })
      if (narrow) setNarrowStage('read')
      else setPartnerTab('chat')
    },
    [ci, narrow, updateView],
  )

  const onClearRelation = useCallback(() => {
    updateView({ selectedRelationId: null })
  }, [updateView])

  const onSelectGroup = useCallback(
    (group) => {
      const entry = group.entryNodeId ? ci.nodesById.get(group.entryNodeId) : null
      const nodes = ci.nodesByGroup.get(group.id) || []
      const target = entry || nodes[0]
      if (!target) return
      onSelectNode(target.id)
      if (narrow) updateView({ directoryOpen: false })
    },
    [ci, narrow, onSelectNode, updateView],
  )

  const onChangeView = useCallback(
    (patch) => {
      if (patch.scale && patch.scale !== 'subject' && narrow) setNarrowStage('graph')
      updateView(patch)
    },
    [narrow, updateView],
  )

  const onGoSubject = useCallback(
    (target, scale) => {
      setContinueOpen(false)
      if (!target) return
      if (target.kind === 'relation') {
        onSelectRelation(target.id, { scale: scale || 'subject' })
        return
      }
      if (target.kind === 'node') {
        onSelectNode(target.id, { scale: scale || 'subject' })
        return
      }
      updateView({ scale: scale || 'evidence', activeInvestigationId: target.id })
      setNarrowStage('graph')
    },
    [narrow, onSelectNode, onSelectRelation, updateView],
  )

  const onDiscussInvestigation = useCallback(
    (investigation) => {
      if (!investigation) return
      setContinueOpen(false)
      updateView({
        scale: 'evidence',
        activeInvestigationId: investigation.id,
        selectedNodeId:
          investigation.subject && investigation.subject.kind === 'node' ? investigation.subject.id : view.selectedNodeId,
        selectedRelationId:
          investigation.subject && investigation.subject.kind === 'relation' ? investigation.subject.id : view.selectedRelationId,
      })
      setChatOverride({ kind: 'investigation', id: investigation.id })
      setPartnerTab('chat')
      if (narrow) setNarrowStage('chat')
      else updateView({ rightOpen: true })
      setNarrowStage((stage) => (narrow ? 'chat' : stage))
    },
    [narrow, updateView, view.selectedNodeId, view.selectedRelationId],
  )

  const onGoRun = useCallback(
    (run) => {
      setContinueOpen(false)
      if (run && run.subject) onGoSubject(run.subject, 'evidence')
      else updateView({ scale: 'evidence' })
    },
    [onGoSubject, updateView],
  )

  const openPartner = useCallback(
    (tab) => {
      if (tab) setPartnerTab(tab)
      if (narrow) setNarrowStage('chat')
      else if (!view.rightOpen) updateView({ rightOpen: true })
    },
    [narrow, updateView, view.rightOpen],
  )

  const onAsk = useCallback(() => openPartner('chat'), [openPartner])

  const onOpenNotes = useCallback(() => {
    openPartner('notes')
  }, [openPartner])

  /* ── 写入：全部经 Host 回执 ─────────────────────────────── */
  const saveNote = useCallback(
    (payload) =>
      app.perform('note.save', payload, {
        successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
      }),
    [app, t],
  )
  const adoptDraft = useCallback(
    (message) => {
      if (!subject || !message) return Promise.resolve(null)
      return app.perform(
        'note.save',
        {
          subject,
          kind: '证据',
          text: message.text,
          authorSource: 'ai-draft',
          savedBy: 'ui',
          adopted: true,
        },
        { successText: t('loop.note.adoptedDraft') },
      )
    },
    [app, subject, t],
  )
  const isMessageAdopted = useCallback(
    (message) => {
      if (!subject || !message) return false
      const value = String(message.text || '').trim()
      if (!value) return false
      return storeIndex
        .notesFor(subject)
        .some((note) => note.authorSource === 'ai-draft' && note.adopted === true && note.text.trim() === value)
    },
    [storeIndex, subject],
  )
  const onPrefillNote = useCallback(
    (text) => {
      if (!ck) return
      noteDrafts.setDraft(ck, text)
      addReceipt({ kind: 'info', text: t('loop.exp.saveObs') })
    },
    [addReceipt, ck, noteDrafts, t],
  )
  const onToggleDirectory = useCallback(() => updateView({ directoryOpen: !view.directoryOpen }), [updateView, view.directoryOpen])
  const onCollapseDirectory = useCallback(() => updateView({ directoryOpen: false }), [updateView])

  /* ── 左右栏拖拽/键盘调整 ───────────────────────────────── */
  const startResize = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    dragState.current = { startX: event.clientX, startWidth: rightWidthRef.current }
    function onMove(moveEvent) {
      if (!dragState.current) return
      const delta = dragState.current.startX - moveEvent.clientX
      setRightWidth(clamp(Math.round(dragState.current.startWidth + delta), 320, 460))
    }
    function onUp() {
      dragState.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const onResizeKeyDown = useCallback((event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setRightWidth((width) => clamp(width + (event.key === 'ArrowLeft' ? 16 : -16), 320, 460))
  }, [])

  /* ── 渲染 ───────────────────────────────────────────────── */
  const partnerElement = h(Partner, {
    t,
    ci,
    storeIndex,
    subject: partnerSubject,
    selectedRelation,
    model: data.model,
    modelAvailable,
    modelReason,
    perform: app.perform,
    addReceipt,
    chat,
    tab: partnerTab,
    onTabChange: setPartnerTab,
    noteDraft: noteDrafts.getDraft(partnerSubject ? subjectKey(partnerSubject) : ''),
    onNoteDraftChange: (text) => noteDrafts.setDraft(partnerSubject ? subjectKey(partnerSubject) : '', text),
    onSaveNote: saveNote,
    onSaveNoteEdit: (payload) =>
      app.perform('note.save', payload, { successText: t('loop.status.saveOk', { what: t('loop.note.title') }) }),
    onArchiveNote: (note) =>
      app.perform('note.archive', { noteId: note.id }, {
        successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
      }),
    onDeleteNote: (note) =>
      app.perform('note.delete', { noteId: note.id }, {
        successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
      }),
    onAdoptDraft: adoptDraft,
    isAdopted: isMessageAdopted,
    onOpenSource: (source) => setSourceDialog({ open: true, source }),
    onClearRelation,
    onCollapse: () => (narrow ? setNarrowStage('graph') : updateView({ rightOpen: false })),
  })

  const subjectScale = h(SubjectScale, {
    t,
    ci,
    view,
    center: centerNode,
    neighbors: neighborData.neighbors,
    totalNeighbors: neighborData.total,
    selectedRelation,
    notes: subject ? storeIndex.notesFor(subject) : [],
    narrow,
    stage: narrowStage === 'read' ? 'read' : 'graph',
    onSelectNode,
    onSelectRelation,
    onClearRelation,
    onRequestGraph: () => setNarrowStage('graph'),
    onOpenSource: (source) => setSourceDialog({ open: true, source }),
    onViewEvidence: () => updateView({ scale: 'evidence' }),
    onOpenNotes,
    onAsk,
    relationInspector:
      narrow && selectedRelation
        ? h(RelationInspector, {
            t,
            ci,
            relation: selectedRelation,
            record: storeIndex.relationFor(selectedRelation.id),
            notes: storeIndex.notesFor({ kind: 'relation', id: selectedRelation.id }),
            onOpenSource: (source) => setSourceDialog({ open: true, source }),
            onClearRelation,
            onAsk,
            onSaveAnnotation: (payload) =>
              app.perform('relation.annotate', Object.assign({ edgeId: selectedRelation.id }, payload), {
                successText: t('loop.relation.saved'),
              }),
          })
        : null,
  })

  const centerContent =
    view.scale === 'domain'
      ? h(DomainScale, {
          t,
          ci,
          store: data.store,
          recommendedGroupId,
          onEnterGroup: onSelectGroup,
        })
      : view.scale === 'evidence'
        ? h(EvidenceScale, {
            t,
            ci,
            storeIndex,
            subject,
            perform: app.perform,
            addReceipt,
            noteDraft,
            onNoteDraftChange: (text) => (ck ? noteDrafts.setDraft(ck, text) : null),
            onSaveNote: saveNote,
            onSaveNoteEdit: (payload) =>
              app.perform('note.save', payload, { successText: t('loop.status.saveOk', { what: t('loop.note.title') }) }),
            onArchiveNote: (note) =>
              app.perform('note.archive', { noteId: note.id }, {
                successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
              }),
            onDeleteNote: (note) =>
              app.perform('note.delete', { noteId: note.id }, {
                successText: t('loop.status.saveOk', { what: t('loop.note.title') }),
              }),
            onPrefillNote,
            onGoSubject: (target) => onGoSubject(target, 'subject'),
            onDiscussInvestigation,
          })
        : subjectScale

  const layoutClass = classNames(
    'la-body',
    view.directoryOpen && 'has-dir',
    !narrow && view.rightOpen && 'has-right',
    narrow && 'is-narrow',
    narrow && narrowStage === 'chat' && 'is-chatstage',
  )

  return h(
    'div',
    {
      className: classNames('la-root', narrow && 'is-narrow'),
      ref: rootRef,
      style: {
        '--la-right-width': `${rightWidth}px`,
        height: fillHeight ? `${fillHeight}px` : undefined,
      },
    },
    h('style', null, CSS),
    h(TopBar, {
      t,
      ci,
      view,
      rightOpen: narrow ? narrowStage === 'chat' : view.rightOpen,
      directoryOpen: view.directoryOpen,
      onChangeView,
      onSelectNode,
      onSelectRelation,
      onOpenContinue: () => setContinueOpen(true),
      onOpenResources: () => setResourcesOpen(true),
      onTogglePartner: () => {
        if (narrow) setNarrowStage((stage) => (stage === 'chat' ? 'graph' : 'chat'))
        else updateView({ rightOpen: !view.rightOpen })
      },
      onToggleDirectory: onToggleDirectory,
    }),
    data.fatal ? h('div', { className: 'la-banner' }, h(Notice, { tone: 'error' }, String(data.fatal))) : null,
    data.readOnly ? h('div', { className: 'la-banner' }, h(Notice, { tone: 'warn' }, t('loop.error.READ_ONLY'))) : null,
    h(
      'div',
      { className: layoutClass },
      view.directoryOpen
        ? [
            h(Directory, {
              key: 'dir',
              t,
              ci,
              store: data.store,
              view,
              activeGroupId,
              narrow,
              onCollapse: onCollapseDirectory,
              onOpenDomain: () => onChangeView({ scale: 'domain' }),
              onSelectGroup,
            }),
            narrow
              ? h('div', {
                  key: 'backdrop',
                  className: 'la-backdrop',
                  onClick: onCollapseDirectory,
                  'aria-hidden': 'true',
                })
              : null,
          ]
        : null,
      narrow && narrowStage === 'chat'
        ? h('main', { className: 'la-mainpane', key: 'chatmain' }, partnerElement)
        : h('main', { className: 'la-mainpane', key: 'main' }, centerContent),
      !narrow && view.rightOpen
        ? h(
            'div',
            { className: 'la-splitter', key: 'splitter' },
            h('span', {
              className: 'la-splitter__handle',
              role: 'separator',
              'aria-orientation': 'vertical',
              'aria-label': t('loop.partner.title'),
              'aria-valuenow': rightWidth,
              'aria-valuemin': 320,
              'aria-valuemax': 460,
              tabIndex: 0,
              onMouseDown: startResize,
              onKeyDown: onResizeKeyDown,
            }),
          )
        : null,
      !narrow && view.rightOpen ? partnerElement : null,
    ),
    narrow
      ? h(
          'nav',
          { className: 'la-mobilestage', 'aria-label': t('loop.stage.label') },
          [
            { id: 'graph', label: t('loop.stage.graph') },
            { id: 'read', label: t('loop.stage.read') },
            { id: 'chat', label: t('loop.stage.chat') },
          ].map((stage) =>
            h(
              'button',
              {
                key: stage.id,
                type: 'button',
                className: `la-mobilestage__item ${narrowStage === stage.id ? 'is-active' : ''}`.trim(),
                onClick: () => setNarrowStage(stage.id),
                'aria-pressed': narrowStage === stage.id,
              },
              stage.label,
            ),
          ),
        )
      : null,
    h(StatusBar, {
      t,
      data,
      receipts: app.receipts,
      notices,
      refreshing: app.refreshing,
      onRefresh: () => app.load({ showRefreshing: true, quiet: true }),
      onCopyPath: () => copy(data.dataPath || ''),
      onOpenReceipts: () => setReceiptsOpen(true),
    }),
    h(ContinueDialog, {
      open: continueOpen,
      onClose: () => setContinueOpen(false),
      t,
      ci,
      storeIndex,
      view,
      onGoSubject,
      onGoInvestigation: onDiscussInvestigation,
      onGoRun,
    }),
    h(ResourcesDialog, {
      open: resourcesOpen,
      onClose: () => setResourcesOpen(false),
      t,
      data,
      storeIndex,
      perform: app.perform,
      addReceipt,
      copyText: copy,
    }),
    h(SourceDialog, {
      open: !!(sourceDialog && sourceDialog.open),
      source: sourceDialog && sourceDialog.source,
      t,
      onClose: () => setSourceDialog(null),
      onCopy: (text) => copy(text),
    }),
    h(ReceiptsDialog, {
      open: receiptsOpen,
      onClose: () => setReceiptsOpen(false),
      t,
      receipts: app.receipts,
      notices,
      onClear: app.clearReceipts,
    }),
    h('div', { className: 'la-live', 'aria-live': 'polite', role: 'status' }, app.receipts[0] ? app.receipts[0].text : ''),
  )
}
  return { App, Panel }
})
__def("index.js", function (__req) {
/**
 * 客户端插件入口：注册 locale 字典与三个宿主槽位，返回 plugin 对象。
 *
 * 槽位（契约 §0，勿改 id/order 含义）：
 * - main：全页面板（key 'loop-atlas'）
 * - settings.section：设置区入口（id 'loop-atlas'，order 92，label 掌控 · 控制论）
 * - sidebar.footer.action：侧栏底部按钮（id 'loop-atlas-open'，order 40，label 掌控）
 */

const { LOCALE } = __req("#locale")
const { App } = __req("App.js")

function SettingsSection(props) {
  const ctx = props.ctx
  const t = ctx.locale.bind('loop')
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    if (typeof ctx.locale.subscribe !== 'function') return undefined
    const unsubscribe = ctx.locale.subscribe(() => setTick((value) => value + 1))
    return typeof unsubscribe === 'function' ? unsubscribe : undefined
  }, [ctx])
  return h(
    'div',
    { style: { padding: '4px 0', fontSize: '13px', lineHeight: 1.9, color: 'var(--dsw-alias-label-primary)' } },
    h('p', { style: { margin: '0 0 10px', color: 'var(--dsw-alias-label-secondary)' } }, t('loop.settings.description')),
    h(
      'button',
      {
        type: 'button',
        onClick: () => {
          try {
            ctx.layout.selectPanel('loop-atlas')
          } catch (error) {
            console.error('[loop-atlas] 无法切换面板', error)
          }
        },
        style: {
          background: 'var(--dsw-alias-brand-primary)',
          color: 'var(--dsw-alias-bg-base)',
          border: 0,
          borderRadius: 'var(--dsw-radius-sm)',
          padding: '8px 16px',
          minHeight: '40px',
          cursor: 'pointer',
          font: 'inherit',
          fontSize: '14px',
        },
      },
      t('loop.settings.open'),
    ),
  )
}

function SidebarButton(props) {
  const ctx = props.ctx
  const t = ctx.locale.bind('loop')
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    if (typeof ctx.locale.subscribe !== 'function') return undefined
    const unsubscribe = ctx.locale.subscribe(() => setTick((value) => value + 1))
    return typeof unsubscribe === 'function' ? unsubscribe : undefined
  }, [ctx])
  return h(
    'button',
    {
      type: 'button',
      title: t('loop.settings.open'),
      onClick: () => {
        try {
          ctx.layout.selectPanel('loop-atlas')
        } catch (error) {
          console.error('[loop-atlas] 无法切换面板', error)
        }
      },
      style: {
        background: 'none',
        border: '1px solid var(--dsw-alias-border-l1)',
        color: 'var(--dsw-alias-label-primary)',
        borderRadius: 'var(--dsw-radius-sm)',
        cursor: 'pointer',
        fontSize: '12px',
        padding: '6px 10px',
        minHeight: '32px',
        letterSpacing: '0.08em',
        font: 'inherit',
      },
    },
    t('loop.sidebar.open'),
  )
}

const plugin = {
  inject: ['slots', 'layout', 'locale'],
  apply(ctx) {
    ctx.effect(() => ctx.locale.register('loop', LOCALE), 'loop-atlas: dictionaries')

    ctx.effect(
      () =>
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'loop-atlas', locale: 'loop' }, (props) =>
            h(App, Object.assign({}, props, { ctx, localeDict: LOCALE })),
          ),
        ),
      'loop-atlas: main panel',
    )

    ctx.effect(
      () =>
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            { name: 'settings.section', id: 'loop-atlas', order: 92, label: '掌控 · 控制论' },
            (props) => h(SettingsSection, Object.assign({}, props, { ctx })),
          ),
        ),
      'loop-atlas: settings section',
    )

    ctx.effect(
      () =>
        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            { name: 'sidebar.footer.action', id: 'loop-atlas-open', order: 40, label: '掌控' },
            (props) => h(SidebarButton, Object.assign({}, props, { ctx })),
          ),
        ),
      'loop-atlas: sidebar action',
    )
  },
}
  return { plugin }
})
__def("#locale", function () {
  return { LOCALE: {"zh":{"loop.app.title":"掌控","loop.app.tagline":"看清一个系统如何纠正自己，也看清自己凭什么相信它","loop.app.loading":"正在读取宿主数据…","loop.app.loadError":"读不到本地数据","loop.app.errorHint":"页面通过 /api/loop-atlas 读取宿主写入的数据文件。请确认宿主侧插件已激活，然后重试。","loop.app.retry":"重试","loop.brand.sub":"控制论 · 推理与验证","loop.scale.label":"阅读尺度","loop.scale.domain":"领域","loop.scale.subject":"问题","loop.scale.evidence":"证据","loop.scale.domain.hint":"看骨架：八个单元各自解决什么问题","loop.scale.subject.hint":"读懂关系：当前节点与它的相关邻居","loop.scale.evidence.hint":"动手验证：实验、预测、证据与任务草案","loop.projection.label":"视角","loop.projection.theory":"理论","loop.projection.history":"历史","loop.projection.practice":"实践","loop.projection.hint":"视角切换在问题尺度可用","loop.search.placeholder":"搜索节点、关系…","loop.search.label":"搜索","loop.search.empty":"没有匹配的节点或关系","loop.search.node":"节点","loop.search.relation":"关系","loop.search.hint":"↑↓ 选择 · Enter 打开 · Esc 关闭","loop.continue":"继续研究","loop.continue.title":"继续研究","loop.continue.lastSubject":"上次阅读","loop.continue.investigations":"进行中的研究问题","loop.continue.predictions":"待验证的预测","loop.continue.runs":"最近的运行","loop.continue.nextTest":"下一项检验","loop.continue.noNextTest":"还没写下一项检验","loop.continue.empty":"还没有进行中的研究。先在问题尺度选一个节点，或写下一条预测。","loop.continue.open":"回到这里","loop.resources":"资料与备份","loop.partner.show":"展开学习伙伴","loop.partner.hide":"收起学习伙伴","loop.partner.title":"学习伙伴","loop.partner.model":"模型","loop.partner.model.available":"可用","loop.partner.model.unavailable":"不可用","loop.partner.tab.chat":"对话","loop.partner.tab.notes":"笔记","loop.dir.title":"单元目录","loop.dir.overview":"领域总览","loop.dir.entry":"入口","loop.dir.notes":"{count} 条笔记","loop.dir.collapse":"收起目录","loop.dir.expand":"展开目录","loop.dir.current":"当前","loop.stage.graph":"图","loop.stage.read":"阅读","loop.stage.chat":"对话","loop.stage.label":"窄屏分段视图","loop.dialog.close":"关闭","loop.overlay.close":"关闭弹层","loop.domain.intro":"八个单元，每个回答一个维持性问题。进入单元即回到它的入口节点。","loop.domain.question":"解决什么问题","loop.domain.capability":"能力目标","loop.domain.concepts":"{count} 个概念","loop.domain.start":"从目标与边界开始","loop.domain.recommended":"建议起点","loop.domain.openUnit":"进入单元：{title}","loop.subject.current":"当前节点","loop.subject.neighbors":"{count} 个相关邻居","loop.subject.neighborsEmpty":"这个节点还没有已收录的关系。可切到理论视角看单元结构，或在证据尺度写下你的问题。","loop.subject.moreNeighbors":"还有 {count} 个相关节点未展开","loop.subject.kind.concept":"概念","loop.subject.kind.device":"装置","loop.subject.kind.event":"事件","loop.subject.eraUnknown":"时间不确定","loop.subject.graph":"图谱","loop.subject.list":"列表","loop.subject.read":"读当前节点","loop.subject.def":"定义","loop.subject.can":"能做什么","loop.subject.mech":"机制","loop.subject.limits":"适用条件与边界","loop.subject.counter":"反例","loop.subject.check":"检验任务","loop.subject.hist":"历史关联","loop.subject.migrate":"迁移到编程智能体","loop.subject.migrateType.formal":"同一机制","loop.subject.migrateType.application":"工程应用","loop.subject.migrateType.analogy":"类比，不是同一机制","loop.subject.migrateType.heuristic":"经验法则，不是同一机制","loop.subject.claims":"主张与来源","loop.subject.sources":"来源","loop.subject.notesCount":"{count} 条相关笔记","loop.subject.relationsCount":"{count} 条关系","loop.subject.graphHint":"点节点切换中心，点连线或关系标签读条件与代价。","loop.subject.viewEvidence":"在证据尺度验证","loop.subject.clearRelation":"取消选中关系","loop.subject.group":"所属单元","loop.subject.unknownGroup":"未分组","loop.subject.empty":"内容包缺少节点数据，无法显示问题尺度。","loop.relation.type.prerequisite":"依赖","loop.relation.type.formal":"形式结果","loop.relation.type.constraint":"限制","loop.relation.type.parallel":"并行","loop.relation.type.historical":"历史影响","loop.relation.type.analogy":"类比","loop.relation.type.application":"工程应用","loop.relation.type.unknown":"关系","loop.relation.detail":"关系详情","loop.relation.fromTo":"{from} → {to}","loop.relation.claim":"这条关系断言什么","loop.relation.condition":"在什么条件下成立","loop.relation.cost":"相信或使用它的代价","loop.relation.claims":"主张级来源","loop.relation.noClaims":"这条关系还没有主张级来源。","loop.relation.noClaim":"这条关系没有单独的主张文本。","loop.relation.annotation":"我的批注","loop.relation.annotationPlaceholder":"在你的条件下，这条关系如何成立？写下你的判断，不必与教材一致。","loop.relation.status":"我的判断","loop.relation.status.open":"待判断","loop.relation.status.supported":"我确认支持","loop.relation.status.challenged":"我有反例","loop.relation.evidence":"相关证据（{count}）","loop.relation.evidenceEmpty":"还没有挂在这条关系上的笔记。在右侧笔记里写一条，或用实验观察生成一条。","loop.relation.attach":"挂为证据","loop.relation.detach":"取消挂载","loop.relation.ask":"就这条关系对话","loop.relation.saveAnnotation":"保存批注","loop.relation.saved":"批注已保存（宿主已确认）","loop.relation.verified.verified":"已核验","loop.relation.verified.secondary":"二手来源","loop.relation.verified.unverified":"未核验","loop.relation.claimKind.formal":"形式结果","loop.relation.claimKind.empirical":"经验","loop.relation.claimKind.historical":"历史","loop.relation.claimKind.interpretation":"解释","loop.relation.selectHint":"点一条连线或关系标签，读它的主张、条件与代价。","loop.relation.noCondition":"未写明条件 —— 这本身值得怀疑。","loop.relation.noCost":"未写明代价。","loop.relation.openSource":"查看来源：{title}","loop.theory.title":"理论视角：先修 → 形式结果 → 设计取舍","loop.theory.current":"当前节点","loop.theory.prereq":"先修与依赖","loop.theory.formal":"形式结果","loop.theory.tradeoff":"设计取舍","loop.theory.historical":"历史影响","loop.theory.analogy":"类比（非同一机制）","loop.theory.application":"工程应用","loop.theory.empty":"这个节点在理论视角下没有更多已收录结构。","loop.history.title":"历史视角：按确证时间区间排列","loop.history.unknown":"时间不确定","loop.history.unknownHint":"以下节点没有可确证的年代起点，单独列出，不编年表。","loop.history.empty":"没有与当前节点相关、且可确证时间的历史资料。","loop.history.gap":"缺口：{item}","loop.history.searchPath":"检索路径：{path}","loop.history.source":"来源","loop.history.work":"著作 / 文献","loop.history.yearUnknown":"年代不确定","loop.history.yearRange":"{from}—{to}","loop.history.yearSingle":"{year}","loop.practice.title":"实践视角：目标 → 上下文 → 行动 → 观测 → 验收 → 修订","loop.practice.goal":"目标","loop.practice.measurement":"测量","loop.practice.context":"上下文","loop.practice.action":"行动","loop.practice.observation":"观测","loop.practice.acceptance":"验收","loop.practice.revision":"修订","loop.practice.other":"未映射到阶段","loop.practice.caveat":"这里放的是工程机制。历史类比只作参照，不等于同一机制。","loop.practice.empty":"这个节点的实践阶段还没有被内容包标注。","loop.practice.stageHint":"按内容包的 practiceStages 标注排列，不是流程顺序的证据。","loop.evidence.title":"证据尺度：动手验证当前主题","loop.evidence.noSubject":"先在问题尺度选一个节点或关系，再回到证据尺度。","loop.evidence.pickSubject":"去问题尺度选主题","loop.evidence.experiments":"实验","loop.evidence.experimentHint":"实验由宿主侧的确定性模型执行；记录模型版本、参数与判据。","loop.evidence.noExperiments":"没有与当前主题关联的实验。","loop.evidence.investigations":"研究问题","loop.evidence.predictions":"预测","loop.evidence.notes":"证据笔记","loop.evidence.tasks":"任务草案","loop.evidence.runs":"运行记录","loop.evidence.noRuns":"还没有运行记录。运行一次实验，它会带着模型版本和判据保存下来。","loop.evidence.newTask":"新建任务草案","loop.evidence.back":"返回证据总览","loop.evidence.investigateFor":"为「{name}」写一个研究问题","loop.evidence.openTask":"打开任务草案","loop.evidence.subjectSources":"{sources} 个来源 · {unverified} 项待核验","loop.evidence.savedAt":"记录于 {at}","loop.evidence.reproducible":"同一参数可复现","loop.evidence.taskEmpty":"还没有任务草案。先写清楚你要改变什么行为。","loop.evidence.viewAllRuns":"查看全部运行","loop.evidence.hideRuns":"收起运行记录","loop.exp.predict":"先写下你的预测（可跳过）","loop.exp.predictionPlaceholder":"改动之后会发生什么？","loop.exp.run":"运行","loop.exp.running":"运行中…","loop.exp.skip":"跳过预测，直接运行","loop.exp.rerun":"改参数后重跑","loop.exp.verdict":"判定结果","loop.exp.criterion":"判据","loop.exp.model":"模型","loop.exp.params":"参数","loop.exp.recordedAt":"记录时间","loop.exp.reproducible":"同一参数得到同一结果","loop.exp.yourPrediction":"你的预测","loop.exp.match":"预测与判定一致","loop.exp.mismatch":"预测与判定不一致 —— 这比猜对更有信息","loop.exp.saveObs":"把这次观察写成证据","loop.exp.teaching":"教学模型","loop.exp.notRealSystem":"这是教学模型，不是任何真实系统的辨识结果。","loop.exp.failed":"运行失败：{message}","loop.exp.trace":"响应轨迹","loop.exp.target":"目标","loop.exp.closePanel":"收起实验","loop.exp.openPanel":"打开实验","loop.exp.runSaved":"运行记录已由宿主保存","loop.exp.verdict.converged":"收敛","loop.exp.verdict.overshoot-settled":"过冲后收敛","loop.exp.verdict.oscillating":"持续振荡（穿越目标）","loop.exp.verdict.oscillating-below":"目标下方振荡（不穿越目标）","loop.exp.verdict.drift":"漂移（未到目标）","loop.exp.verdict.diverging":"发散","loop.exp.verdict.pass":"通过","loop.exp.verdict.fail":"失败","loop.exp.verdict.mixed":"部分通过","loop.exp.delay.K":"增益 K","loop.exp.delay.D":"延迟 D（秒）","loop.exp.delay.formula":"一阶惯性 + 纯延迟：y′ = (u − y)/τ，τ = 0.5 s，u = clamp(K·(1 − y(t−D)), −2, 2)，dt = 0.02 s，目标 1。","loop.exp.proxy.e":"优化力度 e","loop.exp.proxy.visible":"可见指标","loop.exp.proxy.hidden":"隐藏指标","loop.exp.proxy.ratio":"隐藏 / 可见","loop.exp.proxy.peak":"隐藏指标峰值出现在 e ≈ {e}，值 {value}","loop.exp.green.cases":"检查用例","loop.exp.green.allGreen":"已勾选的检查全部通过","loop.exp.green.notCorrect":"这只说明「已测到的行为」通过，不等于功能正确。","loop.exp.green.caveat":"把「越界」用例勾上再看一次。","loop.exp.green.off":"未启用","loop.exp.green.pass":"通过","loop.exp.green.fail":"失败","loop.exp.green.actual":"实得：{actual}","loop.exp.green.expect":"期望：{expect}","loop.pred.title":"预测","loop.pred.new":"写一条预测","loop.pred.text":"预测内容","loop.pred.textPlaceholder":"例如：延迟大到 1 秒后，同一增益会持续振荡。","loop.pred.resolveBy":"可判定条件","loop.pred.resolveByPlaceholder":"例如：D ≥ 0.9、K = 1.2 时，16 秒内穿越目标 4 次以上。","loop.pred.save":"保存预测（未解决）","loop.pred.saved":"预测已保存（宿主已确认）","loop.pred.saving":"保存中…","loop.pred.empty":"还没有预测。先写一条可判定的预测，再用实验或观察去碰它。","loop.pred.status.open":"待验证","loop.pred.status.supported":"支持","loop.pred.status.refuted":"反驳","loop.pred.status.inconclusive":"不足以判断","loop.pred.resolve.supported":"支持","loop.pred.resolve.refuted":"反驳","loop.pred.resolve.inconclusive":"不足以判断","loop.pred.resolutionNote":"判定说明","loop.pred.resolutionNotePlaceholder":"依据是哪次运行、哪条观察？","loop.pred.resolve":"记录判定","loop.pred.resolvedAt":"判定于 {at}","loop.pred.legacy":"旧记录","loop.pred.legacyHint":"旧版本预测没有完整判定字段，按「待验证」显示。","loop.pred.linkRun":"关联运行（可选）","loop.pred.noRun":"不关联运行","loop.pred.investigation":"所属研究问题","loop.pred.noneInvestigation":"不关联研究问题","loop.pred.needText":"先写预测内容。","loop.inv.title":"研究问题","loop.inv.new":"新建研究问题","loop.inv.titleLabel":"问题标题","loop.inv.titlePlaceholder":"例如：负反馈在什么延迟下不再稳定？","loop.inv.claim":"当前主张","loop.inv.claimPlaceholder":"你认为现在成立的解释。","loop.inv.counter":"相反解释","loop.inv.counterPlaceholder":"如果当前主张错了，最可能的另一种解释是什么？","loop.inv.nextTest":"下一项检验","loop.inv.nextTestPlaceholder":"一句话：下一步怎么检验。","loop.inv.save":"保存研究问题","loop.inv.saved":"研究问题已保存（宿主已确认）","loop.inv.saving":"保存中…","loop.inv.empty":"还没有研究问题。写下一个主张和一个相反解释，让后面每一步都有对手。","loop.inv.status.open":"开放","loop.inv.status.testing":"检验中","loop.inv.status.supported":"支持","loop.inv.status.revised":"已修订","loop.inv.status.inconclusive":"不足以判断","loop.inv.statusLabel":"状态","loop.inv.resolve":"更新状态","loop.inv.resolveNote":"说明","loop.inv.discuss":"就这个问题对话","loop.inv.predCount":"{count} 条预测","loop.inv.runCount":"{count} 次运行","loop.inv.editing":"正在编辑：{title}","loop.inv.cancel":"取消编辑","loop.inv.needTitle":"先写研究问题标题。","loop.inv.nextTestLabel":"下一步","loop.note.title":"笔记","loop.note.placeholder":"写下你自己的话。它只属于你，AI 的回复不会自动变成你的笔记。","loop.note.kind":"类型","loop.note.kind.理解":"理解","loop.note.kind.疑问":"疑问","loop.note.kind.证据":"证据","loop.note.kind.反驳":"反驳","loop.note.kind.实践":"实践","loop.note.save":"保存为我的笔记","loop.note.saving":"保存中…","loop.note.edit":"编辑","loop.note.saveEdit":"保存修改","loop.note.cancel":"取消","loop.note.archive":"归档","loop.note.restore":"恢复","loop.note.delete":"删除","loop.note.deleteConfirm":"确定删除这条笔记？此操作会写入本地数据。","loop.note.empty":"这个主题还没有笔记。先写一句自己的理解。","loop.note.source.user":"用户原文","loop.note.source.ai-draft":"AI 草案","loop.note.source.import":"导入材料","loop.note.source.legacy":"旧记录来源不确定","loop.note.legacyHint":"旧版本记录无法区分是你亲写还是工具代写；请确认后自行修改。","loop.note.encodingHint":"这条旧记录可能包含编码损坏（? 替换字符）。","loop.note.savedBy":"保存者","loop.note.savedBy.ui":"你","loop.note.savedBy.agent":"智能体","loop.note.adopted":"已采纳","loop.note.revision":"修订 {n}","loop.note.adoptDraft":"存为我的证据（草案）","loop.note.adoptedDraft":"已存为草案","loop.note.draftHint":"作为 AI 草案保存；不会冒充你的原文。","loop.note.saveError":"保存失败：{message}","loop.note.count":"{count} 条","loop.note.archivedLabel":"已归档","loop.note.statusLabel":"状态","loop.note.adoptError":"存为草案失败：{message}","loop.note.notesFor":"当前主题的笔记","loop.chat.title":"对话","loop.chat.empty":"就当前主题向真实模型提问。回答不会自动变成你的笔记。","loop.chat.placeholder":"针对当前主题提问…（Ctrl+Enter 发送）","loop.chat.send":"发送","loop.chat.sending":"生成中…","loop.chat.stop":"停止","loop.chat.stopping":"停止中…","loop.chat.retry":"重试","loop.chat.failed":"失败","loop.chat.cancelled":"已停止","loop.chat.streaming":"生成中…","loop.chat.errorCode":"错误代码：{code}","loop.chat.interrupted":"上次回答在关闭页面时中断，可重试。","loop.chat.modelUnavailable":"模型不可用：{reason}。问题草稿会保留。","loop.chat.sendFailed":"请求失败：{message}","loop.chat.draftHint":"草稿按主题保存；切换主题不会串题。","loop.chat.subjectNote":"回答归属发送时的主题，切换主题不会改变它。","loop.chat.you":"你","loop.chat.ai":"学习伙伴","loop.chat.copy":"复制","loop.chat.copied":"已复制","loop.chat.copyFailed":"复制失败：{reason}","loop.chat.noModel":"未配置默认模型","loop.chat.sourcesSummary":"来源 {sources} · 待核验 {unverified}","loop.chat.retryUnavailable":"宿主未提供重试接口：{message}","loop.chat.partial":"（未完成）","loop.task.title":"任务草案","loop.task.startTitle":"先问：你要改变什么行为？","loop.task.request":"真实需求","loop.task.requestPlaceholder":"用你自己的话写：现在什么行为不对，你希望它变成什么？不用先想验收标准。","loop.task.generate":"生成可编辑草案","loop.task.generating":"生成中…","loop.task.goal":"目标","loop.task.acceptance":"验收（什么算够）","loop.task.boundary":"边界（不做什么）","loop.task.unknowns":"未知项（以问题呈现）","loop.task.answerPlaceholder":"先写你的判断（可留空）","loop.task.concepts":"相关概念","loop.task.evidence":"证据关联","loop.task.save":"保存草案","loop.task.saving":"保存中…","loop.task.saved":"草案已保存（宿主已确认）","loop.task.archive":"归档","loop.task.versions":"版本","loop.task.version":"第 {n} 版","loop.task.compare":"对比当前与所选版本","loop.task.copy":"复制全文","loop.task.export":"导出","loop.task.notSent":"草案只保存在本地，不会自动发送给任何外部工具。","loop.task.empty":"还没有任务草案。","loop.task.needRequest":"先写真实需求，再生成草案。","loop.task.addAcceptance":"加一条验收","loop.task.addBoundary":"加一条边界","loop.task.addUnknown":"加一条未知项","loop.task.remove":"移除","loop.task.status.draft":"草案","loop.task.status.saved":"已保存","loop.task.status.archived":"已归档","loop.task.model":"生成模型","loop.task.fromSubject":"来自主题","loop.task.evidenceEmpty":"还没有可关联的证据。","loop.task.editorTitle":"编辑任务草案","loop.task.back":"返回","loop.task.readOnly":"已保存版本（只读）","loop.task.compareTitle":"版本对比","loop.task.draftReady":"草案已生成，可逐条修改后再保存。","loop.task.generatedAt":"生成于 {at}","loop.task.exportDone":"已导出任务草案","loop.task.basedOn":"依据缺口","loop.task.modelUnavailable":"模型不可用：{reason}","loop.task.acceptanceEmpty":"还没有验收条目 —— 这样的草案不值得执行。","loop.res.title":"资料与备份","loop.res.dataPath":"数据文件路径","loop.res.backup":"立即备份","loop.res.backupDone":"备份已创建：{path}","loop.res.backingUp":"备份中…","loop.res.export":"导出用户数据包","loop.res.exportDone":"已导出用户数据包","loop.res.exporting":"导出中…","loop.res.import":"导入用户数据包","loop.res.importPick":"选择数据包 JSON…","loop.res.preview":"预览与校验","loop.res.previewing":"校验中…","loop.res.counts":"记录数：{summary}","loop.res.conflicts":"冲突：{count}","loop.res.errors":"校验错误：{count}","loop.res.mode":"导入方式","loop.res.mode.merge":"合并（同 ID 不同内容时报冲突，整体不写）","loop.res.mode.skip":"跳过已存在的记录","loop.res.mode.replace":"替换（需确认，会先自动备份）","loop.res.replaceConfirm":"我已了解：替换会覆盖现有记录","loop.res.confirmImport":"确认导入","loop.res.importing":"导入中…","loop.res.importDone":"导入完成：{summary}","loop.res.conflictList":"冲突清单","loop.res.errorList":"校验错误","loop.res.migration":"迁移报告","loop.res.migrationEmpty":"没有迁移记录（当前数据不是从旧版本升级来的）。","loop.res.migrating":"读取中…","loop.res.notices":"数据提示","loop.res.importLog":"导入历史","loop.res.copyPath":"复制路径","loop.res.copied":"已复制","loop.res.copyFailed":"复制失败：{reason}","loop.res.packTooLarge":"用户数据包不能超过 8 MiB（当前约 {size}）。","loop.res.parseError":"不是合法的 JSON 文件：{reason}","loop.res.invalidPack":"不是本插件导出的用户数据包。","loop.res.reportTitle":"迁移细节","loop.res.importIdempotent":"重复导入同一数据包不会产生新记录。","loop.res.blocked":"有校验错误时不能导入，请先修正数据包。","loop.status.dataPath":"数据：{path}","loop.status.model":"模型：{model}","loop.status.modelUnavailable":"模型不可用","loop.status.saveOk":"已保存（宿主确认）：{what}","loop.status.saveError":"保存失败：{message}","loop.status.at":"{at}","loop.status.receipts":"回执与提示","loop.status.noReceipts":"还没有回执。","loop.status.notice":"提示","loop.status.warning":"警告","loop.status.error":"错误","loop.status.ok":"成功","loop.status.viewSaveFailed":"视图状态未能保存：{message}","loop.status.dismiss":"清空回执","loop.status.ready":"就绪","loop.status.loading":"读取中","loop.status.loadFailed":"读取失败","loop.status.noticesCount":"{count} 条数据提示","loop.status.receiptFromHost":"以下回执来自宿主真实响应","loop.status.copiedPath":"路径已复制","loop.list.title":"列表视图","loop.list.filter":"过滤节点与关系…","loop.list.nodes":"节点","loop.list.relations":"关系","loop.list.empty":"没有匹配的条目。","loop.list.nodeHint":"选一个节点把它放到中心。","loop.list.relationHint":"选一条关系读它的条件与代价。","loop.a11y.graph":"知识图谱：当前节点与相关邻居","loop.a11y.list":"知识图谱的列表替代视图","loop.a11y.current":"当前","loop.a11y.relation":"关系 {type}：{from} 到 {to}","loop.a11y.selected":"已选中","loop.a11y.panel":"掌控面板","loop.a11y.status":"状态与回执","loop.a11y.notes":"笔记列表","loop.a11y.chat":"对话消息列表","loop.a11y.unknown":"未命名","loop.time.unknown":"时间不确定","loop.time.justNow":"刚刚","loop.time.minutesAgo":"{count} 分钟前","loop.time.hoursAgo":"{count} 小时前","loop.common.cancel":"取消","loop.common.confirm":"确认","loop.common.close":"关闭","loop.common.save":"保存","loop.common.delete":"删除","loop.common.edit":"编辑","loop.common.back":"返回","loop.common.loading":"加载中…","loop.common.none":"—","loop.common.unknown":"未知","loop.common.copy":"复制","loop.common.copied":"已复制","loop.common.copyFailed":"复制失败","loop.common.more":"更多","loop.common.less":"收起","loop.common.expand":"展开","loop.common.new":"新建","loop.common.optional":"可选","loop.common.required":"必填","loop.common.refresh":"刷新","loop.common.retry":"重试","loop.common.previous":"上一步","loop.common.next":"下一步","loop.common.notes":"笔记","loop.common.evidence":"证据","loop.common.sources":"来源","loop.common.revision":"修订","loop.common.dismiss":"知道了","loop.common.you":"你","loop.common.agent":"智能体","loop.common.source":"来源","loop.error.VALIDATION":"输入不合法","loop.error.NOT_FOUND":"找不到记录","loop.error.CONFLICT":"数据冲突","loop.error.STORAGE_WRITE":"写入存储失败","loop.error.LLM_UNAVAILABLE":"模型不可用","loop.error.LLM_AUTH":"模型鉴权失败","loop.error.LLM_RATE_LIMIT":"模型限流","loop.error.LLM_CONTEXT":"上下文超限","loop.error.BUSY":"同一主题已有进行中的回答","loop.error.CANCELED":"已取消","loop.error.IMPORT_INVALID":"导入包不合法","loop.error.PACKAGE_TOO_LARGE":"数据包过大","loop.error.READ_ONLY":"数据只读","loop.error.NETWORK":"无法连接宿主接口","loop.error.PROTOCOL":"宿主返回了无法解析的响应","loop.error.HTTP":"宿主返回 HTTP {status}","loop.error.UNKNOWN":"未知错误","loop.settings.title":"掌控 · 控制论","loop.settings.description":"一张同源知识图谱：沿控制论的历史与理论，把反馈、延迟、测量与边界迁移到编程智能体的任务设计上。笔记、实验记录与任务草案都保存在本地数据文件中。","loop.settings.open":"打开掌控","loop.settings.dataPath":"数据文件：{path}","loop.sidebar.open":"掌控","loop.today.cta.answer":"继续回答六问","loop.today.cta.backfill":"回填这次观察","loop.today.cta.checkEarly":"提前看一次","loop.today.cta.designCheck":"设计一次最小检验","loop.today.cta.startCheck":"开始这次检验","loop.today.cta.compare":"对比预测与实际","loop.today.cta.designNext":"设计下一次检验","loop.today.cta.restart":"重启这条回路","loop.today.cta.archived":"已归档，开一张新卡","loop.today.cta.quick":"只做 5 分钟版本","loop.today.tier.quick":"5 分钟","loop.today.tier.standard":"30 分钟","loop.today.tier.deep":"深度","loop.coach.gap.adaptation-failure.firstAction":"换规则而不是加力：写下「同一个动作已经失败过，这次要改的是哪条规则」（例如不再提高重试上限，改成第一次失败就换策略）。","loop.coach.gap.adaptation-failure.label":"同一动作反复失败","loop.coach.gap.authority-gap.firstAction":"找出你真正能改的最小点，写成具体动作（例如「合并前自动跑一次检查」），而不是「让大家更负责」。一个都没有时，只对自己负责的那部分建回路。","loop.coach.gap.authority-gap.label":"没有可改动作","loop.coach.gap.drift.firstAction":"先修测量再加记忆项：确认你读的数还在反映目标（例如从通过率换回回滚次数），然后加一条累积项，让小的持续偏差也能触发动作。","loop.coach.gap.drift.label":"稳定但不在目标","loop.coach.gap.late-measurement.firstAction":"先把反馈缩短一次：把大改动拆成能单独观察的小步，或把检查提前（例如从发布后一天改成合并前十分钟）。缩不短就把观察窗口拉长到超过延迟。","loop.coach.gap.late-measurement.label":"测得晚","loop.coach.gap.missing-counter-signal.firstAction":"写一条会让你改口的观察，并且能被数据判真假（例如「一周内重试率没降超过一成，我就承认问题不在模型」）。","loop.coach.gap.missing-counter-signal.label":"缺反证条件","loop.coach.gap.oscillating.firstAction":"先降增益再看延迟：把每次调整幅度减半，并把观察窗口拉长到超过一个完整来回（例如从一天改成三天）。仍摆动就重点查动作到结果之间的延迟。","loop.coach.gap.oscillating.label":"来回摆动","loop.coach.gap.proxy.firstAction":"加一个与当前指标独立的第二指标（例如不只数测试通过数，再数回滚次数），并写下两件事：它们何时会冲突、冲突时以哪个为准。","loop.coach.gap.proxy.label":"代理指标当目标","loop.coach.gap.saturated.firstAction":"力度已经到顶，再加只会更差：先降一档（例如重试从 3 次降到 1 次）或换一个动作通道，然后等满一个反馈周期再判断。","loop.coach.gap.saturated.label":"动作顶到上限","loop.coach.gap.unclear-goal.firstAction":"把目标改写成一句能判定真假的话：写清「哪个量、到多少、在多长时间窗内」，再补一句「我不控制什么」放进边界。写不出量，就先换成可数的次数。","loop.coach.gap.unclear-goal.label":"目标不清","loop.coach.gap.unmeasured.firstAction":"只定一个最小测量：一个数字或一条日志，并写清多久看一次（例如每次合并前看测试通过率）。先不求准，只要求明天还能看到同一个数。","loop.coach.gap.unmeasured.label":"没有测量","loop.coach.question.action.hint":"列具体动作：权限、工具、时间、人手、发布开关；改不了的写下来，它会成为边界。","loop.coach.question.action.title":"你能直接改变什么？又改不了什么？","loop.coach.question.action.unknown":"一个可改动作都没有时，先缩小范围：只对这个系统里你负责的那部分建回路，而不是整件事。","loop.coach.question.delay.hint":"给一个量级：分钟 / 小时 / 天；不知道也写「不知道」，这本身就是缺口信息。","loop.coach.question.delay.title":"从你动手，到你能看见结果，大概多久？","loop.coach.question.delay.unknown":"不知道延迟时，先把检查周期放长：至少等一个你觉得「够长」的时间再判断，并把等待写进观察窗口。","loop.coach.question.disturbance.hint":"需求变更、flaky 测试、模型波动、上游依赖、并发、人的注意力，都算。","loop.coach.question.disturbance.title":"哪些外来的变化会让它偏离？","loop.coach.question.disturbance.unknown":"想不出来可以先空着，但把「先观察一天」写进下一个动作；扰动常常回看时才显形。","loop.coach.question.goal.hint":"最好是一个能被判定的量或状态，例如「改动提交前测试稳定通过且无回归」。","loop.coach.question.goal.title":"你在试图让什么保持不变或变好？","loop.coach.question.goal.unknown":"写不出量就先写一句「我希望它别变成什么样」；它会记成目标不清，下一步再改成可判定的句子。","loop.coach.question.hypothesis.hint":"两句都要：主张（为什么会这样）和会推翻它的观察（看到什么就改口）。","loop.coach.question.hypothesis.title":"你现在的解释是什么？什么观察会让你改口？","loop.coach.question.hypothesis.unknown":"只有主张也能先建卡；把「还缺一条会证伪的观察」记成缺口，下次补上。","loop.coach.question.measurement.hint":"测试、日志、评审、用户反馈、感觉都算，但要写清看什么、多久看一次。","loop.coach.question.measurement.title":"你现在靠什么知道它好还是不好？","loop.coach.question.measurement.unknown":"答「没有测量」不算失败：先借一个现成的数（测试结果、评审结论、回滚记录），哪怕一天看一次，也比凭感觉强。","loop.coach.template.coding-agent.example.action":"例：我可以改系统提示词里的检查清单和重试上限；不能改模型权重和评测集。","loop.coach.template.coding-agent.example.delay":"例：改提示词后要 2—3 轮才看得出是否稳定；CI 结果约 10 分钟。","loop.coach.template.coding-agent.example.disturbance":"例：同一个提交在 CI 上偶发失败；长会话之后模型开始不守格式。","loop.coach.template.coding-agent.example.goal":"例：20 轮以内的任务里，改动后第一次跑测试就通过，且没有引入回归。","loop.coach.template.coding-agent.example.hypothesis":"例：失败集中在会话后段，我猜是上下文压力；若前 5 轮失败率一样高，这个解释就站不住。","loop.coach.template.coding-agent.example.measurement":"例：每轮任务结束看「失败工具调用数 / 总轮数」，以及首次通过测试发生在第几轮。","loop.coach.template.coding-agent.hint.action":"列出你能改的：提示词、工具集、重试上限、上下文预算；也写清改不了的：模型权重、上游接口。","loop.coach.template.coding-agent.hint.delay":"从改提示词到能看出差别，通常是一轮到几轮；写清你打算等几轮再判断。","loop.coach.template.coding-agent.hint.disturbance":"典型扰动：flaky 测试、模型波动、上下文被截断、上游依赖变更、并发任务抢占。","loop.coach.template.coding-agent.hint.goal":"把它写成智能体在一次任务里要守住的量（通过率、往返次数、time-to-green），并配一个时间窗。","loop.coach.template.coding-agent.hint.hypothesis":"主张要指向机制（例如失败来自上下文超限），并写一条会证伪它的观察。","loop.coach.template.coding-agent.hint.measurement":"优先用会话里已有的数：测试结果、工具失败与重试次数、首次成功耗时。","loop.coach.template.coding-agent.label":"编程智能体","loop.coach.template.personal.example.action":"例：我能把手机放到另一间房、把练习难度降一档；不能减少本周的工作量。","loop.coach.template.personal.example.delay":"例：4 周后才知道这套练习有没有效，中间只看次数不看效果。","loop.coach.template.personal.example.disturbance":"例：周四开会到很晚；周末被家务占满。","loop.coach.template.personal.example.goal":"例：连续 4 周，每周至少 3 次、每次 40 分钟的刻意练习。","loop.coach.template.personal.example.hypothesis":"例：卡点是练习太难；若降一档后卡点仍在，就该怀疑方法不对。","loop.coach.template.personal.example.measurement":"例：每次练习后记一行「练了什么 / 卡在哪」，每周日数一次次数和卡点。","loop.coach.template.personal.hint.action":"写你一个人就能改的：时间块、环境、练习难度；写清受外部限制的部分。","loop.coach.template.personal.hint.delay":"从练习到看见效果，个人通常要几周；先定一个「几周后看」的检查点。","loop.coach.template.personal.hint.disturbance":"典型扰动：睡眠不足、临时加班、社交打断、信息过载。","loop.coach.template.personal.hint.goal":"目标是你要维持的状态或能力：每周练习次数、连续专注时长、错误率。","loop.coach.template.personal.hint.hypothesis":"解释要能区分「练得少」和「练得不对」，并写一条能分辨的观察。","loop.coach.template.personal.hint.measurement":"用你已经在留的痕迹：学习记录、提交历史、专注计时；不要靠事后回忆。","loop.coach.template.personal.label":"个人学习","loop.coach.template.product.example.action":"例：我能决定本期砍掉哪个功能、用灰度开关；不能决定预算和上线日期。","loop.coach.template.product.example.delay":"例：发布后 3—7 天才看到留存变化，两周才能判断是否回滚。","loop.coach.template.product.example.disturbance":"例：大客户临时加需求；依赖的支付接口改版。","loop.coach.template.product.example.goal":"例：连续两次发布，24 小时内无回滚、无 P1 事故。","loop.coach.template.product.example.hypothesis":"例：验收争议多来自标准没写清；若标准提前写清后争议仍多，就说明是需求本身不清楚。","loop.coach.template.product.example.measurement":"例：每次发布会看回滚记录和验收结论，每周五汇总一次。","loop.coach.template.product.hint.action":"写你能决定的：范围裁剪、发布开关、验收标准；写清哪些需要别人同意。","loop.coach.template.product.hint.delay":"从发布到能看出用户反应，常见是几天到两周；短于这个窗口的判断都不作数。","loop.coach.template.product.hint.disturbance":"典型扰动：需求中途变更、上游团队延期、线上事故、关键人请假。","loop.coach.template.product.hint.goal":"选一个对外承诺的结果当目标量：回滚次数、发布节奏、验收一次通过率。","loop.coach.template.product.hint.hypothesis":"解释要能区分「需求不对」和「执行不对」，并写一条能分辨两者的观察。","loop.coach.template.product.hint.measurement":"用已有的发布记录与评审结论，不要新造仪表盘；写清多久看一次。","loop.coach.template.product.label":"产品 / 项目","loop.coach.template.team.example.action":"例：我可以规定「谁改需求谁写验收」、固定每周三对齐；不能改公司审批流程。","loop.coach.template.team.example.delay":"例：改例会形式后约 3 周才看出返工是否减少。","loop.coach.template.team.example.disturbance":"例：季度末临时支援别的项目；两位核心成员同时休假。","loop.coach.template.team.example.goal":"例：一个迭代内返工不超过 2 次，且每次返工都有记录的原因。","loop.coach.template.team.example.hypothesis":"例：返工多是因为验收没写清；若写清后返工仍多，就要看是不是排期问题。","loop.coach.template.team.example.measurement":"例：每周看任务状态变更记录和返工记录，例会只读这两项。","loop.coach.template.team.hint.action":"写你能改的协作机制：谁在哪个节点必须确认、信息放在哪；写清你无权改的流程。","loop.coach.template.team.hint.delay":"从改协作方式到行为真的改变，通常要一个迭代以上；短窗口内没变化很正常。","loop.coach.template.team.hint.disturbance":"典型扰动：人员流动、优先级插队、跨团队依赖、信息只在口头传递。","loop.coach.template.team.hint.goal":"目标是团队要守住的协作结果：交付准时率、返工次数、决策到执行的间隔。","loop.coach.template.team.hint.hypothesis":"解释要指向协调失败的类型（没人负责 / 信息不到 / 没有决策点），并写一条能区分的观察。","loop.coach.template.team.hint.measurement":"用会议记录、任务状态、返工记录这类已有痕迹，别新增填报。","loop.coach.template.team.label":"团队协作","loop.coach.wizard.createCard":"生成掌控卡","loop.coach.wizard.createCardHint":"只要第 1 问（目标）和第 6 问（解释）有内容，就能先建卡再补，其余留空也行。","loop.coach.wizard.draftSaved":"草稿已自动保存，可以随时退出，下次从这里接着答。","loop.coach.wizard.intro":"一屏一问，每题都能跳过；跳过的题会变成待补的缺口，不会拦住你建卡。答不上来就写「不知道」，草稿自动保存。","loop.coach.wizard.progress":"第 {current} 问 / 共 {total} 问","loop.coach.wizard.skip":"跳过这问","loop.coach.wizard.title":"掌控六问","loop.coach.wizard.unknownHint":"选「我不知道」也能继续：这一项会记成缺口，之后在卡上补。"},"en":{"loop.app.title":"Grasp","loop.app.tagline":"See how a system corrects itself — and why you should believe it.","loop.app.loading":"Reading host data…","loop.app.loadError":"Cannot read local data","loop.app.errorHint":"The panel reads the host-written data file through /api/loop-atlas. Check that the host plugin is active, then retry.","loop.app.retry":"Retry","loop.brand.sub":"Cybernetics · reasoning & verification","loop.scale.label":"Reading scale","loop.scale.domain":"Domain","loop.scale.subject":"Question","loop.scale.evidence":"Evidence","loop.scale.domain.hint":"Skeleton: what each of the eight units solves","loop.scale.subject.hint":"Read one relation: the current node and its neighbours","loop.scale.evidence.hint":"Test it: experiments, predictions, evidence, task drafts","loop.projection.label":"View","loop.projection.theory":"Theory","loop.projection.history":"History","loop.projection.practice":"Practice","loop.projection.hint":"View switching is available on the question scale","loop.search.placeholder":"Search nodes, relations…","loop.search.label":"Search","loop.search.empty":"No matching node or relation","loop.search.node":"Node","loop.search.relation":"Relation","loop.search.hint":"↑↓ select · Enter open · Esc close","loop.continue":"Continue","loop.continue.title":"Continue research","loop.continue.lastSubject":"Last read","loop.continue.investigations":"Open investigations","loop.continue.predictions":"Unresolved predictions","loop.continue.runs":"Recent runs","loop.continue.nextTest":"Next test","loop.continue.noNextTest":"No next test written yet","loop.continue.empty":"Nothing in progress. Pick a node on the question scale, or write a prediction.","loop.continue.open":"Go back here","loop.resources":"Data & backup","loop.partner.show":"Show learning partner","loop.partner.hide":"Hide learning partner","loop.partner.title":"Learning partner","loop.partner.model":"Model","loop.partner.model.available":"Available","loop.partner.model.unavailable":"Unavailable","loop.partner.tab.chat":"Chat","loop.partner.tab.notes":"Notes","loop.dir.title":"Unit directory","loop.dir.overview":"Domain overview","loop.dir.entry":"Entry","loop.dir.notes":"{count} notes","loop.dir.collapse":"Collapse directory","loop.dir.expand":"Expand directory","loop.dir.current":"Current","loop.stage.graph":"Graph","loop.stage.read":"Read","loop.stage.chat":"Chat","loop.stage.label":"Narrow-screen sections","loop.dialog.close":"Close","loop.overlay.close":"Close dialog","loop.domain.intro":"Eight units, each answering one sustaining question. Entering a unit returns to its entry node.","loop.domain.question":"What it solves","loop.domain.capability":"Capability","loop.domain.concepts":"{count} concepts","loop.domain.start":"Start with goals and boundaries","loop.domain.recommended":"Suggested start","loop.domain.openUnit":"Enter unit: {title}","loop.subject.current":"Current node","loop.subject.neighbors":"{count} related neighbours","loop.subject.neighborsEmpty":"No recorded relation touches this node yet. Switch to the theory view for unit structure, or write your question on the evidence scale.","loop.subject.moreNeighbors":"{count} more related nodes not expanded","loop.subject.kind.concept":"Concept","loop.subject.kind.device":"Device","loop.subject.kind.event":"Event","loop.subject.eraUnknown":"Date uncertain","loop.subject.graph":"Graph","loop.subject.list":"List","loop.subject.read":"Read current node","loop.subject.def":"Definition","loop.subject.can":"What it can do","loop.subject.mech":"Mechanism","loop.subject.limits":"Conditions & limits","loop.subject.counter":"Counterexample","loop.subject.check":"Test task","loop.subject.hist":"Historical context","loop.subject.migrate":"Transfer to coding agents","loop.subject.migrateType.formal":"Same mechanism","loop.subject.migrateType.application":"Engineering application","loop.subject.migrateType.analogy":"Analogy, not the same mechanism","loop.subject.migrateType.heuristic":"Heuristic, not the same mechanism","loop.subject.claims":"Claims & sources","loop.subject.sources":"Sources","loop.subject.notesCount":"{count} related notes","loop.subject.relationsCount":"{count} relations","loop.subject.graphHint":"Click a node to re-centre; click an edge or its label to read conditions and costs.","loop.subject.viewEvidence":"Test on the evidence scale","loop.subject.clearRelation":"Clear selected relation","loop.subject.group":"Unit","loop.subject.unknownGroup":"Ungrouped","loop.subject.empty":"The content pack has no nodes, so the question scale cannot render.","loop.relation.type.prerequisite":"Prerequisite","loop.relation.type.formal":"Formal result","loop.relation.type.constraint":"Constraint","loop.relation.type.parallel":"Parallel","loop.relation.type.historical":"Historical influence","loop.relation.type.analogy":"Analogy","loop.relation.type.application":"Engineering use","loop.relation.type.unknown":"Relation","loop.relation.detail":"Relation detail","loop.relation.fromTo":"{from} → {to}","loop.relation.claim":"What this relation asserts","loop.relation.condition":"When it holds","loop.relation.cost":"Cost of trusting or using it","loop.relation.claims":"Claim-level sources","loop.relation.noClaims":"This relation has no claim-level source yet.","loop.relation.noClaim":"This relation has no standalone claim text.","loop.relation.annotation":"My annotation","loop.relation.annotationPlaceholder":"How does this relation hold under your conditions? Write your own judgement — it need not match the text.","loop.relation.status":"My judgement","loop.relation.status.open":"Undecided","loop.relation.status.supported":"I confirm it","loop.relation.status.challenged":"I have a counterexample","loop.relation.evidence":"Related evidence ({count})","loop.relation.evidenceEmpty":"No note is attached to this relation yet. Write one in the Notes tab, or generate one from an experiment observation.","loop.relation.attach":"Attach as evidence","loop.relation.detach":"Detach","loop.relation.ask":"Discuss this relation","loop.relation.saveAnnotation":"Save annotation","loop.relation.saved":"Annotation saved (host confirmed)","loop.relation.verified.verified":"Verified","loop.relation.verified.secondary":"Secondary source","loop.relation.verified.unverified":"Unverified","loop.relation.claimKind.formal":"Formal result","loop.relation.claimKind.empirical":"Empirical","loop.relation.claimKind.historical":"Historical","loop.relation.claimKind.interpretation":"Interpretation","loop.relation.selectHint":"Click an edge or a relation label to read its claim, condition and cost.","loop.relation.noCondition":"No condition recorded — that itself is worth doubting.","loop.relation.noCost":"No cost recorded.","loop.relation.openSource":"View source: {title}","loop.theory.title":"Theory view: prerequisites → formal results → trade-offs","loop.theory.current":"Current node","loop.theory.prereq":"Prerequisites & dependencies","loop.theory.formal":"Formal results","loop.theory.tradeoff":"Design trade-offs","loop.theory.historical":"Historical influence","loop.theory.analogy":"Analogy (not the same mechanism)","loop.theory.application":"Engineering use","loop.theory.empty":"This node has no further recorded structure in the theory view.","loop.history.title":"History view: ordered by verified date ranges","loop.history.unknown":"Date uncertain","loop.history.unknownHint":"The following nodes have no verifiable start date; they are listed separately instead of being placed on the timeline.","loop.history.empty":"No history with a verifiable date relates to the current node.","loop.history.gap":"Gap: {item}","loop.history.searchPath":"Search path: {path}","loop.history.source":"Source","loop.history.work":"Work / literature","loop.history.yearUnknown":"Date unknown","loop.history.yearRange":"{from}—{to}","loop.history.yearSingle":"{year}","loop.practice.title":"Practice view: goal → context → action → observation → acceptance → revision","loop.practice.goal":"Goal","loop.practice.measurement":"Measurement","loop.practice.context":"Context","loop.practice.action":"Action","loop.practice.observation":"Observation","loop.practice.acceptance":"Acceptance","loop.practice.revision":"Revision","loop.practice.other":"Unmapped stage","loop.practice.caveat":"This view shows engineering mechanisms. Historical analogies are references, not the same mechanism.","loop.practice.empty":"The content pack has not annotated practice stages for this node.","loop.practice.stageHint":"Arranged by the content pack practiceStages labels, not by evidential order.","loop.evidence.title":"Evidence scale: test the current subject","loop.evidence.noSubject":"Pick a node or relation on the question scale, then return to the evidence scale.","loop.evidence.pickSubject":"Choose a subject on the question scale","loop.evidence.experiments":"Experiments","loop.evidence.experimentHint":"Experiments run in the host-side deterministic models; each record carries model version, parameters and criterion.","loop.evidence.noExperiments":"No experiment is linked to the current subject.","loop.evidence.investigations":"Investigations","loop.evidence.predictions":"Predictions","loop.evidence.notes":"Evidence notes","loop.evidence.tasks":"Task drafts","loop.evidence.runs":"Run records","loop.evidence.noRuns":"No runs recorded yet. Run an experiment and it is saved with model version and criterion.","loop.evidence.newTask":"New task draft","loop.evidence.back":"Back to evidence overview","loop.evidence.investigateFor":"Write an investigation for “{name}”","loop.evidence.openTask":"Open task draft","loop.evidence.subjectSources":"{sources} sources · {unverified} unverified","loop.evidence.savedAt":"Recorded {at}","loop.evidence.reproducible":"Same parameters reproduce","loop.evidence.taskEmpty":"No task draft yet. Start with the behaviour you want to change.","loop.evidence.viewAllRuns":"Show all runs","loop.evidence.hideRuns":"Hide run records","loop.exp.predict":"Write your prediction first (optional)","loop.exp.predictionPlaceholder":"What will happen when you change it?","loop.exp.run":"Run","loop.exp.running":"Running…","loop.exp.skip":"Skip prediction and run","loop.exp.rerun":"Change parameters and rerun","loop.exp.verdict":"Verdict","loop.exp.criterion":"Criterion","loop.exp.model":"Model","loop.exp.params":"Parameters","loop.exp.recordedAt":"Recorded at","loop.exp.reproducible":"Same parameters give the same result","loop.exp.yourPrediction":"Your prediction","loop.exp.match":"Your prediction matched the verdict","loop.exp.mismatch":"Your prediction missed the verdict — that is more informative than guessing right","loop.exp.saveObs":"Turn this observation into evidence","loop.exp.teaching":"Teaching model","loop.exp.notRealSystem":"This is a teaching model, not an identification of any real system.","loop.exp.failed":"Run failed: {message}","loop.exp.trace":"Response trace","loop.exp.target":"Target","loop.exp.closePanel":"Collapse experiment","loop.exp.openPanel":"Open experiment","loop.exp.runSaved":"Run record saved by the host","loop.exp.verdict.converged":"Converges","loop.exp.verdict.overshoot-settled":"Overshoots, then settles","loop.exp.verdict.oscillating":"Sustained oscillation (crosses target)","loop.exp.verdict.oscillating-below":"Oscillates below target (never crosses)","loop.exp.verdict.drift":"Drifts (does not reach target)","loop.exp.verdict.diverging":"Diverges","loop.exp.verdict.pass":"Pass","loop.exp.verdict.fail":"Fail","loop.exp.verdict.mixed":"Partially passes","loop.exp.delay.K":"Gain K","loop.exp.delay.D":"Delay D (s)","loop.exp.delay.formula":"First-order lag + pure delay: y′ = (u − y)/τ, τ = 0.5 s, u = clamp(K·(1 − y(t−D)), −2, 2), dt = 0.02 s, target 1.","loop.exp.proxy.e":"Optimisation effort e","loop.exp.proxy.visible":"Visible metric","loop.exp.proxy.hidden":"Hidden metric","loop.exp.proxy.ratio":"Hidden / visible","loop.exp.proxy.peak":"Hidden metric peaks at e ≈ {e}, value {value}","loop.exp.green.cases":"Check cases","loop.exp.green.allGreen":"All enabled checks pass","loop.exp.green.notCorrect":"This only means the measured behaviour passes, not that the function is correct.","loop.exp.green.caveat":"Enable the “beyond range” case and look again.","loop.exp.green.off":"Disabled","loop.exp.green.pass":"Pass","loop.exp.green.fail":"Fail","loop.exp.green.actual":"Actual: {actual}","loop.exp.green.expect":"Expected: {expect}","loop.pred.title":"Predictions","loop.pred.new":"Write a prediction","loop.pred.text":"Prediction","loop.pred.textPlaceholder":"e.g. Once the delay reaches 1 s, the same gain will oscillate forever.","loop.pred.resolveBy":"Decidable condition","loop.pred.resolveByPlaceholder":"e.g. With D ≥ 0.9 and K = 1.2, the response crosses the target four or more times within 16 s.","loop.pred.save":"Save prediction (open)","loop.pred.saved":"Prediction saved (host confirmed)","loop.pred.saving":"Saving…","loop.pred.empty":"No predictions yet. Write a decidable one, then let an experiment or observation hit it.","loop.pred.status.open":"Open","loop.pred.status.supported":"Supported","loop.pred.status.refuted":"Refuted","loop.pred.status.inconclusive":"Inconclusive","loop.pred.resolve.supported":"Support","loop.pred.resolve.refuted":"Refute","loop.pred.resolve.inconclusive":"Inconclusive","loop.pred.resolutionNote":"Resolution note","loop.pred.resolutionNotePlaceholder":"Which run or observation decides it?","loop.pred.resolve":"Record verdict","loop.pred.resolvedAt":"Resolved {at}","loop.pred.legacy":"Legacy record","loop.pred.legacyHint":"Legacy predictions lack full verdict fields and are shown as open.","loop.pred.linkRun":"Link run (optional)","loop.pred.noRun":"No linked run","loop.pred.investigation":"Investigation","loop.pred.noneInvestigation":"No investigation","loop.pred.needText":"Write the prediction text first.","loop.inv.title":"Investigations","loop.inv.new":"New investigation","loop.inv.titleLabel":"Question title","loop.inv.titlePlaceholder":"e.g. Under what delay does negative feedback stop being stable?","loop.inv.claim":"Current claim","loop.inv.claimPlaceholder":"The explanation you currently hold.","loop.inv.counter":"Counter-explanation","loop.inv.counterPlaceholder":"If the current claim is wrong, what is the most likely alternative?","loop.inv.nextTest":"Next test","loop.inv.nextTestPlaceholder":"One sentence: how will you test it next?","loop.inv.save":"Save investigation","loop.inv.saved":"Investigation saved (host confirmed)","loop.inv.saving":"Saving…","loop.inv.empty":"No investigations yet. Write one claim and one counter-explanation so later steps have an opponent.","loop.inv.status.open":"Open","loop.inv.status.testing":"Testing","loop.inv.status.supported":"Supported","loop.inv.status.revised":"Revised","loop.inv.status.inconclusive":"Inconclusive","loop.inv.statusLabel":"Status","loop.inv.resolve":"Update status","loop.inv.resolveNote":"Note","loop.inv.discuss":"Discuss this investigation","loop.inv.predCount":"{count} predictions","loop.inv.runCount":"{count} runs","loop.inv.editing":"Editing: {title}","loop.inv.cancel":"Cancel editing","loop.inv.needTitle":"Write an investigation title first.","loop.inv.nextTestLabel":"Next","loop.note.title":"Notes","loop.note.placeholder":"Write your own words. They are yours alone; an AI reply never becomes your note automatically.","loop.note.kind":"Kind","loop.note.kind.理解":"Understanding","loop.note.kind.疑问":"Question","loop.note.kind.证据":"Evidence","loop.note.kind.反驳":"Counterexample","loop.note.kind.实践":"Practice","loop.note.save":"Save as my note","loop.note.saving":"Saving…","loop.note.edit":"Edit","loop.note.saveEdit":"Save changes","loop.note.cancel":"Cancel","loop.note.archive":"Archive","loop.note.restore":"Restore","loop.note.delete":"Delete","loop.note.deleteConfirm":"Delete this note? This writes to local data.","loop.note.empty":"No notes on this subject yet. Start with one sentence of your own understanding.","loop.note.source.user":"User text","loop.note.source.ai-draft":"AI draft","loop.note.source.import":"Imported material","loop.note.source.legacy":"Legacy origin uncertain","loop.note.legacyHint":"Older records cannot distinguish your own writing from tool-written text; confirm and edit it yourself.","loop.note.encodingHint":"This legacy record may contain encoding damage (? replacement characters).","loop.note.savedBy":"Saved by","loop.note.savedBy.ui":"You","loop.note.savedBy.agent":"Agent","loop.note.adopted":"Adopted","loop.note.revision":"Revision {n}","loop.note.adoptDraft":"Save as my evidence (draft)","loop.note.adoptedDraft":"Saved as draft","loop.note.draftHint":"Saved as an AI draft; never passed off as your own words.","loop.note.saveError":"Save failed: {message}","loop.note.count":"{count}","loop.note.archivedLabel":"Archived","loop.note.statusLabel":"Status","loop.note.adoptError":"Could not save as draft: {message}","loop.note.notesFor":"Notes on the current subject","loop.chat.title":"Chat","loop.chat.empty":"Ask the real model about the current subject. Replies never become your notes automatically.","loop.chat.placeholder":"Ask about the current subject… (Ctrl+Enter to send)","loop.chat.send":"Send","loop.chat.sending":"Generating…","loop.chat.stop":"Stop","loop.chat.stopping":"Stopping…","loop.chat.retry":"Retry","loop.chat.failed":"Failed","loop.chat.cancelled":"Stopped","loop.chat.streaming":"Generating…","loop.chat.errorCode":"Error code: {code}","loop.chat.interrupted":"The last reply was interrupted while the page was closed; you can retry.","loop.chat.modelUnavailable":"Model unavailable: {reason}. Your question draft is kept.","loop.chat.sendFailed":"Request failed: {message}","loop.chat.draftHint":"Drafts are kept per subject; switching subjects never mixes them.","loop.chat.subjectNote":"A reply belongs to the subject it was sent from; switching subjects does not move it.","loop.chat.you":"You","loop.chat.ai":"Learning partner","loop.chat.copy":"Copy","loop.chat.copied":"Copied","loop.chat.copyFailed":"Copy failed: {reason}","loop.chat.noModel":"No default model configured","loop.chat.sourcesSummary":"{sources} sources · {unverified} unverified","loop.chat.retryUnavailable":"The host offers no retry endpoint: {message}","loop.chat.partial":"(incomplete)","loop.task.title":"Task draft","loop.task.startTitle":"First: what behaviour do you want to change?","loop.task.request":"The real request","loop.task.requestPlaceholder":"In your own words: what behaviour is wrong now, and what should it become? Do not start with acceptance criteria.","loop.task.generate":"Generate editable draft","loop.task.generating":"Generating…","loop.task.goal":"Goal","loop.task.acceptance":"Acceptance (what counts as enough)","loop.task.boundary":"Boundaries (what not to do)","loop.task.unknowns":"Unknowns (as questions)","loop.task.answerPlaceholder":"Write your judgement first (may stay empty)","loop.task.concepts":"Related concepts","loop.task.evidence":"Evidence links","loop.task.save":"Save draft","loop.task.saving":"Saving…","loop.task.saved":"Draft saved (host confirmed)","loop.task.archive":"Archive","loop.task.versions":"Versions","loop.task.version":"Version {n}","loop.task.compare":"Compare current with selected version","loop.task.copy":"Copy full text","loop.task.export":"Export","loop.task.notSent":"The draft stays local; it is never sent anywhere automatically.","loop.task.empty":"No task drafts yet.","loop.task.needRequest":"Write the real request before generating a draft.","loop.task.addAcceptance":"Add acceptance item","loop.task.addBoundary":"Add boundary","loop.task.addUnknown":"Add unknown","loop.task.remove":"Remove","loop.task.status.draft":"Draft","loop.task.status.saved":"Saved","loop.task.status.archived":"Archived","loop.task.model":"Generated by","loop.task.fromSubject":"From subject","loop.task.evidenceEmpty":"No evidence available to link.","loop.task.editorTitle":"Edit task draft","loop.task.back":"Back","loop.task.readOnly":"Saved version (read-only)","loop.task.compareTitle":"Version comparison","loop.task.draftReady":"Draft generated. Edit each part before saving.","loop.task.generatedAt":"Generated {at}","loop.task.exportDone":"Task draft exported","loop.task.basedOn":"Evidence gaps","loop.task.modelUnavailable":"Model unavailable: {reason}","loop.task.acceptanceEmpty":"No acceptance items yet — such a draft should not be executed.","loop.res.title":"Data & backup","loop.res.dataPath":"Data file path","loop.res.backup":"Back up now","loop.res.backupDone":"Backup created: {path}","loop.res.backingUp":"Backing up…","loop.res.export":"Export user package","loop.res.exportDone":"User package exported","loop.res.exporting":"Exporting…","loop.res.import":"Import user package","loop.res.importPick":"Choose package JSON…","loop.res.preview":"Preview & validate","loop.res.previewing":"Validating…","loop.res.counts":"Records: {summary}","loop.res.conflicts":"Conflicts: {count}","loop.res.errors":"Validation errors: {count}","loop.res.mode":"Import mode","loop.res.mode.merge":"Merge (same id with different content conflicts; nothing is written)","loop.res.mode.skip":"Skip existing records","loop.res.mode.replace":"Replace (requires confirmation; auto-backup first)","loop.res.replaceConfirm":"I understand replacing overwrites existing records","loop.res.confirmImport":"Confirm import","loop.res.importing":"Importing…","loop.res.importDone":"Import finished: {summary}","loop.res.conflictList":"Conflicts","loop.res.errorList":"Validation errors","loop.res.migration":"Migration report","loop.res.migrationEmpty":"No migration recorded (this data was not upgraded from an older version).","loop.res.migrating":"Reading…","loop.res.notices":"Data notices","loop.res.importLog":"Import history","loop.res.copyPath":"Copy path","loop.res.copied":"Copied","loop.res.copyFailed":"Copy failed: {reason}","loop.res.packTooLarge":"A user package must not exceed 8 MiB (current about {size}).","loop.res.parseError":"Not valid JSON: {reason}","loop.res.invalidPack":"Not a user package exported by this plugin.","loop.res.reportTitle":"Migration detail","loop.res.importIdempotent":"Importing the same package twice creates no new records.","loop.res.blocked":"Validation errors block import; fix the package first.","loop.status.dataPath":"Data: {path}","loop.status.model":"Model: {model}","loop.status.modelUnavailable":"Model unavailable","loop.status.saveOk":"Saved (host confirmed): {what}","loop.status.saveError":"Save failed: {message}","loop.status.at":"{at}","loop.status.receipts":"Receipts & notices","loop.status.noReceipts":"No receipts yet.","loop.status.notice":"Notice","loop.status.warning":"Warning","loop.status.error":"Error","loop.status.ok":"OK","loop.status.viewSaveFailed":"View state was not saved: {message}","loop.status.dismiss":"Clear receipts","loop.status.ready":"Ready","loop.status.loading":"Loading","loop.status.loadFailed":"Load failed","loop.status.noticesCount":"{count} data notices","loop.status.receiptFromHost":"Receipts below come from real host responses","loop.status.copiedPath":"Path copied","loop.list.title":"List view","loop.list.filter":"Filter nodes and relations…","loop.list.nodes":"Nodes","loop.list.relations":"Relations","loop.list.empty":"Nothing matches.","loop.list.nodeHint":"Pick a node to centre it.","loop.list.relationHint":"Pick a relation to read its conditions and costs.","loop.a11y.graph":"Knowledge graph: current node and related neighbours","loop.a11y.list":"Accessible list alternative to the knowledge graph","loop.a11y.current":"Current","loop.a11y.relation":"Relation {type}: {from} to {to}","loop.a11y.selected":"Selected","loop.a11y.panel":"Grasp panel","loop.a11y.status":"Status and receipts","loop.a11y.notes":"Notes list","loop.a11y.chat":"Chat messages","loop.a11y.unknown":"Untitled","loop.time.unknown":"Date uncertain","loop.time.justNow":"just now","loop.time.minutesAgo":"{count} min ago","loop.time.hoursAgo":"{count} h ago","loop.common.cancel":"Cancel","loop.common.confirm":"Confirm","loop.common.close":"Close","loop.common.save":"Save","loop.common.delete":"Delete","loop.common.edit":"Edit","loop.common.back":"Back","loop.common.loading":"Loading…","loop.common.none":"—","loop.common.unknown":"Unknown","loop.common.copy":"Copy","loop.common.copied":"Copied","loop.common.copyFailed":"Copy failed","loop.common.more":"More","loop.common.less":"Less","loop.common.expand":"Expand","loop.common.new":"New","loop.common.optional":"Optional","loop.common.required":"Required","loop.common.refresh":"Refresh","loop.common.retry":"Retry","loop.common.previous":"Previous","loop.common.next":"Next","loop.common.notes":"Notes","loop.common.evidence":"Evidence","loop.common.sources":"Sources","loop.common.revision":"Revision","loop.common.dismiss":"Dismiss","loop.common.you":"You","loop.common.agent":"Agent","loop.common.source":"Source","loop.error.VALIDATION":"Invalid input","loop.error.NOT_FOUND":"Record not found","loop.error.CONFLICT":"Data conflict","loop.error.STORAGE_WRITE":"Storage write failed","loop.error.LLM_UNAVAILABLE":"Model unavailable","loop.error.LLM_AUTH":"Model authentication failed","loop.error.LLM_RATE_LIMIT":"Model rate limited","loop.error.LLM_CONTEXT":"Context window exceeded","loop.error.BUSY":"This subject already has a reply in progress","loop.error.CANCELED":"Cancelled","loop.error.IMPORT_INVALID":"Invalid import package","loop.error.PACKAGE_TOO_LARGE":"Package too large","loop.error.READ_ONLY":"Data is read-only","loop.error.NETWORK":"Cannot reach the host API","loop.error.PROTOCOL":"The host returned an unparseable response","loop.error.HTTP":"Host returned HTTP {status}","loop.error.UNKNOWN":"Unknown error","loop.settings.title":"Grasp · Cybernetics","loop.settings.description":"One knowledge graph for the history and theory of cybernetics, carried into coding-agent task design: feedback, delay, measurement, boundary. Notes, experiment records and task drafts all live in the local data file.","loop.settings.open":"Open Grasp","loop.settings.dataPath":"Data file: {path}","loop.sidebar.open":"Grasp","loop.today.cta.answer":"Continue the six questions","loop.today.cta.backfill":"Backfill this observation","loop.today.cta.checkEarly":"Check early","loop.today.cta.designCheck":"Design a minimal test","loop.today.cta.startCheck":"Start this test","loop.today.cta.compare":"Compare prediction and outcome","loop.today.cta.designNext":"Design the next test","loop.today.cta.restart":"Restart this loop","loop.today.cta.archived":"Archived — start a new card","loop.today.cta.quick":"Do the 5-minute version","loop.today.tier.quick":"5 min","loop.today.tier.standard":"30 min","loop.today.tier.deep":"Deep","loop.coach.gap.adaptation-failure.firstAction":"Change the rule, not the force: write down which rule you will change given the same action already failed (e.g. stop raising the retry cap and switch strategy on the first failure).","loop.coach.gap.adaptation-failure.label":"Adaptation failure","loop.coach.gap.authority-gap.firstAction":"Find the smallest lever you truly control and state it as a concrete action (e.g. run one check before every merge), not as \"make everyone more responsible\". If there is none, build the loop only for the part you own.","loop.coach.gap.authority-gap.label":"No lever","loop.coach.gap.drift.firstAction":"Fix the measurement before adding memory: check the number still tracks the goal (e.g. switch from pass rate back to rollback count), then add a cumulative term so a small persistent error still triggers action.","loop.coach.gap.drift.label":"Drifting","loop.coach.gap.late-measurement.firstAction":"Shorten the loop once: split a large change into a step you can observe alone, or move the check earlier (e.g. from the day after release to ten minutes before merge). If you cannot shorten it, make the observation window longer than the delay.","loop.coach.gap.late-measurement.label":"Feedback too late","loop.coach.gap.missing-counter-signal.firstAction":"Write one observation that would change your mind and can be checked against data (e.g. \"if the retry rate does not drop by ten percent within a week, the model is not the problem\").","loop.coach.gap.missing-counter-signal.label":"No falsifier","loop.coach.gap.oscillating.firstAction":"Lower the gain first, then look at delay: halve each adjustment and make the observation window longer than one full swing (e.g. one day to three). If it still oscillates, examine the delay between action and result.","loop.coach.gap.oscillating.label":"Oscillating","loop.coach.gap.proxy.firstAction":"Add a second metric independent of the current one (e.g. count rollbacks as well as passing tests), and write down when the two would conflict and which one wins then.","loop.coach.gap.proxy.label":"Proxy as goal","loop.coach.gap.saturated.firstAction":"You are at the limit; pushing harder only makes it worse. Lower the gain one notch (e.g. retries from three to one) or switch action channel, then wait a full feedback cycle before judging.","loop.coach.gap.saturated.label":"Lever saturated","loop.coach.gap.unclear-goal.firstAction":"Rewrite the goal as one sentence that can be judged true or false: which quantity, what value, within what time window. Then add one sentence on what you do not control and keep it as the boundary. If no quantity comes out, start with a count you can tally.","loop.coach.gap.unclear-goal.label":"Goal unclear","loop.coach.gap.unmeasured.firstAction":"Define one minimal measurement: a single number or one log line, plus how often you read it (e.g. test pass rate before every merge). Skip accuracy for now; tomorrow you must be able to read the same number again.","loop.coach.gap.unmeasured.label":"No measurement","loop.coach.question.action.hint":"List concrete levers: permissions, tools, time, people, release switches. Write down what you cannot change — that becomes your boundary.","loop.coach.question.action.title":"What can you change directly, and what can't you?","loop.coach.question.action.unknown":"If no lever is available, shrink the scope: build the loop around the part you own in this system rather than the whole thing.","loop.coach.question.delay.hint":"Give an order of magnitude: minutes, hours, days. Write 'unknown' if unsure — that itself is gap information.","loop.coach.question.delay.title":"How long from your action to a visible result?","loop.coach.question.delay.unknown":"If the delay is unknown, make the check interval longer: wait at least as long as feels 'enough' before judging, and record the wait in the observation window.","loop.coach.question.disturbance.hint":"Scope changes, flaky tests, model variance, upstream dependencies, concurrency, human attention — all count.","loop.coach.question.disturbance.title":"Which outside changes push it off target?","loop.coach.question.disturbance.unknown":"Leaving it blank is fine, but put 'observe for one day' as your next action; disturbances often only show up in hindsight.","loop.coach.question.goal.hint":"Aim for a quantity or state that can be judged, e.g. \"tests pass with no regressions before each commit\".","loop.coach.question.goal.title":"What are you trying to keep stable or make better?","loop.coach.question.goal.unknown":"If no quantity comes to mind, write what you do not want it to become; it is recorded as \"goal unclear\" and we rewrite it into a checkable sentence next.","loop.coach.question.hypothesis.hint":"Both parts are required: a claim about why, and an observation that would refute it.","loop.coach.question.hypothesis.title":"What is your current explanation — and what would change your mind?","loop.coach.question.hypothesis.unknown":"A claim alone can still create the card; record 'missing a falsifying observation' as a gap and add it next time.","loop.coach.question.measurement.hint":"Tests, logs, reviews, user feedback and gut feeling all count — but state what you look at and how often.","loop.coach.question.measurement.title":"How do you currently know whether it is good or bad?","loop.coach.question.measurement.unknown":"\"No measurement\" is fine to admit: borrow one number that already exists (test result, review note, rollback log) and read it once a day — that beats guessing.","loop.coach.template.coding-agent.example.action":"e.g. I can change the prompt checklist and the retry cap; I cannot change model weights or the eval set.","loop.coach.template.coding-agent.example.delay":"e.g. Two to three turns to see whether a prompt change is stable; CI takes about 10 minutes.","loop.coach.template.coding-agent.example.disturbance":"e.g. The same commit fails intermittently in CI; after long sessions the model stops following the format.","loop.coach.template.coding-agent.example.goal":"e.g. In a task of at most 20 turns, the first test run after the change passes with no regressions.","loop.coach.template.coding-agent.example.hypothesis":"e.g. Failures cluster late in the session, so I suspect context pressure; if the first five turns fail just as often, the explanation fails.","loop.coach.template.coding-agent.example.measurement":"e.g. Per task, read failed tool calls over total turns, and the turn at which tests first pass.","loop.coach.template.coding-agent.hint.action":"List what you can change — prompt, tool set, retry cap, context budget — and what you cannot: model weights, upstream APIs.","loop.coach.template.coding-agent.hint.delay":"From a prompt change to a visible difference is usually one to several turns; state how many you will wait before judging.","loop.coach.template.coding-agent.hint.disturbance":"Typical disturbances: flaky tests, model variance, truncated context, upstream changes, concurrent jobs.","loop.coach.template.coding-agent.hint.goal":"Formulate it as the quantity the agent must hold within one task (pass rate, turns, time-to-green), plus a time window.","loop.coach.template.coding-agent.hint.hypothesis":"Make the claim about a mechanism (e.g. failures come from context overflow) and add one observation that would refute it.","loop.coach.template.coding-agent.hint.measurement":"Prefer numbers the session already has: test results, tool failure and retry counts, time to first success.","loop.coach.template.coding-agent.label":"Coding agent","loop.coach.template.personal.example.action":"e.g. I can leave my phone in another room and lower practice difficulty one notch; I cannot reduce this week's workload.","loop.coach.template.personal.example.delay":"e.g. Four weeks to know whether the practice works; in between I only count sessions, not results.","loop.coach.template.personal.example.disturbance":"e.g. Meetings run late on Thursday; chores fill the weekend.","loop.coach.template.personal.example.goal":"e.g. For four straight weeks, at least three 40-minute deliberate-practice sessions per week.","loop.coach.template.personal.example.hypothesis":"e.g. Plateaus come from practice being too hard; if a lower difficulty does not remove them, suspect the method.","loop.coach.template.personal.example.measurement":"e.g. One line after each session — what I practiced and where I got stuck — counted every Sunday.","loop.coach.template.personal.hint.action":"List changes you can make alone — time blocks, environment, practice difficulty — and note what is externally constrained.","loop.coach.template.personal.hint.delay":"From practice to a visible effect usually takes weeks; set a check point a few weeks out.","loop.coach.template.personal.hint.disturbance":"Typical disturbances: poor sleep, overtime, social interruptions, information overload.","loop.coach.template.personal.hint.goal":"Aim at the state or capability you want to sustain: sessions per week, focus streak, error rate.","loop.coach.template.personal.hint.hypothesis":"The claim must distinguish \"too little practice\" from \"wrong practice\", with an observation that tells them apart.","loop.coach.template.personal.hint.measurement":"Use traces you already leave — study log, commit history, focus timer — not after-the-fact memory.","loop.coach.template.personal.label":"Personal learning","loop.coach.template.product.example.action":"e.g. I can cut scope and use a canary switch; I cannot decide budget or the launch date.","loop.coach.template.product.example.delay":"e.g. Retention shifts show 3—7 days after release; two weeks to judge whether to roll back.","loop.coach.template.product.example.disturbance":"e.g. A big customer adds a last-minute requirement; the payment API changes.","loop.coach.template.product.example.goal":"e.g. Two consecutive releases with no rollback and no P1 incident within 24 hours.","loop.coach.template.product.example.hypothesis":"e.g. Acceptance disputes come from vague criteria; if disputes persist once criteria are written up front, the requirement itself is unclear.","loop.coach.template.product.example.measurement":"e.g. Read the rollback log and acceptance notes after each release, summarized every Friday.","loop.coach.template.product.hint.action":"State what you decide — scope cuts, release switch, acceptance bar — and what needs someone else to approve.","loop.coach.template.product.hint.delay":"From release to a visible user response is usually days to two weeks; judgments inside that window do not count.","loop.coach.template.product.hint.disturbance":"Typical disturbances: mid-flight scope changes, upstream delays, incidents, key people away.","loop.coach.template.product.hint.goal":"Pick an outward promise as the quantity: rollbacks, release cadence, first-pass acceptance rate.","loop.coach.template.product.hint.hypothesis":"The claim must separate \"wrong requirement\" from \"wrong execution\", plus one observation that tells them apart.","loop.coach.template.product.hint.measurement":"Use existing release records and review outcomes, not a new dashboard; state how often you read them.","loop.coach.template.product.label":"Product / project","loop.coach.template.team.example.action":"e.g. I can require that whoever changes scope writes the acceptance, and fix a Wednesday sync; I cannot change the company approval flow.","loop.coach.template.team.example.delay":"e.g. About three weeks after changing the sync format to see whether rework drops.","loop.coach.template.team.example.disturbance":"e.g. Quarter-end support for another project; two core members on leave at once.","loop.coach.template.team.example.goal":"e.g. At most two reworks per iteration, each with a recorded cause.","loop.coach.template.team.example.hypothesis":"e.g. Rework comes from vague acceptance; if rework persists once acceptance is written, look at scheduling instead.","loop.coach.template.team.example.measurement":"e.g. Weekly, read task status changes and rework logs; the standup only looks at these two.","loop.coach.template.team.hint.action":"Name the mechanisms you can change: who signs off at which checkpoint, where information lives; list processes you cannot change.","loop.coach.template.team.hint.delay":"From a collaboration change to changed behavior usually takes one iteration or more; no change in a short window is expected.","loop.coach.template.team.hint.disturbance":"Typical disturbances: turnover, priority interrupts, cross-team dependencies, verbal-only information.","loop.coach.template.team.hint.goal":"Aim at the collaboration outcome the team must hold: on-time delivery, rework count, decision-to-execution lag.","loop.coach.template.team.hint.hypothesis":"Point the claim at a coordination failure type — no owner, no information, no decision point — and add an observation that distinguishes them.","loop.coach.template.team.hint.measurement":"Use existing traces — meeting notes, task status, rework logs — not new reporting forms.","loop.coach.template.team.label":"Team collaboration","loop.coach.wizard.createCard":"Create the control card","loop.coach.wizard.createCardHint":"As long as Q1 (goal) and Q6 (explanation) have content, create the card now and fill in the rest later.","loop.coach.wizard.draftSaved":"Draft saved automatically — leave anytime and pick up here next time.","loop.coach.wizard.intro":"One question per screen, and every question can be skipped. A skipped question becomes a gap to fill later, not a blocker; write \"I don't know\" if needed — your draft saves automatically.","loop.coach.wizard.progress":"Question {current} of {total}","loop.coach.wizard.skip":"Skip this question","loop.coach.wizard.title":"The six control questions","loop.coach.wizard.unknownHint":"\"I don't know\" still moves you forward: the item is recorded as a gap you can fill later on the card."}} }
})
    return __req("index.js").plugin
  },
})
