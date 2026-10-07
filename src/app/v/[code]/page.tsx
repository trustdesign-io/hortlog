import { notFound } from 'next/navigation'
import { GoogleAnalytics } from '@next/third-parties/google'
import { prisma } from '@/lib/prisma'
import { QrRedirect } from './qr-redirect'

interface ShortLinkPageProps {
  params: Promise<{ code: string }>
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { code } = await params

  const view = await prisma.view.findUnique({
    where: { shortCode: code },
    select: {
      slug: true,
      organisation: { select: { slug: true } },
      primaryCollection: { select: { slug: true } },
    },
  })

  if (!view) return notFound()

  const orgSlug = view.organisation.slug
  const viewSlug = view.slug
  const collectionSlug = view.primaryCollection?.slug

  const destination = collectionSlug
    ? `/${orgSlug}/${collectionSlug}/${viewSlug}`
    : `/${orgSlug}/views/${viewSlug}`

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <>
      {gaId && <GoogleAnalytics gaId={gaId} />}
      <QrRedirect destination={destination} shortCode={code} />
    </>
  )
}
