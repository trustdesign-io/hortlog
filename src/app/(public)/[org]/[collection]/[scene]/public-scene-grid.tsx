'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { HexGrid, HexOutline, HexPlantLabel, HexSubCells } from '@/components/hex-grid'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { HEX_HEIGHT_RATIO } from '@/lib/hex-grid'
import { cellKey, hexOf, SUB_CELL_NAMES } from '@/lib/scene-grid'
import { unmeasuredCellWidth, useFittedGrid } from '@/hooks/use-fitted-grid'
import { sceneTilt, type ScenePerspective } from '@/lib/scene-perspective'

const CELL_WIDTH_REM = 6
const PX_PER_REM = 16
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
  // Fit the grid to the space left on screen, so it shows whole without scrolling
  const fitted = useFittedGrid(box, rows, cols, perspective, CELL_WIDTH_REM * PX_PER_REM)
  // A split hex opened to choose one of its small cells
  const [openHex, setOpenHex] = useState<{ row: number; col: number } | null>(null)

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

  const tilt = fitted?.tilt ?? sceneTilt(perspective, rows, CELL_WIDTH_REM * PX_PER_REM)
  const cellWidth = fitted ? `${fitted.cellPx}px` : unmeasuredCellWidth(rows, cols, tilt, CELL_WIDTH_REM)

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
            const planted = Array.from({ length: 7 }, (_, sub) => cellMap[cellKey(row, col, sub)]).filter(Boolean)
            return (
              <button
                key={cell}
                type="button"
                onClick={() => setOpenHex({ row, col })}
                className="hex-cell group"
                style={style}
                aria-label={`${planted.length} plant${planted.length === 1 ? '' : 's'} at row ${row + 1}, column ${col + 1}: ${planted.map((p) => p.scientificName).join(', ')}`}
              >
                <span className="hex-shape block bg-muted/30 group-hover:opacity-80">
                  <HexOutline className="text-border/60" />
                  <HexSubCells
                    renderSub={(sub, subStyle) => {
                      const plant = cellMap[cellKey(row, col, sub)]
                      return (
                        <span key={sub} className="hex-sub bg-muted" style={subStyle}>
                          {plant ? (
                            <SpecimenImage imageUrl={plant.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" />
                          ) : (
                            <HexOutline className="text-border/60" />
                          )}
                        </span>
                      )
                    }}
                  />
                </span>
              </button>
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
      {/* A split hex, enlarged: choose which of its plants to see */}
      <Sheet open={openHex !== null} onOpenChange={(open) => !open && setOpenHex(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Choose a plant</SheetTitle>
            <SheetDescription>{openHex && `Row ${openHex.row + 1}, column ${openHex.col + 1}`}</SheetDescription>
          </SheetHeader>
          {openHex && (
            <div
              className="relative mx-auto mb-6"
              style={{ width: 'min(100% - 2rem, 20rem, calc((100dvh - 10rem) * 0.866))', aspectRatio: `1 / ${HEX_HEIGHT_RATIO}` }}
            >
              <HexSubCells
                renderSub={(sub, subStyle) => {
                  const plant = cellMap[cellKey(openHex.row, openHex.col, sub)]
                  return plant ? (
                    <Link
                      key={sub}
                      href={`${basePath}/${plant.slug}`}
                      className="hex-sub bg-muted hover:opacity-80"
                      style={subStyle}
                      aria-label={`${plant.scientificName}, ${SUB_CELL_NAMES[sub]}`}
                    >
                      <SpecimenImage imageUrl={plant.thumbnailUrl} alt="" fill sizes="110px" className="object-cover" />
                      <HexPlantLabel scientificName={plant.scientificName} />
                    </Link>
                  ) : (
                    <span key={sub} className="hex-sub" style={subStyle} aria-hidden="true">
                      <HexOutline className="text-border/60" />
                    </span>
                  )
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
