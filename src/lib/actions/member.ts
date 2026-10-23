'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { isLeader, LEADER_ROLES, parseRole, type Role } from '@/lib/roles'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPendingInviteFor } from '@/lib/pending-invites'
import { reinvite } from '@/lib/reinvite'
import type { ActionResult } from '@/lib/shared/types'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ?? 'http://localhost:3000'

export async function inviteMember(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const roleRaw = formData.get('role')
  const role = parseRole(roleRaw)
  const inviteName = (formData.get('name') as string | null)?.trim() || null

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

    const inviteMeta: Record<string, string> = { pending_org_slug: orgSlug, pending_role: role }
    if (inviteName) inviteMeta.full_name = inviteName
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/auth/callback`,
      data: inviteMeta,
    })
    if (error) {
      console.error('[inviteMember] Supabase invite error:', error)
      failures.push(email)
    }
  }

  if (failures.length === emails.length) {
    return { success: false, error: `Failed to invite: ${failures.join(', ')}` }
  }

  revalidatePath(`/${orgSlug}/team/members`)

  if (failures.length > 0) {
    return { success: false, error: `Some invites failed: ${failures.join(', ')}` }
  }

  return { success: true }
}

export async function changeMemberRole(
  orgSlug: string,
  membershipId: string,
  roleRaw: Role,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')
  const role = parseRole(roleRaw)

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  // An organisation always keeps at least one director or manager
  if (!isLeader(role)) {
    const leaderCount = await prisma.membership.count({
      where: { organisationId: org.id, role: { in: LEADER_ROLES } },
    })
    const target = await prisma.membership.findUnique({
      where: { id: membershipId, organisationId: org.id },
      select: { role: true },
    })
    if (target && isLeader(target.role) && leaderCount <= 1) {
      return { success: false, error: 'Cannot downgrade the last director or manager.' }
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

  revalidatePath(`/${orgSlug}/team/members`)
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

  if (target && isLeader(target.role)) {
    const leaderCount = await prisma.membership.count({
      where: { organisationId: org.id, role: { in: LEADER_ROLES } },
    })
    if (leaderCount <= 1) {
      return { success: false, error: 'Cannot remove the last director or manager.' }
    }
  }

  try {
    await prisma.membership.delete({ where: { id: membershipId, organisationId: org.id } })
  } catch (err) {
    console.error('[removeMember] Prisma error:', err)
    return { success: false, error: 'Failed to remove member. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/team/members`)
  return { success: true }
}

/** The invited person, if their invite to this garden is still waiting to be accepted */
async function pendingInvitee(orgSlug: string, userId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data.user || !isPendingInviteFor(data.user, orgSlug)) return null
  // Someone with a hortlog account has accepted something: never remove them
  if (await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })) return null
  return { supabase, user: data.user }
}

/**
 * Sends a fresh invite (the old link may have expired, or gone to spam). An
 * unaccepted invite can't be sent twice, so it's replaced: the waiting
 * account is removed and the person invited again, same role and name.
 */
export async function resendInvite(orgSlug: string, userId: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')
  const found = await pendingInvitee(orgSlug, userId)
  if (!found) return { success: false, error: 'This invite has already been accepted or cancelled.' }
  const r = await reinvite(found.supabase, found.user)
  if (!r.ok) {
    revalidatePath(`/${orgSlug}/team/members`)
    return {
      success: false,
      error: r.removed
        ? `The old invite was removed but a new one couldn’t be sent. Invite ${found.user.email} again.`
        : 'The invite couldn’t be resent. Try again.',
    }
  }
  revalidatePath(`/${orgSlug}/team/members`)
  return { success: true }
}

/** Withdraws an invite that hasn't been accepted */
export async function cancelInvite(orgSlug: string, userId: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')
  const found = await pendingInvitee(orgSlug, userId)
  if (!found) return { success: true }
  const { error } = await found.supabase.auth.admin.deleteUser(found.user.id)
  if (error) {
    console.error('[cancelInvite] error:', error)
    return { success: false, error: 'The invite couldn’t be cancelled. Try again.' }
  }
  revalidatePath(`/${orgSlug}/team/members`)
  return { success: true }
}

