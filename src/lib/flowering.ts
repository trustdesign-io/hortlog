import { prisma } from '@/lib/prisma'
import { locationPath, withinIds } from '@/lib/locations'
import { freshSince } from '@/lib/plant-stage'
import { publicScenePath } from '@/lib/scene-urls'

export interface FloweringPlant {
  id: string
  slug: string
  scientificName: string
  commonName: string
  photoUrl: string | null
  stage: 'FLOWER' | 'FRUIT'
  seenAt: Date
  /** Places from the chosen one inwards, e.g. ["Arid", "Madagascar"] */
  places: string[]
  /** Its public page, from the site root */
  path: string
}

export interface FloweringGroup {
  label: string
  plants: FloweringPlant[]
}

/**
 * What's in flower and fruit now at a garden, or in one place and everywhere
 * inside it, grouped by place, flowers first. Null if the garden doesn't exist.
 */
export async function floweringNow(orgSlug: string, inId: string | undefined | null) {
  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true, name: true, slug: true } })
  if (!org) return null
  const locations = await prisma.location.findMany({ where: { organisationId: org.id }, select: { id: true, name: true, parentId: true } })
  const place = inId ? (locations.find((l) => l.id === inId) ?? null) : null

  const specimens = await prisma.specimen.findMany({
    where: {
      organisationId: org.id,
      removedAt: null,
      stage: { in: ['FLOWER', 'FRUIT'] },
      stageSeenAt: { gte: freshSince() },
      // Plants in scenes still being set up stay out of sight
      OR: [{ sceneId: null }, { scene: { active: true } }],
    },
    orderBy: { stageSeenAt: 'desc' },
    take: 500,
    select: {
      id: true,
      slug: true,
      imageUrl: true,
      stage: true,
      stageSeenAt: true,
      locationId: true,
      species: { select: { commonName: true, scientificName: true, photoUrl: true } },
      scene: { select: { slug: true, locationId: true, photoTakenAt: true, primaryCollection: { select: { slug: true } } } },
    },
  })

  const inside = place ? new Set(withinIds(locations, place.id)) : null
  const groups = new Map<string, FloweringGroup>()
  for (const s of specimens) {
    const where = s.locationId ?? s.scene?.locationId ?? null
    if (inside && (where === null || !inside.has(where))) continue
    const path = locationPath(locations, where)
    const fromPlace = place ? path.slice(path.findIndex((l) => l.id === place.id)) : path
    const places = fromPlace.map((l) => l.name)
    const label = places.length > 0 ? places.join(' › ') : 'Elsewhere in the garden'
    const plant: FloweringPlant = {
      id: s.id,
      slug: s.slug,
      scientificName: s.species.scientificName,
      commonName: s.species.commonName,
      photoUrl: s.imageUrl ?? s.species.photoUrl,
      stage: s.stage as 'FLOWER' | 'FRUIT',
      seenAt: s.stageSeenAt as Date,
      places,
      path:
        s.scene && s.scene.photoTakenAt
          ? `${publicScenePath(org.slug, s.scene.slug, s.scene.primaryCollection?.slug ?? null)}/${s.slug}`
          : `/${org.slug}/specimens/${s.slug}`,
    }
    const group = groups.get(where ?? '') ?? { label, plants: [] }
    group.plants.push(plant)
    groups.set(where ?? '', group)
  }
  const sorted = [...groups.values()].sort((a, b) => a.label.localeCompare(b.label))
  for (const g of sorted) g.plants.sort((a, b) => (a.stage === b.stage ? 0 : a.stage === 'FLOWER' ? -1 : 1))
  const all = sorted.flatMap((g) => g.plants)
  return {
    org,
    place,
    groups: sorted,
    flowerCount: all.filter((p) => p.stage === 'FLOWER').length,
    fruitCount: all.filter((p) => p.stage === 'FRUIT').length,
  }
}
