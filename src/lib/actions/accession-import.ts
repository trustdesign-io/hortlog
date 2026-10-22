'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { isImportRow, MAX_IMPORT_ROWS, type ImportRow } from '@/lib/accession-import'
import { speciesForName } from '@/lib/species-for-name'
import { freeSpecimenSlug } from '@/lib/specimen-slug'

export type ImportOutcome = 'created' | 'updated' | 'unidentified' | 'unchanged' | 'failed'

export interface ImportRowResult {
  name: string
  accessionNumber: string | null
  outcome: ImportOutcome
  /** Its staff page, once it's in hortlog */
  slug: string | null
}

/** Rows the server takes at a time; the browser sends a big file in parts */
const MAX_ROWS_PER_CALL = 50

/** Which of these accession numbers are already in the garden, for the preview */
export async function existingAccessions(orgSlug: string, accessionNumbers: string[]): Promise<string[]> {
  await requireOrgAccess(orgSlug, 'can_edit_specimen')
  const wanted = [...new Set(accessionNumbers.filter((a) => typeof a === 'string' && a.length > 0 && a.length <= 60))].slice(0, MAX_IMPORT_ROWS)
  if (wanted.length === 0) return []
  const rows = await prisma.specimen.findMany({
    where: { organisation: { slug: orgSlug }, accessionNumber: { in: wanted } },
    select: { accessionNumber: true },
  })
  return rows.map((r) => r.accessionNumber as string)
}

/** The innermost place, making any of the path that doesn't exist yet */
async function placeFor(organisationId: string, path: string[], cache: Map<string, string>): Promise<string | null> {
  let parentId: string | null = null
  for (let i = 0; i < path.length; i++) {
    const key = path.slice(0, i + 1).join('\u0000').toLowerCase()
    const cached = cache.get(key)
    if (cached) {
      parentId = cached
      continue
    }
    const name = path[i]
    const found: { id: string } | null = await prisma.location.findFirst({
      where: { organisationId, parentId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    })
    const id: string = found?.id ?? (await prisma.location.create({ data: { organisationId, parentId, name }, select: { id: true } })).id
    cache.set(key, id)
    parentId = id
  }
  return parentId
}

/**
 * Adds or updates a part of an import. A plant whose accession number is
 * already in the garden is updated (its place, and its name if it was
 * unidentified); anything else is added. Names hortlog can't match exactly
 * come in as Unidentified, with the name kept in the notes to sort out later.
 */
export async function importAccessions(orgSlug: string, input: unknown[]): Promise<{ success: true; results: ImportRowResult[] } | { success: false; error: string }> {
  await requireOrgAccess(orgSlug, 'can_edit_specimen')
  if (!Array.isArray(input) || input.length > MAX_ROWS_PER_CALL) return { success: false, error: 'Too many rows at once.' }
  const rows: ImportRow[] = input.filter(isImportRow)

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'This organisation no longer exists.' }

  const places = new Map<string, string>()
  const speciesByName = new Map<string, Awaited<ReturnType<typeof speciesForName>>>()
  const results: ImportRowResult[] = []

  for (const row of rows) {
    const result: ImportRowResult = { name: row.scientificName, accessionNumber: row.accessionNumber, outcome: 'failed', slug: null }
    try {
      const nameKey = row.scientificName.toLowerCase()
      let species = speciesByName.get(nameKey)
      if (!species) {
        species = await speciesForName(row.scientificName, row.commonName ?? row.scientificName)
        speciesByName.set(nameKey, species)
      }
      const locationId = row.location.length > 0 ? await placeFor(org.id, row.location, places) : null

      const existing = row.accessionNumber
        ? await prisma.specimen.findFirst({
            where: { organisationId: org.id, accessionNumber: row.accessionNumber },
            select: { id: true, slug: true, locationId: true, species: { select: { scientificName: true } } },
          })
        : null

      if (existing) {
        const data: { locationId?: string; speciesId?: string } = {}
        if (locationId && locationId !== existing.locationId) data.locationId = locationId
        if (existing.species.scientificName === 'Unidentified' && !species.unidentified) data.speciesId = species.id
        if (Object.keys(data).length > 0) await prisma.specimen.update({ where: { id: existing.id }, data })
        results.push({ ...result, outcome: Object.keys(data).length > 0 ? 'updated' : 'unchanged', slug: existing.slug })
        continue
      }

      const notes = [species.unidentified ? `Field name: ${row.scientificName}` : null, species.unidentified && row.authority ? `Imported with the author ${row.authority}.` : null, row.notes]
        .filter(Boolean)
        .join('\n\n')
      const slug = species.unidentified
        ? await freeSpecimenSlug(org.id, '', row.scientificName, row.accessionNumber)
        : await freeSpecimenSlug(org.id, '', species.scientificName, row.accessionNumber)
      await prisma.specimen.create({
        data: {
          organisationId: org.id,
          speciesId: species.id,
          slug,
          accessionNumber: row.accessionNumber,
          notes: notes || null,
          locationId,
        },
      })
      results.push({ ...result, outcome: species.unidentified ? 'unidentified' : 'created', slug })
    } catch (err) {
      console.error('[importAccessions] row failed:', err)
      results.push(result)
    }
  }

  revalidatePath(`/${orgSlug}/specimens`)
  revalidatePath(`/${orgSlug}/locations`)
  return { success: true, results }
}
