'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createLocation, deleteLocation, updateLocation } from '@/lib/actions/location'
import { flattenTree, MAX_LOCATION_NAME, withinIds } from '@/lib/locations'

export interface ManagedLocation {
  id: string
  name: string
  parentId: string | null
  scenes: number
  plants: number
}

interface LocationsManagerProps {
  orgSlug: string
  locations: ManagedLocation[]
  canEdit: boolean
}

/** The places in a garden as an indented tree: add, rename, move inside another, remove. */
export function LocationsManager({ orgSlug, locations, canEdit }: LocationsManagerProps) {
  const rows = flattenTree(locations)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium">Locations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Where things are, place within place: a glasshouse, its zones, the beds in them.
          </p>
        </div>
        {canEdit ? (
          <LocationDialog orgSlug={orgSlug} locations={locations} />
        ) : (
          <UnavailableAction reason="Your role can’t add places." className={buttonVariants({ size: 'sm' })}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add place
          </UnavailableAction>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No places yet." hint={canEdit ? 'Use Add place to add the first one, e.g. a glasshouse.' : null} />
      ) : (
        <ul role="list" className="overflow-hidden rounded-xl border bg-card">
          {rows.map((l) => (
            <li key={l.id} className="flex items-center gap-2 border-b py-2.5 pr-2 last:border-0" style={{ paddingLeft: `${1 + l.depth * 1.25}rem` }}>
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[l.scenes > 0 && `${l.scenes} scene${l.scenes === 1 ? '' : 's'}`, l.plants > 0 && `${l.plants} plant${l.plants === 1 ? '' : 's'}`]
                    .filter(Boolean)
                    .join(' · ') || 'Nothing here directly'}
                </p>
              </div>
              {canEdit ? (
                <>
                  <LocationDialog orgSlug={orgSlug} locations={locations} editing={l} />
                  <DeleteLocationDialog orgSlug={orgSlug} location={l} parentName={locations.find((p) => p.id === l.parentId)?.name ?? null} />
                </>
              ) : (
                <>
                  <UnavailableAction reason="Your role can’t change places." label={`Edit ${l.name}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </UnavailableAction>
                  <UnavailableAction
                    reason="Your role can’t remove places."
                    label={`Remove ${l.name}`}
                    className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'text-destructive' })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </UnavailableAction>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Add a place, or (with `editing`) rename and move one */
function LocationDialog({ orgSlug, locations, editing }: { orgSlug: string; locations: ManagedLocation[]; editing?: ManagedLocation }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(editing?.name ?? '')
  const [parentId, setParentId] = useState(editing?.parentId ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // A place can't go inside itself or anything within it
  const excluded = editing ? new Set(withinIds(locations, editing.id)) : new Set<string>()
  const options = flattenTree(locations).filter((l) => !excluded.has(l.id))

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName(editing?.name ?? '')
      setParentId(editing?.parentId ?? '')
      setError(null)
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = editing
        ? await updateLocation(orgSlug, editing.id, name, parentId || null)
        : await createLocation(orgSlug, name, parentId || null)
      if (!result.success) {
        setError(result.error ?? 'Something went wrong.')
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {editing ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" aria-label={`Edit ${editing.name}`} />}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add place
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add place'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Rename it, or move it inside another place. Everything in it moves too.' : 'A glasshouse, a zone, a bed: anywhere plants are.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location-name">Name</Label>
            <Input
              id="location-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_LOCATION_NAME}
              placeholder="e.g. Princess of Wales Conservatory"
              disabled={isPending}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-parent">Inside</Label>
            <NativeSelect id="location-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} disabled={isPending} className="w-full">
              <NativeSelectOption value="">Nowhere (a top-level place)</NativeSelectOption>
              {options.map((l) => (
                <NativeSelectOption key={l.id} value={l.id}>
                  {`${'— '.repeat(l.depth)}${l.name}`}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || name.trim() === ''}>
              {isPending ? 'Saving…' : editing ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteLocationDialog({ orgSlug, location, parentName }: { orgSlug: string; location: ManagedLocation; parentName: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function remove() {
    startTransition(async () => {
      const result = await deleteLocation(orgSlug, location.id)
      if (!result.success) {
        setError(result.error ?? 'Something went wrong.')
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null) }}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" aria-label={`Remove ${location.name}`} className="text-destructive hover:text-destructive" />}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {location.name}?</DialogTitle>
          <DialogDescription>
            Nothing in it is deleted: its places, scenes and plants move up to {parentName ? `“${parentName}”` : 'no place'}.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={remove} disabled={isPending}>
            {isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
