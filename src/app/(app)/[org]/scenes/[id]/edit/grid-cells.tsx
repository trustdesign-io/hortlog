import { forwardRef } from 'react'
import { Plus, X } from 'lucide-react'
import { HexOutline } from '@/components/hex-grid'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { hexCellStyle } from '@/lib/hex-grid'

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
  isActive: boolean
  onFocus: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

interface EmptyCellProps extends CellProps {
  onClick: () => void
}

export const EmptyCell = forwardRef<HTMLButtonElement, EmptyCellProps>(function EmptyCell(
  { row, col, isActive, onClick, onFocus, onKeyDown },
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
      style={hexCellStyle(row, col)}
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
}

export const FilledCell = forwardRef<HTMLDivElement, FilledCellProps>(function FilledCell(
  { row, col, specimen, isActive, onRemove, onFocus, onKeyDown },
  ref,
) {
  return (
    <div
      ref={ref}
      tabIndex={isActive ? 0 : -1}
      className="hex-cell group"
      style={hexCellStyle(row, col)}
      role="gridcell"
      aria-rowindex={row + 1}
      aria-colindex={col + 1}
      aria-label={`${specimen.commonName} at row ${row + 1}, column ${col + 1}`}
      title={`${specimen.commonName} (${specimen.scientificName})`}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      <span className="hex-shape block bg-muted">
        <SpecimenImage
          imageUrl={specimen.thumbnailUrl}
          alt=""
          fill
          sizes="144px"
          className="object-cover"
        />
        <span className="absolute inset-x-0 bottom-[22%] block truncate bg-black/65 px-4 py-0.5 text-center text-[11px] font-medium leading-tight text-white">
          {specimen.commonName}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-[20%] top-[22%] z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
          aria-label={`Remove ${specimen.commonName} from this cell`}
          tabIndex={-1}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    </div>
  )
})
