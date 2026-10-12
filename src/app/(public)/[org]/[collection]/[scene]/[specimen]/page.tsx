import { sceneSpecimenMetadata, SceneSpecimenPage } from './scene-specimen-page'

interface PublicSpecimenInScenePageProps {
  params: Promise<{ org: string; collection: string; scene: string; specimen: string }>
}

export async function generateMetadata({ params }: PublicSpecimenInScenePageProps) {
  const { org, collection, scene, specimen } = await params
  return sceneSpecimenMetadata({ orgSlug: org, collectionSlug: collection, sceneSlug: scene, specimenSlug: specimen })
}

export default async function PublicSpecimenInScenePage({ params }: PublicSpecimenInScenePageProps) {
  const { org, collection, scene, specimen } = await params
  return <SceneSpecimenPage orgSlug={org} collectionSlug={collection} sceneSlug={scene} specimenSlug={specimen} />
}
