import { sceneMetadata, ScenePage } from '../../[collection]/[scene]/scene-page'

// A scene with no primary collection. Scenes with one live at /[org]/[collection]/[scene].
interface SceneWithoutCollectionPageProps {
  params: Promise<{ org: string; scene: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Pick<SceneWithoutCollectionPageProps, 'params'>) {
  const { org, scene } = await params
  return sceneMetadata(org, null, scene)
}

export default async function SceneWithoutCollectionPage({ params, searchParams }: SceneWithoutCollectionPageProps) {
  const { org, scene } = await params
  return <ScenePage orgSlug={org} collectionSlug={null} sceneSlug={scene} rawTab={(await searchParams).tab} />
}
