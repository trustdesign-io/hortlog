'use client'

import { useActionState, useTransition, useState } from 'react'
import { updateSpecimen, deleteSpecimen, removeSpecimenFromView } from '@/lib/actions/specimen'
import { toSlug } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScientificName } from '@/components/ui/scientific-name'
import { Trash2, MapPin, X } from 'lucide-react'
import type { ActionResult } from '@/lib/shared/types'

interface SpecimenData {
  id: string
  slug: string
  accessionNumber: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  viewId: string | null
  gridCell: string | null
  species: { id: string; commonName: string; scientificName: string }
  view: { id: string; name: string } | null
  collectionIds: string[]
}

interface CollectionOption {
  id: string
  name: string
}

interface SpecimenEditFormProps {
  orgSlug: string
  specimen: SpecimenData
  collections: CollectionOption[]
}

function DeleteSpecimenDialog({
  orgSlug,
  specimenId,
  specimenName,
  isPlaced,
}: {
  orgSlug: string
  specimenId: string
  specimenName: string
  isPlaced: boolean
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSpecimen(orgSlug, specimenId)
      if (!result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setError(null)
        setOpen(next)
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" />
        }
      >
        <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Delete specimen
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{specimenName}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently delete this specimen and all its data. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {isPlaced && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            This specimen is currently placed on a view. Deleting it will remove it from the view.
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete specimen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SpecimenEditForm({ orgSlug, specimen, collections }: SpecimenEditFormProps) {
  const boundAction = updateSpecimen.bind(null, orgSlug, specimen.id)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null,
  )
  const [isRemovingFromView, startRemoveTransition] = useTransition()
  const [slug, setSlug] = useState(specimen.slug)
  const [slugEdited, setSlugEdited] = useState(true)
  const [removeViewError, setRemoveViewError] = useState<string | null>(null)

  function handleAccessionChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) setSlug(toSlug(e.target.value))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugEdited(true)
  }

  function handleRemoveFromView() {
    startRemoveTransition(async () => {
      const result = await removeSpecimenFromView(orgSlug, specimen.id)
      if (!result.success) setRemoveViewError(result.error)
    })
  }

  return (
    <div className="space-y-4">
      {/* Grid placement */}
      {specimen.view && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Placed on view</p>
                <p className="text-xs text-muted-foreground">
                  {specimen.view.name}
                  {specimen.gridCell && ` — cell ${specimen.gridCell}`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFromView}
              disabled={isRemovingFromView}
              aria-label="Remove from view"
            >
              <X className="mr-1 h-3 w-3" aria-hidden="true" />
              Remove
            </Button>
          </div>
          {removeViewError && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {removeViewError}
            </p>
          )}
        </div>
      )}

      <form action={formAction} className="space-y-4" aria-busy={isPending}>
        <input type="hidden" name="slug" value={slug} />

        {state !== null && !state.success && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        {state !== null && state.success && !isPending && (
          <p className="text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
            Changes saved.
          </p>
        )}

        {/* Species (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Species</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{specimen.species.commonName}</p>
            <ScientificName className="text-xs text-muted-foreground">
              {specimen.species.scientificName}
            </ScientificName>
            <p className="mt-1 text-xs text-muted-foreground">
              Species cannot be changed after creation.
            </p>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="accessionNumber">Accession number</Label>
              <Input
                id="accessionNumber"
                name="accessionNumber"
                type="text"
                autoComplete="off"
                defaultValue={specimen.accessionNumber ?? ''}
                onChange={handleAccessionChange}
                maxLength={60}
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">
                Slug
                <span className="ml-1 font-normal text-xs text-muted-foreground">
                  (URL identifier)
                </span>
              </Label>
              <Input
                id="slug-display"
                name="slug-display"
                type="text"
                autoComplete="off"
                value={slug}
                onChange={handleSlugChange}
                maxLength={96}
                disabled={isPending}
                aria-describedby="slug-hint"
              />
              <p id="slug-hint" className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. Must be unique within this organisation.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={specimen.notes ?? ''}
                maxLength={2000}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  defaultValue={specimen.latitude ?? ''}
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  defaultValue={specimen.longitude ?? ''}
                  disabled={isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collections */}
        {collections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <fieldset>
                <legend className="sr-only">Assign to collections</legend>
                <div className="flex flex-col gap-3">
                  {collections.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        name="collectionId"
                        value={c.id}
                        defaultChecked={specimen.collectionIds.includes(c.id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                        disabled={isPending}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <DeleteSpecimenDialog
            orgSlug={orgSlug}
            specimenId={specimen.id}
            specimenName={specimen.species.commonName}
            isPlaced={!!specimen.viewId}
          />
        </div>
      </form>

      {/* Slug badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Slug:</span>
        <Badge variant="outline" className="font-mono text-xs">
          {slug}
        </Badge>
      </div>
    </div>
  )
}
