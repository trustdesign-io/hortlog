import { forwardRef, type CSSProperties } from 'react'
import { Plus, X } from 'lucide-react'
import { HexOutline, HexPlantLabel, HexSubCells } from '@/components/hex-grid'
import { cellKey } from '@/lib/scene-grid'
import { SpecimenImage } from '@/components/ui/specimen-image'

export interface PlacedSpecimen {
  id: string
  gridCell: string
  accessionNumber: string | null
  commonName: string
  scientificName: string
  thumbnailUrl: string | null
}

interface CellProps {
  row: number
  col: number
  style: CSSProperties
  isActive: boolean
  onFocus: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

interface EmptyCellProps extends CellProps {
  onClick: () => void
}

export const EmptyCell = forwardRef<HTMLButtonElement, EmptyCellProps>(function EmptyCell(
  { row, col, style, isActive, onClick, onFocus, onKeyDown },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      tabIndex={isActive ? 0 : -1}
      className="hex-cell group text-muted-foreground"
      style={style}
      aria-label={`Empty cell at row ${row + 1}, column ${col + 1}. Press Enter to place a specimen.`}
      role="gridcell"
      aria-rowindex={row + 1}
      aria-colindex={col + 1}
    >
      <span className="hex-shape flex items-center justify-center bg-card group-hover:bg-muted">
        <HexOutline className="text-border group-hover:text-primary/50" />
        <Plus className="relative h-5 w-5" aria-hidden="true" />
      </span>
    </button>
  )
})

interface FilledCellProps extends CellProps {
  specimen: PlacedSpecimen
  onRemove: () => void
  /** Options for this hex, such as splitting it */
  onOpen: () => void
}

export const FilledCell = forwardRef<HTMLDivElement, FilledCellProps>(function FilledCell(
  { row, col, style, specimen, isActive, onRemove, onOpen, onFocus, onKeyDown },
  ref,
) {
  return (
    <div
      ref={ref}
      tabIndex={isActive ? 0 : -1}
      className="hex-cell group"
      style={style}
      role="gridcell"
      aria-rowindex={row + 1}
      aria-colindex={col + 1}
      aria-label={`${specimen.scientificName} at row ${row + 1}, column ${col + 1}. Press Enter for options.`}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen()
          return
        }
        onKeyDown(e)
      }}
      onClick={onOpen}
    >
      <span className="hex-shape block cursor-pointer bg-muted">
        <SpecimenImage
          imageUrl={specimen.thumbnailUrl}
          alt=""
          fill
          sizes="120px"
          className="object-cover"
        />
        <HexPlantLabel scientificName={specimen.scientificName} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="group/remove absolute right-[14%] top-[18%] z-10 flex h-11 w-11 items-center justify-center text-muted-foreground opacity-0 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
          aria-label={`Remove ${specimen.scientificName} from this cell`}
          tabIndex={-1}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 group-focus-visible/remove:ring-2 group-focus-visible/remove:ring-ring">
            <X className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      </span>
    </div>
  )
})

interface SplitCellProps extends CellProps {
  /** Plants in this hex's small cells, by cell key ("row,col:sub") */
  plants: Record<string, PlacedSpecimen>
  onOpen: () => void
}

/** A hex split into seven smaller cells. Opening it shows them large enough to arrange. */
export const SplitCell = forwardRef<HTMLButtonElement, SplitCellProps>(function SplitCell(
  { row, col, style, plants, isActive, onOpen, onFocus, onKeyDown },
  ref,
) {
  const count = Array.from({ length: 7 }, (_, sub) => plants[cellKey(row, col, sub)]).filter(Boolean).length
  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      tabIndex={isActive ? 0 : -1}
      className="hex-cell group"
      style={style}
      role="gridcell"
      aria-rowindex={row + 1}
      aria-colindex={col + 1}
      aria-label={`Split cell at row ${row + 1}, column ${col + 1}, ${count} of 7 small cells planted. Press Enter to arrange.`}
    >
      <span className="hex-shape block bg-card group-hover:bg-muted">
        <HexOutline className="text-border group-hover:text-primary/50" />
        <HexSubCells
          renderSub={(sub, subStyle) => {
            const plant = plants[cellKey(row, col, sub)]
            return (
              <span key={sub} className="hex-sub" style={subStyle}>
                {plant ? (
                  <SpecimenImage imageUrl={plant.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <HexOutline className="text-border" />
                )}
              </span>
            )
          }}
        />
      </span>
    </button>
  )
})
