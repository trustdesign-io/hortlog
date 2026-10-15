import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { SceneHeader } from '../scene-header'
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
      slug: true,
      perspective: true,
      organisationId: true,
      primaryCollectionId: true,
      primaryCollection: { select: { name: true } },
      _count: { select: { specimens: true } },
    },
  })
  if (!scene) return notFound()

  const collections = await prisma.collection.findMany({
    where: { organisationId: scene.organisationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <SceneHeader
        orgSlug={orgSlug}
        sceneId={scene.id}
        name={scene.name}
        collectionName={scene.primaryCollection?.name ?? null}
        active="details"
      />
      <SceneDetailsForm
        orgSlug={orgSlug}
        scene={{
          id: scene.id,
          name: scene.name,
          primaryCollectionId: scene.primaryCollectionId,
          perspective: scene.perspective,
          plantCount: scene._count.specimens,
        }}
        collections={collections}
      />
    </div>
  )
}
