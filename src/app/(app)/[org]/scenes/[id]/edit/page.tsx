import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { ZoneEditor } from './zone-editor'
import { SceneHeader } from '../scene-header'

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
      gridRows: true,
      gridCols: true,
      primaryCollection: { select: { name: true } },
      zones: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          rows: true,
          cols: true,
          position: true,
          specimens: {
            select: {
              id: true,
              gridCell: true,
              accessionNumber: true,
              imageUrl: true,
              species: { select: { commonName: true, scientificName: true, photoUrl: true } },
            },
          },
        },
      },
    },
  })
  if (!scene) return notFound()

  // If the scene has no zones yet (legacy data), seed a default BED zone.
  // Wrapped in a serialisable transaction so concurrent page opens don't create duplicates.
  if (scene.zones.length === 0) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.sceneZone.count({ where: { sceneId: scene.id } })
      if (existing > 0) return
      const zone = await tx.sceneZone.create({
        data: { name: 'Bed', type: 'BED', rows: scene.gridRows, cols: scene.gridCols, position: 0, sceneId: scene.id },
        select: { id: true },
      })
      await tx.specimen.updateMany({
        where: { sceneId: scene.id, zoneId: null },
        data: { zoneId: zone.id },
      })
    }, { isolationLevel: 'Serializable' })

    // Reload zones after the transaction
    const freshZones = await prisma.sceneZone.findMany({
      where: { sceneId: scene.id },
      orderBy: { position: 'asc' },
      select: {
        id: true, name: true, type: true, rows: true, cols: true, position: true,
        specimens: {
          select: {
            id: true, gridCell: true, accessionNumber: true, imageUrl: true,
            species: { select: { commonName: true, scientificName: true, photoUrl: true } },
          },
        },
      },
    })
    scene.zones.push(...freshZones as typeof scene.zones)
  }

  const availableSpecimens = await prisma.specimen.findMany({
    where: { organisationId: org.id, sceneId: null },
    select: {
      id: true,
      accessionNumber: true,
      imageUrl: true,
      species: { select: { commonName: true, scientificName: true, photoUrl: true } },
    },
    orderBy: { species: { commonName: 'asc' } },
  })

  return (
    <div className="space-y-6">
      <SceneHeader
        orgSlug={orgSlug}
        sceneId={scene.id}
        name={scene.name}
        collectionName={scene.primaryCollection?.name ?? null}
        active="layout"
      />
      <ZoneEditor
        orgSlug={orgSlug}
        sceneId={scene.id}
        zones={scene.zones.map((z) => ({
          id: z.id,
          name: z.name,
          type: z.type,
          rows: z.rows,
          cols: z.cols,
          position: z.position,
          specimens: z.specimens.map((s) => ({
            id: s.id,
            gridCell: s.gridCell!,
            accessionNumber: s.accessionNumber,
            commonName: s.species.commonName,
            scientificName: s.species.scientificName,
            thumbnailUrl: s.imageUrl ?? s.species.photoUrl,
          })),
        }))}
        availableSpecimens={availableSpecimens.map((s) => ({
          id: s.id,
          accessionNumber: s.accessionNumber,
          commonName: s.species.commonName,
          scientificName: s.species.scientificName,
          thumbnailUrl: s.imageUrl ?? s.species.photoUrl,
        }))}
      />
    </div>
  )
}
