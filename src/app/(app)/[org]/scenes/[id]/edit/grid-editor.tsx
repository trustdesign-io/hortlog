'use client'

import { useOptimistic, useTransition, useState, useCallback, useRef, useEffect } from 'react'
import { placeSpecimen, removeSpecimenFromCell, resizeSceneGrid, setHexSplit } from '@/lib/actions/scene'
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
import { sceneCellScale, sceneTilt, type ScenePerspective } from '@/lib/scene-perspective'
import {
  cellKey,
  cellLabel,
  gridResizeError,
  hexOf,
  planGridOps,
  type GridOp,
  type GridShape,
  type GridSide,
} from '@/lib/scene-grid'
import { Button } from '@/components/ui/button'
import { RotatePrompt } from './rotate-prompt'
import { EmptyCell, FilledCell, SplitCell, type PlacedSpecimen } from './grid-cells'
import { HexSheet } from './hex-sheet'
import { GridSizeControls } from './grid-size-controls'

const CELL_WIDTH_REM = 7.5
const PX_PER_REM = 16
/** Clicks on the resize buttons within this long are saved together. */
const RESIZE_SAVE_DELAY_MS = 700

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

/** Grid as changed locally by resize clicks that haven't come back from the server yet. */
interface LocalLayout {
  shape: GridShape
  grid: GridState
  splitCells: string[]
}

type OptimisticAction =
  | { type: 'place'; cell: string; specimen: PlacedSpecimen }
  | { type: 'remove'; cell: string }
  | { type: 'move'; from: string; to: string }

