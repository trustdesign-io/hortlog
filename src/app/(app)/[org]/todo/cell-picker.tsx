'use client'

import { Check } from 'lucide-react'
import { HexGrid, HexOutline, HexPlantLabel } from '@/components/hex-grid'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { sceneTilt, type ScenePerspective } from '@/lib/scene-perspective'
import { cn } from '@/lib/utils'

const CELL_WIDTH_REM = 5
const PX_PER_REM = 16

export interface PickerScene {
  id: string
  name: string
  gridRows: number
  gridCols: number
  rowShift: number
  perspective: ScenePerspective
  plants: Array<{ id: string; cell: string; scientificName: string; thumbnailUrl: string | null }>
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
          cellWidth={`${CELL_WIDTH_REM}rem`}
          tiltDeg={sceneTilt(scene.perspective, scene.gridRows, CELL_WIDTH_REM * PX_PER_REM)}
          rowShift={scene.rowShift}
          renderCell={(row, col, style) => {
            const cell = `${row},${col}`
            const plant = byCell.get(cell)
            if (!plant) {
              return (
                <div key={cell} className="hex-cell" style={style} aria-hidden="true">
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
                aria-label={plant.scientificName}
                className="hex-cell"
                style={style}
              >
                <span
                  className={cn(
                    'hex-shape block bg-muted transition-opacity',
                    selected.length > 0 && !isOn && 'opacity-40',
                  )}
                >
                  <SpecimenImage imageUrl={plant.thumbnailUrl} alt="" fill sizes="80px" className="object-cover" />
                  {isOn && (
                    <span className="absolute inset-0 flex items-start justify-center bg-primary/35 pt-[16%]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </span>
                  )}
                  <HexPlantLabel scientificName={plant.scientificName} />
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
