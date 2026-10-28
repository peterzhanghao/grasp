/**
 * 掌控 · 领域层实验模型（纯函数，无 IO、无 ctx、无第三方依赖）
 *
 * 契约：docs/refactor-spec.md 第 5 节。
 * 修订（Lead 2026-10-28 拍板）：执行器饱和改为对称 ±2。
 * 原因：旧模型 u 被限制在 1 以内时 y(t) ≤ target 恒成立，轨迹不可能穿越/过冲目标，
 *       「过冲后收敛」「穿越目标振荡」两类现象不可达，且只能靠「穿越次数」误判。
 * 改 ±2 后 target=1 可被穿越，六类现象均可由参数扫描达到；仍是一阶惯性 + 纯延迟 +
 * 执行器饱和的教学模型，不是真实系统辨识，也不构成稳定性证明。
 */

export const EXPERIMENT_MODELS = {
  delay: { id: 'delay-v2', version: 2 },
  proxy: { id: 'proxy-v2', version: 2 },
  green: { id: 'green-v2', version: 2 },
}

/** runDelay 的模型常量（教学设定，勿当真实系统参数）。 */
export const DELAY_MODEL = Object.freeze({
  tau: 0.5,
  target: 1,
  dt: 0.02,
  T: 16,
  uLimit: Object.freeze({ min: -2, max: 2 }),
  KMin: 0,
  KMax: 5,
  DMin: 0,
  DMax: 2,
})

export const DELAY_VERDICTS = Object.freeze([
  'converged',
  'overshoot-settled',
  'oscillating',
  'oscillating-below',
  'drift',
  'diverging',
])

export const PROXY_MODEL = Object.freeze({ eMin: 0, eMax: 2.6, hiddenKnee: 1.2, hiddenPenalty: 30 })

export const GREEN_MODEL = Object.freeze({ pageSize: 3 })

const DELAY_VERDICT_LABELS = {
  converged: '收敛（无振荡，稳态偏差在容差带内）',
  'overshoot-settled': '过冲后收敛（越过目标后回到稳态）',
  oscillating: '持续振荡（末段穿越目标）',
  'oscillating-below': '目标下方振荡（不穿越目标）',
  drift: '稳态偏差（无振荡，但停在目标之外）',
  diverging: '发散（幅度持续增大，受执行器饱和限制）',
}

const clampValue = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/**
 * 数值兜底：非有限数回退默认值，超界钳制到合法区间，并记录 adjustments（不吞掉）。
 * 返回 { value, adjustments }，不修改入参。
 */
function safeNumber(raw, fallback, min, max, name, adjustments) {
  const num = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(num)) {
    adjustments.push({
      param: name,
      from: raw === undefined ? 'undefined' : String(raw),
      to: fallback,
      reason: '不是有限数值，已回退默认值',
    })
    return fallback
  }
  const clamped = clampValue(num, min, max)
  if (clamped !== num) {
    adjustments.push({
      param: name,
      from: num,
      to: clamped,
      reason: `超出允许区间 [${min}, ${max}]，已钳制`,
    })
  }
  return clamped
}

/** 一阶惯性 + 纯延迟 + 比例反馈，确定性显式欧拉积分。D=0 时读取当前 y，不做越界访问。 */
function simulateDelay(K, D, tau, target, dt, T, uLimit) {
  const steps = Math.round(T / dt)
  const initialY = 0
  const history = [initialY]
  const trace = [{ t: 0, y: initialY, u: 0 }]
  let y = initialY

  for (let k = 0; k < steps; k++) {
    const t = k * dt
    const delayedT = t - D
    let yDelayed
    if (delayedT <= 0) {
      // 延迟窗口内还没有历史输出，按初值取 0（契约：初值 0）。
      yDelayed = initialY
    } else {
      const x = delayedT / dt
      const i = Math.floor(x)
      const frac = x - i
      const a = i < history.length ? history[i] : history[history.length - 1]
      const b = i + 1 < history.length ? history[i + 1] : a
      yDelayed = a + (b - a) * frac
    }
    const u = clampValue(K * (target - yDelayed), uLimit.min, uLimit.max)
    y = y + dt * (u - y) / tau
    history.push(y)
    trace.push({ t: t + dt, y, u })
  }
  return trace
}

