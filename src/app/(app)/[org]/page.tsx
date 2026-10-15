import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Leaf, Grid3x3, BookOpen, Plus } from 'lucide-react'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { roleLabel as titleFor } from '@/lib/roles'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { startOfWeek } from '@/lib/week'

interface OrgPageProps {
  params: Promise<{ org: string }>
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { org: orgSlug } = await params
  const { user } = await requireOrgAccess(orgSlug, 'can_view_org')
  const canManage = canManageOrg(user, orgSlug)

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      _count: {
        // Only scenes in use at the venue count
        select: { specimens: true, scenes: { where: { active: true } }, collections: true },
      },
      scenes: {
        where: { active: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          _count: { select: { specimens: true } },
        },
      },
      collections: {
        orderBy: { name: 'asc' },
        take: 5,
        include: {
          _count: { select: { specimens: true } },
        },
      },
    },
  })

  if (!org) return notFound()

  const now = new Date()
  const [doneThisWeek, outstanding, overdue] = await Promise.all([
    prisma.task.count({
      where: { organisationId: org.id, status: 'DONE', completedAt: { gte: startOfWeek(now) } },
    }),
    prisma.task.count({ where: { organisationId: org.id, status: 'OPEN' } }),
    prisma.task.count({ where: { organisationId: org.id, status: 'OPEN', dueDate: { lt: now } } }),
  ])

  const membership = user.memberships.find((m) => m.organisation.slug === orgSlug)
  const roleLabel = !membership
    ? 'Platform admin'
    : titleFor(membership.role, org)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {org.logoUrl ? (
            <Image
              src={org.logoUrl}
              alt={`${org.name} logo`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-cover ring-1 ring-border"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-heading font-semibold text-lg ring-1 ring-border" aria-hidden="true">
              {org.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-medium">{org.name}</h1>
            <Badge variant="outline" className="mt-1">{roleLabel}</Badge>
          </div>
        </div>

        {canManage && (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/${orgSlug}/specimens/new`}
            className={buttonVariants({ variant: 'default', size: 'sm' })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Specimen
          </Link>
          <Link
            href={`/${orgSlug}/scenes/new`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Scene
          </Link>
        </div>
        )}
      </div>

      {/* Summary stats: one card, three linked columns, same on every screen */}
      <Card className="py-0">
        <ul className="grid grid-cols-3 divide-x">
          {[
            { label: 'Specimens', value: org._count.specimens, href: `/${orgSlug}/specimens`, Icon: Leaf },
            { label: 'Collections', value: org._count.collections, href: `/${orgSlug}/collections`, Icon: BookOpen },
            { label: 'Scenes', value: org._count.scenes, href: `/${orgSlug}/scenes`, Icon: Grid3x3 },
          ].map(({ label, value, href, Icon }) => (
            <li key={label}>
              <Link
                href={href}
                className="flex h-full flex-col items-center gap-1 px-2 py-4 text-center transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:py-5"
              >
                <span className="font-heading text-2xl font-semibold tabular-nums sm:text-3xl">{value}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
                  {label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent scenes */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Scenes</CardTitle>
              <Link
                href={`/${orgSlug}/scenes`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                See all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {org.scenes.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No scenes yet.
                {canManage && (
                  <>
                    {' '}
                    <Link href={`/${orgSlug}/scenes/new`} className="text-primary hover:underline">
                      Create one
                    </Link>
                  </>
                )}
              </p>
            ) : (
              <ul className="divide-y">
                {org.scenes.map((scene) => (
                  <li key={scene.id}>
                    <Link
                      href={canManage ? `/${orgSlug}/scenes/${scene.id}/edit` : `/${orgSlug}/scenes`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {scene.name}
                        {scene.title && <span className="font-normal text-muted-foreground"> · {scene.title}</span>}
                      </span>
                      <span className="ml-4 shrink-0 text-muted-foreground tabular-nums">
                        {scene._count.specimens} specimen{scene._count.specimens !== 1 ? 's' : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Collections */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Collections</CardTitle>
              <Link
                href={`/${orgSlug}/collections`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                See all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {org.collections.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No collections yet.
                {canManage && (
                  <>
                    {' '}
                    <Link href={`/${orgSlug}/collections`} className="text-primary hover:underline">
                      Create one
                    </Link>
                  </>
                )}
              </p>
            ) : (
              <ul className="divide-y">
                {org.collections.map((collection) => (
                  <li key={collection.id}>
                    <Link
                      href={`/${orgSlug}/collections`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="font-medium truncate">{collection.name}</span>
                      <span className="ml-4 shrink-0 text-muted-foreground tabular-nums">
                        {collection._count.specimens} specimen{collection._count.specimens !== 1 ? 's' : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tasks</CardTitle>
              <Link
                href={`/${orgSlug}/todo`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                See all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {[
                { label: 'Outstanding tasks', value: outstanding, alert: false },
                { label: 'Tasks completed this week', value: doneThisWeek, alert: false },
                { label: 'Overdue tasks', value: overdue, alert: overdue > 0 },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className={row.alert ? 'ml-4 shrink-0 tabular-nums text-destructive' : 'ml-4 shrink-0 tabular-nums text-muted-foreground'}>
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
