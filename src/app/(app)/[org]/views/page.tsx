import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button-variants'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ViewsPageProps {
  params: Promise<{ org: string }>
  searchParams: Promise<{ filter?: string }>
}

export default async function ViewsPage({ params, searchParams }: ViewsPageProps) {
  const [{ org: orgSlug }, { filter }] = await Promise.all([params, searchParams])
  const { user } = await requireOrgAccess(orgSlug, 'can_edit_view')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const isMineFilter = filter === 'mine'

  const views = await prisma.view.findMany({
    where: {
      organisationId: org.id,
      ...(isMineFilter ? { assignments: { some: { userId: user.id } } } : {}),
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      shortCode: true,
      gridRows: true,
      gridCols: true,
      primaryCollection: { select: { name: true } },
      _count: { select: { specimens: true } },
      assignments: {
        take: 4,
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { assignedAt: 'asc' },
      },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Views</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grid displays shown on Vantage screens.
          </p>
        </div>
        <Link href={`/${orgSlug}/views/new`} className={buttonVariants({ size: 'sm' })}>
          New view
        </Link>
      </div>

      {/* Filter toggle */}
      <div className="flex gap-2">
        <Link
          href={`/${orgSlug}/views`}
          className={cn(
            buttonVariants({ variant: isMineFilter ? 'outline' : 'secondary', size: 'sm' }),
          )}
        >
          All views
        </Link>
        <Link
          href={`/${orgSlug}/views?filter=mine`}
          className={cn(
            buttonVariants({ variant: isMineFilter ? 'secondary' : 'outline', size: 'sm' }),
          )}
        >
          Assigned to me
        </Link>
      </div>

      {views.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {isMineFilter ? 'No views assigned to you.' : 'No views yet.'}
          </p>
          {!isMineFilter && (
            <Link
              href={`/${orgSlug}/views/new`}
              className="mt-3 inline-block text-sm text-primary underline-offset-2 hover:underline"
            >
              Create your first view
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <ul role="list">
            {views.map((v) => (
              <li key={v.id} className="border-b last:border-0">
                <Link
                  href={`/${orgSlug}/views/${v.id}/edit`}
                  className="flex items-start gap-4 px-4 py-3 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.gridRows}×{v.gridCols} grid ·{' '}
                      {v._count.specimens} specimen{v._count.specimens === 1 ? '' : 's'}
                      {v.primaryCollection && ` · ${v.primaryCollection.name}`}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {v.assignments.length > 0 && (
                      <div
                        className="flex -space-x-2"
                        aria-label={`Assigned to ${v.assignments.map((a) => a.user.name ?? a.user.email).join(', ')}`}
                      >
                        {v.assignments.map((a) => {
                          const display = a.user.name ?? a.user.email
                          return (
                            <div
                              key={a.id}
                              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground"
                              aria-hidden="true"
                            >
                              {display[0]?.toUpperCase()}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <Badge variant="outline" className="font-mono text-xs">
                      {v.shortCode}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
