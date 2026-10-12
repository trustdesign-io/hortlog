import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { publicScenePath } from '@/lib/scene-urls'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'

interface ViewsPageProps {
  params: Promise<{ org: string }>
}

export default async function ViewsPage({ params }: ViewsPageProps) {
  const { org: orgSlug } = await params
  const { user } = await requireOrgAccess(orgSlug, 'can_view_org')
  const canManage = canManageOrg(user, orgSlug)

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const scenes = await prisma.scene.findMany({
    where: {
      organisationId: org.id,
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      shortCode: true,
      gridRows: true,
      gridCols: true,
      primaryCollection: { select: { name: true, slug: true } },
      _count: { select: { specimens: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Scenes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grid displays shown on Vantage screens.
          </p>
        </div>
        {canManage && (
          <Link href={`/${orgSlug}/scenes/new`} className={buttonVariants({ size: 'sm' })}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New scene
          </Link>
        )}
      </div>

      {scenes.length === 0 ? (
        <EmptyState message="No scenes yet." hint={canManage ? 'Use New scene to add the first one.' : null} />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <ul role="list">
            {scenes.map((v) => (
              <li key={v.id} className="border-b last:border-0">
                <Link
                  // Members see the scene as it is displayed; managers open the editor
                  href={
                    canManage
                      ? `/${orgSlug}/scenes/${v.id}/edit`
                      : publicScenePath(orgSlug, v.slug, v.primaryCollection?.slug ?? null)
                  }
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
