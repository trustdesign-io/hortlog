'use client'

import { useActionState, useTransition, useState, useEffect, useMemo } from 'react'
import { createSpecies, updateSpecies, deleteSpecies } from '@/lib/actions/species'
import { ScientificName } from '@/components/ui/scientific-name'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { ActionResult } from '@trustdesign/shared/types'
import type { Species } from '@prisma/client'

const CONSERVATION_OPTIONS = [
  { value: '', label: '— None —' },
  { value: 'LC', label: 'LC — Least Concern' },
  { value: 'NT', label: 'NT — Near Threatened' },
  { value: 'VU', label: 'VU — Vulnerable' },
  { value: 'EN', label: 'EN — Endangered' },
  { value: 'CR', label: 'CR — Critically Endangered' },
  { value: 'EW', label: 'EW — Extinct in the Wild' },
  { value: 'EX', label: 'EX — Extinct' },
  { value: 'DD', label: 'DD — Data Deficient' },
]

interface SpeciesFormFieldsProps {
  defaultValues?: Partial<Species>
  error?: string | null
}

function SpeciesFormFields({ defaultValues, error }: SpeciesFormFieldsProps) {
  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Field>
        <FieldLabel htmlFor="commonName">Common name *</FieldLabel>
        <Input
          id="commonName"
          name="commonName"
          required
          defaultValue={defaultValues?.commonName}
          placeholder="e.g. Dog Rose"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="scientificName">Scientific name *</FieldLabel>
        <Input
          id="scientificName"
          name="scientificName"
          required
          defaultValue={defaultValues?.scientificName}
          placeholder="e.g. Rosa canina"
        />
        <FieldError>Must follow binomial nomenclature (e.g. Rosa canina)</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="family">Family</FieldLabel>
        <Input
          id="family"
          name="family"
          defaultValue={defaultValues?.family ?? ''}
          placeholder="e.g. Rosaceae"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="origin">Origin</FieldLabel>
        <Input
          id="origin"
          name="origin"
          defaultValue={defaultValues?.origin ?? ''}
          placeholder="e.g. Europe, Western Asia"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="conservationStatus">Conservation status</FieldLabel>
        <select
          id="conservationStatus"
          name="conservationStatus"
          defaultValue={defaultValues?.conservationStatus ?? ''}
          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {CONSERVATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Describe the species…"
        />
      </Field>
    </div>
  )
}

export function CreateSpeciesDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    createSpecies,
    null,
  )

  useEffect(() => {
    if (state?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Add species
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add species</DialogTitle>
        </DialogHeader>
        <form action={action} key={String(open)}>
          <SpeciesFormFields error={state?.success === false ? state.error : null} />
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditSpeciesDialogProps {
  species: Species
}

export function EditSpeciesDialog({ species }: EditSpeciesDialogProps) {
  const [open, setOpen] = useState(false)
  const boundAction = useMemo(() => updateSpecies.bind(null, species.id), [species.id])
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null,
  )

  useEffect(() => {
    if (state?.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" aria-label={`Edit ${species.commonName}`} />}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit species</DialogTitle>
        </DialogHeader>
        <form action={action} key={open ? species.id : 'closed'}>
          <SpeciesFormFields
            defaultValues={species}
            error={state?.success === false ? state.error : null}
          />
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteSpeciesButtonProps {
  species: Species
  specimenCount: number
}

export function DeleteSpeciesButton({ species, specimenCount }: DeleteSpeciesButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSpecies(species.id)
      if (result.success) {
        setOpen(false)
      } else {
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
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${species.commonName}`}
            disabled={specimenCount > 0}
            title={specimenCount > 0 ? `Used by ${specimenCount} specimen${specimenCount === 1 ? '' : 's'}` : undefined}
          />
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete species?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will permanently delete{' '}
          <ScientificName className="not-italic font-medium text-foreground">
            {species.scientificName}
          </ScientificName>{' '}
          and cannot be undone.
        </p>
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
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SpeciesAdminListProps {
  species: Array<Species & { _count: { specimens: number } }>
}

export function SpeciesAdminList({ species }: SpeciesAdminListProps) {
  if (species.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No species found. Add the first one above.
      </p>
    )
  }

  return (
    <ul role="list" className="divide-y rounded-xl border bg-card overflow-hidden">
      {species.map((s) => (
        <li key={s.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{s.commonName}</p>
            <ScientificName className="text-xs text-muted-foreground">
              {s.scientificName}
            </ScientificName>
            {s.family && (
              <p className="text-xs text-muted-foreground">{s.family}</p>
            )}
          </div>
          {s._count.specimens > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {s._count.specimens} specimen{s._count.specimens === 1 ? '' : 's'}
            </span>
          )}
          <div className="flex shrink-0 gap-1">
            <EditSpeciesDialog species={s} />
            <DeleteSpeciesButton species={s} specimenCount={s._count.specimens} />
          </div>
        </li>
      ))}
    </ul>
  )
}
