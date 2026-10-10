'use client'

import { useActionState, useState } from 'react'
import { createSpecimen } from '@/lib/actions/specimen'
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
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox'
import { ScientificName } from '@/components/ui/scientific-name'
import type { ActionResult } from '@/lib/shared/types'

interface SpeciesOption {
  id: string
  commonName: string
  scientificName: string
}

interface CollectionOption {
  id: string
  name: string
}

interface AddSpecimenFormProps {
  orgSlug: string
  species: SpeciesOption[]
  collections: CollectionOption[]
}

export function AddSpecimenForm({ orgSlug, species, collections }: AddSpecimenFormProps) {
  const boundAction = createSpecimen.bind(null, orgSlug)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null,
  )
  const [speciesId, setSpeciesId] = useState('')

  return (
    <form action={formAction} className="space-y-4" aria-busy={isPending}>
      {/* Hidden field carries the speciesId into formData */}
      <input type="hidden" name="speciesId" value={speciesId} />

      {state !== null && !state.success && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      {/* Species */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Species</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="species-input">
            Species
            <span className="ml-1 text-destructive" aria-hidden="true">*</span>
          </Label>
          <Combobox
            value={speciesId}
            onValueChange={(v) => setSpeciesId(v ?? '')}
          >
            <ComboboxInput
              id="species-input"
              placeholder="Search by common or scientific name…"
              showTrigger={false}
              showClear={!!speciesId}
              aria-required="true"
              disabled={isPending}
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>No species found.</ComboboxEmpty>
                {species.map((s) => (
                  <ComboboxItem key={s.id} value={s.id}>
                    {s.commonName}{' '}
                    <ScientificName className="text-xs text-muted-foreground">
                      {s.scientificName}
                    </ScientificName>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {!speciesId && state !== null && !state.success && (
            <p className="text-xs text-muted-foreground">Select a species from the list.</p>
          )}
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
              placeholder="e.g. A-001"
              maxLength={60}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Must be unique within this organisation. Required when multiple specimens of the same species exist.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any relevant notes about this specimen…"
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
          <p className="text-xs text-muted-foreground -mt-2">
            Optional GPS coordinates. Used by future woodland mapping features.
          </p>
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
                placeholder="51.5074"
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
                placeholder="-0.1278"
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

      <Button type="submit" disabled={isPending || !speciesId} className="w-full sm:w-auto">
        {isPending ? 'Adding…' : 'Add specimen'}
      </Button>
    </form>
  )
}
