import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { SceneHeader } from '../scene-header'
import { publicScenePath } from '@/lib/scene-urls'
import { QRPanel } from './qr-panel'

interface SceneQrPageProps {
  params: Promise<{ org: string; id: string }>
}

export default async function SceneQrPage({ params }: SceneQrPageProps) {
  const { org: orgSlug, id: sceneId } = await params
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: { id: true, name: true, slug: true, shortCode: true, active: true, title: true, primaryCollection: { select: { name: true, slug: true } } },
  })
  if (!scene) return notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'

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
        active="qr"
      />
      <QRPanel
        orgSlug={orgSlug}
        sceneId={scene.id}
        sceneName={scene.name}
        sceneSlug={scene.slug}
        shortCode={scene.shortCode}
        siteUrl={siteUrl}
      />
    </div>
  )
}
