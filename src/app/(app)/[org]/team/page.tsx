import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { sortTeam } from '@/lib/team'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Team',
  robots: { index: false, follow: false },
}

interface TeamPageProps {
  params: Promise<{ org: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { org: orgSlug } = await params
  // can_edit_specimen is held by every member, so the whole team can see who is on it.
  const { user: viewer } = await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: {
      name: true,
      managerLabel: true,
      memberLabel: true,
      memberships: {
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  })
  if (!org) return notFound()

  const team = sortTeam(org.memberships)
  const managers = team.filter((m) => m.role === 'MANAGER').length

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {team.length === 1 ? '1 person' : `${team.length} people`} at {org.name}
        </p>
      </div>

      {team.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No one has joined yet.</p>
        </div>
      ) : (
        <ul role="list" aria-label="Team" className="overflow-hidden rounded-xl border bg-card">
          {team.map((m, i) => {
            const isManager = m.role === 'MANAGER'
            return (
              <li
                key={m.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  i < team.length - 1 && 'border-b',
                  // Rule off the managers from everyone else
                  isManager && i === managers - 1 && managers < team.length && 'border-b-2',
                )}
              >
                <UserAvatar user={m.user} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.user.name ?? m.user.email.split('@')[0]}
                    {m.user.id === viewer.id && <span className="font-normal text-muted-foreground"> (you)</span>}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    isManager ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {isManager ? org.managerLabel : org.memberLabel}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
