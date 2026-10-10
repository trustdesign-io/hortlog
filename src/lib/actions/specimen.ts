'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { uploadSpecimenImage } from '@/lib/storage'
import { toSlug } from '@/lib/utils/slug'
import type { ActionResult } from '@/lib/shared/types'

export async function createSpecimen(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const speciesId = (formData.get('speciesId') as string | null)?.trim() ?? ''
  const accessionNumber = (formData.get('accessionNumber') as string | null)?.trim() || null
  const notes = (formData.get('notes') as string | null)?.trim() || null
  const latRaw = formData.get('latitude') as string | null
  const lngRaw = formData.get('longitude') as string | null
  const collectionIds = formData.getAll('collectionId') as string[]

  if (!speciesId) return { success: false, error: 'A species is required.' }

  const latitude = latRaw ? parseFloat(latRaw) : null
  const longitude = lngRaw ? parseFloat(lngRaw) : null

  if (latRaw && isNaN(latitude!)) return { success: false, error: 'Latitude must be a valid number.' }
  if (lngRaw && isNaN(longitude!)) return { success: false, error: 'Longitude must be a valid number.' }

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const species = await prisma.species.findUnique({ where: { id: speciesId }, select: { scientificName: true } })
  if (!species) return { success: false, error: 'Selected species not found.' }

  if (accessionNumber) {
    const existing = await prisma.specimen.findFirst({
      where: { organisationId: org.id, accessionNumber },
    })
    if (existing) {
      return { success: false, error: `Accession number "${accessionNumber}" is already in use.` }
    }
  }

  const slugBase = accessionNumber
    ? `${species.scientificName} ${accessionNumber}`
    : species.scientificName
  const slug = toSlug(slugBase)

  let newId: string
  try {
    const created = await prisma.specimen.create({
      data: {
        slug,
        accessionNumber,
        notes,
        latitude,
        longitude,
        organisationId: org.id,
        speciesId,
        collections: collectionIds.length
          ? { create: collectionIds.map((id) => ({ collectionId: id })) }
          : undefined,
      },
      select: { id: true },
    })
    newId = created.id
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return {
        success: false,
        error:
          'A specimen with this species already exists. Add an accession number to distinguish it.',
      }
    }
    console.error('[createSpecimen] error:', err)
    return { success: false, error: 'Failed to create specimen. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/specimens`)
  redirect(`/${orgSlug}/specimens/${newId}/edit`)
}

export async function updateSpecimen(
  orgSlug: string,
  specimenId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const slug = (formData.get('slug') as string | null)?.trim() ?? ''
  const accessionNumber = (formData.get('accessionNumber') as string | null)?.trim() || null
  const notes = (formData.get('notes') as string | null)?.trim() || null
  const latRaw = formData.get('latitude') as string | null
  const lngRaw = formData.get('longitude') as string | null
  const collectionIds = formData.getAll('collectionId') as string[]

  if (!slug) return { success: false, error: 'Slug is required.' }
  if (slug.length < 2 || slug.length > 96) return { success: false, error: 'Slug must be 2–96 characters.' }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  }

  const latitude = latRaw ? parseFloat(latRaw) : null
  const longitude = lngRaw ? parseFloat(lngRaw) : null
  if (latRaw && isNaN(latitude!)) return { success: false, error: 'Latitude must be a valid number.' }
  if (lngRaw && isNaN(longitude!)) return { success: false, error: 'Longitude must be a valid number.' }

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const target = await prisma.specimen.findUnique({
    where: { id: specimenId, organisationId: org.id },
    select: { slug: true },
  })
  if (!target) return { success: false, error: 'Specimen not found.' }

  if (accessionNumber) {
    const existingAccession = await prisma.specimen.findFirst({
      where: { organisationId: org.id, accessionNumber, id: { not: specimenId } },
    })
    if (existingAccession) {
      return { success: false, error: `Accession number "${accessionNumber}" is already in use.` }
    }
  }

  if (slug !== target.slug) {
    const existing = await prisma.specimen.findUnique({
      where: { slug_organisationId: { slug, organisationId: org.id } },
    })
    if (existing) return { success: false, error: `The slug "${slug}" is already in use.` }
  }

  const validCollections = await prisma.collection.findMany({
    where: { id: { in: collectionIds }, organisationId: org.id },
    select: { id: true },
  })
  const validCollectionIds = validCollections.map((c) => c.id)

  try {
    await prisma.$transaction([
      prisma.specimen.update({
        where: { id: specimenId, organisationId: org.id },
        data: { slug, accessionNumber, notes, latitude, longitude },
      }),
      prisma.collectionMembership.deleteMany({ where: { specimenId } }),
      ...(validCollectionIds.length > 0
        ? [
            prisma.collectionMembership.createMany({
              data: validCollectionIds.map((id) => ({ specimenId, collectionId: id })),
            }),
          ]
        : []),
    ])
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already in use.` }
    }
    console.error('[updateSpecimen] error:', err)
    return { success: false, error: 'Failed to save changes. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/specimens`)
  revalidatePath(`/${orgSlug}/specimens/${specimenId}/edit`)
  return { success: true }
}

export async function deleteSpecimen(
  orgSlug: string,
  specimenId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  try {
    await prisma.specimen.delete({ where: { id: specimenId, organisationId: org.id } })
  } catch (err) {
    console.error('[deleteSpecimen] error:', err)
    return { success: false, error: 'Failed to delete specimen. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/specimens`)
  redirect(`/${orgSlug}/specimens`)
}

export async function removeSpecimenFromView(
  orgSlug: string,
  specimenId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  try {
    await prisma.specimen.update({
      where: { id: specimenId, organisationId: org.id },
      data: { viewId: null, gridCell: null },
    })
  } catch (err) {
    console.error('[removeSpecimenFromView] error:', err)
    return { success: false, error: 'Failed to remove from view. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/specimens/${specimenId}/edit`)
  return { success: true }
}

export async function uploadSpecimenImageAction(
  orgSlug: string,
  specimenId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const specimen = await prisma.specimen.findUnique({
    where: { id: specimenId, organisationId: org.id },
    select: { id: true },
  })
  if (!specimen) return { success: false, error: 'Specimen not found.' }

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Please select an image file.' }
  }

  const result = await uploadSpecimenImage(file, specimenId, org.id)
  if (!result.success) return result

  await prisma.specimen.update({
    where: { id: specimenId, organisationId: org.id },
    data: { imageUrl: result.url },
  })

  revalidatePath(`/${orgSlug}/specimens/${specimenId}/edit`)
  return { success: true }
}
