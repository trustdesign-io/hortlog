'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireOrgAccess, isAdmin } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadOrgLogo } from '@/lib/storage'
import { RESERVED_ORG_SLUGS } from '@/lib/reserved-slugs'
import { geocodePostcode, normalisePostcode } from '@/lib/postcode'
import type { ActionResult } from '@/lib/shared/types'

const SLUG_PATTERN = /^[a-z0-9-]+$/
const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ??
  'http://localhost:3000'

/**
 * Validates the form's postcode and looks up its coordinates. An empty field
 * clears the location. Only looks up when the postcode has changed.
 */
async function locationFromForm(
  formData: FormData,
  current: { postcode: string | null; latitude: number | null; longitude: number | null } | null,
): Promise<{ error: string } | { postcode: string | null; latitude: number | null; longitude: number | null }> {
  const raw = (formData.get('postcode') as string | null)?.trim() ?? ''
  if (!raw) return { postcode: null, latitude: null, longitude: null }
  const postcode = normalisePostcode(raw)
  if (!postcode) return { error: 'Please enter a full UK postcode, e.g. DA4 0JB.' }
  if (current && current.postcode === postcode && current.latitude !== null && current.longitude !== null) {
    return { postcode, latitude: current.latitude, longitude: current.longitude }
  }
  const coords = await geocodePostcode(postcode)
  if (coords === null) return { error: `We couldn't find the postcode ${postcode}.` }
  if (coords === undefined) return { error: 'The postcode lookup is unavailable right now. Please try again.' }
  return { postcode, ...coords }
}

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
  const managerName = (formData.get('managerName') as string | null)?.trim() || null

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
  if (RESERVED_ORG_SLUGS.has(slug)) {
    return {
      success: false,
      error: `The slug "${slug}" is reserved and cannot be used for an organisation.`,
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

  const location = await locationFromForm(formData, null)
  if ('error' in location) return { success: false, error: location.error }

  let org: { id: string; slug: string }
  try {
    org = await prisma.organisation.create({
      data: { slug, name, ...location },
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

  redirect('/admin/organisations')
}

export async function updateOrgSettings(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  // Forms from before the Director role have no director label: keep the default
  const directorLabel = (formData.get('directorLabel') as string | null)?.trim() || 'Director'
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
  if (RESERVED_ORG_SLUGS.has(slug)) {
    return { success: false, error: `The slug "${slug}" is reserved and cannot be used for an organisation.` }
  }
  if (directorLabel.length > 60) return { success: false, error: 'Director label must be 60 characters or fewer.' }
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

  const current = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { postcode: true, latitude: true, longitude: true },
  })
  // Older forms have no postcode field: leave the location alone
  const location = formData.has('postcode') ? await locationFromForm(formData, current) : null
  if (location && 'error' in location) return { success: false, error: location.error }

  try {
    await prisma.organisation.update({
      where: { slug: orgSlug },
      data: { name, slug, directorLabel, managerLabel, memberLabel, ...(location ?? {}) },
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

  // The weather bar on every page of the organisation reads the location
  revalidatePath(`/${orgSlug}`, 'layout')
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

export async function updateOrgRecordPrivacy(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')
  const recordsPublic = formData.get('recordsPublic') === 'on'
  const privateRecordsShowName = formData.get('privateRecordsShowName') === 'on'

  try {
    await prisma.organisation.update({
      where: { slug: orgSlug },
      data: { recordsPublic, privateRecordsShowName },
    })
  } catch (err) {
    console.error('[updateOrgRecordPrivacy] error:', err)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/settings`)
  // Public records read this setting on every request, so nothing else needs refreshing
  return { success: true }
}

/** Whether people can find this garden in Find a garden and ask to join. Never for a personal garden. */
export async function updateOrgListing(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')
  const listed = formData.get('listed') === 'on'
  try {
    const { count } = await prisma.organisation.updateMany({ where: { slug: orgSlug, personal: false }, data: { listed } })
    if (count === 0) return { success: false, error: 'A personal garden can’t be listed.' }
  } catch (err) {
    console.error('[updateOrgListing] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
  revalidatePath(`/${orgSlug}/settings`)
  revalidatePath('/gardens')
  return { success: true }
}
