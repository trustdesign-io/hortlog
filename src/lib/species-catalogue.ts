import { prisma } from '@/lib/prisma'
import { findReferencePhoto } from '@/lib/inaturalist'
import { nameKey, resolveTaxon, suggestNames, type NameSuggestion } from '@/lib/taxonomy'
import { toSlug } from '@/lib/utils/slug'
import { fetchOpenData } from '@/lib/open-data'

export interface ExistingSpecies {
  id: string
  scientificName: string
  commonName: string
  family: string | null
}

export interface CatalogueSuggestion extends NameSuggestion {
  /** Set when the name (or its accepted name) is already in hortlog. */
  existingId: string | null
}

/** Small edit distance, for ranking near-misses in hortlog's own species. */
function distance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

/** hortlog's own species close to what was typed, by name or common name, typos allowed. */
export async function findExistingSpecies(query: string): Promise<ExistingSpecies[]> {
  const q = nameKey(query)
  if (q.length < 2) return []
  const words = q.split(' ').filter((w) => w.length >= 2)
  const candidates = await prisma.species.findMany({
    where: {
      OR: words.flatMap((w) => [
        { scientificName: { contains: w.slice(0, 3), mode: 'insensitive' as const } },
        { commonName: { contains: w.slice(0, 3), mode: 'insensitive' as const } },
      ]),
    },
    select: { id: true, scientificName: true, commonName: true, family: true },
    take: 200,
  })
  const score = (s: ExistingSpecies) => {
    const name = nameKey(s.scientificName)
    const common = nameKey(s.commonName)
    if (name.startsWith(q) || common.includes(q)) return 0
    return Math.min(distance(q, name.slice(0, q.length)), distance(q, common.slice(0, q.length)))
  }
  const tolerance = Math.max(1, Math.floor(q.length / 5))
  return candidates
    .map((s) => ({ s, d: score(s) }))
    .filter(({ d }) => d <= tolerance)
    .sort((a, b) => a.d - b.d || a.s.scientificName.localeCompare(b.s.scientificName))
    .slice(0, 6)
    .map(({ s }) => s)
}

/** The botanical name part of a catalogue label, without authority: "Sansevieria trifasciata". */
function labelName(label: string): string {
  // Genus, then lowercase epithets and rank markers, up to the first author name
  const words = label.split(' ')
  const out = [words[0]]
  for (const w of words.slice(1)) {
    if (!/^(?:[a-z×-]+|subsp\.|var\.|f\.|×)$/.test(w)) break
    out.push(w)
  }
  return out.join(' ')
}

/** Both lists for the species picker. */
export async function searchCatalogue(query: string): Promise<{
  existing: ExistingSpecies[]
  catalogue: CatalogueSuggestion[]
}> {
  const [existing, suggestions] = await Promise.all([findExistingSpecies(query), suggestNames(query)])
  const keys = suggestions.flatMap((s) => [nameKey(labelName(s.label)), s.acceptedLabel ? nameKey(labelName(s.acceptedLabel)) : null])
  const inHortlog = await prisma.species.findMany({
    where: { nameKey: { in: keys.filter((k): k is string => k !== null) } },
    select: { id: true, nameKey: true },
  })
  const idFor = (label: string | null) =>
    label ? (inHortlog.find((s) => s.nameKey === nameKey(labelName(label)))?.id ?? null) : null
  return {
    existing,
    catalogue: suggestions.map((s) => ({ ...s, existingId: idFor(s.acceptedLabel ?? s.label) })),
  }
}

export type AddFromCatalogueResult =
  | { ok: true; species: ExistingSpecies; existed: boolean }
  | { ok: false; error: string }

/**
 * Adds the accepted taxon for a picked catalogue name, or returns the species
 * already in hortlog for it. Duplicates are caught by IPNI id, Catalogue of Life
 * id and normalised name.
 */
export async function addFromCatalogue(usageId: string, commonName: string): Promise<AddFromCatalogueResult> {
  const taxon = await resolveTaxon(usageId)
  if (!taxon) return { ok: false, error: 'Could not look that name up. Please try again.' }

  const key = nameKey(taxon.scientificName)
  const select = { id: true, scientificName: true, commonName: true, family: true } as const
  const existing = await prisma.species.findFirst({
    where: {
      OR: [
        { nameKey: key },
        { colId: taxon.colId },
        ...(taxon.ipniId ? [{ ipniId: taxon.ipniId }] : []),
      ],
    },
    select,
  })
  if (existing) return { ok: true, species: existing, existed: true }

  const name = commonName.trim()
  if (!name) return { ok: false, error: 'Common name is required.' }
  if (name.length > 120) return { ok: false, error: 'Common name must be 120 characters or fewer.' }

  // A free slug: the name, then the name with a number
  const base = toSlug(taxon.scientificName)
  let slug = base
  for (let n = 2; await prisma.species.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`

  const [photo, openData] = await Promise.all([
    findReferencePhoto(taxon.scientificName),
    fetchOpenData({ scientificName: taxon.scientificName, ipniId: taxon.ipniId }),
  ])
  try {
    const species = await prisma.species.create({
      data: {
        slug,
        scientificName: taxon.scientificName,
        authority: taxon.authority,
        commonName: name,
        family: taxon.family,
        origin: taxon.nativeRange,
        powoUrl: taxon.powoUrl,
        colId: taxon.colId,
        ipniId: taxon.ipniId,
        nameKey: key,
        ...photo,
        statusCategory: openData.statusCategory,
        statusSource: openData.statusSource,
        statusUpdatedAt: openData.statusUpdatedAt,
        nativeRegions: openData.nativeRegions,
        introducedRegions: openData.introducedRegions,
        lifeForm: openData.lifeForm,
        climate: openData.climate,
        habitatExcerpt: openData.habitatExcerpt,
        habitatExcerptSource: openData.habitatExcerptSource,
        gbifTaxonKey: openData.gbifTaxonKey,
        openDataUpdatedAt: openData.openDataUpdatedAt,
      },
      select,
    })
    return { ok: true, species, existed: false }
  } catch (err) {
    // Someone added it at the same moment: use theirs
    const again = await prisma.species.findFirst({ where: { nameKey: key }, select })
    if (again) return { ok: true, species: again, existed: true }
    console.error('[addFromCatalogue]', err)
    return { ok: false, error: 'Failed to add species. Please try again.' }
  }
}
