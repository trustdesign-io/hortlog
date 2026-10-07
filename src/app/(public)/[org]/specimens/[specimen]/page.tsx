import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SpecimenDetail, specimenJsonLd } from '@/app/(public)/specimen-detail'

interface PublicSpecimenPageProps {
  params: Promise<{ org: string; specimen: string }>
}

const resolveData = cache(async function resolveData(orgSlug: string, specimenSlug: string) {
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!org) return null

  const specimen = await prisma.specimen.findUnique({
    where: { slug_organisationId: { slug: specimenSlug, organisationId: org.id } },
    select: {
      id: true,
      slug: true,
      accessionNumber: true,
      notes: true,
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

  return { org, specimen }
})

export async function generateMetadata({ params }: PublicSpecimenPageProps) {
  const { org, specimen: specimenSlug } = await params
  const data = await resolveData(org, specimenSlug)
  if (!data) return {}

  return {
    title: `${data.specimen.species.commonName} — ${data.org.name}`,
    description: data.specimen.species.description?.slice(0, 160) ?? undefined,
  }
}

export default async function PublicSpecimenPage({ params }: PublicSpecimenPageProps) {
  const { org: orgSlug, specimen: specimenSlug } = await params

  const data = await resolveData(orgSlug, specimenSlug)
  if (!data) return notFound()

  const { org, specimen } = data

  const breadcrumbs = [
    { label: org.name, href: `/${orgSlug}` },
    { label: specimen.species.commonName, href: `/${orgSlug}/specimens/${specimenSlug}` },
  ]

  const jsonLd = specimenJsonLd(
    specimen.species.scientificName,
    specimen.species.commonName,
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpecimenDetail
        species={specimen.species}
        specimen={{ accessionNumber: specimen.accessionNumber, notes: specimen.notes }}
        breadcrumbs={breadcrumbs}
        backHref={`/${orgSlug}`}
      />
    </>
  )
}
