import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SceneSpecimenPage } from '@/app/(public)/[org]/[collection]/[scene]/[specimen]/scene-specimen-page'
import { DEMO_GARDEN_NAME, DEMO_ORG, DEMO_VISIT_PATH, loadDemo } from '../../demo-data'

export const metadata: Metadata = {
  title: 'Demo: a plant',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface DemoPlantPageProps {
  params: Promise<{ specimen: string }>
}

/** A plant in the demo scene, as a visitor sees it */
export default async function DemoPlantPage({ params }: DemoPlantPageProps) {
  const { specimen } = await params
  const demo = await loadDemo()
  if (!demo) return notFound()
  return (
    <SceneSpecimenPage
      orgSlug={DEMO_ORG}
      collectionSlug={demo.scene.primaryCollection?.slug ?? null}
      sceneSlug={demo.scene.slug}
      specimenSlug={specimen}
      demo={{ gardenName: DEMO_GARDEN_NAME, scenePath: DEMO_VISIT_PATH }}
    />
  )
}
