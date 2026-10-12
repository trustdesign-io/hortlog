import type { CSSProperties } from 'react'

/** Pointy-topped regular hexagon: height is 2/√3 of its width. */
export const HEX_HEIGHT_RATIO = 2 / Math.sqrt(3)

/** Each row sits three quarters of a cell height below the one above. */
const ROW_STEP = 0.75

export type HexDirection = 'left' | 'right' | 'up' | 'down'

export interface HexCoord {
  row: number
  col: number
}

export interface HexOffset {
  x: number
  y: number
}

export interface HexExtent {
  width: number
  height: number
}

/**
 * Top-left corner of a cell, with x in cell widths and y in cell widths too,
 * so both scale from a single `--hex-w` length. Odd rows shift right by half
 * a cell ("odd-r" offset coordinates).
 */
export function hexOffset(row: number, col: number): HexOffset {
  return { x: col + (row % 2) * 0.5, y: row * ROW_STEP * HEX_HEIGHT_RATIO }
}

/** Viewer distance from the front edge of a bed, in cell widths. */
const VIEW_DISTANCE = 10

export interface HexFrame {
  left: number
  top: number
  width: number
  height: number
}

function radians(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Distance from the front edge of the bed to the middle of a row, in cell widths. */
function rowDepth(row: number, rows: number): number {
  return (rows - 1 - row) * ROW_STEP * HEX_HEIGHT_RATIO + HEX_HEIGHT_RATIO / 2
}

function depthScale(depth: number, tiltDeg: number): number {
  return VIEW_DISTANCE / (VIEW_DISTANCE + depth * Math.sin(radians(tiltDeg)))
}

/** Height above the front of the bed at which a point at `depth` appears. */
function project(depth: number, tiltDeg: number): number {
  return depth * Math.cos(radians(tiltDeg)) * depthScale(depth, tiltDeg)
}

function nearEdge(row: number, rows: number, tiltDeg: number): number {
  return project(rowDepth(row, rows) - HEX_HEIGHT_RATIO / 2, tiltDeg)
}

/** Projected near-to-far extent of a row, so rows keep tiling as they lie back. */
function cellHeight(row: number, rows: number, tiltDeg: number): number {
  return project(rowDepth(row, rows) + HEX_HEIGHT_RATIO / 2, tiltDeg) - nearEdge(row, rows, tiltDeg)
}

/** Bounding box of the whole grid, in cell widths. A tilt lays it back as a bed. */
export function hexGridExtent(rows: number, cols: number, tiltDeg = 0): HexExtent {
  return {
    width: cols + (rows > 1 ? 0.5 : 0),
    height: project(rowDepth(0, rows) + HEX_HEIGHT_RATIO / 2, tiltDeg),
  }
}

/**
 * Box of one cell, in cell widths. With a tilt the grid is projected as a bed
 * receding from the viewer, but each cell stays an upright box: scaled and
 * moved, never rotated, so clipping, hit-testing and labels are unaffected.
 * Each cell stands on its near edge, so the front row sits on the bed's front.
 */
export function hexFrame(
  row: number,
  col: number,
  rows: number,
  cols: number,
  tiltDeg = 0,
): HexFrame {
  const depth = rowDepth(row, rows)
  const scale = depthScale(depth, tiltDeg)
  const height = cellHeight(row, rows, tiltDeg)
  const { width: gridWidth, height: gridHeight } = hexGridExtent(rows, cols, tiltDeg)
  const centreX = hexOffset(row, col).x + 0.5
  return {
    left: (centreX - gridWidth / 2) * scale + gridWidth / 2 - scale / 2,
    top: gridHeight - nearEdge(row, rows, tiltDeg) - height,
    width: scale,
    height,
  }
}

function widths(n: number): string {
  return `calc(var(--hex-w) * ${Number(n.toFixed(4))})`
}

/** Container style: sets `--hex-w` and sizes the box to hold every cell. */
export function hexGridStyle(
  rows: number,
  cols: number,
  cellWidth: string,
  tiltDeg = 0,
): CSSProperties {
  const { width, height } = hexGridExtent(rows, cols, tiltDeg)
  return {
    '--hex-w': cellWidth,
    position: 'relative',
    width: widths(width),
    height: widths(height),
  } as CSSProperties
}

/** Absolute position and size for one cell inside a `hexGridStyle` container. */
export function hexCellStyle(
  row: number,
  col: number,
  rows: number,
  cols: number,
  tiltDeg = 0,
): CSSProperties {
  const frame = hexFrame(row, col, rows, cols, tiltDeg)
  return {
    position: 'absolute',
    left: widths(frame.left),
    top: widths(frame.top),
    width: widths(frame.width),
    height: widths(frame.height),
  }
}

const clamp = (n: number, max: number): number => Math.max(0, Math.min(max - 1, n))

/**
 * Keyboard neighbour. Both hexes in the adjacent row are exactly half a cell
 * away, so up and down break the tie by keeping the column index. That is
 * reversible and does not drift sideways over repeated presses. Moves off an edge stay on the current cell.
 */
export function moveHexCell(
  from: HexCoord,
  direction: HexDirection,
  rows: number,
  cols: number,
): HexCoord {
  const delta = {
    left: { row: 0, col: -1 },
    right: { row: 0, col: 1 },
    up: { row: -1, col: 0 },
    down: { row: 1, col: 0 },
  }[direction]
  return {
    row: clamp(from.row + delta.row, rows),
    col: clamp(from.col + delta.col, cols),
  }
}
