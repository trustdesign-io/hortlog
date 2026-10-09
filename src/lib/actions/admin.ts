'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@trustdesign/shared/types'

const SLUG_PATTERN = /^[a-z0-9-]+$/
const RESERVED_SLUGS = new Set([
  'admin', 'dashboard', 'settings', 'no-access', 'orgs', 'auth',
  'sign-in', 'sign-up', 'forgot-password', 'check-email', 'accept-invite',
  'api', 'v',
])

// ─── Organisations ────────────────────────────────────────────────────────────

export async function adminDeleteOrg(orgSlug: string): Promise<ActionResult> {
  const user = await requireAuth()
  if (!isAdmin(user)) return { success: false, error: 'Admin access required.' }

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return { success: false, error: 'Organisation not found.' }

  await prisma.organisation.delete({ where: { id: org.id } })

  revalidatePath('/admin/organisations')
  redirect('/admin/organisations')
}

export async function adminCreateOrg(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth()
  if (!isAdmin(user)) return { success: false, error: 'Admin access required.' }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const managerEmail = (formData.get('managerEmail') as string | null)?.trim().toLowerCase() ?? ''
  const managerName = (formData.get('managerName') as string | null)?.trim() || null

  if (!name) return { success: false, error: 'Organisation name is required.' }
  if (name.length > 120) return { success: false, error: 'Organisation name must be 120 characters or fewer.' }
  if (!slug) return { success: false, error: 'URL slug is required.' }
  if (slug.length < 2 || slug.length > 48) return { success: false, error: 'Slug must be between 2 and 48 characters.' }
  if (!SLUG_PATTERN.test(slug)) return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  if (RESERVED_SLUGS.has(slug)) return { success: false, error: `"${slug}" is a reserved name and cannot be used as a slug.` }
  if (!managerEmail) return { success: false, error: 'First manager email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) return { success: false, error: 'Please enter a valid email address for the first manager.' }

  const existing = await prisma.organisation.findUnique({ where: { slug } })
  if (existing) return { success: false, error: `The slug "${slug}" is already taken.` }

  const APP_URL =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ??
    'http://localhost:3000'

  let org: { id: string; slug: string }
  try {
    org = await prisma.organisation.create({
      data: { slug, name },
      select: { id: true, slug: true },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already taken.` }
    }
    throw err
  }

  const existingManager = await prisma.user.findUnique({
    where: { email: managerEmail },
    select: { id: true },
  })

  if (existingManager) {
    await prisma.membership.create({
      data: { userId: existingManager.id, organisationId: org.id, role: 'MANAGER' },
    })
  } else {
    const supabase = createAdminClient()
    const inviteMeta: Record<string, string> = { pending_org_slug: slug, pending_role: 'MANAGER' }
    if (managerName) inviteMeta.full_name = managerName
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(managerEmail, {
      redirectTo: `${APP_URL}/auth/callback`,
      data: inviteMeta,
    })
    if (inviteError) {
      await prisma.organisation.delete({ where: { id: org.id } })
      return { success: false, error: 'Failed to invite the manager. Please try again.' }
    }
  }

  revalidatePath('/admin/organisations')
  redirect('/admin/organisations')
}

export async function adminUpdateOrg(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth()
  if (!isAdmin(user)) return { success: false, error: 'Admin access required.' }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const managerLabel = (formData.get('managerLabel') as string | null)?.trim() ?? ''
  const memberLabel = (formData.get('memberLabel') as string | null)?.trim() ?? ''

  if (!name) return { success: false, error: 'Organisation name is required.' }
  if (name.length > 120) return { success: false, error: 'Organisation name must be 120 characters or fewer.' }
  if (!slug) return { success: false, error: 'URL slug is required.' }
  if (slug.length < 2 || slug.length > 48) return { success: false, error: 'Slug must be between 2 and 48 characters.' }
  if (!SLUG_PATTERN.test(slug)) return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  if (RESERVED_SLUGS.has(slug)) return { success: false, error: `"${slug}" is a reserved name and cannot be used as a slug.` }

  if (slug !== orgSlug) {
    const existing = await prisma.organisation.findUnique({ where: { slug } })
    if (existing) return { success: false, error: `The slug "${slug}" is already taken.` }
  }

  try {
    await prisma.organisation.update({
      where: { slug: orgSlug },
      data: { name, slug, managerLabel: managerLabel || 'Manager', memberLabel: memberLabel || 'Member' },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already taken.` }
    }
    throw err
  }

  revalidatePath('/admin/organisations')
  if (slug !== orgSlug) redirect(`/admin/organisations`)
  return { success: true }
}

// ─── Members (users) ──────────────────────────────────────────────────────────

export async function adminDeleteUser(userId: string): Promise<ActionResult> {
  const currentUser = await requireAuth()
  if (!isAdmin(currentUser)) return { success: false, error: 'Admin access required.' }
  if (currentUser.id === userId) return { success: false, error: 'You cannot delete your own account.' }

  const adminCount = await prisma.user.count({ where: { isAdmin: true } })
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!target) return { success: false, error: 'User not found.' }
  if (target.isAdmin && adminCount <= 1) {
    return { success: false, error: 'Cannot delete the last platform admin.' }
  }

  // Delete DB row first so FK constraints are satisfied before removing the auth identity.
  // The five audit FK fields are now nullable (SetNull), so related records are preserved.
  // WorkRecords cascade-delete with the User row (owned data).
  await prisma.user.delete({ where: { id: userId } })

  // Auth deletion is a best-effort follow-up. If it fails the admin can retry since the
  // DB row is already gone and a fresh invite to the same email will work.
  const supabase = createAdminClient()
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError) {
    revalidatePath('/admin/members')
    return {
      success: false,
      error: `User data deleted but authentication removal failed: ${authError.message}. The user cannot sign in. You may retry this action to complete the cleanup.`,
    }
  }

  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function adminUpdateUserName(
  userId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const currentUser = await requireAuth()
  if (!isAdmin(currentUser)) return { success: false, error: 'Admin access required.' }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  if (!name) return { success: false, error: 'Name is required.' }
  if (name.length > 120) return { success: false, error: 'Name must be 120 characters or fewer.' }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return { success: false, error: 'User not found.' }

  await prisma.user.update({ where: { id: userId }, data: { name } })

  const supabase = createAdminClient()
  await supabase.auth.admin.updateUserById(userId, { user_metadata: { full_name: name } })

  revalidatePath('/admin/members')
  return { success: true }
}


