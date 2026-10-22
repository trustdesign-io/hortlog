import { prisma } from '@/lib/prisma'
import { addFromCatalogue, labelName, searchCatalogue } from '@/lib/species-catalogue'
import { nameKey } from '@/lib/taxonomy'

const SPECIES_RANKS = new Set(['species', 'subspecies', 'variety', 'form'])

/**
 * Looks a typed name up in the botanical catalogue, as the species picker
 * would. Only a name that matches exactly (authority aside) is taken; anything
 * less certain is left for a member to identify.
 */
async function lookUpTypedName(name: string, commonName: string): Promise<{ id: string; scientificName: string } | null> {
  const key = nameKey(name)
  const { existing, catalogue } = await searchCatalogue(name)
  const known = existing.find((s) => nameKey(s.scientificName) === key)
  if (known) return known
  const exact = catalogue.filter((c) => {
    return SPECIES_RANKS.has(c.rank.toLowerCase()) && nameKey(labelName(c.label)) === key
  })
  // Several taxa with the same name (different authors) can't be told apart from the name alone
  const accepted = new Set(exact.map((c) => c.existingId ?? nameKey(labelName(c.acceptedLabel ?? c.label))))
  if (exact.length === 0 || accepted.size > 1) return null
  const pick = exact[0]
  if (pick.existingId) {
    return prisma.species.findUnique({ where: { id: pick.existingId }, select: { id: true, scientificName: true } })
  }
  const added = await addFromCatalogue(pick.usageId, commonName)
  return added.ok ? { id: added.species.id, scientificName: added.species.scientificName } : null
}

/**
 * The species for a typed name (added offline, or imported): one already in
 * hortlog by that name; an exact match in the botanical catalogue; else
 * "Unidentified", for the caller to keep the typed name in the plant's notes.
 */
export async function speciesForName(
  name: string,
  commonName: string = name,
): Promise<{ id: string; scientificName: string; unidentified: boolean }> {
  const match = await prisma.species.findFirst({
    where: {
      OR: [
        { scientificName: { equals: name, mode: 'insensitive' } },
        { commonName: { equals: name, mode: 'insensitive' } },
      ],
    },
    select: { id: true, scientificName: true },
  })
  if (match) return { ...match, unidentified: false }
  try {
    const found = await lookUpTypedName(name, commonName)
    if (found) return { ...found, unidentified: false }
  } catch (err) {
    // The catalogue being down mustn't hold up the plant; it can be identified later
    console.error('[speciesForName] Catalogue lookup failed:', err)
  }
  const unknown = await prisma.species.upsert({
    where: { slug: 'unidentified' },
    create: { slug: 'unidentified', scientificName: 'Unidentified', commonName: 'Unidentified plant' },
    update: {},
    select: { id: true, scientificName: true },
  })
  return { ...unknown, unidentified: true }
}
