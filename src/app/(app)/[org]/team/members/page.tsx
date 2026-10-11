import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { MemberList } from './member-list'
import { TeamTabs } from '../team-tabs'
import { sortDirectorsThenByName } from '@/lib/team'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface MembersPageProps {
  params: Promise<{ org: string }>
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { org: orgSlug } = await params
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: {
      name: true,
      directorLabel: true,
      managerLabel: true,
      memberLabel: true,
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!org) return notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage who has access to {org.name}.
        </p>
      </div>
      <TeamTabs orgSlug={orgSlug} active="members" />
      <MemberList
        orgSlug={orgSlug}
        labels={{ directorLabel: org.directorLabel, managerLabel: org.managerLabel, memberLabel: org.memberLabel }}
        members={sortDirectorsThenByName(org.memberships).map((m) => ({
          id: m.id,
          role: m.role,
          createdAt: m.createdAt.toISOString(),
          user: { ...m.user, createdAt: m.user.createdAt.toISOString() },
        }))}
      />
    </div>
  )
}
