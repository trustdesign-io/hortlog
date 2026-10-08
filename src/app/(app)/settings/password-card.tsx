'use client'

import { useActionState } from 'react'
import { changePassword } from '@/lib/actions/account'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActionResult } from '@trustdesign/shared/types'

export function PasswordCard() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    changePassword,
    null,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
        <CardDescription>Enter your current password to set a new one.</CardDescription>
      </CardHeader>
      <form action={action} aria-busy={isPending}>
        <CardContent className="flex flex-col gap-4">
          {state?.success === false && (
            <p className="text-sm text-destructive" role="alert">{state.error}</p>
          )}
          {state?.success === true && !isPending && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
              Password changed successfully.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              required
              autoComplete="current-password"
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              required
              autoComplete="new-password"
              minLength={8}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Updating…' : 'Update password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
