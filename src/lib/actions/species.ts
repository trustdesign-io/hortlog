'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { toSlug } from '@/lib/utils/slug'
import { notFound } from 'next/navigation'
import type { ActionResult } from '@/lib/shared/types'

const CONSERVATION_STATUSES = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD']
const SCIENTIFIC_NAME_PATTERN = /^[A-Z][a-z]+(\s[a-z×'\-]+)+$/

async function requireAdmin() {
  const user = await requireAuth()
  if (!isAdmin(user)) notFound()
  return user
}

function parseSpeciesForm(formData: FormData): {
  commonName: string
  scientificName: string
  family: string | null
  origin: string | null
  description: string | null
  conservationStatus: string | null
} | { error: string } {
  const commonName = (formData.get('commonName') as string | null)?.trim() ?? ''
  const scientificName = (formData.get('scientificName') as string | null)?.trim() ?? ''
  const family = (formData.get('family') as string | null)?.trim() || null
  const origin = (formData.get('origin') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const conservationStatusRaw = (formData.get('conservationStatus') as string | null)?.trim() || null
  const conservationStatus = conservationStatusRaw?.toUpperCase() || null

  if (!commonName) return { error: 'Common name is required.' }
  if (commonName.length > 120) return { error: 'Common name must be 120 characters or fewer.' }
  if (!scientificName) return { error: 'Scientific name is required.' }
  if (scientificName.length > 200) return { error: 'Scientific name must be 200 characters or fewer.' }
  if (!SCIENTIFIC_NAME_PATTERN.test(scientificName)) {
    return { error: 'Scientific name must follow binomial nomenclature (e.g. "Rosa canina").' }
  }
  if (conservationStatus && !CONSERVATION_STATUSES.includes(conservationStatus)) {
    return { error: `Conservation status must be one of: ${CONSERVATION_STATUSES.join(', ')}.` }
  }

  return { commonName, scientificName, family, origin, description, conservationStatus }
}

export async function createSpecies(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseSpeciesForm(formData)
  if ('error' in parsed) return { success: false, error: parsed.error }

  const { commonName, scientificName, family, origin, description, conservationStatus } = parsed
  const slug = toSlug(scientificName)

  const existing = await prisma.species.findUnique({ where: { slug } })
  if (existing) return { success: false, error: `A species with this scientific name already exists.` }

  try {
    await prisma.species.create({
      data: { slug, commonName, scientificName, family, origin, description, conservationStatus },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: 'A species with this scientific name already exists.' }
    }
    console.error('[createSpecies] error:', err)
    return { success: false, error: 'Failed to create species. Please try again.' }
  }

  revalidatePath('/admin/species')
  return { success: true }
}

export async function updateSpecies(
  speciesId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  const parsed = parseSpeciesForm(formData)
  if ('error' in parsed) return { success: false, error: parsed.error }

  const { commonName, scientificName, family, origin, description, conservationStatus } = parsed
  const slug = toSlug(scientificName)

  const conflict = await prisma.species.findFirst({
    where: { slug, NOT: { id: speciesId } },
  })
  if (conflict) return { success: false, error: 'Another species with this scientific name already exists.' }

  try {
    await prisma.species.update({
      where: { id: speciesId },
      data: { slug, commonName, scientificName, family, origin, description, conservationStatus },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return { success: false, error: 'Species not found.' }
    }
    console.error('[updateSpecies] error:', err)
    return { success: false, error: 'Failed to update species. Please try again.' }
  }

  revalidatePath('/admin/species')
  return { success: true }
}

export async function deleteSpecies(speciesId: string): Promise<ActionResult> {
  await requireAdmin()

  const count = await prisma.specimen.count({ where: { speciesId } })
  if (count > 0) {
    return {
      success: false,
      error: `Cannot delete — ${count} ${count === 1 ? 'specimen references' : 'specimens reference'} this species.`,
    }
  }

  try {
    await prisma.species.delete({ where: { id: speciesId } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return { success: false, error: 'Species not found.' }
      // FK violation: a specimen was added between the count check and the delete
      if (err.code === 'P2003') {
        return { success: false, error: 'Cannot delete — specimens still reference this species.' }
      }
    }
    console.error('[deleteSpecies] error:', err)
    return { success: false, error: 'Failed to delete species. Please try again.' }
  }

  revalidatePath('/admin/species')
  return { success: true }
}
