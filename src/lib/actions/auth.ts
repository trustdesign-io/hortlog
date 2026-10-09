'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignInSchema, SignUpSchema } from '@trustdesign/shared/schemas'
import type { ActionResult } from '@trustdesign/shared/types'
import { getLandingPath } from '@/lib/auth/landing'

export async function signInWithEmail(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const result = SignInSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!result.success) return { success: false, error: result.error.issues[0].message }
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.signInWithPassword(result.data)
  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      redirect(`/check-email?email=${encodeURIComponent(result.data.email)}`)
    }
    return { success: false, error: 'Invalid email or password.' }
  }
  redirect(await getLandingPath(user!.id))
}

export async function signUpWithEmail(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const result = SignUpSchema.safeParse({ name: formData.get('name'), email: formData.get('email'), password: formData.get('password') })
  if (!result.success) return { success: false, error: result.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email: result.data.email, password: result.data.password, options: { data: { full_name: result.data.name } } })
  if (error) return { success: false, error: error.message }
  // Redirect to confirmation screen regardless — don't reveal whether email already existed
  redirect(`/check-email?email=${encodeURIComponent(result.data.email)}`)
}

export async function resendVerificationEmail(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  // Prefer session-derived email to prevent unauthenticated callers spamming arbitrary addresses
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? (formData.get('email') as string | null) ?? ''
  if (!email) return { success: false, error: 'Email address is missing.' }
  if (user?.email_confirmed_at) return { success: false, error: 'Email already confirmed.' }
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) return { success: false, error: 'Failed to resend. Please try again.' }
  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
