import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { GridEditor } from './grid-editor'
import { ScenePhotoCard } from '@/components/scene-photo-card'
import { NamePlants, type PlantToName } from './name-plants'
import { parseGridCell } from '@/lib/scene-grid'
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
        extraCells: true,
        accessionNumber: true,
        imageUrl: true,
        notes: true,
        photoX: true,
        photoY: true,
        species: { select: { commonName: true, scientificName: true, photoUrl: true, slug: true } },
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

  // Plants still to name, in grid order, with what they were called when added
  const toName: PlantToName[] = placedSpecimens
    .filter((s) => s.species.slug === 'unidentified' && s.gridCell)
    .map((s) => {
      const lines = (s.notes ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
      const field = lines.find((l) => l.startsWith('Field name: '))?.slice('Field name: '.length)
      const note = lines
        .filter((l) => !l.startsWith('Field name: '))
        .join(' ')
        .replace(/^Added from the bed photo\.\s*/, '')
      return {
        id: s.id,
        gridCell: s.gridCell as string,
        fieldName: field ?? 'Unidentified plant',
        note: note || null,
        photo: s.photoX !== null && s.photoY !== null ? ([s.photoX, s.photoY] as [number, number]) : null,
      }
    })
    .sort((a, b) => {
      const pa = parseGridCell(a.gridCell)
      const pb = parseGridCell(b.gridCell)
      return (pa?.row ?? 0) - (pb?.row ?? 0) || (pa?.col ?? 0) - (pb?.col ?? 0) || (pa?.sub ?? -1) - (pb?.sub ?? -1)
    })

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
          extraCells: s.extraCells,
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
      <NamePlants org={orgSlug} sceneId={scene.id} plants={toName} />
      <ScenePhotoCard org={orgSlug} sceneId={scene.id} />
    </div>
  )
}
