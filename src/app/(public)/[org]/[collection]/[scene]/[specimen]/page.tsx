import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SpecimenDetail, specimenJsonLdString } from '@/app/(public)/specimen-detail'
import { GaEvent } from '@/components/ga-event'
import { truncateDescription } from '@/lib/seo'
import { getCurrentUser } from '@/lib/auth/current-user'
import { SpecimenWorkHistory } from '@/components/specimen-work-history'
import { SpecimenCare } from '@/components/specimen-care'

interface PublicSpecimenInScenePageProps {
  params: Promise<{
    org: string
    collection: string
    scene: string
    specimen: string
  }>
}

const resolveData = cache(async function resolveData(
  orgSlug: string,
  collectionSlug: string,
  sceneSlug: string,
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

  const scene = await prisma.scene.findFirst({
    where: { slug: sceneSlug, organisationId: org.id, primaryCollectionId: collection.id },
    select: { id: true, name: true, slug: true },
  })
  if (!scene) return null

  const specimen = await prisma.specimen.findUnique({
    where: { slug_organisationId: { slug: specimenSlug, organisationId: org.id } },
    select: {
      id: true,
      slug: true,
      accessionNumber: true,
      cultivar: true,
      notes: true,
      imageUrl: true,
      sceneId: true,
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
        },
      },
    },
  })
  if (!specimen) return null

  // Specimen must belong to this specific scene
  if (specimen.sceneId !== scene.id) return null

  return { org, collection, scene, specimen }
})

export async function generateMetadata({ params }: PublicSpecimenInScenePageProps) {
  const { org: orgSlug, collection: collectionSlug, scene: sceneSlug, specimen: specimenSlug } = await params
  const data = await resolveData(orgSlug, collectionSlug, sceneSlug, specimenSlug)
  if (!data) return {}

  const { scientificName, commonName, description } = data.specimen.species
  const title = `${scientificName} — ${commonName}`
  const metaDescription = description
    ? truncateDescription(description)
    : `${commonName} specimen record at ${data.org.name}.`
  const canonical = `/${orgSlug}/${collectionSlug}/${sceneSlug}/${specimenSlug}`

  return {
    title,
    description: metaDescription,
    alternates: { canonical },
    openGraph: { title, description: metaDescription },
  }
}

export default async function PublicSpecimenInScenePage({
  params,
}: PublicSpecimenInScenePageProps) {
  const { org: orgSlug, collection: collectionSlug, scene: sceneSlug, specimen: specimenSlug } =
    await params

  const [data, currentUser] = await Promise.all([
    resolveData(orgSlug, collectionSlug, sceneSlug, specimenSlug),
    getCurrentUser(),
  ])
  if (!data) return notFound()

  const { org, collection, scene, specimen } = data
  const isMember = currentUser?.memberships.some((m) => m.organisation.slug === orgSlug) ?? false
  const scenePath = `/${orgSlug}/${collectionSlug}/${sceneSlug}`

  const breadcrumbs = [
    { label: org.name, href: `/${orgSlug}` },
    { label: collection.name, href: `/${orgSlug}/${collectionSlug}` },
    { label: scene.name, href: scenePath },
    { label: specimen.species.commonName, href: `${scenePath}/${specimenSlug}` },
  ]

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
        specimen={{
          accessionNumber: specimen.accessionNumber,
          notes: specimen.notes,
          imageUrl: specimen.imageUrl,
          cultivar: specimen.cultivar,
        }}
        breadcrumbs={breadcrumbs}
        backHref={scenePath}
      >
        <SpecimenCare specimenId={specimen.id} audience={isMember ? 'members' : 'public'} />
        {isMember && currentUser && (
          <SpecimenWorkHistory orgSlug={orgSlug} specimenId={specimen.id} userId={currentUser.id} />
        )}
      </SpecimenDetail>
    </>
  )
}
