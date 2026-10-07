import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { ChevronLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { CreateSpeciesDialog, SpeciesAdminList } from './species-admin'

const PAGE_SIZE = 50

interface AdminSpeciesPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminSpeciesPage({ searchParams }: AdminSpeciesPageProps) {
  const user = await requireAuth()
  if (!isAdmin(user)) return notFound()

  const { q, page: pageParam } = await searchParams
  const query = q?.trim() ?? ''
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const where = query
    ? {
        OR: [
          { commonName: { contains: query, mode: 'insensitive' as const } },
          { scientificName: { contains: query, mode: 'insensitive' as const } },
          { family: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [species, total] = await Promise.all([
    prisma.species.findMany({
      where,
      orderBy: { commonName: 'asc' },
      skip,
      take: PAGE_SIZE,
      include: { _count: { select: { specimens: true } } },
    }),
    prisma.species.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (params.q) sp.set('q', params.q)
    if (params.page && params.page !== '1') sp.set('page', params.page)
    const s = sp.toString()
    return `/admin/species${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Species</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? 'species' : 'species total'}
          </p>
        </div>
        <CreateSpeciesDialog />
      </div>

      {/* Search */}
      <form method="get" action="/admin/species" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name, scientific name, or family…"
          className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search species"
        />
        <button
          type="submit"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Search
        </button>
        {query && (
          <Link href="/admin/species" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Clear
          </Link>
        )}
      </form>

      <SpeciesAdminList species={species} />

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ q: query || undefined, page: String(page - 1) })}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ q: query || undefined, page: String(page + 1) })}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
