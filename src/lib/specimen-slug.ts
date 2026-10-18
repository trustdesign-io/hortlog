import { prisma } from '@/lib/prisma'
import { toSlug } from '@/lib/utils/slug'

/** The name a plant was logged under before it was identified, kept in its notes */
export function fieldNameOf(notes: string | null): string | undefined {
  return notes ? /^Field name: (.+)$/m.exec(notes)?.[1]?.trim() : undefined
}

/**
 * Whether a slug is still the one made when the plant was logged unidentified
 * (from its field name, or "unidentified"), so it's safe to replace. Slugs a
 * member has chosen, or that already follow a botanical name, are kept.
 */
export function isPlaceholderSlug(slug: string, notes: string | null, accessionNumber: string | null): boolean {
  const field = fieldNameOf(notes)
  const bases = ['unidentified', field ? toSlug([field, accessionNumber].filter(Boolean).join(' ')) : '', field ? toSlug(field) : '']
  return bases.some((b) => b.length > 0 && (slug === b || slug.startsWith(`${b}-`)))
}

/** A slug from the botanical name that no other specimen in the organisation uses */
export async function freeSpecimenSlug(organisationId: string, specimenId: string, scientificName: string, accessionNumber: string | null): Promise<string> {
  const base = toSlug([scientificName, accessionNumber].filter(Boolean).join(' ')) || 'plant'
  const taken = new Set(
    (
      await prisma.specimen.findMany({
        where: { organisationId, slug: { startsWith: base }, id: { not: specimenId } },
        select: { slug: true },
      })
    ).map((s) => s.slug),
  )
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
}

/**
 * When a plant logged as Unidentified gets its name, its web address follows:
 * the placeholder slug becomes one from the botanical name. Returns the new
 * slug, or null to keep the current one.
 */
export async function slugAfterNaming(
  specimen: { id: string; organisationId: string; slug: string; notes: string | null; accessionNumber: string | null },
  scientificName: string,
): Promise<string | null> {
  if (scientificName === 'Unidentified') return null
  if (!isPlaceholderSlug(specimen.slug, specimen.notes, specimen.accessionNumber)) return null
  return freeSpecimenSlug(specimen.organisationId, specimen.id, scientificName, specimen.accessionNumber)
}
