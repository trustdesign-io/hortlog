'use client'

import { useState, useActionState } from 'react'
import { createOrg } from '@/lib/actions/org'
import { toSlug } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ActionResult } from '@trustdesign/shared/types'

const initialState: ActionResult<undefined> = { success: true }

export function NewOrgForm() {
  const [state, formAction, isPending] = useActionState(createOrg, initialState)
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) {
      setSlug(toSlug(e.target.value))
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(raw)
    setSlugEdited(raw.length > 0)
  }

  return (
    <Card className="w-full max-w-md mt-8">
      <CardHeader>
        <CardTitle className="font-heading text-lg">
          Create an organisation
        </CardTitle>
        <CardDescription>
          Set up a new garden, woodland, or collection space on hortlog.
        </CardDescription>
      </CardHeader>
      <form action={formAction} aria-busy={isPending}>
        <CardContent className="flex flex-col gap-4">
          {!state.success && state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Organisation name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="off"
              placeholder="Royal Botanical Gardens"
              onChange={handleNameChange}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">
              URL slug
              <span className="ml-1 font-normal text-xs text-muted-foreground">
                hortlog.com/
              </span>
            </Label>
            <Input
              id="slug"
              name="slug"
              type="text"
              required
              autoComplete="off"
              placeholder="royal-botanical-gardens"
              value={slug}
              onChange={handleSlugChange}
              aria-describedby="slug-hint"
            />
            <p id="slug-hint" className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="managerEmail">First manager&apos;s email</Label>
            <Input
              id="managerEmail"
              name="managerEmail"
              type="email"
              required
              autoComplete="off"
              placeholder="manager@organisation.org"
            />
            <p className="text-xs text-muted-foreground">
              An invitation will be sent to this address.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create organisation'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
