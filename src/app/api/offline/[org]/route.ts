import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Rough per-item size estimates (bytes) used for the pre-download warning
const BYTES_PER_PAGE = 60_000
const BYTES_PER_IMAGE = 150_000

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org: orgSlug } = await params

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true },
  })

  if (!org) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const scenes = await prisma.scene.findMany({
    where: { organisationId: org.id },
    select: {
      slug: true,
      shortCode: true,
      primaryCollection: { select: { slug: true } },
      specimens: {
        select: {
          slug: true,
          imageUrl: true,
          species: { select: { photoUrl: true } },
        },
      },
    },
  })

  const urls: string[] = []
  let specimenCount = 0

  for (const scene of scenes) {
    const collectionSlug = scene.primaryCollection?.slug
    if (!collectionSlug) continue

    const sceneBase = `/${orgSlug}/${collectionSlug}/${scene.slug}`

    // Scene page (list and grid tabs)
    urls.push(sceneBase)
    urls.push(`${sceneBase}?tab=grid`)

    // QR redirect shortlink
    urls.push(`/v/${scene.shortCode}`)

    for (const specimen of scene.specimens) {
      urls.push(`${sceneBase}/${specimen.slug}`)
      specimenCount++

      // Specimen image (Supabase storage)
      if (specimen.imageUrl) urls.push(specimen.imageUrl)

      // Species reference photo (iNaturalist / external)
      if (specimen.species.photoUrl) urls.push(specimen.species.photoUrl)
    }
  }

  const pageCount = urls.filter((u) => !u.startsWith('http')).length
  const imageCount = urls.filter((u) => u.startsWith('http')).length
  const estimatedBytes = pageCount * BYTES_PER_PAGE + imageCount * BYTES_PER_IMAGE

  return NextResponse.json({
    orgSlug,
    orgName: org.name,
    urls,
    specimenCount,
    sceneCount: scenes.length,
    estimatedBytes,
  })
}
