import { NextResponse } from 'next/server'
import { strToU8, zipSync } from 'fflate'
import { checkOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { locationPath } from '@/lib/locations'
import { emlXml, isDwcLicence, metaXml, occurrenceCsv, publishable, type DwcPlant } from '@/lib/darwin-core'

interface RouteParams {
  params: Promise<{ org: string }>
}

/** The garden's living collection as a Darwin Core Archive, for GBIF or BGCI. Managers only. */
export async function GET(req: Request, { params }: RouteParams) {
  const { org: orgSlug } = await params
  const access = await checkOrgAccess(orgSlug, 'can_edit_org_settings')
  if (!access.allowed) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

  const licence = new URL(req.url).searchParams.get('licence') ?? 'CC-BY'
  if (!isDwcLicence(licence)) return NextResponse.json({ error: 'Unknown licence' }, { status: 400 })

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true, slug: true, name: true, latitude: true, longitude: true },
  })
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [specimens, locations] = await Promise.all([
    prisma.specimen.findMany({
      // Plants no longer in the garden aren't in the living collection
      where: { organisationId: org.id, removedAt: null },
      orderBy: { slug: 'asc' },
      select: {
        slug: true,
        accessionNumber: true,
        latitude: true,
        longitude: true,
        updatedAt: true,
        locationId: true,
        scene: { select: { locationId: true } },
        species: { select: { scientificName: true, authority: true, family: true, ipniId: true } },
      },
    }),
    prisma.location.findMany({ where: { organisationId: org.id }, select: { id: true, name: true, parentId: true } }),
  ])

  const plants: DwcPlant[] = specimens.map((s) => ({
    slug: s.slug,
    accessionNumber: s.accessionNumber,
    scientificName: s.species.scientificName,
    authority: s.species.authority,
    family: s.species.family,
    ipniId: s.species.ipniId,
    places: locationPath(locations, s.locationId ?? s.scene?.locationId ?? null).map((l) => l.name),
    latitude: s.latitude,
    longitude: s.longitude,
    updatedAt: s.updatedAt,
  }))
  const garden = {
    slug: org.slug,
    name: org.name,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com',
    latitude: org.latitude,
    longitude: org.longitude,
  }
  const now = new Date()
  const zip = zipSync({
    'occurrence.csv': strToU8(occurrenceCsv(plants, garden)),
    'meta.xml': strToU8(metaXml()),
    'eml.xml': strToU8(emlXml(garden, licence, plants.filter(publishable).length, now)),
  })

  return new NextResponse(Buffer.from(zip), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${org.slug}-darwin-core-${now.toISOString().slice(0, 10)}.zip"`,
      'Cache-Control': 'no-store',
    },
  })
}
