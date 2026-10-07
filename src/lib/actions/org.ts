'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireOrgAccess } from '@/lib/auth/permissions'
import { uploadOrgLogo } from '@/lib/storage'
import type { ActionResult } from '@trustdesign/shared/types'

const SLUG_PATTERN = /^[a-z0-9-]+$/

export async function createOrg(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth()

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

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

  const existing = await prisma.organisation.findUnique({ where: { slug } })
  if (existing) {
    return {
      success: false,
      error: `The slug "${slug}" is already taken. Please choose a different one.`,
    }
  }

  try {
    await prisma.organisation.create({
      data: {
        slug,
        name,
        memberships: {
          create: {
            userId: user.id,
            role: 'MANAGER',
          },
        },
      },
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

  redirect(`/${slug}`)
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
