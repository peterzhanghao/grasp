/**
 * 样式入口：基础层 + 外壳层 + 视图层，按顺序拼接为一段 CSS。
 */

import { BASE_CSS } from './base.js'
import { SHELL_CSS } from './shell.js'
import { VIEWS_CSS } from './views.js'

export const CSS = [BASE_CSS, SHELL_CSS, VIEWS_CSS].join('\n')