const ptp = (values) => (values.length ? Math.max(...values) - Math.min(...values) : 0)

/** 从轨迹计算契约要求的 metrics，并给出判定依据（窗口、趋势）。 */
function delayMetrics(trace, target) {
  // 末 4 秒为判定窗口（工作窗口），前一 4 秒用于观察幅度趋势。
  const windowSteps = Math.max(1, Math.round(4 / DELAY_MODEL.dt))
  const ys = trace.map((p) => p.y)
  const tail = ys.slice(-windowSteps)
  const previous = ys.slice(-2 * windowSteps, -windowSteps)
  const lastAmplitude = ptp(tail)
  const prevAmplitude = ptp(previous)
  const amplitudeRatio = lastAmplitude / Math.max(prevAmplitude, 0.01)
  const tailStart = trace.length - windowSteps

  let crossings = 0
  let tailCrossings = 0
  for (let i = 1; i < trace.length; i++) {
    const before = trace[i - 1].y - target
    const after = trace[i].y - target
    if (before * after < 0) {
      crossings += 1
      if (i >= tailStart) tailCrossings += 1
    }
  }

  const final = trace.length ? trace[trace.length - 1].y : 0
  const peak = ys.length ? Math.max(...ys) : 0
  const maxAbs = ys.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  return {
    metrics: {
      final,
      peak,
      overshoot: Math.max(0, peak - target),
      lastAmplitude,
      drift: target - final,
      crossings,
      maxAbs,
    },
    evidence: {
      windowSeconds: 4,
      previousAmplitude: prevAmplitude,
      amplitudeRatio,
      tailCrossings,
      tailMin: tail.length ? Math.min(...tail) : 0,
      tailMax: tail.length ? Math.max(...tail) : 0,
    },
  }
}

/** 六类现象判定（互斥且穷尽）。阈值写进 criterion；有限 16 秒窗口不是稳定性证明。 */
function classifyDelay(evidence, metrics, target) {
  const AMP_MIN = 0.04
  const DECAY_RATIO = 0.65
  const GROW_RATIO = 1.05
  const NEAR_TOL = 0.2
  const OVERSHOOT_TOL = 0.02

  const sustained = metrics.lastAmplitude >= AMP_MIN && evidence.amplitudeRatio >= DECAY_RATIO
  if (sustained && evidence.amplitudeRatio >= GROW_RATIO) return 'diverging'
  if (sustained) return evidence.tailCrossings > 0 ? 'oscillating' : 'oscillating-below'
  if (metrics.peak > target + OVERSHOOT_TOL) return 'overshoot-settled'
  if (Math.abs(metrics.drift) <= NEAR_TOL) return 'converged'
  return 'drift'
}

function delayVerdictLabel(verdict, evidence, metrics, model) {
  const base = DELAY_VERDICT_LABELS[verdict] || verdict
  const range = `[${evidence.tailMin.toFixed(2)}, ${evidence.tailMax.toFixed(2)}]`
  switch (verdict) {
    case 'converged':
      return `${base}：末段残余振幅 ${metrics.lastAmplitude.toFixed(3)}，稳态偏差 ${metrics.drift.toFixed(3)}（容差 ±0.20）`
    case 'drift':
      return `${base}：末段残余振幅 ${metrics.lastAmplitude.toFixed(3)}，稳态偏差 ${metrics.drift.toFixed(3)} 超出容差 ±0.20`
    case 'overshoot-settled':
      return `${base}：峰值 ${metrics.peak.toFixed(3)} 超过目标 ${metrics.overshoot.toFixed(3)}，末段残余振幅 ${metrics.lastAmplitude.toFixed(3)}`
    case 'oscillating':
      return `${base}：末 4 秒穿越目标 ${evidence.tailCrossings} 次，峰峰振幅 ${metrics.lastAmplitude.toFixed(3)}，末端振荡区间 ${range}`
    case 'oscillating-below':
      return `${base}：末 4 秒峰峰振幅 ${metrics.lastAmplitude.toFixed(3)}，末端振荡区间 ${range} 未穿越目标（此前瞬态可能已越过）`
    case 'diverging':
      return `${base}：末 4 秒振幅为前一窗口的 ${evidence.amplitudeRatio.toFixed(2)} 倍，仍在增大（受执行器 ${model.uLimit.min}/${model.uLimit.max} 与 ${model.T} 秒窗口限制）`
    default:
      return base
  }
}

