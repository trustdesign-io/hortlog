import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SpecimenDetail, specimenJsonLdString } from '@/app/(public)/specimen-detail'
import { GaEvent } from '@/components/ga-event'
import { truncateDescription } from '@/lib/seo'
import { SpecimenCare } from '@/components/specimen-care'
import { publicScenePath } from '@/lib/scene-urls'
import { distinctCommonName } from '@/lib/species-name'
import { LabelReportForm } from '@/components/label-report-form'

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
  const common = distinctCommonName({ scientificName, commonName })
  const title = common ? `${scientificName} — ${common}` : scientificName
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

export async function SceneSpecimenPage({
  orgSlug,
  collectionSlug,
  sceneSlug,
  specimenSlug,
  demo,
}: SceneSpecimenArgs & {
  /** The demo's visitor view: the garden isn't named, nothing is tracked or reported, no care log */
  demo?: { gardenName: string; scenePath: string }
}) {
  const data = await resolveData(orgSlug, collectionSlug, sceneSlug, specimenSlug)
  if (!data) return notFound()

  const { org, collection, scene, specimen } = data
  const scenePath = demo?.scenePath ?? publicScenePath(orgSlug, sceneSlug, collectionSlug)

  const breadcrumbs = demo
    ? [
        { label: demo.gardenName, href: scenePath },
        { label: specimen.species.commonName, href: `${scenePath}/${specimenSlug}` },
      ]
    : [
        { label: org.name, href: `/${orgSlug}` },
        ...(collection ? [{ label: collection.name, href: `/${orgSlug}/${collection.slug}` }] : []),
        { label: scene.name, href: scenePath },
        { label: specimen.species.commonName, href: `${scenePath}/${specimenSlug}` },
      ]

  return (
    <>
      {/* Visitor page, read outdoors: always light */}
      <span data-daylight="" hidden />
      {!demo && <GaEvent name="specimen_view" params={{ specimen_slug: specimenSlug, org: orgSlug }} />}
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
        backHref={scenePath}
        backLabel={scene.title ?? scene.name}
      >
        {/* Reached from a scene: always the visitor's view, even for signed-in members */}
        {!demo && <SpecimenCare specimenId={specimen.id} audience="public" />}
        {!demo && <LabelReportForm orgSlug={orgSlug} specimenId={specimen.id} audience="visitor" />}
      </SpecimenDetail>
    </>
  )
}
