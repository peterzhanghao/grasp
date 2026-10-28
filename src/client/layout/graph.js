/**
 * 问题尺度图谱布局（纯函数，便于 node --test）。
 *
 * 设计约束（contract §6）：
 * - 容器自适应，HTML 节点用屏幕 px 绝对定位；SVG 连线坐标与容器同 px，不用 viewBox 整图缩放；
 * - 当前节点居中，邻居按关系类型分区；
 * - 字号由 CSS 固定（不随图缩放）；
 * - 非当前关系不靠透明度隐藏。
 */

export const NODE_SIZE = {
  center: { width: 208, height: 96 },
  neighbor: { width: 156, height: 58 },
}

export function relationZone(neighbor) {
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
export function layoutSubjectGraph(options) {
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
export function zoneForRelationType(type) {
  if (type === 'prerequisite') return 'prereq'
  if (type === 'formal' || type === 'application' || type === 'constraint') return 'downstream'
  return 'context'
}
