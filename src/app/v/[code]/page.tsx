import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { QrRedirect } from './qr-redirect'

interface ShortLinkPageProps {
  params: Promise<{ code: string }>
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { code } = await params

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

  const destination = collectionSlug
    ? `/${orgSlug}/${collectionSlug}/${sceneSlug}`
    : `/${orgSlug}/scenes/${sceneSlug}`

  return <QrRedirect destination={destination} shortCode={code} />
}
