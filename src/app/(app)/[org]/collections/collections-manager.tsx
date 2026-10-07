'use client'

import { useActionState, useTransition, useState } from 'react'
import { createCollection, updateCollection, deleteCollection } from '@/lib/actions/collection'
import { toSlug } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { ActionResult } from '@trustdesign/shared/types'

interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  _count: { specimens: number }
}

interface CollectionsManagerProps {
  orgSlug: string
  collections: Collection[]
  canDelete: boolean
}

interface CollectionFormFieldsProps {
  defaultName?: string
  defaultSlug?: string
  defaultDescription?: string | null
  isPending: boolean
  error?: string | null
}

function CollectionFormFields({
  defaultName = '',
  defaultSlug = '',
  defaultDescription = '',
  isPending,
  error,
}: CollectionFormFieldsProps) {
  const [slug, setSlug] = useState(defaultSlug)
  const [slugEdited, setSlugEdited] = useState(!!defaultSlug)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) setSlug(toSlug(e.target.value))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugEdited(true)
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="cf-name">Name</Label>
        <Input
          id="cf-name"
          name="name"
          type="text"
          required
          autoComplete="off"
          defaultValue={defaultName}
          onChange={handleNameChange}
          maxLength={120}
          disabled={isPending}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cf-slug">Slug</Label>
        <Input
          id="cf-slug"
          name="slug"
          type="text"
          required
          autoComplete="off"
          value={slug}
          onChange={handleSlugChange}
          maxLength={48}
          disabled={isPending}
          aria-describedby="cf-slug-hint"
        />
        <p id="cf-slug-hint" className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens only.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cf-description">
          Description
          <span className="ml-1 font-normal text-xs text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="cf-description"
          name="description"
          rows={3}
          autoComplete="off"
          defaultValue={defaultDescription ?? ''}
          maxLength={500}
          disabled={isPending}
        />
      </div>
    </div>
  )
}

function CreateCollectionDialog({ orgSlug }: { orgSlug: string }) {
  const [open, setOpen] = useState(false)
  const boundAction = createCollection.bind(null, orgSlug)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null,
  )

  if (state?.success && open) setOpen(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        New collection
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Create a themed group of specimens.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          {/* key forces remount (and state reset) each time the dialog opens */}
          <CollectionFormFields
            key={String(open)}
            isPending={isPending}
            error={state !== null && !state.success ? state.error : null}
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditCollectionDialog({
  orgSlug,
  collection,
}: {
  orgSlug: string
  collection: Collection
}) {
  const [open, setOpen] = useState(false)
  const boundAction = updateCollection.bind(null, orgSlug, collection.id)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null,
  )

  if (state?.success && open) setOpen(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={`Edit ${collection.name}`} />
        }
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>
            Update the details for &ldquo;{collection.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          {/* key forces remount (and state reset) each time the dialog opens */}
          <CollectionFormFields
            key={open ? collection.id : 'closed'}
            defaultName={collection.name}
            defaultSlug={collection.slug}
            defaultDescription={collection.description}
            isPending={isPending}
            error={state !== null && !state.success ? state.error : null}
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
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

function DeleteCollectionDialog({
  orgSlug,
  collection,
}: {
  orgSlug: string
  collection: Collection
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCollection(orgSlug, collection.id)
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
            size="icon"
            aria-label={`Delete ${collection.name}`}
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{collection.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently delete the collection. Specimens will not be deleted —
            only their membership in this collection will be removed. This cannot be undone.
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CollectionsManager({ orgSlug, collections, canDelete }: CollectionsManagerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {collections.length === 0
            ? 'No collections yet.'
            : `${collections.length} collection${collections.length === 1 ? '' : 's'}`}
        </p>
        <CreateCollectionDialog orgSlug={orgSlug} />
      </div>

      {collections.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <ul role="list">
            {collections.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-3 border-b px-4 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">/{c.slug}</p>
                  {c.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="mr-2 text-xs text-muted-foreground">
                    {c._count.specimens} specimen{c._count.specimens === 1 ? '' : 's'}
                  </span>
                  <EditCollectionDialog orgSlug={orgSlug} collection={c} />
                  {canDelete && (
                    <DeleteCollectionDialog orgSlug={orgSlug} collection={c} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
