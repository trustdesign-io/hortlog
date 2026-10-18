import { notFound } from 'next/navigation'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { LocationsManager } from './locations-manager'

interface LocationsPageProps {
  params: Promise<{ org: string }>
}

export default async function LocationsPage({ params }: LocationsPageProps) {
  const { org: orgSlug } = await params
  const { user } = await requireOrgAccess(orgSlug, 'can_view_org')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return notFound()

  const locations = await prisma.location.findMany({
    where: { organisationId: org.id },
    select: { id: true, name: true, parentId: true, _count: { select: { scenes: true, specimens: true } } },
  })

  return (
    <LocationsManager
      orgSlug={orgSlug}
      canEdit={canManageOrg(user, orgSlug)}
      locations={locations.map((l) => ({ id: l.id, name: l.name, parentId: l.parentId, scenes: l._count.scenes, plants: l._count.specimens }))}
    />
  )
}
