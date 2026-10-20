import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Flower2, Leaf } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { locationPath, withinIds } from '@/lib/locations'
import { freshSince, seenLabel, STAGE_LABELS } from '@/lib/plant-stage'
import { publicScenePath } from '@/lib/scene-urls'
import { distinctCommonName } from '@/lib/species-name'
import { ScientificName } from '@/components/ui/scientific-name'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { GaEvent } from '@/components/ga-event'

interface FloweringPageProps {
  params: Promise<{ org: string }>
  /** `in`: a location id, to show that place and everywhere inside it */
  searchParams: Promise<{ in?: string }>
}

async function resolve(orgSlug: string, inId: string | undefined) {
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!org) return null
  const locations = await prisma.location.findMany({
    where: { organisationId: org.id },
    select: { id: true, name: true, parentId: true },
  })
  const place = inId ? (locations.find((l) => l.id === inId) ?? null) : null
  return { org, locations, place }
}

export async function generateMetadata({ params, searchParams }: FloweringPageProps) {
  const { org: orgSlug } = await params
  const data = await resolve(orgSlug, (await searchParams).in)
  if (!data) return {}
  const where = data.place?.name ?? data.org.name
  return {
    title: `In flower now — ${where}`,
    description: `What’s flowering and fruiting at ${where} this week, recorded by the garden team.`,
  }
}

/** What's in flower and fruit now, by place, as recorded by the garden's team. */
export default async function FloweringPage({ params, searchParams }: FloweringPageProps) {
  const { org: orgSlug } = await params
  const data = await resolve(orgSlug, (await searchParams).in)
  if (!data) return notFound()
  const { org, locations, place } = data

  const specimens = await prisma.specimen.findMany({
    where: {
      organisationId: org.id,
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
      cultivar: true,
      imageUrl: true,
      stage: true,
      stageSeenAt: true,
      locationId: true,
      species: { select: { commonName: true, scientificName: true, photoUrl: true } },
      scene: {
        select: { slug: true, locationId: true, photoTakenAt: true, primaryCollection: { select: { slug: true } } },
      },
    },
  })

  const inside = place ? new Set(withinIds(locations, place.id)) : null
  const placed = specimens
    .map((s) => ({ ...s, where: s.locationId ?? s.scene?.locationId ?? null }))
    .filter((s) => !inside || (s.where !== null && inside.has(s.where)))

  // Grouped by place, outermost first, e.g. "Arid › Madagascar"; flowers before fruit
  const groups = new Map<string, { label: string; plants: typeof placed }>()
  for (const s of placed) {
    const path = locationPath(locations, s.where)
    const fromPlace = place ? path.slice(path.findIndex((l) => l.id === place.id)) : path
    const label = fromPlace.length > 0 ? fromPlace.map((l) => l.name).join(' › ') : 'Elsewhere in the garden'
    const key = s.where ?? ''
    const group = groups.get(key) ?? { label, plants: [] }
    group.plants.push(s)
    groups.set(key, group)
  }
  const sorted = [...groups.values()].sort((a, b) => a.label.localeCompare(b.label))
  for (const g of sorted) g.plants.sort((a, b) => (a.stage === b.stage ? 0 : a.stage === 'FLOWER' ? -1 : 1))

  const hrefOf = (s: (typeof placed)[number]) =>
    s.scene && s.scene.photoTakenAt
      ? `${publicScenePath(org.slug, s.scene.slug, s.scene.primaryCollection?.slug ?? null)}/${s.slug}`
      : `/${org.slug}/specimens/${s.slug}`

  const flowerCount = placed.filter((s) => s.stage === 'FLOWER').length

  return (
    <div data-daylight="" className="mx-auto max-w-2xl space-y-5 px-4 pb-10 pt-4 sm:px-6">
      <GaEvent name="flowering_view" params={{ org: orgSlug, location: place?.id ?? 'all' }} />
      <header className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <Leaf className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{org.name}</span>
        </p>
        <h1 className="font-heading text-2xl leading-tight text-balance sm:text-3xl">
          In flower now{place ? ` in ${place.name}` : ''}
        </h1>
        <p className="text-base text-muted-foreground">
          {placed.length === 0
            ? 'Nothing has been recorded in flower here in the last three weeks.'
            : `${flowerCount} in flower${placed.length > flowerCount ? `, ${placed.length - flowerCount} in fruit` : ''}, recorded by the garden team in the last three weeks.`}
        </p>
        {place && (
          <Link href={`/${org.slug}/flowering`} className="inline-block text-sm text-primary underline underline-offset-2">
            Everywhere at {org.name}
          </Link>
        )}
      </header>

      {sorted.map((group) => (
        <section key={group.label} aria-label={group.label} className="space-y-2">
          <h2 className="font-heading text-lg">{group.label}</h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {group.plants.map((s) => {
              const common = distinctCommonName(s.species)
              return (
                <li key={s.id}>
                  <Link
                    href={hrefOf(s)}
                    className="flex min-h-16 items-center gap-3 px-3 py-2 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <SpecimenImage imageUrl={s.imageUrl ?? s.species.photoUrl} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <ScientificName className="block truncate font-medium leading-tight">{s.species.scientificName}</ScientificName>
                      <span className="block truncate text-sm text-muted-foreground">
                        {common && `${common} · `}
                        <span className={s.stage === 'FLOWER' ? 'font-medium text-pink-700' : undefined}>
                          {s.stage === 'FLOWER' && <Flower2 className="mr-0.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />}
                          {STAGE_LABELS[s.stage ?? 'FLOWER']}
                        </span>
                        {s.stageSeenAt && ` · ${seenLabel(s.stageSeenAt)}`}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
