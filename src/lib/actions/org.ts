'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireOrgAccess, isAdmin } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadOrgLogo } from '@/lib/storage'
import type { ActionResult } from '@trustdesign/shared/types'

const SLUG_PATTERN = /^[a-z0-9-]+$/
const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ??
  'http://localhost:3000'

export async function createOrg(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth()

  if (!isAdmin(user)) {
    return { success: false, error: 'Only platform admins can create organisations.' }
  }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const managerEmail = (formData.get('managerEmail') as string | null)?.trim().toLowerCase() ?? ''

  if (!name) return { success: false, error: 'Organisation name is required.' }
  if (name.length > 120) return { success: false, error: 'Organisation name must be 120 characters or fewer.' }
  if (!slug) return { success: false, error: 'URL slug is required.' }
  if (slug.length < 2 || slug.length > 48) {
    return { success: false, error: 'Slug must be between 2 and 48 characters.' }
  }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      success: false,
      error: 'Slug may only contain lowercase letters, numbers, and hyphens.',
    }
  }
  if (!managerEmail) return { success: false, error: 'First manager email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail)) {
    return { success: false, error: 'Please enter a valid email address for the first manager.' }
  }

  const existing = await prisma.organisation.findUnique({ where: { slug } })
  if (existing) {
    return {
      success: false,
      error: `The slug "${slug}" is already taken. Please choose a different one.`,
    }
  }

  let org: { id: string; slug: string }
  try {
    org = await prisma.organisation.create({
      data: { slug, name },
      select: { id: true, slug: true },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return {
        success: false,
        error: `The slug "${slug}" is already taken. Please choose a different one.`,
      }
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
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(managerEmail, {
      redirectTo: `${APP_URL}/auth/callback`,
      data: { pending_org_slug: slug },
    })
    if (inviteError) {
      await prisma.organisation.delete({ where: { id: org.id } })
      return { success: false, error: 'Failed to invite the manager. Please try again.' }
    }
  }

  redirect('/dashboard')
}

export async function updateOrgSettings(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const managerLabel = (formData.get('managerLabel') as string | null)?.trim() ?? ''
  const memberLabel = (formData.get('memberLabel') as string | null)?.trim() ?? ''

  if (!name) return { success: false, error: 'Organisation name is required.' }
  if (name.length > 120) return { success: false, error: 'Organisation name must be 120 characters or fewer.' }
  if (!slug) return { success: false, error: 'URL slug is required.' }
  if (slug.length < 2 || slug.length > 48) {
    return { success: false, error: 'Slug must be between 2 and 48 characters.' }
  }
  if (!SLUG_PATTERN.test(slug)) {
    return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  }
  if (!managerLabel) return { success: false, error: 'Manager label is required.' }
  if (managerLabel.length > 60) return { success: false, error: 'Manager label must be 60 characters or fewer.' }
  if (!memberLabel) return { success: false, error: 'Member label is required.' }
  if (memberLabel.length > 60) return { success: false, error: 'Member label must be 60 characters or fewer.' }

  if (slug !== orgSlug) {
    // Best-effort pre-check for a friendlier error message.
    // The P2002 catch below is the authoritative uniqueness guard.
    const existing = await prisma.organisation.findUnique({ where: { slug } })
    if (existing) {
      return { success: false, error: `The slug "${slug}" is already taken. Please choose a different one.` }
    }
  }

  try {
    await prisma.organisation.update({
      where: { slug: orgSlug },
      data: { name, slug, managerLabel, memberLabel },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already taken. Please choose a different one.` }
    }
    throw err
  }

  if (slug !== orgSlug) {
    revalidatePath(`/${orgSlug}/settings`)
    redirect(`/${slug}/settings`)
  }

  revalidatePath(`/${orgSlug}/settings`)
  return { success: true }
}

export async function uploadOrgLogoAction(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const file = formData.get('logo')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Please select an image file.' }
  }

  const result = await uploadOrgLogo(file, org.id)
  if (!result.success) return result

  await prisma.organisation.update({
    where: { id: org.id },
    data: { logoUrl: result.url },
  })

  revalidatePath(`/${orgSlug}/settings`)
  return { success: true }
}
