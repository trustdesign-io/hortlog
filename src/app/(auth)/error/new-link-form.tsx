'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestNewInviteLink } from '@/lib/actions/new-link'
import type { ActionResult } from '@/lib/shared/types'

/** Invited but the link didn't work: send a fresh one to the same address */
export function NewLinkForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(requestNewInviteLink, null)

  if (state?.success) {
    return (
      <p className="text-sm" role="status">
        If that address has an invite waiting, a new link is on its way. Check your spam folder too, and open the link within
        a day.
      </p>
    )
  }

  return (
    <form action={action} className="w-full space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="new-link-email">Invited? Get a new link</Label>
        <Input id="new-link-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="h-11 text-base" />
      </div>
      {state && !state.success && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="h-11 w-full">
        {isPending ? 'Sending…' : 'Send me a new link'}
      </Button>
    </form>
  )
}
