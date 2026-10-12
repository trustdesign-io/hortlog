'use client'

import { cn } from '@/lib/utils'
import { ZONE_TYPE_LABELS } from '@/lib/zone-types'
import type { ZoneType } from '@prisma/client'

interface PickerZone {
  id: string
  name: string
  type: ZoneType
  rows: number
  cols: number
  plants: Array<{ id: string; cell: string; name: string }>
}

export interface PickerScene {
  id: string
  name: string
  gridRows: number
  gridCols: number
  plants: Array<{ id: string; cell: string; name: string }>
  zones?: PickerZone[]
}

interface CellPickerProps {
  scene: PickerScene
  selectedZoneId: string | null
  selected: string[]
  onZoneChange: (zoneId: string | null) => void
  onChange: (cells: string[]) => void
  disabled?: boolean
}

export function CellPicker({
  scene,
  selectedZoneId,
  selected,
  onZoneChange,
  onChange,
  disabled,
}: CellPickerProps) {
  const zones = scene.zones ?? []
  const hasZones = zones.length > 1

  const activeZone = hasZones
    ? (zones.find((z) => z.id === selectedZoneId) ?? zones[0])
    : (zones[0] ?? null)

  const rows = activeZone ? activeZone.rows : scene.gridRows
  const cols = activeZone ? activeZone.cols : scene.gridCols
  const plants = activeZone ? activeZone.plants : scene.plants

  const byCell = new Map(plants.map((p) => [p.cell, p]))
  const chosen = new Set(selected)

  function toggle(cell: string) {
    onChange(chosen.has(cell) ? selected.filter((c) => c !== cell) : [...selected, cell])
  }

  function handleZoneChange(zoneId: string) {
    onZoneChange(zoneId)
    onChange([])
  }

  const label = activeZone ? activeZone.name.toLowerCase() : 'scene'
  const summary = selected.length
    ? `${selected.length} of ${plants.length} plants`
    : `Whole ${label}: ${plants.length} plant${plants.length === 1 ? '' : 's'}`

  return (
    <div className="flex flex-col gap-2">
      {hasZones && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground shrink-0">Zone</label>
          <select
            value={activeZone?.id ?? ''}
            onChange={(e) => handleZoneChange(e.target.value)}
            disabled={disabled}
            className="flex-1 h-7 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Select zone"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({ZONE_TYPE_LABELS[z.type]})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span aria-live="polite">{summary}</span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Whole {label}
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          role="group"
          aria-label={`${activeZone ? activeZone.name : scene.name} grid`}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(3.5rem, 1fr))` }}
        >
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
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

      {activeZone && <input type="hidden" name="zoneId" value={activeZone.id} readOnly />}
      {selected.map((c) => (
        <input key={c} type="hidden" name="cell" value={c} readOnly />
      ))}
    </div>
  )
}
