/**
 * 统一错误类型与 HTTP 状态映射。
 *
 * 约定：业务代码只抛 AppError；HTTP 层与工具层读 code 生成对用户可读的回执。
 */
export class AppError extends Error {
  /**
   * @param {string} code 契约第 4 节的错误码
   * @param {string} message 给用户看的中文原因
   * @param {object} [details] 附加信息（不得包含凭据）
   * @param {Error} [cause]
   */
  constructor(code, message, details, cause) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details || null
    if (cause) this.cause = cause
  }
}

export const ERROR_STATUS = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSY: 409,
  CANCELED: 409,
  IMPORT_INVALID: 400,
  PACKAGE_TOO_LARGE: 413,
  READ_ONLY: 503,
  STORAGE_WRITE: 507,
  LLM_UNAVAILABLE: 503,
  LLM_AUTH: 502,
  LLM_RATE_LIMIT: 429,
  LLM_CONTEXT: 413,
  LLM_OUTPUT: 502,
  INTERNAL: 500,
}

export function statusFor(error) {
  if (error instanceof AppError) return ERROR_STATUS[error.code] || 500
  return 500
}

export function toErrorBody(error) {
  if (error instanceof AppError) {
    return { ok: false, code: error.code, error: error.message, details: error.details }
  }
  return { ok: false, code: 'INTERNAL', error: '插件内部错误：' + String((error && error.message) || error) }
}

/** 把模型终态失败码翻译成 AppError。 */
export function fromLlmFailure(failure) {
  const code = String((failure && failure.code) || '')
  const message = String((failure && failure.message) || '模型调用失败')
  const map = {
    NO_ADAPTER: ['LLM_UNAVAILABLE', '宿主没有可用的模型适配器：' + message],
    MISSING_CREDENTIAL: ['LLM_AUTH', '模型凭据缺失：' + message],
    INVALID_CREDENTIAL: ['LLM_AUTH', '模型凭据无效：' + message],
    AUTH: ['LLM_AUTH', '模型鉴权失败：' + message],
    RATE_LIMIT: ['LLM_RATE_LIMIT', '模型限流：' + message],
    QUOTA: ['LLM_RATE_LIMIT', '模型额度不足：' + message],
    ACCOUNT_QUOTA: ['LLM_RATE_LIMIT', '账户额度不足：' + message],
    CONTEXT_WINDOW_EXCEEDED: ['LLM_CONTEXT', '上下文超出模型窗口：' + message],
  }
  const hit = map[code]
  if (hit) return new AppError(hit[0], hit[1], { llmCode: code })
  return new AppError('LLM_UNAVAILABLE', '模型调用失败：' + message, { llmCode: code || 'UNKNOWN' })
}

/** 存储错误转成可重试的说明，不吞错。 */
export function fromStorageFailure(error) {
  const errCode = String((error && error.code) || '')
  const errno = error && typeof error.errno === 'number' ? error.errno : null
  const base = String((error && error.message) || error)
  const map = {
    ENOSPC: '磁盘空间不足，数据没有写入',
    EACCES: '没有写入权限，数据没有写入',
    EPERM: '写操作被系统拒绝，数据没有写入',
    EBUSY: '数据文件被占用，数据没有写入',
    EISDIR: '数据路径被占用（同名目录存在），数据没有写入',
    EMFILE: '文件句柄耗尽，数据没有写入',
    EROFS: '数据目录是只读的，数据没有写入',
  }
  const hint = map[errCode] || '写入失败，数据没有写入'
  return new AppError('STORAGE_WRITE', hint + '：' + base, { fsCode: errCode, errno, retryable: true }, error)
}
