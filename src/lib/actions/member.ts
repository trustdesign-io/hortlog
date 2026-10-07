'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@trustdesign/shared/types'

export async function inviteMember(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  if (!email) return { success: false, error: 'Email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: { userId_organisationId: { userId: existingUser.id, organisationId: org.id } },
    })
    if (existingMembership) {
      return { success: false, error: 'This user is already a member of this organisation.' }
    }
    await prisma.membership.create({
      data: { userId: existingUser.id, organisationId: org.id, role: 'MEMBER' },
    })
    revalidatePath(`/${orgSlug}/members`)
    return { success: true }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
    data: { pending_org_slug: orgSlug },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/${orgSlug}/members`)
  return { success: true }
}

export async function changeMemberRole(
  orgSlug: string,
  membershipId: string,
  role: 'MANAGER' | 'MEMBER',
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  if (role === 'MEMBER') {
    const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
    if (!org) return { success: false, error: 'Organisation not found.' }

    const managerCount = await prisma.membership.count({
      where: { organisationId: org.id, role: 'MANAGER' },
    })
    const target = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: { role: true },
    })
    if (target?.role === 'MANAGER' && managerCount <= 1) {
      return { success: false, error: 'Cannot downgrade the last manager.' }
    }
  }

  await prisma.membership.update({
    where: { id: membershipId },
    data: { role },
  })

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
    where: { id: membershipId },
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

  await prisma.membership.delete({ where: { id: membershipId } })

  revalidatePath(`/${orgSlug}/members`)
  return { success: true }
}
