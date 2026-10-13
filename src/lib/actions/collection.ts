'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { normaliseTypeName, typeNameError } from '@/lib/collection-types'
import type { ActionResult } from '@/lib/shared/types'

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

/** The form's type, or null for none; undefined when it names a type outside this organisation. */
async function resolveTypeId(organisationId: string, formData: FormData): Promise<string | null | undefined> {
  const raw = (formData.get('typeId') as string | null)?.trim() || null
  if (!raw) return null
  const type = await prisma.collectionType.findFirst({ where: { id: raw, organisationId }, select: { id: true } })
  return type ? type.id : undefined
}

export async function createCollection(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

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

  const typeId = await resolveTypeId(org.id, formData)
  if (typeId === undefined) return { success: false, error: 'Selected type not found.' }

  try {
    await prisma.collection.create({
      data: { name, slug, description, typeId, organisationId: org.id },
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
  await requireOrgAccess(orgSlug, 'can_edit_scene')

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

  const typeId = await resolveTypeId(org.id, formData)
  if (typeId === undefined) return { success: false, error: 'Selected type not found.' }

  try {
    await prisma.collection.update({
      where: { id: collectionId, organisationId: org.id },
      data: { name, slug, description, typeId },
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

// ─── Collection types ──────────────────────────────────────────────────────────

async function orgId(orgSlug: string): Promise<string | null> {
  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  return org?.id ?? null
}

/** Another type in the organisation with this name, ignoring case. */
async function typeNameTaken(organisationId: string, name: string, exceptId?: string): Promise<boolean> {
  const clash = await prisma.collectionType.findFirst({
    where: { organisationId, name: { equals: name, mode: 'insensitive' }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  })
  return clash !== null
}

export async function createCollectionType(orgSlug: string, rawName: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const name = normaliseTypeName(rawName)
  const invalid = typeNameError(name)
  if (invalid) return { success: false, error: invalid }

  const organisationId = await orgId(orgSlug)
  if (!organisationId) return { success: false, error: 'Organisation not found.' }
  if (await typeNameTaken(organisationId, name)) return { success: false, error: `There is already a type called "${name}".` }

  try {
    await prisma.collectionType.create({ data: { name, organisationId } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `There is already a type called "${name}".` }
    }
    console.error('[createCollectionType] error:', err)
    return { success: false, error: 'Failed to add the type. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/collections`)
  return { success: true }
}

export async function renameCollectionType(orgSlug: string, typeId: string, rawName: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const name = normaliseTypeName(rawName)
  const invalid = typeNameError(name)
  if (invalid) return { success: false, error: invalid }

  const organisationId = await orgId(orgSlug)
  if (!organisationId) return { success: false, error: 'Organisation not found.' }
  if (await typeNameTaken(organisationId, name, typeId)) {
    return { success: false, error: `There is already a type called "${name}".` }
  }

  try {
    const { count } = await prisma.collectionType.updateMany({ where: { id: typeId, organisationId }, data: { name } })
    if (count === 0) return { success: false, error: 'Type not found.' }
  } catch (err) {
    console.error('[renameCollectionType] error:', err)
    return { success: false, error: 'Failed to rename the type. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/collections`)
  return { success: true }
}

/** Deletes a type; its collections are kept and become untyped. */
export async function deleteCollectionType(orgSlug: string, typeId: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')
  const organisationId = await orgId(orgSlug)
  if (!organisationId) return { success: false, error: 'Organisation not found.' }

  try {
    const { count } = await prisma.collectionType.deleteMany({ where: { id: typeId, organisationId } })
    if (count === 0) return { success: false, error: 'Type not found.' }
  } catch (err) {
    console.error('[deleteCollectionType] error:', err)
    return { success: false, error: 'Failed to delete the type. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/collections`)
  return { success: true }
}
