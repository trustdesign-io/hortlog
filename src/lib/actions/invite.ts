'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getNameFromMetadata } from '@/lib/auth/name-utils'
import type { ActionResult } from '@trustdesign/shared/types'

export async function acceptInvite(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = (formData.get('password') as string | null) ?? ''
  const confirm = (formData.get('confirmPassword') as string | null) ?? ''
  const nameInput = (formData.get('name') as string | null)?.trim() || null

  if (!nameInput) return { success: false, error: 'Please enter your name.' }
  if (nameInput.length > 120) return { success: false, error: 'Name must be 120 characters or fewer.' }
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirm) {
    return { success: false, error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Determine final name: prefer explicitly entered name, fall back to invite metadata
  const nameFromMeta = getNameFromMetadata(user.user_metadata)
  const resolvedName = nameInput || nameFromMeta

  // If a name was provided, persist it to Supabase metadata so it survives page refreshes
  if (nameInput) {
    await supabase.auth.updateUser({ data: { full_name: nameInput } })
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) {
    return { success: false, error: 'Failed to set password. Please try again.' }
  }

  // Ensure the User row exists in the database
  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email!, name: resolvedName },
    update: resolvedName ? { name: resolvedName } : {},
  })

  // Create membership from invite metadata
  const orgSlug = (user.user_metadata?.pending_org_slug ?? null) as string | null
  const role = user.user_metadata?.pending_role === 'MANAGER' ? 'MANAGER' as const : 'MEMBER' as const

  if (orgSlug) {
    const org = await prisma.organisation.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })
    if (org) {
      await prisma.membership.upsert({
        where: { userId_organisationId: { userId: user.id, organisationId: org.id } },
        create: { userId: user.id, organisationId: org.id, role },
        update: {},
      })
      await supabase.auth.updateUser({
        data: { pending_org_slug: null, pending_role: null },
      })
      redirect(`/${orgSlug}`)
    }
  }

  redirect('/records')
}
