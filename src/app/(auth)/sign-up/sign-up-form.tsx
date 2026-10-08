'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUpWithEmail } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { ActionResult } from '@trustdesign/shared/types'

const initialState: ActionResult = { success: true }

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, initialState)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="font-heading text-lg">
          Create your account
        </CardTitle>
        <CardDescription>Join hortlog to manage your botanical collections.</CardDescription>
      </CardHeader>
      <form action={formAction} aria-busy={isPending}>
        <CardContent className="flex flex-col gap-4">
          {!state.success && state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" required autoComplete="name" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
