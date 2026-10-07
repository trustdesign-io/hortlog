import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { SpecimensList } from './specimens-list'

interface SpecimensPageProps {
  params: Promise<{ org: string }>
  searchParams: Promise<{ q?: string; collectionId?: string; placed?: string }>
}

export default async function SpecimensPage({ params, searchParams }: SpecimensPageProps) {
  const { org: orgSlug } = await params
  const { q, collectionId, placed } = await searchParams
  await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const query = q?.trim() ?? ''
  const placedOnly = placed === 'true'

  const [specimens, collections] = await Promise.all([
    prisma.specimen.findMany({
      where: {
        organisationId: org.id,
        ...(query
          ? {
              OR: [
                { species: { commonName: { contains: query, mode: 'insensitive' } } },
                { species: { scientificName: { contains: query, mode: 'insensitive' } } },
                { accessionNumber: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(collectionId ? { collections: { some: { collectionId } } } : {}),
        ...(placedOnly ? { viewId: { not: null } } : {}),
      },
      select: {
        id: true,
        slug: true,
        accessionNumber: true,
        viewId: true,
        species: { select: { commonName: true, scientificName: true } },
        view: { select: { name: true } },
        collections: { include: { collection: { select: { id: true, name: true } } } },
      },
      orderBy: { species: { commonName: 'asc' } },
      take: 200,
    }),
    prisma.collection.findMany({
      where: { organisationId: org.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Specimens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All plant and specimen records for this organisation.
          </p>
        </div>
        <Link href={`/${orgSlug}/specimens/new`} className={buttonVariants({ size: 'sm' })}>
          Add specimen
        </Link>
      </div>
      <SpecimensList
        orgSlug={orgSlug}
        specimens={specimens}
        collections={collections}
        initialQuery={query}
        initialCollectionId={collectionId ?? ''}
        initialPlaced={placedOnly}
      />
    </div>
  )
}
