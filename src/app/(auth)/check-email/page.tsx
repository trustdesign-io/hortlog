'use client'

import { Suspense, useActionState, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { resendVerificationEmail } from '@/lib/actions/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ActionResult } from '@/types'

const COOLDOWN_SECONDS = 60
const initialState: ActionResult = { success: true }

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [state, formAction, isPending] = useActionState(resendVerificationEmail, initialState)
  const [cooldown, setCooldown] = useState(0)
  const [submitCount, setSubmitCount] = useState(0)
  const prevSubmitCountRef = useRef(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  // Only start cooldown when a NEW submission completes successfully
  useEffect(() => {
    if (submitCount > prevSubmitCountRef.current && state.success && !isPending) {
      prevSubmitCountRef.current = submitCount
      setCooldown(COOLDOWN_SECONDS)
    }
  }, [submitCount, state.success, isPending])

  const canResend = cooldown === 0 && !isPending

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="font-heading text-lg">
          Check your email
        </CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to <strong>{email}</strong>. Follow it to finish
          setting up your account.
        </CardDescription>
      </CardHeader>

      {submitCount > 0 && !isPending && (
        <CardContent>
          {state.success ? (
            <p className="text-sm text-green-700 dark:text-green-400" role="status">
              Verification email sent. Check your inbox.
            </p>
          ) : (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
        </CardContent>
      )}

      <CardFooter className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <form action={formAction} onSubmit={() => setSubmitCount((n) => n + 1)} className="inline">
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              disabled={!canResend}
              className="underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={
                cooldown > 0 ? `Resend available in ${cooldown} seconds` : 'Resend verification email'
              }
            >
              {cooldown > 0 ? `resend in ${cooldown}s` : 'resend the email'}
            </button>
          </form>
          .
        </p>
        <Link href="/sign-up" className="text-sm underline underline-offset-4">
          Use a different email address
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  )
}
