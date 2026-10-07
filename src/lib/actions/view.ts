'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { toSlug } from '@/lib/utils/slug'
import type { ActionResult } from '@trustdesign/shared/types'

const SLUG_PATTERN = /^[a-z0-9-]+$/

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    '',
  )
}

async function uniqueShortCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateShortCode()
    const existing = await prisma.view.findUnique({ where: { shortCode: code } })
    if (!existing) return code
  }
  throw new Error('Failed to generate a unique short code after 10 attempts.')
}

export async function createView(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slugRaw = (formData.get('slug') as string | null)?.trim() ?? ''
  const primaryCollectionId = (formData.get('primaryCollectionId') as string | null)?.trim() || null
  const gridRowsRaw = formData.get('gridRows') as string | null
  const gridColsRaw = formData.get('gridCols') as string | null

  const slug = slugRaw || toSlug(name)

  if (!name) return { success: false, error: 'Name is required.' }
  if (name.length > 120) return { success: false, error: 'Name must be 120 characters or fewer.' }
  if (!slug) return { success: false, error: 'Slug is required.' }
  if (slug.length < 2 || slug.length > 48) return { success: false, error: 'Slug must be 2–48 characters.' }
  if (!SLUG_PATTERN.test(slug)) {
    return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  }

  const gridRows = gridRowsRaw ? parseInt(gridRowsRaw, 10) : 4
  const gridCols = gridColsRaw ? parseInt(gridColsRaw, 10) : 4

  if (isNaN(gridRows) || gridRows < 1 || gridRows > 20) {
    return { success: false, error: 'Grid rows must be between 1 and 20.' }
  }
  if (isNaN(gridCols) || gridCols < 1 || gridCols > 20) {
    return { success: false, error: 'Grid columns must be between 1 and 20.' }
  }

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const existing = await prisma.view.findUnique({
    where: { slug_organisationId: { slug, organisationId: org.id } },
  })
  if (existing) return { success: false, error: `The slug "${slug}" is already in use.` }

  if (primaryCollectionId) {
    const collection = await prisma.collection.findUnique({
      where: { id: primaryCollectionId, organisationId: org.id },
    })
    if (!collection) return { success: false, error: 'Selected collection not found.' }
  }

  let shortCode: string
  try {
    shortCode = await uniqueShortCode()
  } catch {
    return { success: false, error: 'Could not generate a unique short code. Please try again.' }
  }

  let newId: string
  try {
    const created = await prisma.view.create({
      data: {
        name,
        slug,
        gridRows,
        gridCols,
        shortCode,
        organisationId: org.id,
        primaryCollectionId,
      },
      select: { id: true },
    })
    newId = created.id
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already in use.` }
    }
    console.error('[createView] error:', err)
    return { success: false, error: 'Failed to create view. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/views`)
  redirect(`/${orgSlug}/views/${newId}/edit`)
}

export async function placeSpecimen(
  orgSlug: string,
  viewId: string,
  specimenId: string,
  row: number,
  col: number,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const view = await prisma.view.findUnique({
    where: { id: viewId, organisationId: org.id },
    select: { id: true },
  })
  if (!view) return { success: false, error: 'View not found.' }

  const specimen = await prisma.specimen.findUnique({
    where: { id: specimenId, organisationId: org.id },
    select: { id: true },
  })
  if (!specimen) return { success: false, error: 'Specimen not found.' }

  const cell = `${row},${col}`

  try {
    await prisma.$transaction([
      // Evict any current occupant of this cell
      prisma.specimen.updateMany({
        where: { viewId, gridCell: cell, id: { not: specimenId } },
        data: { viewId: null, gridCell: null },
      }),
      // Place (or move) the specimen into this cell
      prisma.specimen.update({
        where: { id: specimenId, organisationId: org.id },
        data: { viewId, gridCell: cell },
      }),
    ])
  } catch (err) {
    console.error('[placeSpecimen] error:', err)
    return { success: false, error: 'Failed to place specimen. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/views/${viewId}/edit`)
  return { success: true }
}

export async function regenerateShortCode(
  orgSlug: string,
  viewId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const view = await prisma.view.findUnique({
    where: { id: viewId, organisationId: org.id },
    select: { id: true },
  })
  if (!view) return { success: false, error: 'View not found.' }

  let shortCode: string
  try {
    shortCode = await uniqueShortCode()
  } catch {
    return { success: false, error: 'Could not generate a unique short code. Please try again.' }
  }

  try {
    await prisma.view.update({
      where: { id: viewId, organisationId: org.id },
      data: { shortCode },
    })
  } catch (err) {
    console.error('[regenerateShortCode] error:', err)
    return { success: false, error: 'Failed to regenerate short code. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/views`)
  revalidatePath(`/${orgSlug}/views/${viewId}/edit`)
  return { success: true }
}

export async function removeSpecimenFromCell(
  orgSlug: string,
  viewId: string,
  specimenId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  try {
    await prisma.specimen.update({
      where: { id: specimenId, organisationId: org.id, viewId },
      data: { viewId: null, gridCell: null },
    })
  } catch (err) {
    console.error('[removeSpecimenFromCell] error:', err)
    return { success: false, error: 'Failed to remove specimen. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/views/${viewId}/edit`)
  return { success: true }
}
