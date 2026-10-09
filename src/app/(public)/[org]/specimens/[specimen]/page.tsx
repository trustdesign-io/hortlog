import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SpecimenDetail, specimenJsonLdString } from '@/app/(public)/specimen-detail'
import { GaEvent } from '@/components/ga-event'
import { truncateDescription } from '@/lib/seo'
import { getCurrentUser } from '@/lib/auth/current-user'
import { SpecimenWorkHistory } from '@/components/specimen-work-history'

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
      imageUrl: true,
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
  const { org: orgSlug, specimen: specimenSlug } = await params
  const data = await resolveData(orgSlug, specimenSlug)
  if (!data) return {}

  const { scientificName, commonName, description } = data.specimen.species
  const title = `${scientificName} — ${commonName}`
  const metaDescription = description
    ? truncateDescription(description)
    : `${commonName} specimen record at ${data.org.name}.`

  return {
    title,
    description: metaDescription,
    alternates: { canonical: `/${orgSlug}/specimens/${specimenSlug}` },
    openGraph: { title, description: metaDescription },
  }
}

export default async function PublicSpecimenPage({ params }: PublicSpecimenPageProps) {
  const { org: orgSlug, specimen: specimenSlug } = await params

  const [data, currentUser] = await Promise.all([
    resolveData(orgSlug, specimenSlug),
    getCurrentUser(),
  ])
  if (!data) return notFound()

  const { org, specimen } = data

  const breadcrumbs = [
    { label: org.name, href: `/${orgSlug}` },
    { label: specimen.species.commonName, href: `/${orgSlug}/specimens/${specimenSlug}` },
  ]

  const isMember = currentUser?.memberships.some((m) => m.organisation.slug === orgSlug)

  return (
    <>
      <GaEvent name="specimen_view" params={{ specimen_slug: specimenSlug, org: orgSlug }} />
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
        specimen={{ accessionNumber: specimen.accessionNumber, notes: specimen.notes, imageUrl: specimen.imageUrl }}
        breadcrumbs={breadcrumbs}
        backHref={`/${orgSlug}`}
      >
        {isMember && currentUser && (
          <SpecimenWorkHistory
            orgSlug={orgSlug}
            specimenId={specimen.id}
            userId={currentUser.id}
          />
        )}
      </SpecimenDetail>
    </>
  )
}
