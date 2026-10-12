import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { hexCellStyle, hexGridStyle } from '@/lib/hex-grid'

interface HexGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  rows: number
  cols: number
  /** CSS length for one cell's width; everything else scales from it. */
  cellWidth: string
  /** Bed tilt in degrees; 0 draws the grid flat, as a wall. */
  tiltDeg?: number
  /** Each cell must apply the given style and the `hex-cell` class. */
  renderCell: (row: number, col: number, style: CSSProperties) => ReactNode
  rowProps?: (row: number) => HTMLAttributes<HTMLDivElement>
}

/**
 * Pointy-topped hexagonal grid in "odd-r" offset layout: odd rows are shifted
 * half a cell to the right. Rows are `display: contents` wrappers so they can
 * carry ARIA row semantics without affecting the absolute positioning.
 */
export function HexGrid({
  rows,
  cols,
  cellWidth,
  tiltDeg = 0,
  renderCell,
  rowProps,
  ...containerProps
}: HexGridProps) {
  return (
    <div {...containerProps} style={hexGridStyle(rows, cols, cellWidth, tiltDeg)}>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} {...rowProps?.(row)} style={{ display: 'contents' }}>
          {Array.from({ length: cols }, (_, col) => renderCell(row, col, hexCellStyle(row, col, rows, cols, tiltDeg)))}
        </div>
      ))}
    </div>
  )
}

/** Dashed hexagon outline; a CSS border would be cut off by the cell's clip-path. */
export function HexOutline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`absolute inset-0 h-full w-full ${className ?? ''}`}
    >
      <polygon
        points="50,2 98,26 98,74 50,98 2,74 2,26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5 4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