const DELAY_CRITERION =
  '判据（16 秒有限窗口，不是稳定性证明）：取末 4 秒（t∈[12,16]）峰峰值为残余振幅，与前一 4 秒比较趋势；' +
  '振幅≥0.04 且未较前一窗口衰减超过 35% 记为持续振荡，其中末窗口穿越目标记振荡、全程不穿越目标记目标下方振荡，' +
  '振幅较前一窗口仍增大 ≥5% 记发散；其余记为已稳定，再看是否越过目标（>0.02 记过冲后收敛）、' +
  '稳态偏差是否在 ±0.20 容差带内（在内记收敛，在外记稳态偏差/漂移）。' +
  '模型：y′=(u−y)/τ，τ=0.5，u=clamp(K·(1−y(t−D)), −2, 2)，target=1，dt=0.02，初值 0；' +
  '这是教学模型（执行器饱和 ±2），不是真实系统辨识，也不能据此宣称真实系统稳定。'

/**
 * 延迟实验：一阶惯性 + 纯延迟 + 比例反馈。
 * @param {{K?: number, D?: number}} [options]
 * @returns 契约第 5 节要求的运行结果（含可复现的 trace/metrics/判据）。
 */
export function runDelay(options) {
  const opts = options && typeof options === 'object' ? options : {}
  const model = EXPERIMENT_MODELS.delay
  const adjustments = []
  const K = safeNumber(opts.K, 1.2, DELAY_MODEL.KMin, DELAY_MODEL.KMax, 'K', adjustments)
  const D = safeNumber(opts.D, 0.6, DELAY_MODEL.DMin, DELAY_MODEL.DMax, 'D', adjustments)

  const trace = simulateDelay(K, D, DELAY_MODEL.tau, DELAY_MODEL.target, DELAY_MODEL.dt, DELAY_MODEL.T, DELAY_MODEL.uLimit)
  const { metrics, evidence } = delayMetrics(trace, DELAY_MODEL.target)
  const verdict = classifyDelay(evidence, metrics, DELAY_MODEL.target)
  const verdictLabel = delayVerdictLabel(verdict, evidence, metrics, DELAY_MODEL)
  const adjustedNote = adjustments.length
    ? ` 本次参数已兜底：${adjustments.map((a) => `${a.param} 由 ${a.from} 调整为 ${a.to}（${a.reason}）`).join('；')}。`
    : ''

  return {
    experimentId: 'delay',
    modelId: model.id,
    modelVersion: model.version,
    params: { K, D },
    uLimit: { min: DELAY_MODEL.uLimit.min, max: DELAY_MODEL.uLimit.max },
    dt: DELAY_MODEL.dt,
    T: DELAY_MODEL.T,
    tau: DELAY_MODEL.tau,
    target: DELAY_MODEL.target,
    initial: 0,
    trace,
    metrics,
    evidence: {
      windowSeconds: evidence.windowSeconds,
      previousAmplitude: evidence.previousAmplitude,
      amplitudeRatio: evidence.amplitudeRatio,
      tailCrossings: evidence.tailCrossings,
    },
    verdict,
    verdictLabel,
    criterion: DELAY_CRITERION + adjustedNote,
    adjustments,
  }
}

// ── 实验三：代理指标 ─────────────────────────────────────────

export function proxyVisible(e) {
  return 100 * (1 - Math.exp(-1.1 * e))
}

/**
 * 隐藏指标：契约公式 hidden(e) = visible(e) − 30·max(0, e−1.2)。
 * 峰值出现在 e=1.2（visible′≈29.4 < 30），之后下降；e=2.6 时明显低于峰值。
 */
export function proxyHidden(e) {
  const visible = proxyVisible(e)
  return visible - PROXY_MODEL.hiddenPenalty * Math.max(0, e - PROXY_MODEL.hiddenKnee)
}

