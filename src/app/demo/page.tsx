import { notFound } from 'next/navigation'
import { SceneHeader } from '@/app/(app)/[org]/scenes/[id]/scene-header'
import { DemoSceneEditor } from './demo-scene-editor'
import { DEMO_ORG, loadDemo } from './demo-data'

/** The demo's Layout tab: the bed photo with every plant marked, ready to tap. */
export default async function DemoLayoutPage() {
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
        active="layout"
      />
      <DemoSceneEditor snap={demo.snap} sceneId={scene.id} photoUrl={demo.photoUrl} />
    </div>
  )
}
