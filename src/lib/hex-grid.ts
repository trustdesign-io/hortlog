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

/** Bounding box of the whole grid, in cell widths. */
export function hexGridExtent(rows: number, cols: number): HexExtent {
  return {
    width: cols + (rows > 1 ? 0.5 : 0),
    height: (ROW_STEP * (rows - 1) + 1) * HEX_HEIGHT_RATIO,
  }
}

function widths(n: number): string {
  return `calc(var(--hex-w) * ${Number(n.toFixed(4))})`
}

/** Container style: sets `--hex-w` and sizes the box to hold every cell. */
export function hexGridStyle(rows: number, cols: number, cellWidth: string): CSSProperties {
  const { width, height } = hexGridExtent(rows, cols)
  return {
    '--hex-w': cellWidth,
    position: 'relative',
    width: widths(width),
    height: widths(height),
  } as CSSProperties
}

/** Absolute position and size for one cell inside a `hexGridStyle` container. */
export function hexCellStyle(row: number, col: number): CSSProperties {
  const { x, y } = hexOffset(row, col)
  return {
    position: 'absolute',
    left: widths(x),
    top: widths(y),
    width: 'var(--hex-w)',
    height: widths(HEX_HEIGHT_RATIO),
  }
}

const clamp = (n: number, max: number): number => Math.max(0, Math.min(max - 1, n))

/**
 * Keyboard neighbour. Up and down keep the column index: the shift is half a
 * cell either way, so the index is the nearest hex without drifting sideways
 * over repeated presses. Moves off an edge stay on the current cell.
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
