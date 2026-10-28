// 最小合法 v2 内容包 fixture：用于 validate-content / graph / pack 的单元测试。
// 结构严格按 docs/refactor-spec.md 第 3 节；内容本身是占位文本，不代表产品内容。

const ISO = '2026-10-28T00:00:00.000Z'

export const MINI_LEGACY_IDS = [
  'boundary', 'goal', 'observer', 'feedback', 'positive', 'variety', 'delay', 'stability',
  'sampling', 'measurement', 'blackbox', 'homeostat', 'actuator', 'adaptation', 'pi', 'model',
  'robust', 'tradeoff', 'vsm', 'cybersyn', 'indicator', 'secondorder', 'responsibility', 'agentloop',
]

const GROUP_IDS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8']

export function makeMiniCore() {
  const groups = GROUP_IDS.map((id, i) => ({
    id,
    order: i + 1,
    title: `单元 ${i + 1}`,
    question: `要维持的量是什么（${i + 1}）？`,
    capability: '占位能力目标',
    entryNodeId: MINI_LEGACY_IDS[i * 3],
  }))

  const nodes = MINI_LEGACY_IDS.map((id, i) => ({
    id,
    groupId: GROUP_IDS[Math.floor(i / 3)],
    kind: 'concept',
    title: `节点 ${id}`,
    aliases: [],
    era: '',
    eraStart: null,
    eraEnd: null,
    eraPrecision: 'unknown',
    def: `定义 ${id}`,
    can: `能 ${id}`,
    mech: `机制 ${id}`,
    limits: `边界 ${id}`,
    counter: `反例 ${id}`,
    check: `检验 ${id}`,
    hist: '',
    migrate: `迁移 ${id}`,
    migrateType: 'application',
    practiceStages: ['goal'],
    claimIds: [`c.${id}.1`],
    sourceIds: ['s.misc'],
    compat: { legacyIds: [] },
  }))

  const claims = MINI_LEGACY_IDS.map((id) => ({
    id: `c.${id}.1`,
    subject: { kind: 'node', id },
    text: `主张 ${id}`,
    // type=formal 的 relation 必须挂 formal 类主张（内容约束 4），fixture 里只给 stability 一个示例。
    kind: id === 'stability' ? 'formal' : 'empirical',
    sourceIds: ['s.misc'],
    verified: 'unverified',
    verifiedAt: null,
  }))

  const sources = [
    {
      id: 's.misc',
      title: '占位来源（fixture）',
      author: 'fixture',
      year: 2000,
      kind: 'book',
      ref: 'fixture',
      url: null,
      doi: null,
      verified: 'unverified',
      verifiedAt: null,
      verifiedBy: null,
      note: 'fixture 占位，检索路径不适用',
    },
  ]

  const relations = [
    {
      id: 'e.goal-to-feedback',
      from: 'goal',
      to: 'feedback',
      type: 'prerequisite',
      claim: '维持目标量需要回路',
      condition: '在负反馈可用时',
      cost: '需要可观测的偏差',
      claimIds: ['c.goal.1'],
      version: 1,
    },
    {
      id: 'e.feedback-to-stability',
      from: 'feedback',
      to: 'stability',
      type: 'formal',
      claim: '形式结果占位（fixture）',
      condition: '前提：线性、时不变、单回路',
      cost: '条件不成立时结论无效',
      claimIds: ['c.stability.1'],
      version: 1,
    },
    {
      id: 'e.positive-to-indicator',
      from: 'positive',
      to: 'indicator',
      type: 'analogy',
      claim: '指标优化可以形成放大环，但这不是同一机制，只是类比',
      condition: '在代理目标被优化时',
      cost: '把类比当机制会误判',
      claimIds: ['c.indicator.1'],
      version: 1,
    },
  ]

  const experiments = [
    { id: 'delay', order: 1, title: '延迟下的反复纠正', subtitle: '一阶惯性+纯延迟', question: '延迟变大会不会振荡？', modelId: 'delay-v2', modelVersion: 2, conceptNodeIds: ['delay', 'stability'], note: '教学模型' },
    { id: 'proxy', order: 2, title: '指标改善，目的变差', subtitle: '两个指标', question: '可见指标上升时隐藏指标如何？', modelId: 'proxy-v2', modelVersion: 2, conceptNodeIds: ['indicator'], note: '教学模型' },
    { id: 'green', order: 3, title: '全绿却错', subtitle: '分页检查器', question: '全绿漏掉什么？', modelId: 'green-v2', modelVersion: 2, conceptNodeIds: ['measurement'], note: '教学模型' },
  ]

  return {
    schemaVersion: 2,
    packId: 'loop-cybernetics-core',
    version: '1.0.0',
    language: 'zh-CN',
    status: 'authored_for_this_plugin_sources_claimed_verified_where_linked',
    definitionOfCore: 'fixture：能界定目标与边界、解释动态回路。',
    groups,
    nodes,
    relations,
    claims,
    sources,
    experiments,
    completeness: {
      baselineCount: 40,
      included: MINI_LEGACY_IDS.slice(),
      added: [],
      merged: [],
      excluded: [{ item: 'fixture 排除项', reason: 'fixture' }],
      gaps: [{ item: 'fixture 缺口', why: 'fixture', searchPath: 'fixture 检索路径' }],
    },
    meta: { fixture: true, builtAt: ISO },
  }
}

