'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { setScenePerspective } from '@/lib/actions/scene'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MAX_GRID, MIN_GRID, type GridSide } from '@/lib/scene-grid'
import type { ScenePerspective } from '@/lib/scene-perspective'

interface GridSizeControlsProps {
  orgSlug: string
  sceneId: string
  rows: number
  cols: number
  perspective: ScenePerspective
  /** Applied on screen straight away; the editor saves clicks in batches. */
  onResize: (side: GridSide, delta: 1 | -1) => void
  resizeError: string | null
}

const SIDE_LABELS: Record<GridSide, string> = { top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' }

/**
 * Grid shape: perspective, and a row or column added on a chosen side or
 * removed from it if it's empty.
 */
export function GridSizeControls({
  orgSlug,
  sceneId,
  rows,
  cols,
  perspective,
  onResize,
  resizeError,
}: GridSizeControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rowSide, setRowSide] = useState<GridSide>('bottom')
  const [colSide, setColSide] = useState<GridSide>('right')
  const [view, setView] = useState<string>(perspective)

  function changePerspective(value: string) {
    setView(value)
    setError(null)
    startTransition(async () => {
      const result = await setScenePerspective(orgSlug, sceneId, value)
      if (result.success) router.refresh()
      else {
        setView(perspective)
        setError(result.error ?? 'Could not change the perspective.')
      }
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
        <span className="w-20 text-sm text-muted-foreground">{label}</span>
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
            onClick={() => onResize(side, -1)}
            disabled={value <= MIN_GRID}
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
            onClick={() => onResize(side, 1)}
            disabled={value >= MAX_GRID}
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
        <div className="flex items-center gap-2">
          <label htmlFor="scene-perspective" className="w-20 text-sm text-muted-foreground">
            Perspective
          </label>
          <NativeSelect
            id="scene-perspective"
            value={view}
            onChange={(e) => changePerspective(e.target.value)}
            disabled={isPending}
            className="[&_select]:h-9"
          >
            <NativeSelectOption value="BED">Bed</NativeSelectOption>
            <NativeSelectOption value="WALL">Wall</NativeSelectOption>
          </NativeSelect>
        </div>
        {stepper('Rows', 'row', rows, ['top', 'bottom'], rowSide, setRowSide)}
        {stepper('Columns', 'column', cols, ['left', 'right'], colSide, setColSide)}
      </div>
      {(resizeError ?? error) && (
        <p className="text-sm text-destructive" role="alert">
          {resizeError ?? error}
        </p>
      )}
    </div>
  )
}
