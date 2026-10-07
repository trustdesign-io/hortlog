'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignInSchema, SignUpSchema } from '@trustdesign/shared/schemas'
import type { ActionResult } from '@trustdesign/shared/types'

export async function signInWithEmail(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const result = SignInSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!result.success) return { success: false, error: result.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)
  if (error) return { success: false, error: 'Invalid email or password.' }
  redirect('/dashboard')
}

export async function signUpWithEmail(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const result = SignUpSchema.safeParse({ name: formData.get('name'), email: formData.get('email'), password: formData.get('password') })
  if (!result.success) return { success: false, error: result.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email: result.data.email, password: result.data.password, options: { data: { name: result.data.name } } })
  if (error) return { success: false, error: error.message }
  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
