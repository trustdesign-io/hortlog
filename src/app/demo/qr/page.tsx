import { notFound } from 'next/navigation'
import { SceneHeader } from '@/app/(app)/[org]/scenes/[id]/scene-header'
import { QRPanel } from '@/app/(app)/[org]/scenes/[id]/qr/qr-panel'
import { DEMO_ORG, loadDemo } from '../demo-data'

export default async function DemoQrPage() {
  const demo = await loadDemo()
  if (!demo) return notFound()
  const { scene } = demo
  return (
    <div className="space-y-6">
      <SceneHeader
        demo
        orgSlug={DEMO_ORG}
        sceneId={scene.id}
        name={scene.name}
        title={scene.title}
        collectionName={scene.primaryCollection?.name ?? null}
        isActive={scene.active}
        publicPath={demo.publicPath}
        active="qr"
      />
      <QRPanel
        demo
        orgSlug={DEMO_ORG}
        sceneId={scene.id}
        sceneName={scene.name}
        sceneSlug={scene.slug}
        shortCode={scene.shortCode}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'}
      />
    </div>
  )
}
