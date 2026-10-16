import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SpecimenDetail, specimenJsonLdString } from '@/app/(public)/specimen-detail'
import { GaEvent } from '@/components/ga-event'
import { truncateDescription } from '@/lib/seo'
import { getCurrentUser } from '@/lib/auth/current-user'
import { SpecimenWorkHistory } from '@/components/specimen-work-history'
import { SpecimenCare } from '@/components/specimen-care'
import { publicScenePath } from '@/lib/scene-urls'

const resolveData = cache(async function resolveData(
  orgSlug: string,
  collectionSlug: string | null,
  sceneSlug: string,
  specimenSlug: string,
) {
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!org) return null

  const collection = collectionSlug
    ? await prisma.collection.findUnique({
        where: { slug_organisationId: { slug: collectionSlug, organisationId: org.id } },
        select: { id: true, name: true, slug: true },
      })
    : null
  if (collectionSlug && !collection) return null

  const scene = await prisma.scene.findFirst({
    where: { slug: sceneSlug, organisationId: org.id, primaryCollectionId: collection?.id ?? null },
    select: { id: true, name: true, title: true, slug: true },
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
          statusCategory: true,
          statusSource: true,
          statusUpdatedAt: true,
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
        },
      },
    },
  })
  if (!specimen) return null

  // Specimen must belong to this specific scene
  if (specimen.sceneId !== scene.id) return null

  return { org, collection, scene, specimen }
})

interface SceneSpecimenArgs {
  orgSlug: string
  collectionSlug: string | null
  sceneSlug: string
  specimenSlug: string
}

/** Shared by the scene specimen routes with and without a collection. */
export async function sceneSpecimenMetadata({ orgSlug, collectionSlug, sceneSlug, specimenSlug }: SceneSpecimenArgs) {
  const data = await resolveData(orgSlug, collectionSlug, sceneSlug, specimenSlug)
  if (!data) return {}

  const { scientificName, commonName, description } = data.specimen.species
  const title = `${scientificName} — ${commonName}`
  const metaDescription = description
    ? truncateDescription(description)
    : `${commonName} specimen record at ${data.org.name}.`
  const canonical = `${publicScenePath(orgSlug, sceneSlug, collectionSlug)}/${specimenSlug}`

  return {
    title,
    description: metaDescription,
    alternates: { canonical },
    openGraph: { title, description: metaDescription },
  }
}

export async function SceneSpecimenPage({ orgSlug, collectionSlug, sceneSlug, specimenSlug }: SceneSpecimenArgs) {
  const [data, currentUser] = await Promise.all([
    resolveData(orgSlug, collectionSlug, sceneSlug, specimenSlug),
    getCurrentUser(),
  ])
  if (!data) return notFound()

  const { org, collection, scene, specimen } = data
  const isMember = currentUser?.memberships.some((m) => m.organisation.slug === orgSlug) ?? false
  const scenePath = publicScenePath(orgSlug, sceneSlug, collectionSlug)

  const breadcrumbs = [
    { label: org.name, href: `/${orgSlug}` },
    ...(collection ? [{ label: collection.name, href: `/${orgSlug}/${collection.slug}` }] : []),
    { label: scene.name, href: scenePath },
    { label: specimen.species.commonName, href: `${scenePath}/${specimenSlug}` },
  ]

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
        }}
        breadcrumbs={breadcrumbs}
        backHref={scenePath}
        backLabel={scene.title ?? scene.name}
      >
        <SpecimenCare specimenId={specimen.id} audience={isMember ? 'members' : 'public'} />
        {isMember && currentUser && (
          <SpecimenWorkHistory orgSlug={orgSlug} specimenId={specimen.id} userId={currentUser.id} />
        )}
      </SpecimenDetail>
    </>
  )
}
