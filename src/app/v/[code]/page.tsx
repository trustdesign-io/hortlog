import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

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

  // 307 Temporary Redirect — Next.js redirect() default for dynamic routes.
  // Temporary so that renaming a view doesn't invalidate the short code.
  redirect(destination)
}
