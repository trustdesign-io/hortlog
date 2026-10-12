'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { resizeSceneGrid } from '@/lib/actions/scene'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MAX_GRID, MIN_GRID, type GridSide } from '@/lib/scene-grid'

interface GridSizeControlsProps {
  orgSlug: string
  sceneId: string
  rows: number
  cols: number
}

const SIDE_LABELS: Record<GridSide, string> = { top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' }

/** Add a row or column on a chosen side, or remove that side's row or column if it's empty. */
export function GridSizeControls({ orgSlug, sceneId, rows, cols }: GridSizeControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rowSide, setRowSide] = useState<GridSide>('bottom')
  const [colSide, setColSide] = useState<GridSide>('right')

  function change(side: GridSide, delta: 1 | -1) {
    setError(null)
    startTransition(async () => {
      const result = await resizeSceneGrid(orgSlug, sceneId, side, delta)
      if (result.success) router.refresh()
      else setError(result.error ?? 'Could not resize the grid.')
    })
  }

  const stepper = (
    label: string,
    noun: 'row' | 'column',
    value: number,
    sides: [GridSide, GridSide],
    side: GridSide,
    setSide: (side: GridSide) => void,
  ) => {
    const where = side === 'top' || side === 'bottom' ? `at the ${side}` : `on the ${side}`
    return (
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
        <span className="w-16 text-sm text-muted-foreground">{label}</span>
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[side]}
          onValueChange={(next: string[]) => {
            const picked = next[0] as GridSide | undefined
            if (picked) setSide(picked)
          }}
          aria-label={`Change ${label.toLowerCase()} at`}
        >
          {sides.map((s) => (
            <ToggleGroupItem key={s} value={s} className="min-h-9 px-3">
              {SIDE_LABELS[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => change(side, -1)}
            disabled={isPending || value <= MIN_GRID}
            aria-label={`Remove the ${noun} ${where}`}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">
            {value}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => change(side, 1)}
            disabled={isPending || value >= MAX_GRID}
            aria-label={`Add a ${noun} ${where}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        {stepper('Rows', 'row', rows, ['top', 'bottom'], rowSide, setRowSide)}
        {stepper('Columns', 'column', cols, ['left', 'right'], colSide, setColSide)}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
