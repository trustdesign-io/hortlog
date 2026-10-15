import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { QrRedirect } from './qr-redirect'
import { publicScenePath } from '@/lib/scene-urls'

interface ShortLinkPageProps {
  params: Promise<{ code: string }>
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  // Codes are stored lowercase; some scanners upper-case the whole link
  const code = (await params).code.toLowerCase()

  const scene = await prisma.scene.findUnique({
    where: { shortCode: code },
    select: {
      slug: true,
      organisation: { select: { slug: true } },
      primaryCollection: { select: { slug: true } },
    },
  })

  if (!scene) return notFound()

  const orgSlug = scene.organisation.slug
  const sceneSlug = scene.slug
  const collectionSlug = scene.primaryCollection?.slug

  const destination = publicScenePath(orgSlug, sceneSlug, collectionSlug ?? null)

  return <QrRedirect destination={destination} shortCode={code} />
}
