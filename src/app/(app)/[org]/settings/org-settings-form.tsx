'use client'

import { useActionState, useState } from 'react'
import { updateOrgSettings } from '@/lib/actions/org'
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

interface OrgData {
  name: string
  slug: string
  managerLabel: string
  memberLabel: string
}

interface OrgSettingsFormProps {
  org: OrgData
  orgSlug: string
}

export function OrgSettingsForm({ org, orgSlug }: OrgSettingsFormProps) {
  const boundAction = updateOrgSettings.bind(null, orgSlug)
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(boundAction, null)

  const [slug, setSlug] = useState(org.slug)
  const [slugEdited, setSlugEdited] = useState(false)
  const slugChanged = slug !== org.slug

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) {
      setSlug(toSlug(e.target.value))
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(raw)
    setSlugEdited(true)
  }

  return (
    <form action={formAction} aria-busy={isPending}>
      <div className="space-y-4">
        {/* General settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Update your organisation&apos;s name and URL slug.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {state !== null && !state.success && state.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}
            {state !== null && state.success && !isPending && (
              <p className="text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
                Settings saved.
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
                defaultValue={org.name}
                onChange={handleNameChange}
                maxLength={120}
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
                value={slug}
                onChange={handleSlugChange}
                aria-describedby="slug-hint"
                maxLength={48}
              />
              <p id="slug-hint" className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
              {slugChanged && (
                <p className="text-xs text-amber-600 dark:text-amber-400" role="alert">
                  Warning: changing the slug will change your organisation&apos;s URL. Any existing links will break.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role labels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role labels</CardTitle>
            <CardDescription>
              Customise how member roles are displayed in the interface. These don&apos;t change the underlying permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="managerLabel">Manager label</Label>
              <Input
                id="managerLabel"
                name="managerLabel"
                type="text"
                required
                autoComplete="off"
                defaultValue={org.managerLabel}
                placeholder="Manager"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                Displayed wherever a Manager role is shown, e.g. &quot;Garden manager&quot;.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="memberLabel">Member label</Label>
              <Input
                id="memberLabel"
                name="memberLabel"
                type="text"
                required
                autoComplete="off"
                defaultValue={org.memberLabel}
                placeholder="Member"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                Displayed wherever a Member role is shown, e.g. &quot;Horticulturalist&quot;.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
