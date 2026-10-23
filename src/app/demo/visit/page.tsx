import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ScenePage } from '@/app/(public)/[org]/[collection]/[scene]/scene-page'
import { DEMO_GARDEN_NAME, DEMO_ORG, DEMO_VISIT_PATH, loadDemo } from '../demo-data'

export const metadata: Metadata = {
  title: 'Demo: what visitors see',
  robots: { index: false, follow: false },
}

// Read live from the database on each visit, never built ahead
export const dynamic = 'force-dynamic'

/** What a visitor sees after scanning the demo scene's QR code, without naming the real garden */
export default async function DemoVisitPage() {
  const demo = await loadDemo()
  if (!demo) return notFound()
  return (
    <ScenePage
      orgSlug={DEMO_ORG}
      collectionSlug={demo.scene.primaryCollection?.slug ?? null}
      sceneSlug={demo.scene.slug}
      demo={{ gardenName: DEMO_GARDEN_NAME, basePath: DEMO_VISIT_PATH }}
    />
  )
}