const PROXY_CRITERION =
  '公式（教学设定，不是真实产品指标）：visible(e)=100·(1−e^(−1.1e)) 随 e 单调上升；' +
  'hidden(e)=visible(e)−30·max(0,e−1.2)。hidden 在 e≈1.2 达到峰值 73.29 后开始下降；' +
  'e=2.6 时 visible≈94.3 为区间最高，hidden≈52.3 比峰值低约 28.7%。' +
  'ratioHiddenToVisible 的标签是「隐藏/可见」= hidden÷visible，不要写成「可见/隐藏」。'

/**
 * 代理指标实验：可见指标 vs 隐藏指标。
 * @param {{e?: number}} [options]
 */
export function runProxy(options) {
  const opts = options && typeof options === 'object' ? options : {}
  const model = EXPERIMENT_MODELS.proxy
  const adjustments = []
  const e = safeNumber(opts.e, 1, PROXY_MODEL.eMin, PROXY_MODEL.eMax, 'e', adjustments)

  const visible = proxyVisible(e)
  const hidden = proxyHidden(e)
  const ratioHiddenToVisible = visible > 0 ? hidden / visible : 0

  // 峰值在解析上落在 e=1.2（visible′(1.2)≈29.4 < 30），与公式一致且可复现。
  const peakHidden = { e: PROXY_MODEL.hiddenKnee, value: proxyHidden(PROXY_MODEL.hiddenKnee) }
  const hiddenVsPeak = (hidden - peakHidden.value) / peakHidden.value

  let verdict
  let verdictLabel
  if (e <= PROXY_MODEL.hiddenKnee) {
    verdict = 'pass'
    verdictLabel = `两个指标同向上升（尚未脱钩）：可见 ${visible.toFixed(1)}，隐藏 ${hidden.toFixed(1)}，隐藏/可见 ${ratioHiddenToVisible.toFixed(3)}`
  } else {
    verdict = 'mixed'
    verdictLabel =
      `指标改善≠目的改善：可见 ${visible.toFixed(1)} 仍在上升，隐藏 ${hidden.toFixed(1)} 已从峰值 ${peakHidden.value.toFixed(1)} 下降 ${(hiddenVsPeak * 100).toFixed(1)}%（隐藏/可见 ${ratioHiddenToVisible.toFixed(3)}）`
  }

  const adjustedNote = adjustments.length
    ? ` 本次 e 已兜底：${adjustments.map((a) => `${a.param} 由 ${a.from} 调整为 ${a.to}（${a.reason}）`).join('；')}。`
    : ''

  return {
    experimentId: 'proxy',
    modelId: model.id,
    modelVersion: model.version,
    params: { e },
    visible,
    hidden,
    ratioHiddenToVisible,
    ratioLabel: '隐藏/可见',
    peakHidden,
    verdict,
    verdictLabel,
    criterion: PROXY_CRITERION + adjustedNote,
    adjustments,
  }
}

// ── 实验一：全绿却错 ─────────────────────────────────────────

const PAGINATION_DATA = Object.freeze(['a', 'b', 'c', 'd', 'e'])

/**
 * 故意留有教学缺陷的分页函数：越界时回退第一页，而不是返回空页。
 * 该缺陷是实验一的核心：全部已勾选检查通过，并不等于功能正确。
 */
export function paginateForDemo(list, page, pageSize = GREEN_MODEL.pageSize) {
  const items = Array.isArray(list) ? list : []
  const size = Math.max(1, Math.floor(pageSize) || GREEN_MODEL.pageSize)
  const pageCount = Math.ceil(items.length / size) || 1
  if (page < 1 || page > pageCount) {
    return items.slice(0, size) // 教学缺陷：越界回退第一页
  }
  return items.slice((page - 1) * size, page * size)
}

