'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { HexGrid, HexOutline, HexPlantLabel, HexSubCells } from '@/components/hex-grid'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { cellKey, cellLabel, hexOf } from '@/lib/scene-grid'
import { hexGridExtent } from '@/lib/hex-grid'
import { sceneCellScale, sceneTilt, type ScenePerspective } from '@/lib/scene-perspective'

const CELL_WIDTH_REM = 6
const PX_PER_REM = 16
/** Cells are never drawn narrower than this, however big the grid. */
const MIN_CELL_PX = 28
/** Space kept clear under the grid. */
const BOTTOM_GAP_PX = 16

/**
 * Cell width and tilt that fit the whole grid in `width` × `height` pixels,
 * never larger than the usual size. The bed tilt depends on cell size, so it's
 * worked out from a first fit, then the fit is redone at that tilt.
 */
export function fitGrid(
  rows: number,
  cols: number,
  perspective: ScenePerspective,
  width: number,
  height: number,
): { cellPx: number; tilt: number } {
  const fit = (tilt: number) => {
    const extent = hexGridExtent(rows, cols, tilt)
    const usual = CELL_WIDTH_REM * PX_PER_REM * sceneCellScale(rows, tilt)
    return Math.max(MIN_CELL_PX, Math.min(usual, width / extent.width, height / extent.height))
  }
  const first = fit(sceneTilt(perspective, rows, CELL_WIDTH_REM * PX_PER_REM))
  const tilt = sceneTilt(perspective, rows, first)
  return { cellPx: Math.floor(fit(tilt)), tilt }
}

interface GridSpecimen {
  id: string
  slug: string
  gridCell: string
  commonName: string
  scientificName: string
  thumbnailUrl: string | null
}

interface PublicSceneGridProps {
  rows: number
  cols: number
  specimens: GridSpecimen[]
  basePath: string
  perspective: ScenePerspective
  rowShift: number
  /** Hexes split into seven smaller cells */
  splitCells?: string[]
}

export function PublicSceneGrid({ rows, cols, specimens, basePath, perspective, rowShift, splitCells = [] }: PublicSceneGridProps) {
  const box = useRef<HTMLDivElement>(null)
  const [fitted, setFitted] = useState<{ cellPx: number; tilt: number } | null>(null)

  // Fit the grid to the space left on screen, so it shows whole without scrolling
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      const height = window.innerHeight - top - BOTTOM_GAP_PX
      setFitted(fitGrid(rows, cols, perspective, el.clientWidth, Math.max(height, 200)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [rows, cols, perspective])

  if (rows <= 0 || cols <= 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Grid is not configured.
      </p>
    )
  }

  if (specimens.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No specimens have been placed in this grid yet.
      </p>
    )
  }

  const cellMap: Record<string, GridSpecimen> = {}
  const split = new Set(splitCells)
  for (const s of specimens) {
    cellMap[s.gridCell] = s
    if (s.gridCell.includes(':')) split.add(hexOf(s.gridCell) ?? '')
  }

  // Before measuring (and without JavaScript): the usual size, squeezed to the screen's width
  const tilt = fitted?.tilt ?? sceneTilt(perspective, rows, CELL_WIDTH_REM * PX_PER_REM)
  const cellWidth = fitted
    ? `${fitted.cellPx}px`
    : `min(${CELL_WIDTH_REM * sceneCellScale(rows, tilt)}rem, calc((100vw - 2rem) / ${hexGridExtent(rows, cols, tilt).width}))`

  return (
    <div
      ref={box}
      className="overflow-x-auto"
      role="region"
      aria-label="Specimen layout"
    >
      <HexGrid
        className="mx-auto"
        rows={rows}
        cols={cols}
        cellWidth={cellWidth}
        tiltDeg={tilt}
        rowShift={rowShift}
        renderCell={(row, col, style) => {
          const cell = `${row},${col}`
          const specimen = cellMap[cell]

          if (split.has(cell)) {
            return (
              <div key={cell} className="hex-cell" style={style}>
                <span className="hex-shape block bg-muted/30">
                  <HexOutline className="text-border/60" />
                  <HexSubCells
                    renderSub={(sub, subStyle) => {
                      const key = cellKey(row, col, sub)
                      const plant = cellMap[key]
                      return plant ? (
                        <Link
                          key={key}
                          href={`${basePath}/${plant.slug}`}
                          className="hex-sub bg-muted hover:opacity-80"
                          style={subStyle}
                          aria-label={`${plant.scientificName}, ${cellLabel(key)}`}
                          title={plant.scientificName}
                        >
                          <SpecimenImage imageUrl={plant.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" />
                        </Link>
                      ) : (
                        <span key={key} className="hex-sub" style={subStyle} aria-hidden="true">
                          <HexOutline className="text-border/60" />
                        </span>
                      )
                    }}
                  />
                </span>
              </div>
            )
          }

          if (specimen) {
            return (
              <Link
                key={cell}
                href={`${basePath}/${specimen.slug}`}
                className="hex-cell group"
                style={style}
                aria-label={`${specimen.scientificName}, row ${row + 1}, column ${col + 1}`}
              >
                <span className="hex-shape block bg-muted group-hover:opacity-80">
                  <SpecimenImage
                    imageUrl={specimen.thumbnailUrl}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <HexPlantLabel scientificName={specimen.scientificName} />
                </span>
              </Link>
            )
          }

          return (
            <div
              key={cell}
              className="hex-cell"
              style={style}
              aria-hidden="true"
            >
              <span className="hex-shape block bg-muted/50">
                <HexOutline className="text-border/60" />
              </span>
            </div>
          )
        }}
      />
    </div>
  )
}
