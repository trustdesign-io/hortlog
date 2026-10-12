'use client'

import { HexGrid, HexOutline } from '@/components/hex-grid'
import { hexCellStyle } from '@/lib/hex-grid'
import { cn } from '@/lib/utils'

const CELL_WIDTH = '5rem'

export interface PickerScene {
  id: string
  name: string
  gridRows: number
  gridCols: number
  plants: Array<{ id: string; cell: string; name: string }>
}

interface CellPickerProps {
  scene: PickerScene
  selected: string[]
  onChange: (cells: string[]) => void
  disabled?: boolean
}

/**
 * The scene's grid in miniature. Tap planted cells to narrow the task to them;
 * with none chosen, the task covers the whole scene.
 */
export function CellPicker({ scene, selected, onChange, disabled }: CellPickerProps) {
  const byCell = new Map(scene.plants.map((p) => [p.cell, p]))
  const chosen = new Set(selected)

  function toggle(cell: string) {
    onChange(chosen.has(cell) ? selected.filter((c) => c !== cell) : [...selected, cell])
  }

  const summary = selected.length
    ? `${selected.length} of ${scene.plants.length} plants`
    : `Whole scene: ${scene.plants.length} plant${scene.plants.length === 1 ? '' : 's'}`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span aria-live="polite">{summary}</span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Whole scene
          </button>
        )}
      </div>
      <div className="overflow-x-auto pb-1">
        <HexGrid
          role="group"
          className="mx-auto"
          aria-label={`${scene.name} grid`}
          rows={scene.gridRows}
          cols={scene.gridCols}
          cellWidth={CELL_WIDTH}
          renderCell={(row, col) => {
            const cell = `${row},${col}`
            const plant = byCell.get(cell)
            if (!plant) {
              return (
                <div key={cell} className="hex-cell" style={hexCellStyle(row, col)} aria-hidden="true">
                  <span className="hex-shape block">
                    <HexOutline className="text-border/60" />
                  </span>
                </div>
              )
            }
            const isOn = chosen.has(cell)
            return (
              <button
                key={cell}
                type="button"
                onClick={() => toggle(cell)}
                disabled={disabled}
                aria-pressed={isOn}
                title={plant.name}
                className="hex-cell"
                style={hexCellStyle(row, col)}
              >
                <span
                  className={cn(
                    'hex-shape flex items-center justify-center px-2 text-center text-[11px] leading-tight transition-colors',
                    isOn
                      ? 'bg-primary text-primary-foreground'
                      : selected.length === 0
                        ? 'bg-primary/15'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  <span className="line-clamp-3">{plant.name}</span>
                </span>
              </button>
            )
          }}
        />
      </div>
      {selected.map((c) => (
        <input key={c} type="hidden" name="cell" value={c} readOnly />
      ))}
    </div>
  )
}
