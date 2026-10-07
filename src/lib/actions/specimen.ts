'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { toSlug } from '@/lib/utils/slug'
import type { ActionResult } from '@trustdesign/shared/types'

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
