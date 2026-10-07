import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, Search, ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 50

interface AdminOrgsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Admin — Organisations' }

export default async function AdminOrgsPage({ searchParams }: AdminOrgsPageProps) {
  const user = await requireAuth()
  if (!isAdmin(user)) return notFound()

  const { q, page: pageParam } = await searchParams
  const search = q?.trim() ?? ''
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [orgs, total] = await Promise.all([
    prisma.organisation.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: { memberships: true, specimens: true, views: true },
        },
      },
    }),
    prisma.organisation.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/species"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-2')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Admin
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-2xl font-medium">Organisations</h1>
          <Link href="/orgs/new" className={buttonVariants({ size: 'sm' })}>
            New organisation
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} organisation{total === 1 ? '' : 's'} on the platform.
        </p>
      </div>

      {/* Search */}
      <form method="get" className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          name="q"
          type="search"
          placeholder="Search by name or slug…"
          defaultValue={search}
          className="pl-9"
          aria-label="Search organisations"
        />
      </form>

      {orgs.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {search ? `No organisations match "${search}".` : 'No organisations yet.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="px-4 py-3 text-left font-medium">Organisation</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Members</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Specimens</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Views</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Created</th>
                <th scope="col" className="sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{org.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {org._count.memberships}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {org._count.specimens}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {org._count.views}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {org.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${org.slug}`}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
                      aria-label={`View ${org.name}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...(search && { q: search }), page: String(page - 1) })}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?${new URLSearchParams({ ...(search && { q: search }), page: String(page + 1) })}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
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
