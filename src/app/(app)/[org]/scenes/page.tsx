import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Plus, Printer } from 'lucide-react'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { publicScenePath } from '@/lib/scene-urls'
import { bedPhotoUrl } from '@/lib/offline/types'
import { SceneThumb } from './scene-thumb'
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
      photoTakenAt: true,
      active: true,
      title: true,
      primaryCollection: { select: { name: true, slug: true } },
      _count: { select: { specimens: true } },
    },
  })
  const activeScenes = scenes.filter((s) => s.active)
  const inactiveScenes = scenes.filter((s) => !s.active)

  const sceneList = (list: typeof scenes) => (
    <div className="rounded-xl border bg-card overflow-hidden">
      <ul role="list">
        {list.map((v) => (
          <li key={v.id} className="border-b last:border-0">
            <Link
              // Members see the scene as it is displayed; managers open the editor
              href={
                canManage
                  ? `/${orgSlug}/scenes/${v.id}/edit`
                  : publicScenePath(orgSlug, v.slug, v.primaryCollection?.slug ?? null)
              }
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <SceneThumb src={v.photoTakenAt ? bedPhotoUrl(orgSlug, v.id, v.photoTakenAt.toISOString()) : null} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {v.name}
                  {v.title && <span className="font-normal text-muted-foreground"> · {v.title}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {v.photoTakenAt ? '' : 'No photo yet · '}
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
  )

  return (
    <div className="space-y-6">
      {/* Phones: buttons stack under the title; wider screens: beside it */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium">Scenes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grid displays shown on Vantage screens.
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Link href={`/print/${orgSlug}/scene-labels`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
              <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Print labels
            </Link>
            <Link href={`/${orgSlug}/scenes/new`} className={buttonVariants({ size: 'sm' })}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              New scene
            </Link>
          </div>
        )}
      </div>

      {activeScenes.length === 0 ? (
        <EmptyState
          message={inactiveScenes.length ? 'No active scenes yet.' : 'No scenes yet.'}
          hint={canManage ? (inactiveScenes.length ? 'Open an inactive scene below and switch it to Active.' : 'Use New scene to add the first one.') : null}
        />
      ) : (
        sceneList(activeScenes)
      )}

      {canManage && inactiveScenes.length > 0 && (
        <details className="group space-y-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
            Inactive scenes ({inactiveScenes.length})
          </summary>
          {sceneList(inactiveScenes)}
        </details>
      )}
    </div>
  )
}
