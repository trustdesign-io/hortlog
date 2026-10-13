'use client'

import { useActionState, useTransition, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import {
  createCollection,
  updateCollection,
  deleteCollection,
  createCollectionType,
  renameCollectionType,
  deleteCollectionType,
} from '@/lib/actions/collection'
import { groupByType, MAX_TYPE_NAME } from '@/lib/collection-types'
import { fuzzyScore } from '@/lib/fuzzy'
import { toSlug } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react'
import type { ActionResult } from '@/lib/shared/types'

interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  typeId: string | null
  _count: { specimens: number }
}

interface CollectionType {
  id: string
  name: string
  _count: { collections: number }
}

interface CollectionsManagerProps {
  orgSlug: string
  collections: Collection[]
  types: CollectionType[]
  /** Managers can create and edit; members only see the list. */
  canEdit: boolean
  canDelete: boolean
}

interface CollectionFormFieldsProps {
  types: CollectionType[]
  defaultTypeId?: string | null
  defaultName?: string
  defaultSlug?: string
  defaultDescription?: string | null
  isPending: boolean
  error?: string | null
}

function CollectionFormFields({
  types,
  defaultTypeId = null,
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
        <Label htmlFor="cf-type">
          Type
          <span className="ml-1 font-normal text-xs text-muted-foreground">(optional)</span>
        </Label>
        <NativeSelect
          id="cf-type"
          name="typeId"
          defaultValue={defaultTypeId ?? ''}
          disabled={isPending}
          className="w-full"
          aria-describedby={types.length === 0 ? 'cf-type-hint' : undefined}
        >
          <NativeSelectOption value="">No type</NativeSelectOption>
          {types.map((t) => (
            <NativeSelectOption key={t.id} value={t.id}>
              {t.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {types.length === 0 && (
          <p id="cf-type-hint" className="text-xs text-muted-foreground">
            Add types such as Location or Taxonomy with Types on the Collections page.
          </p>
        )}
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

function CreateCollectionDialog({ orgSlug, types }: { orgSlug: string; types: CollectionType[] }) {
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
            types={types}
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
  types,
}: {
  orgSlug: string
  collection: Collection
  types: CollectionType[]
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
            types={types}
            defaultTypeId={collection.typeId}
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

function TypeRow({ orgSlug, type, canDelete }: { orgSlug: string; type: CollectionType; canDelete: boolean }) {
  const [name, setName] = useState(type.name)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const n = type._count.collections

  function run(action: () => Promise<ActionResult>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.success) setError(result.error)
      setConfirming(false)
    })
  }

  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Name of type ${type.name}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_TYPE_NAME}
          disabled={isPending}
          className="h-9 flex-1"
        />
        <span className="w-24 shrink-0 text-xs text-muted-foreground">
          {n} collection{n === 1 ? '' : 's'}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || name.trim() === type.name}
          onClick={() => run(() => renameCollectionType(orgSlug, type.id, name))}
        >
          Rename
        </Button>
        {canDelete &&
          (confirming ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => run(() => deleteCollectionType(orgSlug, type.id))}
            >
              Confirm
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Delete type ${type.name}`}
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          ))}
      </div>
      {confirming && (
        <p className="text-xs text-muted-foreground">
          {n > 0
            ? `Its ${n} collection${n === 1 ? '' : 's'} will be kept, just without a type.`
            : 'No collections use this type.'}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}

function ManageTypesDialog({
  orgSlug,
  types,
  canDelete,
}: {
  orgSlug: string
  types: CollectionType[]
  canDelete: boolean
}) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function add(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createCollectionType(orgSlug, newName)
      if (result.success) setNewName('')
      else setError(result.error)
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Tags className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Types
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collection types</DialogTitle>
          <DialogDescription>
            Name the kinds of collection you keep, such as Location or Taxonomy, then pick one for each collection.
          </DialogDescription>
        </DialogHeader>
        {types.length > 0 && (
          <ul className="divide-y">
            {types.map((t) => (
              <TypeRow key={`${t.id}:${t.name}`} orgSlug={orgSlug} type={t} canDelete={canDelete} />
            ))}
          </ul>
        )}
        <form onSubmit={add} className="flex flex-col gap-1">
          <Label htmlFor="new-type">Add a type</Label>
          <div className="flex gap-2">
            <Input
              id="new-type"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Location"
              maxLength={MAX_TYPE_NAME}
              disabled={isPending}
              autoComplete="off"
              className="h-9 flex-1"
            />
            <Button type="submit" size="sm" disabled={isPending || !newName.trim()}>
              Add
            </Button>
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CollectionsManager({ orgSlug, collections, types, canEdit, canDelete }: CollectionsManagerProps) {
  const [query, setQuery] = useState('')
  const typeName = new Map(types.map((t) => [t.id, t.name]))
  const matches = query.trim()
    ? collections
        .map((c) => ({
          c,
          score: fuzzyScore(query, [c.name, c.slug, c.description, c.typeId ? typeName.get(c.typeId) : null]),
        }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((m) => m.c)
    : collections
  const groups = groupByType(matches, types)
  const showHeadings = types.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">Themed groups of specimens for display purposes.</p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <ManageTypesDialog orgSlug={orgSlug} types={types} canDelete={canDelete} />
            <CreateCollectionDialog orgSlug={orgSlug} types={types} />
          </div>
        )}
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

      {groups.map((group) => (
        <section key={group.type?.id ?? 'untyped'} aria-label={group.type?.name ?? 'No type'} className="space-y-2">
          {showHeadings && (
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.type?.name ?? 'No type'}
            </h2>
          )}
          <div className="rounded-xl border bg-card overflow-hidden">
            <ul role="list">
              {group.items.map((c) => (
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
                    {canEdit && <EditCollectionDialog orgSlug={orgSlug} collection={c} types={types} />}
                    {canDelete && (
                      <DeleteCollectionDialog orgSlug={orgSlug} collection={c} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  )
}
