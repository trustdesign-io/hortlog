'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { createZone, updateZone, deleteZone, moveZone } from '@/lib/actions/zone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ZONE_TYPE_LABELS, ZONE_TYPE_DEFAULT_NAME, ZONE_TYPES } from '@/lib/zone-types'
import { GridEditor } from './grid-editor'
import { ZoneSizeControls } from './zone-size-controls'
import { PerspectivePreview } from './perspective-preview'
import { RotatePrompt } from './rotate-prompt'
import type { ZoneType } from '@prisma/client'

interface PlacedSpecimen {
  id: string
  gridCell: string
  accessionNumber: string | null
  commonName: string
  scientificName: string
  thumbnailUrl: string | null
}

interface AvailableSpecimen {
  id: string
  accessionNumber: string | null
  commonName: string
  scientificName: string
  thumbnailUrl: string | null
}

export interface ZoneData {
  id: string
  name: string
  type: ZoneType
  rows: number
  cols: number
  position: number
  specimens: PlacedSpecimen[]
}

interface ZoneEditorProps {
  orgSlug: string
  sceneId: string
  zones: ZoneData[]
  availableSpecimens: AvailableSpecimen[]
}

export function ZoneEditor({ orgSlug, sceneId, zones, availableSpecimens }: ZoneEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeZoneId, setActiveZoneId] = useState<string>(zones[0]?.id ?? '')
  const [showPerspective, setShowPerspective] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const activeZone = zones.find((z) => z.id === activeZoneId) ?? zones[0]

  function handleAddZone() {
    setAddError(null)
    startTransition(async () => {
      const type: ZoneType = 'BED'
      const name = ZONE_TYPE_DEFAULT_NAME[type]
      const result = await createZone(orgSlug, sceneId, name, type)
      if (result.success) {
        if (result.data) setActiveZoneId(result.data.id)
        router.refresh()
      } else {
        setAddError(result.error ?? 'Failed to add zone.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <RotatePrompt />

      {/* Zone tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => setActiveZoneId(zone.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              zone.id === activeZoneId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
            aria-pressed={zone.id === activeZoneId}
          >
            {zone.name}
            <span className="ml-1.5 text-[10px] opacity-70">{ZONE_TYPE_LABELS[zone.type]}</span>
          </button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddZone}
          disabled={isPending}
          aria-label="Add a zone"
        >
          <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Add zone
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPerspective((v) => !v)}
          aria-pressed={showPerspective}
        >
          {showPerspective ? (
            <EyeOff className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          ) : (
            <Eye className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          )}
          {showPerspective ? 'Hide perspective' : 'Perspective'}
        </Button>
      </div>

      {addError && (
        <p className="text-sm text-destructive" role="alert">{addError}</p>
      )}

      {/* Perspective preview */}
      {showPerspective && (
        <PerspectivePreview
          zones={zones.map((z) => ({
            id: z.id,
            name: z.name,
            type: z.type,
            rows: z.rows,
            cols: z.cols,
            position: z.position,
            specimens: z.specimens,
          }))}
        />
      )}

      {/* Active zone management */}
      {activeZone && (
        <ZoneManagementPanel
          key={activeZone.id}
          orgSlug={orgSlug}
          zone={activeZone}
          isFirst={zones[0]?.id === activeZone.id}
          isLast={zones[zones.length - 1]?.id === activeZone.id}
          isOnly={zones.length === 1}
          onDeleted={() => setActiveZoneId(zones.find((z) => z.id !== activeZone.id)?.id ?? '')}
        />
      )}

      {/* Zone grid editor */}
      {activeZone && (
        <>
          <ZoneSizeControls
            orgSlug={orgSlug}
            zoneId={activeZone.id}
            rows={activeZone.rows}
            cols={activeZone.cols}
          />
          <GridEditor
            orgSlug={orgSlug}
            sceneId={sceneId}
            zoneId={activeZone.id}
            gridRows={activeZone.rows}
            gridCols={activeZone.cols}
            placedSpecimens={activeZone.specimens}
            availableSpecimens={availableSpecimens}
          />
        </>
      )}
    </div>
  )
}

// ── Zone management panel ─────────────────────────────────────────────────────

interface ZoneManagementPanelProps {
  orgSlug: string
  zone: ZoneData
  isFirst: boolean
  isLast: boolean
  isOnly: boolean
  onDeleted: () => void
}

function ZoneManagementPanel({
  orgSlug,
  zone,
  isFirst,
  isLast,
  isOnly,
  onDeleted,
}: ZoneManagementPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(zone.name)
  const [type, setType] = useState<ZoneType>(zone.type)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updateZone(orgSlug, zone.id, { name, type })
      if (result.success) router.refresh()
      else setError(result.error ?? 'Failed to save.')
    })
  }

  function handleMove(direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await moveZone(orgSlug, zone.id, direction)
      if (result.success) router.refresh()
    })
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    startTransition(async () => {
      const result = await deleteZone(orgSlug, zone.id)
      if (result.success) { onDeleted(); router.refresh() }
      else setError(result.error ?? 'Failed to delete zone.')
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[160px] space-y-1.5">
          <Label htmlFor={`zone-name-${zone.id}`} className="text-xs">Zone name</Label>
          <Input
            id={`zone-name-${zone.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            disabled={isPending}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`zone-type-${zone.id}`} className="text-xs">Type</Label>
          <select
            id={`zone-type-${zone.id}`}
            value={type}
            onChange={(e) => { setType(e.target.value as ZoneType); }}
            onBlur={save}
            disabled={isPending}
            className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ZONE_TYPES.map((t) => (
              <option key={t} value={t}>{ZONE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Position controls */}
        <div className="flex items-center gap-1" role="group" aria-label="Zone order">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => handleMove('up')}
            disabled={isPending || isFirst}
            aria-label="Move zone earlier (closer to front)"
            title="Move up in order"
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => handleMove('down')}
            disabled={isPending || isLast}
            aria-label="Move zone later (further from front)"
            title="Move down in order"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        {/* Delete */}
        <Button
          type="button"
          variant={confirmDelete ? 'destructive' : 'ghost'}
          size="sm"
          onClick={handleDelete}
          disabled={isPending || isOnly}
          title={isOnly ? 'Cannot delete the last zone' : 'Delete this zone'}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          {confirmDelete ? 'Confirm delete' : 'Delete zone'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {confirmDelete && (
        <p className="text-sm text-muted-foreground">
          All plants in this zone will be unplaced. Click confirm to proceed.
          <button type="button" className="ml-2 underline text-foreground" onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
        </p>
      )}
    </div>
  )
}
