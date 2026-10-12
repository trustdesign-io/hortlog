import { sceneMetadata, ScenePage } from './scene-page'

interface PublicScenePageProps {
  params: Promise<{ org: string; collection: string; scene: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Pick<PublicScenePageProps, 'params'>) {
  const { org, collection, scene } = await params
  return sceneMetadata(org, collection, scene)
}

export default async function PublicScenePage({ params, searchParams }: PublicScenePageProps) {
  const { org, collection, scene } = await params
  return <ScenePage orgSlug={org} collectionSlug={collection} sceneSlug={scene} rawTab={(await searchParams).tab} />
}
