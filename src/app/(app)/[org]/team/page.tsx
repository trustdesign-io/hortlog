import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { TeamTabs } from './team-tabs'
import { EmptyState } from '@/components/empty-state'
import { prisma } from '@/lib/prisma'
import { Fragment } from 'react'
import { sortTeam } from '@/lib/team'
import { listPendingInvites } from '@/lib/pending-invites'
import { roleLabel, type Role, type RoleLabels } from '@/lib/roles'
import { UserAvatar } from '@/components/user-avatar'
import { ActionLink } from '@/components/ui/action-link'
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
          user: { select: { id: true, name: true, email: true, avatarUrl: true, username: true, recordPublic: true } },
        },
      },
    },
  })
  if (!org) return notFound()

  // Invited but not joined yet: shown on the chart, greyed out. The chart still shows if this lookup fails.
  const invited: TierPerson[] = (
    await listPendingInvites(orgSlug).catch((err) => {
      console.error('[TeamPage] pending invites:', err)
      return []
    })
  )
    .filter((i) => !org.memberships.some((m) => m.user.id === i.userId))
    .map((i) => ({
      id: `invite-${i.userId}`,
      role: i.role,
      pending: true,
      user: { id: i.userId, name: i.name, email: i.email, avatarUrl: null, username: null, recordPublic: false },
    }))

  const team: TierPerson[] = [...sortTeam(org.memberships), ...invited]
  // Directors lead; managers and members sit on one level together. Managers
  // have more permissions in hortlog, not authority over other people.
  const directors = sortByName(team.filter((m) => m.role === 'DIRECTOR'))
  const everyoneElse = sortByName(team.filter((m) => m.role !== 'DIRECTOR'))
  const tiers = [
    { key: 'directors', label: plural(org.directorLabel, directors.length), people: directors, lead: true },
    { key: 'team', label: directors.length > 0 ? 'Team' : '', people: everyoneElse, lead: false },
  ].filter((t) => t.people.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {team.length - invited.length === 1 ? '1 person' : `${team.length - invited.length} people`} at {org.name}
          {invited.length > 0 && ` · ${invited.length} invited`}
        </p>
      </div>
      {canManageOrg(viewer, orgSlug) && <TeamTabs orgSlug={orgSlug} active="team" />}

      {team.length === 0 ? (
        <EmptyState message="No one has joined yet." />
      ) : (
        // An org chart: directors on top, everyone else on one level below
        <div className="flex flex-col items-center">
          {tiers.map((tier, i) => (
            <Fragment key={tier.key}>
              {i > 0 && <div aria-hidden="true" className="h-8 w-px bg-border" />}
              <TeamTier
                label={tier.label}
                people={tier.people}
                lead={tier.lead}
                labels={org}
                viewerId={viewer.id}
              />
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

/** Alphabetical, with anyone invited but not joined yet after the rest */
function sortByName<T extends { pending?: boolean; user: { name: string | null; email: string } }>(people: T[]): T[] {
  const key = (p: T) => (p.user.name ?? p.user.email).toLocaleLowerCase('en-GB')
  return [...people].sort((a, b) => Number(a.pending ?? false) - Number(b.pending ?? false) || key(a).localeCompare(key(b), 'en-GB'))
}

interface TierPerson {
  id: string
  role: Role
  /** Invited and hasn't accepted yet */
  pending?: boolean
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
    username: string | null
    recordPublic: boolean
  }
}

/** Where tapping someone's card goes: their public work record, or why it can't */
function recordLink(p: TierPerson, viewerId: string): { href: string; unavailable: string | null } {
  const first = (p.user.name ?? p.user.email.split('@')[0]).trim().split(/\s+/)[0]
  if (p.pending) return { href: '', unavailable: `${first} hasn’t joined yet, so there’s no work record to show.` }
  if (p.user.recordPublic && p.user.username) return { href: `/u/${p.user.username}`, unavailable: null }
  if (p.user.id === viewerId) return { href: '/records', unavailable: null }
  return { href: '', unavailable: `${first} hasn’t made their work record public.` }
}

function TeamTier({
  label,
  people,
  lead,
  labels,
  viewerId,
}: {
  /** Empty when there is only one level: the page heading says enough. */
  label: string
  people: TierPerson[]
  lead: boolean
  labels: RoleLabels
  viewerId: string
}) {
  return (
    <section aria-label={label || 'Team'} className="w-full">
      {label && (
        <h2 className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </h2>
      )}
      <ul role="list" className="flex flex-wrap justify-center gap-3">
        {people.map((p) => (
          <li key={p.id} className="flex w-[calc(50%-0.375rem)] sm:w-40">
            <ActionLink
              {...recordLink(p, viewerId)}
              className={cn(
                'flex w-full flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                lead && 'border-primary/40',
                p.pending && 'border-dashed bg-muted/40',
              )}
            >
              <UserAvatar
                user={p.user}
                className={cn(lead ? 'h-16 w-16' : 'h-12 w-12', p.pending && 'opacity-50 grayscale')}
                fallbackClassName={lead ? 'text-base' : 'text-sm'}
              />
              <span className={cn('block w-full truncate text-sm font-medium', p.pending && 'text-muted-foreground')}>
                {p.user.name ?? p.user.email.split('@')[0]}
              </span>
              {/* Title on every card below the directors, so managers are visible without being ranked */}
              {!lead && <span className="block -mt-1.5 text-xs text-muted-foreground">{roleLabel(p.role, labels)}</span>}
              {p.pending && (
                <span className="block -mt-1 rounded-full border border-dashed px-2 text-xs text-muted-foreground">Invited</span>
              )}
            </ActionLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
