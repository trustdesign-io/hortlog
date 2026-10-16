import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { GridEditor } from './grid-editor'
import { ScenePhotoCard } from '@/components/scene-photo-card'
import { SceneHeader } from '../scene-header'
import { publicScenePath } from '@/lib/scene-urls'

interface SceneEditPageProps {
  params: Promise<{ org: string; id: string }>
}

export default async function SceneEditPage({ params }: SceneEditPageProps) {
  const { org: orgSlug, id: sceneId } = await params
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const scene = await prisma.scene.findUnique({
    where: { id: sceneId, organisationId: org.id },
    select: {
      id: true,
      name: true,
      slug: true,
      perspective: true,
      gridRows: true,
      gridCols: true,
      rowShift: true,
      splitCells: true,
      blockedCells: true,
      active: true, title: true, primaryCollection: { select: { name: true, slug: true } },
    },
  })
  if (!scene) return notFound()

  const [placedSpecimens, availableSpecimens] = await Promise.all([
    prisma.specimen.findMany({
      where: { organisationId: org.id, sceneId },
      select: {
        id: true,
        gridCell: true,
        accessionNumber: true,
        imageUrl: true,
        species: { select: { commonName: true, scientificName: true, photoUrl: true } },
      },
    }),
    prisma.specimen.findMany({
      where: { organisationId: org.id, sceneId: null },
      select: {
        id: true,
        accessionNumber: true,
        imageUrl: true,
        species: { select: { commonName: true, scientificName: true, photoUrl: true } },
      },
      orderBy: { species: { commonName: 'asc' } },
    }),
  ])

  return (
    <div className="space-y-6">
      <SceneHeader
        orgSlug={orgSlug}
        sceneId={scene.id}
        name={scene.name}
        collectionName={scene.primaryCollection?.name ?? null}
        isActive={scene.active}
        title={scene.title}
        publicPath={publicScenePath(orgSlug, scene.slug, scene.primaryCollection?.slug ?? null)}
        active="layout"
      />
      <GridEditor
        orgSlug={orgSlug}
        sceneId={scene.id}
        gridRows={scene.gridRows}
        gridCols={scene.gridCols}
        rowShift={scene.rowShift}
        splitCells={scene.splitCells}
        blockedCells={scene.blockedCells}
        perspective={scene.perspective}
        placedSpecimens={placedSpecimens.map((s) => ({
          id: s.id,
          gridCell: s.gridCell!,
          accessionNumber: s.accessionNumber,
          commonName: s.species.commonName,
          scientificName: s.species.scientificName,
          thumbnailUrl: s.imageUrl ?? s.species.photoUrl,
        }))}
        availableSpecimens={availableSpecimens.map((s) => ({
          id: s.id,
          accessionNumber: s.accessionNumber,
          commonName: s.species.commonName,
          scientificName: s.species.scientificName,
          thumbnailUrl: s.imageUrl ?? s.species.photoUrl,
        }))}
      />
      <ScenePhotoCard org={orgSlug} sceneId={scene.id} />
    </div>
  )
}
