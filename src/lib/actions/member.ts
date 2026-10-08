'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@trustdesign/shared/types'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ?? 'http://localhost:3000'

export async function inviteMember(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const roleRaw = formData.get('role')
  const role: 'MANAGER' | 'MEMBER' = roleRaw === 'MANAGER' ? 'MANAGER' : 'MEMBER'

  const raw = (formData.get('email') as string | null) ?? ''
  const emails = [...new Set(raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean))]

  if (emails.length === 0) return { success: false, error: 'At least one email address is required.' }
  if (emails.length > 20) return { success: false, error: 'You can invite up to 20 members at a time.' }

  const invalid = emails.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  if (invalid.length > 0) {
    return { success: false, error: `Invalid email address${invalid.length > 1 ? 'es' : ''}: ${invalid.join(', ')}` }
  }

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const supabase = createAdminClient()
  const failures: string[] = []

  for (const email of emails) {
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existingUser) {
      const existingMembership = await prisma.membership.findUnique({
        where: { userId_organisationId: { userId: existingUser.id, organisationId: org.id } },
      })
      if (existingMembership) {
        failures.push(`${email} (already a member)`)
        continue
      }
      await prisma.membership.create({
        data: { userId: existingUser.id, organisationId: org.id, role },
      })
      continue
    }

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/auth/callback`,
      data: { pending_org_slug: orgSlug, pending_role: role },
    })
    if (error) {
      console.error('[inviteMember] Supabase invite error:', error)
      failures.push(email)
    }
  }

  if (failures.length === emails.length) {
    return { success: false, error: `Failed to invite: ${failures.join(', ')}` }
  }

  revalidatePath(`/${orgSlug}/members`)

  if (failures.length > 0) {
    return { success: false, error: `Some invites failed: ${failures.join(', ')}` }
  }

  return { success: true }
}

export async function changeMemberRole(
  orgSlug: string,
  membershipId: string,
  role: 'MANAGER' | 'MEMBER',
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  if (role === 'MEMBER') {
    const managerCount = await prisma.membership.count({
      where: { organisationId: org.id, role: 'MANAGER' },
    })
    const target = await prisma.membership.findUnique({
      where: { id: membershipId, organisationId: org.id },
      select: { role: true },
    })
    if (target?.role === 'MANAGER' && managerCount <= 1) {
      return { success: false, error: 'Cannot downgrade the last manager.' }
    }
  }

  try {
    await prisma.membership.update({
      where: { id: membershipId, organisationId: org.id },
      data: { role },
    })
  } catch (err) {
    console.error('[changeMemberRole] Prisma error:', err)
    return { success: false, error: 'Failed to update role. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/members`)
  return { success: true }
}

export async function removeMember(
  orgSlug: string,
  membershipId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const target = await prisma.membership.findUnique({
    where: { id: membershipId, organisationId: org.id },
    select: { role: true },
  })

  if (target?.role === 'MANAGER') {
    const managerCount = await prisma.membership.count({
      where: { organisationId: org.id, role: 'MANAGER' },
    })
    if (managerCount <= 1) {
      return { success: false, error: 'Cannot remove the last manager.' }
    }
  }

  try {
    await prisma.membership.delete({ where: { id: membershipId, organisationId: org.id } })
  } catch (err) {
    console.error('[removeMember] Prisma error:', err)
    return { success: false, error: 'Failed to remove member. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/members`)
  return { success: true }
}
