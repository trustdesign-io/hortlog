import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { hasCapability } from '@/lib/auth/capabilities'
import { prisma } from '@/lib/prisma'
import { CollectionsManager } from './collections-manager'

interface CollectionsPageProps {
  params: Promise<{ org: string }>
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const { org: orgSlug } = await params
  const { user } = await requireOrgAccess(orgSlug, 'can_edit_view')

  const membership = user.memberships.find((m) => m.organisation.slug === orgSlug)!
  const canDelete = hasCapability(membership.role, 'can_edit_org_settings', user.isAdmin)

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const collections = await prisma.collection.findMany({
    where: { organisationId: org.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { specimens: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-medium">Collections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Themed groups of specimens for display purposes.
        </p>
      </div>
      <CollectionsManager
        orgSlug={orgSlug}
        collections={collections}
        canDelete={canDelete}
      />
    </div>
  )
}
