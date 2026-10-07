'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { signInWithGoogle } from '@/lib/supabase/google-oauth'
import { signUpWithEmail } from '@/lib/actions/auth'
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
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: true }

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, initialState)
  const [oauthError, setOauthError] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setOauthError(null)
    const { error } = await signInWithGoogle()
    if (error) setOauthError(error)
  }

  const errorMessage = (!state.success && state.error) ? state.error : oauthError

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        {/* CardTitle renders as div; role+aria-level needed for a11y and heading selectors */}
        <CardTitle role="heading" aria-level={1}>Create an account</CardTitle>
        <CardDescription>Enter your details to get started.</CardDescription>
      </CardHeader>
      <form action={formAction} aria-busy={isPending}>
        <CardContent className="flex flex-col gap-4">
          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
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
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            Continue with Google
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
