'use client'

import { useActionState, useTransition, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import {
  createCollection,
  updateCollection,
  deleteCollection,
} from '@/lib/actions/collection'
import { fuzzyScore } from '@/lib/fuzzy'
import { toSlug } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { UnavailableAction } from '@/components/ui/unavailable-action'
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
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { ActionResult } from '@/lib/shared/types'

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
  /** Managers can create and edit; members only see the list. */
  canEdit: boolean
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

  // Close once per successful save. Tracking the handled result (rather than
  // checking `open`) lets the dialog be opened again afterwards.
  const [handled, setHandled] = useState(state)
  if (state !== handled) {
    setHandled(state)
    if (state?.success) setOpen(false)
  }

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

  // Close once per successful save. Tracking the handled result (rather than
  // checking `open`) lets the dialog be opened again afterwards.
  const [handled, setHandled] = useState(state)
  if (state !== handled) {
    setHandled(state)
    if (state?.success) setOpen(false)
  }

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

export function CollectionsManager({ orgSlug, collections, canEdit, canDelete }: CollectionsManagerProps) {
  const [query, setQuery] = useState('')
  const matches = query.trim()
    ? collections
        .map((c) => ({
          c,
          score: fuzzyScore(query, [c.name, c.slug, c.description]),
        }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((m) => m.c)
    : collections

  return (
    <div className="space-y-6">
      {/* Phones: buttons stack under the title; wider screens: beside it */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">Themed groups of specimens for display purposes.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {canEdit ? (
            <CreateCollectionDialog orgSlug={orgSlug} />
          ) : (
            <UnavailableAction reason="Your role can’t create collections." className={buttonVariants({ size: 'sm' })}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              New collection
            </UnavailableAction>
          )}
        </div>
      </div>

      {collections.length === 0 && (
        <EmptyState message="No collections yet." hint={canEdit ? 'Use New collection to add the first one.' : null} />
      )}

      {collections.length > 0 && (
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections"
            aria-label="Search collections"
            autoComplete="off"
            className="pl-9"
          />
        </div>
      )}

      {collections.length > 0 && matches.length === 0 && (
        <p className="text-sm text-muted-foreground" role="status">
          No collections match &ldquo;{query.trim()}&rdquo;.
        </p>
      )}

      {matches.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <ul role="list" aria-label="Collections">
              {matches.map((c) => (
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
                    {canEdit ? (
                      <EditCollectionDialog orgSlug={orgSlug} collection={c} />
                    ) : (
                      <UnavailableAction reason="Your role can’t edit collections." label={`Edit ${c.name}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </UnavailableAction>
                    )}
                    {canDelete ? (
                      <DeleteCollectionDialog orgSlug={orgSlug} collection={c} />
                    ) : (
                      <UnavailableAction
                        reason="Your role can’t delete collections."
                        label={`Delete ${c.name}`}
                        className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'text-destructive' })}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </UnavailableAction>
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