const GREEN_CASES = [
  {
    id: 'p1',
    label: '第 1 页',
    expect: '返回前 3 条 [a,b,c]',
    run: () => paginateForDemo(PAGINATION_DATA, 1),
    check: (rows) => JSON.stringify(rows) === JSON.stringify(['a', 'b', 'c']),
  },
  {
    id: 'p2',
    label: '第 2 页',
    expect: '返回剩余 2 条 [d,e]',
    run: () => paginateForDemo(PAGINATION_DATA, 2),
    check: (rows) => JSON.stringify(rows) === JSON.stringify(['d', 'e']),
  },
  {
    id: 'empty',
    label: '空列表',
    expect: '空列表第 1 页返回 []',
    run: () => paginateForDemo([], 1),
    check: (rows) => Array.isArray(rows) && rows.length === 0,
  },
  {
    id: 'beyond',
    label: '越界页',
    expect: '第 99 页应返回空列表 []（越界即空页）',
    run: () => paginateForDemo(PAGINATION_DATA, 99),
    check: (rows) => Array.isArray(rows) && rows.length === 0,
  },
]

const GREEN_DEFAULT_ENABLED = Object.freeze({ p1: true, p2: true, empty: true, beyond: false })

function greenEnabledMap(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const enabled = { ...GREEN_DEFAULT_ENABLED }
  const unknown = []
  for (const key of Object.keys(source)) {
    if (!(key in GREEN_DEFAULT_ENABLED)) unknown.push(key)
    else enabled[key] = Boolean(source[key])
  }
  return { enabled, unknown }
}

const GREEN_CAVEAT =
  '已勾选的检查全部通过，只表示这些断言在已测输入上成立；它们不证明功能正确，也不构成稳定性证明。' +
  '本沙盒检查器是确定性分页函数（数据 [a,b,c,d,e]），不读取你的仓库；beyond 用例揭示它在越界时会回退第一页。' +
  '「全绿」与「正确」之间的差距，就是这次实验要看见的东西。'

const GREEN_CRITERION =
  'green-v2 判据：用内置确定性分页函数（数据 [a,b,c,d,e]，每页 3 条）检查 p1（第 1 页应返回 a,b,c）、' +
  'p2（第 2 页应返回 d,e）、empty（空列表第 1 页应为空）；beyond（第 99 页应为空）默认未勾选、勾上即失败，' +
  '因为实现会在越界时回退第一页。allGreen 只表示「已勾选用例全部通过」，不表示功能正确，也不是稳定性证明；' +
  '该检查器不读取真实仓库，不代表真实项目事故。'

/**
 * 全绿却错实验：默认勾选 p1/p2/empty，beyond 默认未勾选；勾上 beyond 就会失败。
 * allGreen 只表示「已勾选用例通过」。
 * @param {{enabled?: Record<string, boolean>}} [options]
 */
export function runGreen(options) {
  const opts = options && typeof options === 'object' ? options : {}
  const model = EXPERIMENT_MODELS.green
  const { enabled, unknown } = greenEnabledMap(opts.enabled)

  const cases = GREEN_CASES.map((item) => {
    if (!enabled[item.id]) {
      return { id: item.id, label: item.label, state: 'off', detail: '未勾选，未运行', expect: item.expect }
    }
    const rows = item.run()
    const pass = item.check(rows)
    return {
      id: item.id,
      label: item.label,
      state: pass ? 'pass' : 'fail',
      detail: `实际返回 ${JSON.stringify(rows)}${pass ? '，与期望一致' : `，与期望不符（期望：${item.expect}）`}`,
      expect: item.expect,
    }
  })

  const checked = cases.filter((c) => c.state !== 'off')
  const allGreen = checked.length > 0 && checked.every((c) => c.state === 'pass')
  const failed = checked.filter((c) => c.state === 'fail').map((c) => c.label)

  let allGreenNote
  if (checked.length === 0) allGreenNote = '没有勾选任何检查：allGreen=false（未运行不等于通过）'
  else if (allGreen) allGreenNote = `已勾选 ${checked.length} 项检查全部通过（仅此含义）`
  else allGreenNote = `已勾选 ${checked.length} 项中有 ${failed.length} 项失败：${failed.join('、')}`

  return {
    experimentId: 'green',
    modelId: model.id,
    modelVersion: model.version,
    params: { enabled: { ...enabled } },
    cases,
    checkedCount: checked.length,
    failedCount: failed.length,
    allGreen,
    allGreenNote,
    criterion: GREEN_CRITERION,
    caveat: unknown.length ? `${GREEN_CAVEAT}（忽略了未知用例：${unknown.join('、')}）` : GREEN_CAVEAT,
    unknownCases: unknown,
  }
}