interface GridEditorProps {
  orgSlug: string
  sceneId: string
  gridRows: number
  gridCols: number
  rowShift: number
  /** Hexes split into seven smaller cells */
  splitCells: string[]
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
  rowShift,
  splitCells,
  perspective,
  placedSpecimens,
  availableSpecimens,
}: GridEditorProps) {
  const [, startTransition] = useTransition()
  const [layout, setLayout] = useState<LocalLayout | null>(null)
  const [resizeError, setResizeError] = useState<string | null>(null)
  const queuedOps = useRef<GridOp[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)

  const shape: GridShape = layout?.shape ?? { rows: gridRows, cols: gridCols, rowShift }
  const { rows, cols } = shape
  const [optimisticGrid, dispatch] = useOptimistic<GridState, OptimisticAction>(
    layout?.grid ?? buildInitialGrid(placedSpecimens),
    (state, action) => {
      if (action.type === 'place') {
        const next: GridState = {}
        for (const [key, val] of Object.entries(state)) {
          if (val.id !== action.specimen.id) next[key] = val
        }
        next[action.cell] = action.specimen
        return next
      }
      if (action.type === 'move') {
        const next = { ...state }
        const specimen = next[action.from]
        if (!specimen) return state
        delete next[action.from]
        next[action.to] = { ...specimen, gridCell: action.to }
        return next
      }
      const next = { ...state }
      delete next[action.cell]
      return next
    },
  )
  const [optimisticSplits, setSplitOptimistic] = useOptimistic<string[], { hex: string; split: boolean }>(
    layout?.splitCells ?? splitCells,
    (state, { hex, split }) => (split ? [...state.filter((c) => c !== hex), hex] : state.filter((c) => c !== hex)),
  )
  const splitSet = new Set(optimisticSplits)
  const [hexSheet, setHexSheet] = useState<{ row: number; col: number } | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerCell, setPickerCell] = useState<{ row: number; col: number; sub: number | null } | null>(null)
  const [search, setSearch] = useState('')
  const tilt = sceneTilt(perspective, rows, CELL_WIDTH_REM * PX_PER_REM)
  const cellWidthRem = CELL_WIDTH_REM * sceneCellScale(rows, tilt)

  // Roving tabindex: track which cell currently owns the tab stop
  const [focusCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 })
  const activeCell = { row: Math.min(focusCell.row, rows - 1), col: Math.min(focusCell.col, cols - 1) }

  /** Sends queued resize clicks as one save; resolves once nothing is queued or saving. */
  const savePending = useCallback(async (): Promise<void> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    while (inFlight.current || queuedOps.current.length > 0) {
      if (inFlight.current) {
        await inFlight.current
        continue
      }
      const ops = queuedOps.current
      queuedOps.current = []
      inFlight.current = (async () => {
        const result = await resizeSceneGrid(orgSlug, sceneId, ops)
        if (!result.success) {
          // Nothing later can apply on top of a failed change; show the saved grid again.
          queuedOps.current = []
          setLayout(null)
          setResizeError(result.error ?? 'Could not resize the grid.')
        }
      })()
      await inFlight.current
      inFlight.current = null
    }
  }, [orgSlug, sceneId])

  /** The saved grid has arrived as props; hand back to them unless more clicks are waiting. */
  function releaseLayout() {
    if (queuedOps.current.length === 0 && !saveTimer.current && !inFlight.current) setLayout(null)
  }

  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      startTransition(async () => {
        await savePending()
        releaseLayout()
      })
    }, RESIZE_SAVE_DELAY_MS)
  }

  // Save anything still queued if the editor is left before the delay runs out.
  useEffect(() => () => void savePending(), [savePending])

  function handleResize(side: GridSide, delta: 1 | -1) {
    const plan = planGridOps(shape, [{ side, delta }], Object.keys(optimisticGrid))
    if (!plan.ok) {
      setResizeError(gridResizeError(plan))
      return
    }
    setResizeError(null)
    const grid: GridState = {}
    for (const [cell, specimen] of Object.entries(optimisticGrid)) {
      const moved = plan.moveCell(cell)
      if (moved) grid[moved] = { ...specimen, gridCell: moved }
    }
    const splits = optimisticSplits.map(plan.moveCell).filter((c): c is string => c !== null)
    setLayout({ shape: plan.shape, grid, splitCells: splits })
    queuedOps.current.push({ side, delta })
    scheduleSave()
  }

  const cellRefs = useRef<Map<string, HTMLElement>>(new Map())

  function handleCellKeyDown(e: React.KeyboardEvent, row: number, col: number) {
    const direction = ARROW_DIRECTIONS[e.key]
    if (!direction) return
    e.preventDefault()
    const next = moveHexCell({ row, col }, direction, rows, cols)
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

  function openPicker(row: number, col: number, sub: number | null = null) {
    setPickerCell({ row, col, sub })
    setSearch('')
    setPickerOpen(true)
  }

  const handlePlace = useCallback(
    (specimen: AvailableSpecimen) => {
      if (!pickerCell) return
      const { row, col, sub } = pickerCell
      const cell = cellKey(row, col, sub)
      const optimisticSpecimen: PlacedSpecimen = { ...specimen, gridCell: cell }
      setPickerOpen(false)
      // Back to the enlarged hex to carry on filling its small cells
      if (sub !== null) setHexSheet({ row, col })
      startTransition(async () => {
        dispatch({ type: 'place', cell, specimen: optimisticSpecimen })
        await savePending()
        const result = await placeSpecimen(orgSlug, sceneId, specimen.id, row, col, sub)
        if (!result.success) setResizeError(result.error ?? 'Could not place the plant.')
        releaseLayout()
      })
    },
    [pickerCell, orgSlug, sceneId, dispatch, savePending],
  )

  function handleSplit(row: number, col: number, split: boolean) {
    const hex = cellKey(row, col)
    const whole = optimisticGrid[hex]
    const inSubs = Object.keys(optimisticGrid).filter((c) => c !== hex && hexOf(c) === hex)
    if (!split && inSubs.length > 1) return
    setResizeError(null)
    if (split) setHexSheet({ row, col })
    startTransition(async () => {
      setSplitOptimistic({ hex, split })
      if (split && whole) dispatch({ type: 'move', from: hex, to: cellKey(row, col, 0) })
      if (!split && inSubs.length === 1) dispatch({ type: 'move', from: inSubs[0], to: hex })
      await savePending()
      const result = await setHexSplit(orgSlug, sceneId, row, col, split)
      if (!result.success) setResizeError(result.error ?? 'Could not change the cell.')
      releaseLayout()
    })
    if (!split) setHexSheet(null)
  }

  function handleRemove(specimen: PlacedSpecimen) {
    const cell = specimen.gridCell
    startTransition(async () => {
      dispatch({ type: 'remove', cell })
      await savePending()
      await removeSpecimenFromCell(orgSlug, sceneId, specimen.id)
      releaseLayout()
    })
  }

  return (
    <>
      <RotatePrompt />
      <div className="mb-4">
        <GridSizeControls
          orgSlug={orgSlug}
          sceneId={sceneId}
          rows={rows}
          cols={cols}
          perspective={perspective}
          onResize={handleResize}
          resizeError={resizeError}
        />
      </div>
      <div className="overflow-x-auto pb-4">
        <HexGrid
          role="grid"
          className="mx-auto"
          aria-label="Specimen placement grid"
          aria-rowcount={rows}
          aria-colcount={cols}
          rows={rows}
          cols={cols}
          cellWidth={`${cellWidthRem}rem`}
          tiltDeg={tilt}
          rowShift={shape.rowShift}
          rowProps={(row) => ({ role: 'row', 'aria-rowindex': row + 1 })}
          renderCell={(row, col, style) => {
            const cell = `${row},${col}`
            const placed = optimisticGrid[cell]
            const isActive = activeCell.row === row && activeCell.col === col
            const setRef = (el: HTMLElement | null) => {
              if (el) cellRefs.current.set(cell, el)
              else cellRefs.current.delete(cell)
            }

            if (splitSet.has(cell)) {
              return (
                <SplitCell
                  key={cell}
                  row={row}
                  col={col}
                  style={style}
                  plants={optimisticGrid}
                  isActive={isActive}
                  onOpen={() => setHexSheet({ row, col })}
                  onFocus={() => setActiveCell({ row, col })}
                  onKeyDown={(e) => handleCellKeyDown(e, row, col)}
                  ref={setRef}
                />
              )
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
                onOpen={() => setHexSheet({ row, col })}
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
              {pickerCell ? cellLabel(cellKey(pickerCell.row, pickerCell.col, pickerCell.sub))?.replace(/^r/, 'R') : ''}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            {pickerCell && pickerCell.sub === null && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPickerOpen(false)
                  handleSplit(pickerCell.row, pickerCell.col, true)
                }}
              >
                Split into 7 smaller cells
              </Button>
            )}
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

      <HexSheet
        hex={hexSheet}
        isSplit={hexSheet !== null && splitSet.has(cellKey(hexSheet.row, hexSheet.col))}
        plants={
          hexSheet
            ? Object.fromEntries(
                Object.entries(optimisticGrid).filter(([c]) => hexOf(c) === cellKey(hexSheet.row, hexSheet.col)),
              )
            : {}
        }
        onOpenChange={(open) => {
          if (!open) setHexSheet(null)
        }}
        onSplit={(split) => hexSheet && handleSplit(hexSheet.row, hexSheet.col, split)}
        onPick={(sub) => {
          if (!hexSheet) return
          setHexSheet(null)
          openPicker(hexSheet.row, hexSheet.col, sub)
        }}
        onRemove={(specimen) => handleRemove(specimen)}
      />
    </>
  )
}
