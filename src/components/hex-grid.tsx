import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { ScientificName } from '@/components/ui/scientific-name'
import { hexCellStyle, hexGridStyle, subCellStyle } from '@/lib/hex-grid'
import { SUB_CELLS } from '@/lib/scene-grid'

interface HexGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
  rows: number
  cols: number
  /** CSS length for one cell's width; everything else scales from it. */
  cellWidth: string
  /** Bed tilt in degrees; 0 draws the grid flat, as a wall. */
  tiltDeg?: number
  /** Flips which rows are offset; see `isShiftedRow`. */
  rowShift?: number
  /** Each cell must apply the given style and the `hex-cell` class. */
  renderCell: (row: number, col: number, style: CSSProperties) => ReactNode
  rowProps?: (row: number) => HTMLAttributes<HTMLDivElement>
}

/**
 * Pointy-topped hexagonal grid in offset layout: alternate rows are shifted
 * half a cell to the right (odd rows, unless `rowShift` flips it). Rows are `display: contents` wrappers so they can
 * carry ARIA row semantics without affecting the absolute positioning.
 */
export function HexGrid({
  rows,
  cols,
  cellWidth,
  tiltDeg = 0,
  rowShift = 0,
  renderCell,
  rowProps,
  ...containerProps
}: HexGridProps) {
  return (
    <div {...containerProps} style={hexGridStyle(rows, cols, cellWidth, tiltDeg)}>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} {...rowProps?.(row)} style={{ display: 'contents' }}>
          {Array.from({ length: cols }, (_, col) => renderCell(row, col, hexCellStyle(row, col, rows, cols, tiltDeg, rowShift)))}
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

/** Focus ring for a focusable `.hex-sub`; shown by CSS only while it has keyboard focus. */
export function HexFocusRing() {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="hex-sub-ring absolute inset-0 z-10 h-full w-full text-ring">
      <polygon
        points="50,1 99,25.5 99,74.5 50,99 1,74.5 1,25.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** Botanical name across the lower part of a planted cell, over its thumbnail. */
export function HexPlantLabel({ scientificName }: { scientificName: string }) {
  return (
    <span className="absolute inset-x-0 bottom-[20%] block bg-black/65 px-[14%] py-0.5 text-center text-[10px] leading-tight text-white">
      <ScientificName className="line-clamp-2 break-words">{scientificName}</ScientificName>
    </span>
  )
}

/**
 * A split hex's seven small cells, for drawing inside its `.hex-shape`. Each
 * must apply the given style and the `hex-sub` class.
 */
export function HexSubCells({ renderSub }: { renderSub: (sub: number, style: CSSProperties) => ReactNode }) {
  return <>{Array.from({ length: SUB_CELLS }, (_, sub) => renderSub(sub, subCellStyle(sub)))}</>
}
