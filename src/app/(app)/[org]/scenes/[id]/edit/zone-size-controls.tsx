'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { resizeZone } from '@/lib/actions/zone'
import { Button } from '@/components/ui/button'
import { MAX_GRID, MIN_GRID, type GridEdge } from '@/lib/scene-grid'

interface ZoneSizeControlsProps {
  orgSlug: string
  zoneId: string
  rows: number
  cols: number
}

export function ZoneSizeControls({ orgSlug, zoneId, rows, cols }: ZoneSizeControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function change(edge: GridEdge, delta: 1 | -1) {
    setError(null)
    startTransition(async () => {
      const result = await resizeZone(orgSlug, zoneId, edge, delta)
      if (result.success) router.refresh()
      else setError(result.error ?? 'Could not resize the zone.')
    })
  }

  const stepper = (edge: GridEdge, label: string, value: number) => (
    <div className="flex items-center gap-1.5" role="group" aria-label={label}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => change(edge, -1)}
        disabled={isPending || value <= MIN_GRID}
        aria-label={`Remove last ${edge === 'row' ? 'row' : 'column'}`}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <span className="w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => change(edge, 1)}
        disabled={isPending || value >= MAX_GRID}
        aria-label={`Add a ${edge === 'row' ? 'row at the bottom' : 'column on the right'}`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {stepper('row', 'Rows', rows)}
        {stepper('col', 'Columns', cols)}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
