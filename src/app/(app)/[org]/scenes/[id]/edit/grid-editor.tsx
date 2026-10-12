'use client'

import { useOptimistic, useTransition, useState, useCallback, useRef } from 'react'
import { placeSpecimen, removeSpecimenFromCell } from '@/lib/actions/scene'
import { ScientificName } from '@/components/ui/scientific-name'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Search } from 'lucide-react'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { HexGrid } from '@/components/hex-grid'
import { moveHexCell, type HexDirection } from '@/lib/hex-grid'
import { sceneTilt, type ScenePerspective } from '@/lib/scene-perspective'
import { Button } from '@/components/ui/button'
import { RotatePrompt } from './rotate-prompt'
import { EmptyCell, FilledCell, type PlacedSpecimen } from './grid-cells'

const CELL_WIDTH_REM = 7.5
const PX_PER_REM = 16

const ARROW_DIRECTIONS: Record<string, HexDirection> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

interface AvailableSpecimen {
  id: string
  accessionNumber: string | null
  commonName: string
  scientificName: string
  thumbnailUrl: string | null
}

type GridState = Record<string, PlacedSpecimen>

type OptimisticAction =
  | { type: 'place'; cell: string; specimen: PlacedSpecimen }
  | { type: 'remove'; cell: string }

interface GridEditorProps {
  orgSlug: string
  sceneId: string
  gridRows: number
  gridCols: number
  perspective: ScenePerspective
  placedSpecimens: PlacedSpecimen[]
  availableSpecimens: AvailableSpecimen[]
}

function buildInitialGrid(placed: PlacedSpecimen[]): GridState {
  return placed.reduce<GridState>((acc, s) => {
    if (s.gridCell) acc[s.gridCell] = s
    return acc
  }, {})
}

export function GridEditor({
  orgSlug,
  sceneId,
  gridRows,
  gridCols,
  perspective,
  placedSpecimens,
  availableSpecimens,
}: GridEditorProps) {
  const [, startTransition] = useTransition()
  const [optimisticGrid, dispatch] = useOptimistic<GridState, OptimisticAction>(
    buildInitialGrid(placedSpecimens),
    (state, action) => {
      if (action.type === 'place') {
        const next: GridState = {}
        for (const [key, val] of Object.entries(state)) {
          if (val.id !== action.specimen.id) next[key] = val
        }
        next[action.cell] = action.specimen
        return next
      }
      const next = { ...state }
      delete next[action.cell]
      return next
    },
  )

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerCell, setPickerCell] = useState<{ row: number; col: number } | null>(null)
  const [search, setSearch] = useState('')
  const [isFlat, setIsFlat] = useState(false)
  const tilt = sceneTilt(perspective, gridRows, CELL_WIDTH_REM * PX_PER_REM, isFlat)

  // Roving tabindex: track which cell currently owns the tab stop
  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 })
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map())

  function handleCellKeyDown(e: React.KeyboardEvent, row: number, col: number) {
    const direction = ARROW_DIRECTIONS[e.key]
    if (!direction) return
    e.preventDefault()
    const next = moveHexCell({ row, col }, direction, gridRows, gridCols)
    setActiveCell(next)
    cellRefs.current.get(`${next.row},${next.col}`)?.focus()
  }

  const placedIds = new Set(Object.values(optimisticGrid).map((s) => s.id))
  const filtered = availableSpecimens.filter((s) => {
    if (placedIds.has(s.id)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.commonName.toLowerCase().includes(q) ||
      s.scientificName.toLowerCase().includes(q) ||
      (s.accessionNumber ?? '').toLowerCase().includes(q)
    )
  })

  function openPicker(row: number, col: number) {
    setPickerCell({ row, col })
    setSearch('')
    setPickerOpen(true)
  }

  const handlePlace = useCallback(
    (specimen: AvailableSpecimen) => {
      if (!pickerCell) return
      const { row, col } = pickerCell
      const cell = `${row},${col}`
      const optimisticSpecimen: PlacedSpecimen = { ...specimen, gridCell: cell }
      setPickerOpen(false)
      startTransition(async () => {
        dispatch({ type: 'place', cell, specimen: optimisticSpecimen })
        await placeSpecimen(orgSlug, sceneId, specimen.id, row, col)
      })
    },
    [pickerCell, orgSlug, sceneId, dispatch],
  )

  function handleRemove(specimen: PlacedSpecimen) {
    const cell = specimen.gridCell
    startTransition(async () => {
      dispatch({ type: 'remove', cell })
      await removeSpecimenFromCell(orgSlug, sceneId, specimen.id)
    })
  }

  return (
    <>
      <RotatePrompt />
      {perspective === 'BED' && (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={isFlat}
            onClick={() => setIsFlat((v) => !v)}
          >
            Flat view
          </Button>
        </div>
      )}
      <div className="overflow-x-auto pb-4">
        <HexGrid
          role="grid"
          className="mx-auto"
          aria-label="Specimen placement grid"
          aria-rowcount={gridRows}
          aria-colcount={gridCols}
          rows={gridRows}
          cols={gridCols}
          cellWidth={`${CELL_WIDTH_REM}rem`}
          tiltDeg={tilt}
          rowProps={(row) => ({ role: 'row', 'aria-rowindex': row + 1 })}
          renderCell={(row, col, style) => {
            const cell = `${row},${col}`
            const placed = optimisticGrid[cell]
            const isActive = activeCell.row === row && activeCell.col === col
            const setRef = (el: HTMLElement | null) => {
              if (el) cellRefs.current.set(cell, el)
              else cellRefs.current.delete(cell)
            }

            return placed ? (
              <FilledCell
                key={cell}
                row={row}
                col={col}
                style={style}
                specimen={placed}
                isActive={isActive}
                onRemove={() => handleRemove(placed)}
                onFocus={() => setActiveCell({ row, col })}
                onKeyDown={(e) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault()
                    handleRemove(placed)
                    return
                  }
                  handleCellKeyDown(e, row, col)
                }}
                ref={setRef}
              />
            ) : (
              <EmptyCell
                key={cell}
                row={row}
                col={col}
                style={style}
                isActive={isActive}
                onClick={() => openPicker(row, col)}
                onFocus={() => setActiveCell({ row, col })}
                onKeyDown={(e) => handleCellKeyDown(e, row, col)}
                ref={setRef}
              />
            )
          }}
        />
      </div>

      {/* Specimen picker sheet */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Place specimen</SheetTitle>
            <SheetDescription>
              {pickerCell
                ? `Row ${pickerCell.row + 1}, Column ${pickerCell.col + 1}`
                : ''}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search specimens…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
                aria-label="Search available specimens"
              />
            </div>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search ? 'No matching specimens.' : 'No specimens available to place.'}
              </p>
            ) : (
              <ul role="list" className="divide-y rounded-xl border bg-card overflow-hidden">
                {filtered.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => handlePlace(s)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <SpecimenImage imageUrl={s.thumbnailUrl} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{s.commonName}</p>
                        <ScientificName className="text-xs text-muted-foreground">
                          {s.scientificName}
                        </ScientificName>
                        {s.accessionNumber && (
                          <p className="text-xs text-muted-foreground">#{s.accessionNumber}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
