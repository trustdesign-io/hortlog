import {
  sceneSpecimenMetadata,
  SceneSpecimenPage,
} from '../../../[collection]/[scene]/[specimen]/scene-specimen-page'

interface SceneWithoutCollectionSpecimenPageProps {
  params: Promise<{ org: string; scene: string; specimen: string }>
}

export async function generateMetadata({ params }: SceneWithoutCollectionSpecimenPageProps) {
  const { org, scene, specimen } = await params
  return sceneSpecimenMetadata({ orgSlug: org, collectionSlug: null, sceneSlug: scene, specimenSlug: specimen })
}

export default async function SceneWithoutCollectionSpecimenPage({ params }: SceneWithoutCollectionSpecimenPageProps) {
  const { org, scene, specimen } = await params
  return <SceneSpecimenPage orgSlug={org} collectionSlug={null} sceneSlug={scene} specimenSlug={specimen} />
}
