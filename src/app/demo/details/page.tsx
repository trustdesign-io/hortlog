import { notFound } from 'next/navigation'
import { SceneHeader } from '@/app/(app)/[org]/scenes/[id]/scene-header'
import { SceneDetailsForm } from '@/app/(app)/[org]/scenes/[id]/details/scene-details-form'
import { DEMO_ORG, loadDemo } from '../demo-data'

// Read live from the database on each visit, never built ahead
export const dynamic = 'force-dynamic'

export default async function DemoDetailsPage() {
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
        active="details"
      />
      <SceneDetailsForm
        demo
        orgSlug={DEMO_ORG}
        scene={{
          id: scene.id,
          name: scene.name,
          title: scene.title,
          primaryCollectionId: scene.primaryCollection?.id ?? null,
          locationId: scene.locationId,
          perspective: scene.perspective,
          plantCount: scene._count.specimens,
        }}
        collections={scene.primaryCollection ? [{ id: scene.primaryCollection.id, name: scene.primaryCollection.name }] : []}
        locations={demo.locations}
      />
    </div>
  )
}
