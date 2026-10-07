'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@trustdesign/shared/types'

export async function acceptInvite(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = (formData.get('password') as string | null) ?? ''
  const confirm = (formData.get('confirmPassword') as string | null) ?? ''

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirm) {
    return { success: false, error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) {
    return { success: false, error: 'Failed to set password. Please try again.' }
  }

  // Ensure the User row exists in the database
  const meta = user.user_metadata ?? {}
  const name = (meta.name ?? meta.full_name ?? null) as string | null
  await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email!, name },
    update: {},
  })

  // Create membership from invite metadata
  const orgSlug = (meta.pending_org_slug ?? null) as string | null
  const role = meta.pending_role === 'MANAGER' ? 'MANAGER' as const : 'MEMBER' as const

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

  redirect('/dashboard')
}
