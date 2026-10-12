import { cache, Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ScientificName } from '@/components/ui/scientific-name'
import { SceneTabNav } from './scene-tab-nav'
import { PublicSceneGrid } from './public-scene-grid'
import { GaEvent } from '@/components/ga-event'
import { CheckInButton } from '@/components/offline/check-in-button'
import { OfflineNotice } from '@/components/offline/offline-notice'

interface PublicScenePageProps {
  params: Promise<{ org: string; collection: string; scene: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Pick<PublicScenePageProps, 'params'>) {
  const { org: orgSlug, collection: collectionSlug, scene: sceneSlug } = await params

  const data = await resolveScene(orgSlug, collectionSlug, sceneSlug)
  if (!data) return {}

  const title = `${data.scene.name} — ${data.org.name}`
  const description = `Browse specimens in the ${data.scene.name} scene from ${data.org.name}.`
  const canonical = `/${orgSlug}/${collectionSlug}/${sceneSlug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description },
  }
}

const resolveScene = cache(async function resolveScene(orgSlug: string, collectionSlug: string, sceneSlug: string) {
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!org) return null

  const collection = await prisma.collection.findUnique({
    where: { slug_organisationId: { slug: collectionSlug, organisationId: org.id } },
    select: { id: true, name: true, slug: true },
  })
  if (!collection) return null

  const scene = await prisma.scene.findFirst({
    where: {
      slug: sceneSlug,
      organisationId: org.id,
      primaryCollectionId: collection.id,
    },
    select: { id: true, name: true, slug: true, gridRows: true, gridCols: true },
  })
  if (!scene) return null

  return { org, collection, scene }
})

export default async function PublicScenePage({ params, searchParams }: PublicScenePageProps) {
  const { org: orgSlug, collection: collectionSlug, scene: sceneSlug } = await params
  const rawTab = (await searchParams).tab
  const tab = rawTab === 'grid' ? 'grid' : 'list'

  const data = await resolveScene(orgSlug, collectionSlug, sceneSlug)
  if (!data) return notFound()

  const { org, collection, scene } = data

  const specimens = await prisma.specimen.findMany({
    where: { sceneId: scene.id, organisationId: org.id },
    select: {
      id: true,
      slug: true,
      accessionNumber: true,
      gridCell: true,
      imageUrl: true,
      species: {
        select: {
          commonName: true,
          scientificName: true,
          description: true,
          photoUrl: true,
        },
      },
    },
    orderBy: { species: { commonName: 'asc' } },
    take: 500,
  })

  const basePath = `/${orgSlug}/${collectionSlug}/${sceneSlug}`

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <GaEvent name="view_page_load" params={{ view_id: scene.id, org: orgSlug }} />
      {/* Header */}
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {org.name} · {collection.name}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-1">
          <div>
            <h1 className="font-heading text-2xl font-medium">{scene.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {specimens.length} {specimens.length === 1 ? 'specimen' : 'specimens'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <OfflineNotice />
            <CheckInButton orgSlug={orgSlug} />
          </div>
        </div>
      </header>

      {/* Tab switcher */}
      <Suspense fallback={<div className="h-[42px] rounded-xl border bg-muted" />}>
        <SceneTabNav basePath={basePath} />
      </Suspense>

      {/* Content */}
      <div className="mt-4">
        {tab === 'list' && (
          <SpecimenList specimens={specimens} basePath={basePath} />
        )}
        {tab === 'grid' && (
          <PublicSceneGrid
            rows={scene.gridRows}
            cols={scene.gridCols}
            specimens={specimens
              .filter((s): s is typeof s & { gridCell: string } => s.gridCell !== null)
              .map((s) => ({
                id: s.id,
                slug: s.slug,
                gridCell: s.gridCell,
                commonName: s.species.commonName,
                scientificName: s.species.scientificName,
                thumbnailUrl: s.imageUrl ?? s.species.photoUrl,
              }))}
            basePath={basePath}
          />
        )}
      </div>
    </div>
  )
}

interface SpecimenEntry {
  id: string
  slug: string
  accessionNumber: string | null
  gridCell: string | null
  species: {
    commonName: string
    scientificName: string
    description: string | null
  }
}

function SpecimenList({
  specimens,
  basePath,
}: {
  specimens: SpecimenEntry[]
  basePath: string
}) {
  if (specimens.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No specimens have been added to this scene yet.
      </p>
    )
  }

  return (
    <ul role="list" className="divide-y rounded-xl border bg-card overflow-hidden">
      {specimens.map((s) => {
        const descriptionSnippet = s.species.description
          ? s.species.description.slice(0, 120) + (s.species.description.length > 120 ? '…' : '')
          : null

        return (
          <li key={s.id}>
            <Link
              href={`${basePath}/${s.slug}`}
              className="flex flex-col gap-0.5 px-4 py-4 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{s.species.commonName}</p>
                {s.accessionNumber && (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    #{s.accessionNumber}
                  </span>
                )}
              </div>
              <ScientificName className="text-xs text-muted-foreground">
                {s.species.scientificName}
              </ScientificName>
              {descriptionSnippet && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {descriptionSnippet}
                </p>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