// ── graph 测试用的轻量内容（带时代与练习阶段） ─────────────────
export function makeGraphCore() {
  return {
    schemaVersion: 2,
    nodes: [
      { id: 'goal', groupId: 'g1', kind: 'concept', title: '目标与被维持的量', eraStart: null, eraEnd: null, eraPrecision: 'unknown', practiceStages: ['goal'], claimIds: [], sourceIds: [] },
      { id: 'feedback', groupId: 'g1', kind: 'concept', title: '负反馈', eraStart: 1868, eraEnd: 1868, eraPrecision: 'year', practiceStages: ['action', 'observation'], claimIds: [], sourceIds: [] },
      { id: 'delay', groupId: 'g2', kind: 'concept', title: '延迟', eraStart: 1942, eraEnd: 1942, eraPrecision: 'year', practiceStages: ['measurement'], claimIds: [], sourceIds: [] },
      { id: 'stability', groupId: 'g2', kind: 'concept', title: '稳定性与振荡', eraStart: 1868, eraEnd: 1868, eraPrecision: 'year', practiceStages: ['observation', 'acceptance'], claimIds: [], sourceIds: [] },
      { id: 'cybersyn', groupId: 'g3', kind: 'event', title: 'Cybersyn', eraStart: 1971, eraEnd: 1973, eraPrecision: 'range', practiceStages: ['revision'], claimIds: [], sourceIds: [] },
    ],
    relations: [
      { id: 'e.goal-to-feedback', from: 'goal', to: 'feedback', type: 'prerequisite', claim: '目标需要回路', condition: '有观测时', cost: '需要测量', claimIds: [], version: 1 },
      { id: 'e.delay-to-stability', from: 'delay', to: 'stability', type: 'formal', claim: '延迟压缩稳定裕度', condition: '线性时不变', cost: '实际系统未必线性', claimIds: [], version: 1 },
      { id: 'e.feedback-to-stability', from: 'feedback', to: 'stability', type: 'constraint', claim: '过强增益导致振荡', condition: '延迟存在时', cost: '降低增益会变慢', claimIds: [], version: 1 },
    ],
    claims: [],
    sources: [
      { id: 's.maxwell1868', title: 'On Governors', author: 'J. C. Maxwell', year: 1868, kind: 'paper', verified: 'unverified', url: null },
      { id: 's.wiener1948', title: 'Cybernetics', author: 'N. Wiener', year: 1948, kind: 'book', verified: 'unverified', url: null },
    ],
    groups: [
      { id: 'g1', order: 1, title: '目标与回路', question: '维持什么？', capability: '定义目标', entryNodeId: 'goal' },
      { id: 'g2', order: 2, title: '时间与稳定', question: '会不会振荡？', capability: '判断稳定性', entryNodeId: 'delay' },
      { id: 'g3', order: 3, title: '组织与历史', question: '谁在回路里？', capability: '看制度条件', entryNodeId: 'cybersyn' },
    ],
    experiments: [],
    completeness: null,
    meta: { fixture: true },
  }
}
