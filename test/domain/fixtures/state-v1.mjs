// v1 用户数据 fixture：形状对齐 D:\plug-in\loop-atlas-data\state.json（v1），
// 内容为合成数据（不使用真实用户的私人笔记正文），其中一条含 '?' 替换字符乱码，
// 用于验证迁移「逐字保留 + encodingSuspected」而不是猜测修复。

const ISO = '2026-10-27T12:49:20.570Z'
const ISO2 = '2026-10-27T12:49:39.039Z'

export function makeV1State() {
  return {
    schemaVersion: 1,
    notes: {
      n_fixture_garbled: {
        id: 'n_fixture_garbled',
        subjectId: 'delay',
        subjectType: 'node',
        kind: '??',
        text: '????"?"?,"????????"?',
        origin: 'user',
        createdAt: ISO,
        updatedAt: ISO,
        revision: 1,
        status: 'active',
      },
      n_fixture_evidence: {
        id: 'n_fixture_evidence',
        subjectId: 'delay',
        subjectType: 'node',
        kind: '证据',
        text: '示例证据：D=1.2 时穿越目标 6 次。',
        origin: 'user',
        createdAt: ISO,
        updatedAt: ISO2,
        revision: 2,
        status: 'active',
      },
      n_fixture_archived: {
        id: 'n_fixture_archived',
        subjectId: 'measurement',
        subjectType: 'node',
        kind: '理解',
        text: '已归档的旧笔记',
        origin: 'user',
        createdAt: ISO,
        updatedAt: ISO2,
        revision: 1,
        status: 'archived',
      },
    },
    revisions: {
      n_fixture_garbled: [{ revision: 1, text: '????"?"?,"????????"?', at: ISO }],
      n_fixture_evidence: [
        { revision: 1, text: '示例修订：延迟改变的是我看到的时刻，不是「慢」。', at: ISO },
        { revision: 2, text: '示例证据：D=1.2 时穿越目标 6 次。', at: ISO2 },
      ],
      n_fixture_archived: [{ revision: 1, text: '已归档的旧笔记', at: ISO }],
    },
    experiments: {
      e_fixture_delay: {
        id: 'e_fixture_delay',
        experimentId: 'delayloop',
        params: { K: 1.2, D: 1.2 },
        result: { crossings: 6 },
        prediction: '持续振荡',
        at: ISO2,
      },
    },
    contracts: {
      c_fixture_pagination: {
        id: 'c_fixture_pagination',
        title: '示例任务契约：分页越界',
        text: '【期望行为】越界页返回空列表\n【验收】越界页长度为 0',
        nodeIds: ['measurement', 'boundary'],
        createdAt: ISO2,
        updatedAt: ISO2,
        revision: 1,
      },
    },
    predictions: {
      p_fixture_open: {
        id: 'p_fixture_open',
        subjectId: 'delay',
        text: '示例预测：把增益降低后振荡是否消失',
        resolveBy: '示例判据：末 4 秒穿越次数 < 2',
        at: ISO2,
        resolved: false,
      },
      p_fixture_resolved_legacy: {
        id: 'p_fixture_resolved_legacy',
        subjectId: 'stability',
        text: '已解决但没记录结局的旧预测',
        resolveBy: '旧判据',
        at: ISO2,
        resolved: true,
      },
    },
    view: { selected: 'delay', projection: 'practice' },
  }
}
