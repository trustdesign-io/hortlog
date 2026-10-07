import { cache, Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ScientificName } from '@/components/ui/scientific-name'
import { ViewTabNav } from './view-tab-nav'
import { PublicViewGrid } from './public-view-grid'
import { GaEvent } from '@/components/ga-event'

interface PublicViewPageProps {
  params: Promise<{ org: string; collection: string; view: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Pick<PublicViewPageProps, 'params'>) {
  const { org: orgSlug, collection: collectionSlug, view: viewSlug } = await params

  const data = await resolveView(orgSlug, collectionSlug, viewSlug)
  if (!data) return {}

  return {
    title: `${data.view.name} — ${data.org.name}`,
    description: `Browse specimens in ${data.view.name}`,
  }
}

const resolveView = cache(async function resolveView(orgSlug: string, collectionSlug: string, viewSlug: string) {
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

  const view = await prisma.view.findFirst({
    where: {
      slug: viewSlug,
      organisationId: org.id,
      primaryCollectionId: collection.id,
    },
    select: { id: true, name: true, slug: true, gridRows: true, gridCols: true },
  })
  if (!view) return null

  return { org, collection, view }
})

export default async function PublicViewPage({ params, searchParams }: PublicViewPageProps) {
  const { org: orgSlug, collection: collectionSlug, view: viewSlug } = await params
  const rawTab = (await searchParams).tab
  const tab = rawTab === 'grid' ? 'grid' : 'list'

  const data = await resolveView(orgSlug, collectionSlug, viewSlug)
  if (!data) return notFound()

  const { org, collection, view } = data

  const specimens = await prisma.specimen.findMany({
    where: { viewId: view.id, organisationId: org.id },
    select: {
      id: true,
      slug: true,
      accessionNumber: true,
      gridCell: true,
      species: {
        select: {
          commonName: true,
          scientificName: true,
          description: true,
        },
      },
    },
    orderBy: { species: { commonName: 'asc' } },
    take: 500,
  })

  const basePath = `/${orgSlug}/${collectionSlug}/${viewSlug}`

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <GaEvent name="view_page_load" params={{ view_id: view.id, org: orgSlug }} />
      {/* Header */}
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {org.name} · {collection.name}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-medium">{view.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {specimens.length} {specimens.length === 1 ? 'specimen' : 'specimens'}
        </p>
      </header>

      {/* Tab switcher */}
      <Suspense fallback={<div className="h-[42px] rounded-xl border bg-muted" />}>
        <ViewTabNav basePath={basePath} />
      </Suspense>

      {/* Content */}
      <div className="mt-4">
        {tab === 'list' && (
          <SpecimenList specimens={specimens} basePath={basePath} />
        )}
        {tab === 'grid' && (
          <PublicViewGrid
            rows={view.gridRows}
            cols={view.gridCols}
            specimens={specimens
              .filter((s): s is typeof s & { gridCell: string } => s.gridCell !== null)
              .map((s) => ({
                id: s.id,
                slug: s.slug,
                gridCell: s.gridCell,
                commonName: s.species.commonName,
                scientificName: s.species.scientificName,
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
        No specimens have been added to this view yet.
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
