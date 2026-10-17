import { notFound } from 'next/navigation'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { buildOrgSnapshot } from '@/lib/offline/snapshot'
import { prisma } from '@/lib/prisma'
import { publicScenePath } from '@/lib/scene-urls'
import { SceneHeader } from '../scene-header'
import { LiveSceneEditor } from './live-scene-editor'

interface SceneEditPageProps {
  params: Promise<{ org: string; id: string }>
}

/** A scene is its bed photo, with each plant marked on it. */
export default async function SceneEditPage({ params }: SceneEditPageProps) {
  const { org: orgSlug, id: sceneId } = await params
  const { user } = await requireOrgAccess(orgSlug, 'can_edit_scene')

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      title: true,
      primaryCollection: { select: { name: true, slug: true } },
    },
  })
  if (!scene) return notFound()

  // The same copy the offline app uses, so the editor works the same either way
  const snap = await buildOrgSnapshot(orgSlug, { id: user.id, name: user.name }, canManageOrg(user, orgSlug))
  if (!snap) return notFound()

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
      <LiveSceneEditor snap={snap} sceneId={scene.id} />
    </div>
  )
}
