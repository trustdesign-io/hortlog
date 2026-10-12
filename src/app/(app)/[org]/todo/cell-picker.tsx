'use client'

import { cn } from '@/lib/utils'

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
        <div
          role="group"
          aria-label={`${scene.name} grid`}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${scene.gridCols}, minmax(3.5rem, 1fr))` }}
        >
          {Array.from({ length: scene.gridRows }, (_, row) =>
            Array.from({ length: scene.gridCols }, (_, col) => {
              const cell = `${row},${col}`
              const plant = byCell.get(cell)
              if (!plant) {
                return <div key={cell} className="h-12 rounded border border-dashed border-border/60" aria-hidden="true" />
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
                  className={cn(
                    'h-12 rounded border px-1 text-[11px] leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isOn
                      ? 'border-primary bg-primary text-primary-foreground'
                      : selected.length === 0
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-border bg-muted/40 text-muted-foreground',
                  )}
                >
                  <span className="line-clamp-2">{plant.name}</span>
                </button>
              )
            }),
          )}
        </div>
      </div>
      {selected.map((c) => (
        <input key={c} type="hidden" name="cell" value={c} readOnly />
      ))}
    </div>
  )
}
