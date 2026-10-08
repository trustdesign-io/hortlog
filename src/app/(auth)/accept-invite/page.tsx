'use client'

import { useActionState } from 'react'
import { acceptInvite } from '@/lib/actions/invite'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const initialState = null

export default function AcceptInvitePage() {
  const [state, formAction, isPending] = useActionState(acceptInvite, initialState)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="font-heading text-lg">
          Set your password
        </CardTitle>
        <CardDescription>
          Choose a password to complete your account setup.
        </CardDescription>
      </CardHeader>
      <form action={formAction} aria-busy={isPending}>
        <CardContent className="flex flex-col gap-4 pb-2">
          {state !== null && !state.success && state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Setting up…' : 'Set password and continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
