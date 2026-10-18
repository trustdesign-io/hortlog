import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { SceneHeader } from '../scene-header'
import { publicScenePath } from '@/lib/scene-urls'
import { SceneDetailsForm } from './scene-details-form'

interface SceneDetailsPageProps {
  params: Promise<{ org: string; id: string }>
}

export default async function SceneDetailsPage({ params }: SceneDetailsPageProps) {
  const { org: orgSlug, id: sceneId } = await params
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: {
      id: true,
      name: true,
      title: true,
      slug: true,
      perspective: true,
      organisationId: true,
      primaryCollectionId: true,
      locationId: true,
      active: true, primaryCollection: { select: { name: true, slug: true } },
      _count: { select: { specimens: true } },
    },
  })
  if (!scene) return notFound()

  const [collections, locations] = await Promise.all([
    prisma.collection.findMany({
      where: { organisationId: scene.organisationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.location.findMany({
      where: { organisationId: scene.organisationId },
      select: { id: true, name: true, parentId: true },
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
        active="details"
      />
      <SceneDetailsForm
        orgSlug={orgSlug}
        scene={{
          id: scene.id,
          name: scene.name,
          title: scene.title,
          primaryCollectionId: scene.primaryCollectionId,
          locationId: scene.locationId,
          perspective: scene.perspective,
          plantCount: scene._count.specimens,
        }}
        collections={collections}
        locations={locations}
      />
    </div>
  )
}
