import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { TeamTabs } from './team-tabs'
import { prisma } from '@/lib/prisma'
import { Fragment } from 'react'
import { sortTeam } from '@/lib/team'
import { isLeader, ROLES, roleLabel, type Role } from '@/lib/roles'
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
  const { user: viewer } = await requireOrgAccess(orgSlug, 'can_view_org')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: {
      name: true,
      directorLabel: true,
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
  // One tier per role, most senior at the top; empty tiers are left out
  const tiers = ROLES.map((role) => ({
    role,
    label: plural(roleLabel(role, org), team.filter((m) => m.role === role).length),
    people: team.filter((m) => m.role === role),
  })).filter((t) => t.people.length > 0)

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {team.length === 1 ? '1 person' : `${team.length} people`} at {org.name}
        </p>
      </div>
      {canManageOrg(viewer, orgSlug) && <TeamTabs orgSlug={orgSlug} active="team" />}

      {team.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No one has joined yet.</p>
        </div>
      ) : (
        // An org chart: directors, then managers, then members, joined by connectors
        <div className="flex flex-col items-center">
          {tiers.map((tier, i) => (
            <Fragment key={tier.role}>
              {i > 0 && <div aria-hidden="true" className="h-8 w-px bg-border" />}
              <TeamTier label={tier.label} people={tier.people} viewerId={viewer.id} role={tier.role} />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

function plural(label: string, n: number): string {
  return n === 1 || /s$/i.test(label) ? label : `${label}s`
}

interface TierPerson {
  id: string
  user: { id: string; name: string | null; email: string; avatarUrl: string | null }
}

function TeamTier({
  label,
  people,
  viewerId,
  role,
}: {
  label: string
  people: TierPerson[]
  viewerId: string
  /** Senior roles get larger avatars. */
  role: Role
}) {
  const lead = isLeader(role)
  return (
    <section aria-label={label} className="w-full">
      <h2 className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <ul
        role="list"
        className="flex flex-wrap justify-center gap-3"
      >
        {people.map((p) => (
          <li
            key={p.id}
            className={cn(
              'flex w-[calc(50%-0.375rem)] flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center sm:w-40',
              lead && 'border-primary/40',
            )}
          >
            <UserAvatar
              user={p.user}
              className={role === 'DIRECTOR' ? 'h-20 w-20' : lead ? 'h-16 w-16' : 'h-12 w-12'}
              fallbackClassName={lead ? 'text-base' : 'text-sm'}
            />
            <p className="w-full truncate text-sm font-medium">
              {p.user.name ?? p.user.email.split('@')[0]}
            </p>
            {p.user.id === viewerId && <p className="-mt-1.5 text-xs text-muted-foreground">You</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
