/**
 * 通用工具：id、subjectKey、时间格式化、剪贴板、下载、classNames。
 * 纯函数优先，方便 node --test 直接 import。
 */

/** 生成 `r_<base36 时间>_<随机>`，满足 Host 的 r_ + [A-Za-z0-9_-]{4,64} 校验。 */
export function newRequestId() {
  const stamp = Date.now().toString(36)
  let rand = ''
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 8; i++) rand += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `r_${stamp}_${rand}`
}

/** 生成一次性的本地 id（笔记、草稿等客户端临时对象用）。 */
export function newLocalId(prefix) {
  return `${prefix || 'l'}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function classNames(...args) {
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
export function subjectKey(subject) {
  if (!subject) return ''
  if (typeof subject === 'string') return subject
  if (!subject.kind || !subject.id) return ''
  return `${subject.kind}:${subject.id}`
}

/** 'node:delay' → { kind:'node', id:'delay' }；非法返回 null。 */
export function parseSubjectKey(key) {
  if (typeof key !== 'string') return null
  const index = key.indexOf(':')
  if (index <= 0 || index === key.length - 1) return null
  return { kind: key.slice(0, index), id: key.slice(index + 1) }
}

export function sameSubject(a, b) {
  return !!a && !!b && a.kind === b.kind && a.id === b.id
}

export function isSubjectOf(kind, id, subject) {
  return !!subject && subject.kind === kind && subject.id === id
}

/** ISO 时间 → 本地可读（YYYY-MM-DD HH:mm）；非法输入返回原值/空串。 */
export function formatTime(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

/** ISO 时间 → 2026-10-28。 */
export function formatDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 相对时间（用于回执/消息）；无法判断则回退 formatTime。 */
export function formatRelative(value, now) {
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
export function truncate(text, limit) {
  const value = String(text == null ? '' : text)
  if (value.length <= limit) return value
  return value.slice(0, Math.max(0, limit - 1)) + '…'
}

/** 30 字以内的单行摘要。 */
export function oneLine(text, limit) {
  return truncate(String(text == null ? '' : text).replace(/\s+/g, ' ').trim(), limit || 80)
}

/** 复制文本：返回 {ok, reason}，不抛错（异步拒绝也会被接住）。 */
export async function copyText(text) {
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
export function downloadJson(filename, data) {
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

export function downloadText(filename, text, mime) {
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
export function formatBytes(bytes) {
  const value = Number(bytes) || 0
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`
  return `${(value / (1024 * 1024)).toFixed(2)} MiB`
}

/** 键盘事件是否可视为激活（Enter/Space）。 */
export function isActivationKey(event) {
  return !!event && (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
}

export function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
