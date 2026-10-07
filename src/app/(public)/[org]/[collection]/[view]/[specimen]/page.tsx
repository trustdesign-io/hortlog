import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SpecimenDetail, specimenJsonLdString } from '@/app/(public)/specimen-detail'

interface PublicSpecimenInViewPageProps {
  params: Promise<{
    org: string
    collection: string
    view: string
    specimen: string
  }>
}

const resolveData = cache(async function resolveData(
  orgSlug: string,
  collectionSlug: string,
  viewSlug: string,
  specimenSlug: string,
) {
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
    where: { slug: viewSlug, organisationId: org.id, primaryCollectionId: collection.id },
    select: { id: true, name: true, slug: true },
  })
  if (!view) return null

  const specimen = await prisma.specimen.findUnique({
    where: { slug_organisationId: { slug: specimenSlug, organisationId: org.id } },
    select: {
      id: true,
      slug: true,
      accessionNumber: true,
      notes: true,
      viewId: true,
      species: {
        select: {
          commonName: true,
          scientificName: true,
          family: true,
          origin: true,
          description: true,
          conservationStatus: true,
        },
      },
    },
  })
  if (!specimen) return null

  // Specimen must belong to this specific view
  if (specimen.viewId !== view.id) return null

  return { org, collection, view, specimen }
})

export async function generateMetadata({ params }: PublicSpecimenInViewPageProps) {
  const { org, collection, view, specimen: specimenSlug } = await params
  const data = await resolveData(org, collection, view, specimenSlug)
  if (!data) return {}

  return {
    title: `${data.specimen.species.commonName} — ${data.view.name}`,
    description: data.specimen.species.description?.slice(0, 160) ?? undefined,
  }
}

export default async function PublicSpecimenInViewPage({
  params,
}: PublicSpecimenInViewPageProps) {
  const { org: orgSlug, collection: collectionSlug, view: viewSlug, specimen: specimenSlug } =
    await params

  const data = await resolveData(orgSlug, collectionSlug, viewSlug, specimenSlug)
  if (!data) return notFound()

  const { org, collection, view, specimen } = data
  const viewPath = `/${orgSlug}/${collectionSlug}/${viewSlug}`

  const breadcrumbs = [
    { label: org.name, href: `/${orgSlug}` },
    { label: collection.name, href: `/${orgSlug}/${collectionSlug}` },
    { label: view.name, href: viewPath },
    { label: specimen.species.commonName, href: `${viewPath}/${specimenSlug}` },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: specimenJsonLdString(
            specimen.species.scientificName,
            specimen.species.commonName,
          ),
        }}
      />
      <SpecimenDetail
        species={specimen.species}
        specimen={{ accessionNumber: specimen.accessionNumber, notes: specimen.notes }}
        breadcrumbs={breadcrumbs}
        backHref={viewPath}
      />
    </>
  )
}
