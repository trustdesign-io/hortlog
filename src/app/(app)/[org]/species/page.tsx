import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { SpeciesBrowser } from './species-browser'

interface SpeciesPageProps {
  params: Promise<{ org: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function SpeciesPage({ params, searchParams }: SpeciesPageProps) {
  const { org: orgSlug } = await params
  const { q } = await searchParams
  await requireOrgAccess(orgSlug, 'can_edit_view')

  const query = q?.trim() ?? ''

  const species = await prisma.species.findMany({
    where: query
      ? {
          OR: [
            { commonName: { contains: query, mode: 'insensitive' } },
            { scientificName: { contains: query, mode: 'insensitive' } },
            { family: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { commonName: 'asc' },
    take: 100,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-medium">Species</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the shared species catalogue used when adding specimens.
        </p>
      </div>
      <SpeciesBrowser species={species} initialQuery={query} />
    </div>
  )
}
