'use client'

import { useActionState, useState } from 'react'
import { createView } from '@/lib/actions/view'
import { toSlug } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ActionResult } from '@/lib/shared/types'

interface CollectionOption {
  id: string
  name: string
}

interface CreateViewFormProps {
  orgSlug: string
  collections: CollectionOption[]
}

export function CreateViewForm({ orgSlug, collections }: CreateViewFormProps) {
  const boundAction = createView.bind(null, orgSlug)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null,
  )
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) setSlug(toSlug(e.target.value))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugEdited(true)
  }

  return (
    <form action={formAction} className="space-y-4" aria-busy={isPending}>
      {state !== null && !state.success && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="off"
              placeholder="e.g. Main entrance display"
              onChange={handleNameChange}
              maxLength={120}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              type="text"
              autoComplete="off"
              value={slug}
              onChange={handleSlugChange}
              maxLength={48}
              disabled={isPending}
              aria-describedby="slug-hint"
              placeholder="auto-generated from name"
            />
            <p id="slug-hint" className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens. Must be unique within this organisation.
            </p>
          </div>
          {collections.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="primaryCollectionId">Primary collection</Label>
              <select
                id="primaryCollectionId"
                name="primaryCollectionId"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                disabled={isPending}
                defaultValue=""
              >
                <option value="">None</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Used by the public view to show specimens from a specific collection.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grid dimensions</CardTitle>
          <CardDescription>
            Set the number of rows and columns for the specimen grid.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="gridRows">Rows</Label>
            <Input
              id="gridRows"
              name="gridRows"
              type="number"
              min="1"
              max="20"
              defaultValue="4"
              required
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="gridCols">Columns</Label>
            <Input
              id="gridCols"
              name="gridCols"
              type="number"
              min="1"
              max="20"
              defaultValue="4"
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Creating…' : 'Create view'}
      </Button>
    </form>
  )
}
