import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SpecimenDetail, specimenJsonLdString } from '@/app/(public)/specimen-detail'
import { GaEvent } from '@/components/ga-event'
import { truncateDescription } from '@/lib/seo'
import { getCurrentUser } from '@/lib/auth/current-user'
import { SpecimenWorkHistory } from '@/components/specimen-work-history'
import { SpecimenCare } from '@/components/specimen-care'
import { distinctCommonName } from '@/lib/species-name'
import { LabelReportForm } from '@/components/label-report-form'
import { LabelIssueBadge } from '@/components/label-issue-badge'
import { PlantStagePicker } from '@/components/plant-stage-picker'
import { PlantStageHistory } from '@/components/plant-stage-history'

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
      cultivar: true,
      notes: true,
      imageUrl: true,
      stage: true,
      stageSeenAt: true,
      species: {
        select: {
          commonName: true,
          scientificName: true,
          family: true,
          origin: true,
          description: true,
          conservationStatus: true,
          photoUrl: true,
          photoAttribution: true,
          photoLicence: true,
          photoSourceUrl: true,
          statusCategory: true,
          statusSource: true,
          statusUpdatedAt: true,
          openDataUpdatedAt: true,
          nativeRegions: true,
          introducedRegions: true,
          lifeForm: true,
          climate: true,
          habitatExcerpt: true,
          habitatExcerptSource: true,
          gbifTaxonKey: true,
          ellenbergL: true,
          ellenbergF: true,
          ellenbergR: true,
          ellenbergN: true,
          ellenbergS: true,
          ellenbergSource: true,
          wcvpStatus: true,
          wcvpAcceptedName: true,
          wcvpAcceptedAuthority: true,
          wcvpPowoUrl: true,
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
  const common = distinctCommonName({ scientificName, commonName })
  const title = common ? `${scientificName} — ${common}` : scientificName
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
      {/* Visitor page, read outdoors: always light */}
      <span data-daylight="" hidden />
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
        specimen={{
          accessionNumber: specimen.accessionNumber,
          notes: specimen.notes,
          imageUrl: specimen.imageUrl,
          cultivar: specimen.cultivar,
          stage: specimen.stage,
          stageSeenAt: specimen.stageSeenAt,
        }}
        breadcrumbs={breadcrumbs}
        backHref={`/${orgSlug}`}
      >
        {isMember && (
          <>
            <PlantStagePicker
              orgSlug={orgSlug}
              specimenId={specimen.id}
              stage={specimen.stage}
              seenAt={specimen.stageSeenAt?.toISOString() ?? null}
            />
            <PlantStageHistory specimenId={specimen.id} />
          </>
        )}
        {isMember && <LabelIssueBadge orgSlug={orgSlug} specimenId={specimen.id} />}
        <SpecimenCare
          specimenId={specimen.id}
          audience={isMember ? 'members' : 'public'}
          viewer={isMember && currentUser ? { id: currentUser.id, name: currentUser.name ?? 'You' } : undefined}
        />
        {isMember && currentUser && (
          <SpecimenWorkHistory
            orgSlug={orgSlug}
            specimenId={specimen.id}
            userId={currentUser.id}
          />
        )}
        <LabelReportForm orgSlug={orgSlug} specimenId={specimen.id} audience={isMember ? 'member' : 'visitor'} />
      </SpecimenDetail>
    </>
  )
}
