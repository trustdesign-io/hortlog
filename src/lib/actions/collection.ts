'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import type { ActionResult } from '@trustdesign/shared/types'

const SLUG_PATTERN = /^[a-z0-9-]+$/

function validateFields(name: string, slug: string): ActionResult | null {
  if (!name) return { success: false, error: 'Name is required.' }
  if (name.length > 120) return { success: false, error: 'Name must be 120 characters or fewer.' }
  if (!slug) return { success: false, error: 'Slug is required.' }
  if (slug.length < 2 || slug.length > 48) return { success: false, error: 'Slug must be 2–48 characters.' }
  if (!SLUG_PATTERN.test(slug)) {
    return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  }
  return null
}

export async function createCollection(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null

  const validationError = validateFields(name, slug)
  if (validationError) return validationError

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const existing = await prisma.collection.findUnique({
    where: { slug_organisationId: { slug, organisationId: org.id } },
  })
  if (existing) return { success: false, error: `The slug "${slug}" is already in use.` }

  try {
    await prisma.collection.create({
      data: { name, slug, description, organisationId: org.id },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already in use.` }
    }
    console.error('[createCollection] error:', err)
    return { success: false, error: 'Failed to create collection. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/collections`)
  return { success: true }
}

export async function updateCollection(
  orgSlug: string,
  collectionId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null

  const validationError = validateFields(name, slug)
  if (validationError) return validationError

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const target = await prisma.collection.findUnique({
    where: { id: collectionId, organisationId: org.id },
    select: { slug: true },
  })
  if (!target) return { success: false, error: 'Collection not found.' }

  if (slug !== target.slug) {
    const existing = await prisma.collection.findUnique({
      where: { slug_organisationId: { slug, organisationId: org.id } },
    })
    if (existing) return { success: false, error: `The slug "${slug}" is already in use.` }
  }

  try {
    await prisma.collection.update({
      where: { id: collectionId, organisationId: org.id },
      data: { name, slug, description },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already in use.` }
    }
    console.error('[updateCollection] error:', err)
    return { success: false, error: 'Failed to update collection. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/collections`)
  return { success: true }
}

export async function deleteCollection(
  orgSlug: string,
  collectionId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  try {
    await prisma.collection.delete({ where: { id: collectionId, organisationId: org.id } })
  } catch (err) {
    console.error('[deleteCollection] error:', err)
    return { success: false, error: 'Failed to delete collection. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/collections`)
  return { success: true }
}