export async function adminAddMembership(
  userId: string,
  orgSlug: string,
  role: 'MANAGER' | 'MEMBER',
): Promise<ActionResult> {
  const currentUser = await requireAuth()
  if (!isAdmin(currentUser)) return { success: false, error: 'Admin access required.' }

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  try {
    await prisma.membership.create({
      data: { userId, organisationId: org.id, role },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: 'User is already a member of this organisation.' }
    }
    throw err
  }

  revalidatePath('/admin/members')
  return { success: true }
}

export async function adminRemoveMembership(
  userId: string,
  membershipId: string,
): Promise<ActionResult> {
  const currentUser = await requireAuth()
  if (!isAdmin(currentUser)) return { success: false, error: 'Admin access required.' }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    select: { role: true, organisationId: true },
  })
  if (!membership) return { success: false, error: 'Membership not found.' }

  if (membership.role === 'MANAGER') {
    const managerCount = await prisma.membership.count({
      where: { organisationId: membership.organisationId, role: 'MANAGER' },
    })
    if (managerCount <= 1) {
      return { success: false, error: 'Cannot remove the last manager from an organisation.' }
    }
  }

  await prisma.membership.delete({ where: { id: membershipId } })

  revalidatePath('/admin/members')
  return { success: true }
}

export async function adminInviteUser(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const currentUser = await requireAuth()
  if (!isAdmin(currentUser)) return { success: false, error: 'Admin access required.' }

  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  const orgSlug = (formData.get('orgSlug') as string | null)?.trim() ?? ''
  const role = formData.get('role') === 'MANAGER' ? 'MANAGER' as const : 'MEMBER' as const
  const inviteName = (formData.get('name') as string | null)?.trim() || null

  if (!email) return { success: false, error: 'Email address is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'Please enter a valid email address.' }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })

  if (existing) {
    if (orgSlug) {
      const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
      if (!org) return { success: false, error: 'Organisation not found.' }
      try {
        await prisma.membership.create({ data: { userId: existing.id, organisationId: org.id, role } })
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          return { success: false, error: 'User is already a member of this organisation.' }
        }
        throw err
      }
    }
    revalidatePath('/admin/members')
    return { success: true }
  }

  const APP_URL =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ??
    'http://localhost:3000'

  const supabase = createAdminClient()
  const data: Record<string, string> = {}
  if (orgSlug) { data.pending_org_slug = orgSlug; data.pending_role = role }
  if (inviteName) data.full_name = inviteName

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP_URL}/auth/callback`,
    data,
  })
  if (error) return { success: false, error: 'Failed to send invitation. Please try again.' }

  revalidatePath('/admin/members')
  return { success: true }
}
