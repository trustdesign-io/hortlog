'use client'

import { Plus, X } from 'lucide-react'
import { HexFocusRing, HexOutline, HexPlantLabel, HexSubCells } from '@/components/hex-grid'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { HEX_HEIGHT_RATIO } from '@/lib/hex-grid'
import { cellKey, SUB_CELL_NAMES, SUB_CELLS } from '@/lib/scene-grid'
import type { PlacedSpecimen } from './grid-cells'

/**
 * Width of the enlarged hex: big enough to tap and read each small cell, and
 * small enough that the whole panel fits a phone screen without scrolling.
 */
const ZOOM_WIDTH = 'min(100%, 20rem, calc((100dvh - 17rem) * 0.866))'

/** Takes a plant off the grid; drawn over its cell in the enlarged hex. */
function RemoveButton({ plant, onRemove }: { plant: PlacedSpecimen; onRemove: (p: PlacedSpecimen) => void }) {
  return (
    <button
      type="button"
      onClick={() => onRemove(plant)}
      aria-label={`Remove ${plant.scientificName} from the grid`}
      className="absolute left-1/2 top-[12%] z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center text-muted-foreground hover:text-destructive focus-visible:outline-none"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-sm">
        <X className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  )
}

interface HexSheetProps {
  hex: { row: number; col: number } | null
  isSplit: boolean
  /** Plants in this hex: one in a whole hex, up to seven when split; by cell key */
  plants: Record<string, PlacedSpecimen>
  onOpenChange: (open: boolean) => void
  onSplit: (split: boolean) => void
  onPick: (sub: number) => void
  onRemove: (specimen: PlacedSpecimen) => void
}

/**
 * One hex, enlarged. A planted hex can be split into seven smaller cells (its
 * plant moves to the centre); a split hex's cells are arranged here, and it
 * can be merged back once it holds one plant or none.
 */
export function HexSheet({ hex, isSplit, plants, onOpenChange, onSplit, onPick, onRemove }: HexSheetProps) {
  const row = hex?.row ?? 0
  const col = hex?.col ?? 0
  const whole = plants[cellKey(row, col)]
  const inSubs = Array.from({ length: SUB_CELLS }, (_, sub) => plants[cellKey(row, col, sub)]).filter(
    (p): p is PlacedSpecimen => Boolean(p),
  )

  return (
    <Sheet open={hex !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isSplit ? 'Split cell' : 'Cell'}</SheetTitle>
          <SheetDescription>
            Row {row + 1}, column {col + 1}
            {isSplit && ' · tap a small cell to place a plant'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="relative mx-auto" style={{ width: ZOOM_WIDTH, aspectRatio: `1 / ${HEX_HEIGHT_RATIO}` }}>
            {isSplit ? (
              <HexSubCells
                renderSub={(sub, style) => {
                  const plant = plants[cellKey(row, col, sub)]
                  const where = SUB_CELL_NAMES[sub]
                  return plant ? (
                    <div key={sub} className="hex-sub bg-muted" style={style} aria-label={`${plant.scientificName}, ${where}`} role="group">
                      <SpecimenImage imageUrl={plant.thumbnailUrl} alt="" fill sizes="110px" className="object-cover" />
                      <HexPlantLabel scientificName={plant.scientificName} />
                      <RemoveButton plant={plant} onRemove={onRemove} />
                    </div>
                  ) : (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => onPick(sub)}
                      className="hex-sub group flex items-center justify-center bg-card text-muted-foreground hover:bg-muted"
                      style={style}
                      aria-label={`Place a plant in the ${where} cell`}
                    >
                      <HexOutline className="text-border group-hover:text-primary/50" />
                      <Plus className="relative h-5 w-5" aria-hidden="true" />
                      <HexFocusRing />
                    </button>
                  )
                }}
              />
            ) : (
              <div className="hex-sub absolute inset-0 bg-muted">
                {whole ? (
                  <>
                    <SpecimenImage imageUrl={whole.thumbnailUrl} alt="" fill sizes="320px" className="object-cover" />
                    <HexPlantLabel scientificName={whole.scientificName} />
                    <RemoveButton plant={whole} onRemove={onRemove} />
                  </>
                ) : (
                  <HexOutline className="text-border" />
                )}
              </div>
            )}
          </div>

          {isSplit ? (
            <div className="space-y-1.5">
              <Button type="button" variant="outline" onClick={() => onSplit(false)} disabled={inSubs.length > 1} className="w-full">
                Merge into one cell
              </Button>
              <p className="text-xs text-muted-foreground">
                {inSubs.length > 1
                  ? 'A whole cell holds one plant. Remove all but one to merge.'
                  : inSubs.length === 1
                    ? 'The plant will fill the whole cell.'
                    : 'The seven small cells become one.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Button type="button" variant="outline" onClick={() => onSplit(true)} className="w-full">
                Split into 7 smaller cells
              </Button>
              <p className="text-xs text-muted-foreground">
                For smaller plants: a centre cell and a ring of six, each a third of the size.
                {whole && ' This plant moves to the centre.'}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
