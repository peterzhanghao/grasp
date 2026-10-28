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

export function Icon(props) {
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
