'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { findReferencePhoto } from '@/lib/inaturalist'
import { addFromCatalogue, searchCatalogue, searchSpoken, type CatalogueSuggestion, type ExistingSpecies } from '@/lib/species-catalogue'
import { canManageOrg } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import type { ActionResult } from '@/lib/shared/types'

const CONSERVATION_STATUSES = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD']

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

  if (commonName.length > 120) return { error: 'Common name must be 120 characters or fewer.' }
  if (!scientificName) return { error: 'Scientific name is required.' }
  if (scientificName.length > 200) return { error: 'Scientific name must be 200 characters or fewer.' }
  if (conservationStatus && !CONSERVATION_STATUSES.includes(conservationStatus)) {
    return { error: `Conservation status must be one of: ${CONSERVATION_STATUSES.join(', ')}.` }
  }

  // Many species have no common name: fall back to the scientific name
  return { commonName: commonName || scientificName, scientificName, family, origin, description, conservationStatus }
}

export async function updateSpecies(
  speciesId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin()

  // The botanical name is fixed: it came from the Catalogue of Life
  const stored = await prisma.species.findUnique({ where: { id: speciesId }, select: { scientificName: true } })
  if (!stored) return { success: false, error: 'Species not found.' }
  formData.set('scientificName', stored.scientificName)

  const parsed = parseSpeciesForm(formData)
  if ('error' in parsed) return { success: false, error: parsed.error }

  const { commonName, scientificName, family, origin, description, conservationStatus } = parsed

  // Try again for a reference photo if the species doesn't have one yet
  const current = await prisma.species.findUnique({ where: { id: speciesId }, select: { photoUrl: true } })
  const photo = current && !current.photoUrl ? await findReferencePhoto(scientificName) : null

  try {
    await prisma.species.update({
      where: { id: speciesId },
      data: { commonName, family, origin, description, conservationStatus, ...photo },
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

/**
 * Who may add species to the shared catalogue: platform admins, and directors or
 * managers of any organisation (they add species from the Add specimen form).
 */
async function requireSpeciesEditor() {
  const user = await requireAuth()
  const allowed = isAdmin(user) || user.memberships.some((m) => canManageOrg(user, m.organisation.slug))
  return allowed ? user : null
}

export async function searchSpeciesCatalogue(
  query: string,
): Promise<{ existing: ExistingSpecies[]; catalogue: CatalogueSuggestion[] }> {
  if (!(await requireSpeciesEditor())) return { existing: [], catalogue: [] }
  return searchCatalogue(query.slice(0, 100))
}

/** The same lists for a name said aloud (what the phone heard, best guess first) */
export async function searchSpeciesSpoken(
  heard: string[],
): Promise<{ existing: ExistingSpecies[]; catalogue: CatalogueSuggestion[] }> {
  if (!(await requireSpeciesEditor())) return { existing: [], catalogue: [] }
  if (!Array.isArray(heard) || heard.some((h) => typeof h !== 'string')) return { existing: [], catalogue: [] }
  return searchSpoken(heard)
}

export async function addSpeciesFromCatalogue(
  usageId: string,
  commonName: string,
): Promise<ActionResult<{ species: ExistingSpecies; existed: boolean }>> {
  if (!(await requireSpeciesEditor())) return { success: false, error: 'You do not have permission to add species.' }
  if (!/^[A-Za-z0-9]{1,20}$/.test(usageId)) return { success: false, error: 'Unknown name.' }
  const result = await addFromCatalogue(usageId, commonName)
  if (!result.ok) return { success: false, error: result.error }
  revalidatePath('/admin/species')
  return { success: true, data: { species: result.species, existed: result.existed } }
}
