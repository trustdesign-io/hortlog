'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { updatePublicRecord } from '@/lib/actions/account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActionResult } from '@/lib/shared/types'

interface PublicRecordCardProps {
  username: string | null
  suggestedUsername: string
  recordPublic: boolean
  recordShowNotes: boolean
}

const checkboxClass = 'mt-0.5 h-5 w-5 shrink-0 accent-primary'

export function PublicRecordCard({ username, suggestedUsername, recordPublic, recordShowNotes }: PublicRecordCardProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(updatePublicRecord, null)
  const [name, setName] = useState(username ?? suggestedUsername)
  const [isPublic, setIsPublic] = useState(recordPublic)
  const savedLink = recordPublic && username ? `/u/${username}` : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Public record</CardTitle>
        <CardDescription>
          Share your record with employers through one link. Search engines are asked not to list it.
        </CardDescription>
      </CardHeader>
      <form action={action} aria-busy={isPending}>
        <CardContent className="flex flex-col gap-5">
          {state?.success === false && (
            <p className="text-sm text-destructive" role="alert">{state.error}</p>
          )}
          {state?.success === true && !isPending && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
              Saved.
            </p>
          )}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="recordPublic"
              defaultChecked={recordPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={isPending}
              className={checkboxClass}
            />
            <span className="text-sm">
              <span className="font-medium">Make my record public</span>
              <span className="block text-muted-foreground">
                Anyone with the link can see the plants you&apos;ve worked with. Exact locations and grid
                references are never shown.
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring">
              <span className="shrink-0 pl-3 text-sm text-muted-foreground">hortlog.com/u/</span>
              <Input
                id="username"
                name="username"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                required={isPublic}
                minLength={3}
                maxLength={30}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={isPending}
                className="border-0 pl-0.5 shadow-none focus-visible:ring-0"
              />
            </div>
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens.</p>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="recordShowNotes"
              defaultChecked={recordShowNotes}
              disabled={isPending}
              className={checkboxClass}
            />
            <span className="text-sm">
              <span className="font-medium">Include notes and open questions</span>
              <span className="block text-muted-foreground">
                Off by default: these often mention colleagues or are still being worked out.
              </span>
            </span>
          </label>

          {savedLink && (
            <p className="text-sm">
              Your public record:{' '}
              <Link href={savedLink} className="underline underline-offset-2" target="_blank">
                hortlog.com{savedLink}
              </Link>
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
