import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { MemberList } from './member-list'
import { TeamTabs } from '../team-tabs'
import { sortDirectorsThenByName } from '@/lib/team'
import { listPendingInvites, type PendingInvite } from '@/lib/pending-invites'
import { PendingInvites } from './pending-invites'
import { JoinRequests } from './join-requests'

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
      joinRequests: {
        where: { declinedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true, message: true, createdAt: true, user: { select: { name: true, email: true } } },
      },
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!org) return notFound()

  // From the sign-in service: a failure there mustn't take the team page down
  let invites: PendingInvite[] = []
  let invitesFailed = false
  try {
    invites = await listPendingInvites(orgSlug)
  } catch (err) {
    console.error('[MembersPage] listing invites failed:', err)
    invitesFailed = true
  }
  const labels = { directorLabel: org.directorLabel, managerLabel: org.managerLabel, memberLabel: org.memberLabel }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage who has access to {org.name}.
        </p>
      </div>
      <TeamTabs orgSlug={orgSlug} active="members" />
      <JoinRequests
        orgSlug={orgSlug}
        requests={org.joinRequests.map((r) => ({
          id: r.id,
          name: r.user.name,
          email: r.user.email,
          message: r.message,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
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
      {invitesFailed ? (
        <p className="text-sm text-muted-foreground">Invites waiting couldn&rsquo;t be loaded just now. Refresh to try again.</p>
      ) : (
        <PendingInvites orgSlug={orgSlug} invites={invites} labels={labels} />
      )}
    </div>
  )
}
