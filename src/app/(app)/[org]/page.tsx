import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Leaf, Grid3x3, BookOpen, Plus } from 'lucide-react'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'

interface OrgPageProps {
  params: Promise<{ org: string }>
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { org: orgSlug } = await params
  const { user } = await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    include: {
      _count: {
        select: { specimens: true, views: true, collections: true },
      },
      views: {
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

  const membership = user.memberships.find((m) => m.organisation.slug === orgSlug)
  const roleLabel =
    membership?.role === 'MANAGER'
      ? org.managerLabel
      : org.memberLabel

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
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
          <div>
            <h1 className="font-heading text-2xl font-medium">{org.name}</h1>
            <Badge variant="outline" className="mt-1">{roleLabel}</Badge>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href={`/${orgSlug}/specimens/new`}
            className={buttonVariants({ variant: 'default', size: 'sm' })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Specimen
          </Link>
          <Link
            href={`/${orgSlug}/views/new`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New View
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Leaf className="h-4 w-4" aria-hidden="true" />
              Specimens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold">{org._count.specimens}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Grid3x3 className="h-4 w-4" aria-hidden="true" />
              Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold">{org._count.views}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold">{org._count.collections}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent views */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Views</CardTitle>
              <Link
                href={`/${orgSlug}/views`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                See all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {org.views.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No views yet.{' '}
                <Link href={`/${orgSlug}/views/new`} className="text-primary hover:underline">
                  Create one
                </Link>
              </p>
            ) : (
              <ul className="divide-y">
                {org.views.map((view) => (
                  <li key={view.id}>
                    <Link
                      href={`/${orgSlug}/views/${view.slug}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="font-medium truncate">{view.name}</span>
                      <span className="ml-4 shrink-0 text-muted-foreground tabular-nums">
                        {view._count.specimens} specimen{view._count.specimens !== 1 ? 's' : ''}
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
                No collections yet.{' '}
                <Link href={`/${orgSlug}/collections/new`} className="text-primary hover:underline">
                  Create one
                </Link>
              </p>
            ) : (
              <ul className="divide-y">
                {org.collections.map((collection) => (
                  <li key={collection.id}>
                    <Link
                      href={`/${orgSlug}/collections/${collection.slug}`}
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
      </div>
    </div>
  )
}
