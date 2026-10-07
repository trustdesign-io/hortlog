'use client'

import { useOptimistic, useTransition, useState, useCallback } from 'react'
import { placeSpecimen, removeSpecimenFromCell } from '@/lib/actions/view'
import { ScientificName } from '@/components/ui/scientific-name'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Search, X, Plus } from 'lucide-react'

interface PlacedSpecimen {
  id: string
  gridCell: string
  accessionNumber: string | null
  commonName: string
  scientificName: string
}

interface AvailableSpecimen {
  id: string
  accessionNumber: string | null
  commonName: string
  scientificName: string
}

type GridState = Record<string, PlacedSpecimen>

type OptimisticAction =
  | { type: 'place'; cell: string; specimen: PlacedSpecimen }
  | { type: 'remove'; cell: string }

interface GridEditorProps {
  orgSlug: string
  viewId: string
  gridRows: number
  gridCols: number
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
  viewId,
  gridRows,
  gridCols,
  placedSpecimens,
  availableSpecimens,
}: GridEditorProps) {
  const [, startTransition] = useTransition()
  const [optimisticGrid, dispatch] = useOptimistic<GridState, OptimisticAction>(
    buildInitialGrid(placedSpecimens),
    (state, action) => {
      if (action.type === 'place') {
        // Remove specimen from any cell it was in before
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

  // Derive which IDs are currently optimistically placed to filter the picker
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
      const optimisticSpecimen: PlacedSpecimen = {
        ...specimen,
        gridCell: cell,
      }
      setPickerOpen(false)
      startTransition(async () => {
        dispatch({ type: 'place', cell, specimen: optimisticSpecimen })
        await placeSpecimen(orgSlug, viewId, specimen.id, row, col)
      })
    },
    [pickerCell, orgSlug, viewId, dispatch],
  )

  function handleRemove(specimen: PlacedSpecimen) {
    const cell = specimen.gridCell
    startTransition(async () => {
      dispatch({ type: 'remove', cell })
      await removeSpecimenFromCell(orgSlug, viewId, specimen.id)
    })
  }

  return (
    <>
      <div
        className="overflow-x-auto pb-4"
        role="grid"
        aria-label="Specimen placement grid"
        aria-rowcount={gridRows}
        aria-colcount={gridCols}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, minmax(100px, 1fr))`,
            gap: '8px',
            minWidth: `${gridCols * 108}px`,
          }}
        >
          {Array.from({ length: gridRows }, (_, row) =>
            Array.from({ length: gridCols }, (_, col) => {
              const cell = `${row},${col}`
              const placed = optimisticGrid[cell]
              return placed ? (
                <FilledCell
                  key={cell}
                  row={row}
                  col={col}
                  specimen={placed}
                  onRemove={() => handleRemove(placed)}
                />
              ) : (
                <EmptyCell
                  key={cell}
                  row={row}
                  col={col}
                  onClick={() => openPicker(row, col)}
                />
              )
            }),
          )}
        </div>
      </div>

      {/* Specimen picker sheet */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Place specimen</SheetTitle>
            <SheetDescription>
              {pickerCell
                ? `Row ${pickerCell.row + 1}, Column ${pickerCell.col + 1}`
                : ''}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
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
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
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

function EmptyCell({
  row,
  col,
  onClick,
}: {
  row: number
  col: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[90px] w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Empty cell at row ${row + 1}, column ${col + 1}. Click to place a specimen.`}
      role="gridcell"
      aria-rowindex={row + 1}
      aria-colindex={col + 1}
    >
      <Plus className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}

function FilledCell({
  row,
  col,
  specimen,
  onRemove,
}: {
  row: number
  col: number
  specimen: PlacedSpecimen
  onRemove: () => void
}) {
  return (
    <div
      className="group relative flex min-h-[90px] flex-col rounded-lg p-2"
      style={{
        backgroundColor: 'color-mix(in srgb, #DCE5D3 80%, transparent)',
      }}
      role="gridcell"
      aria-rowindex={row + 1}
      aria-colindex={col + 1}
      aria-label={`${specimen.commonName} at row ${row + 1}, column ${col + 1}`}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/70 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring group-hover:opacity-100"
        aria-label={`Remove ${specimen.commonName} from this cell`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
      <div className="mt-3 min-w-0 flex-1">
        <p className="truncate text-xs font-medium leading-tight">{specimen.commonName}</p>
        <ScientificName className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
          {specimen.scientificName}
        </ScientificName>
        {specimen.accessionNumber && (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            #{specimen.accessionNumber}
          </p>
        )}
      </div>
    </div>
  )
}
