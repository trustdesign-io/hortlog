import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { DEFAULT_ROLE_LABELS, roleLabel } from '@/lib/roles'
import type { Role } from '@/lib/roles'
import { Search, Trash2, UserCog } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { MemberInviteDialog } from './_components/member-invite-dialog'
import { MemberDeleteDialog } from './_components/member-delete-dialog'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { MemberEditDialog } from './_components/member-edit-dialog'
import { listAllPendingInvites } from '@/lib/pending-invites'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 50

interface AdminMembersPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Admin — All users' }

export default async function AdminMembersPage({ searchParams }: AdminMembersPageProps) {
  const user = await requireAuth()
  if (!isAdmin(user)) return notFound()

  const { q, page: pageParam } = await searchParams
  const search = q?.trim() ?? ''
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total, orgs] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            organisation: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { workRecords: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.organisation.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Invited but not joined yet: not users of the app until they accept. First page only.
  const orgNames = new Map(orgs.map((o) => [o.slug, o.name]))
  const needle = search.toLowerCase()
  const invited =
    page === 1
      ? (
          await listAllPendingInvites().catch((err) => {
            console.error('[AdminMembersPage] pending invites:', err)
            return []
          })
        ).filter((i) => !needle || i.email.toLowerCase().includes(needle) || (i.name ?? '').toLowerCase().includes(needle))
      : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">All users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} user{total === 1 ? '' : 's'} on the platform
            {invited.length > 0 && ` · ${invited.length} invited`}.
          </p>
        </div>
        <MemberInviteDialog orgs={orgs} />
      </div>

      <form method="get" className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          name="q"
          type="search"
          placeholder="Search by name or email…"
          defaultValue={search}
          className="pl-9"
          aria-label="Search users"
        />
      </form>

      {users.length === 0 && invited.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {search ? `No users match "${search}".` : 'No users yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="px-4 py-3 text-left font-medium">User</th>
                <th scope="col" className="hidden px-4 py-3 text-left font-medium sm:table-cell">Organisations</th>
                <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">Joined</th>
                <th scope="col" className="sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invited.map((i) => (
                <InvitedRow
                  key={`invite-${i.userId}`}
                  name={i.name}
                  email={i.email}
                  role={i.role}
                  orgSlug={i.orgSlug}
                  orgName={i.orgSlug ? (orgNames.get(i.orgSlug) ?? i.orgSlug) : null}
                  invitedAt={i.invitedAt}
                  expired={i.expired}
                />
              ))}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {u.name ?? (
                            <span className="text-muted-foreground italic">Add name</span>
                          )}
                        </p>
                        {u.isAdmin && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                        {u.id === user.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="break-all text-xs text-muted-foreground">{u.email}</p>
                      <div className="mt-2 sm:hidden">
                        <OrgPills memberships={u.memberships} />
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <OrgPills memberships={u.memberships} />
                  </td>
                  <td className="hidden px-4 py-3 text-right text-muted-foreground text-xs sm:table-cell">
                    {u.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MemberEditDialog
                        userId={u.id}
                        userName={u.name}
                        userEmail={u.email}
                        memberships={u.memberships}
                        allOrgs={orgs}
                      />
                      {u.id !== user.id ? (
                        <MemberDeleteDialog
                          userId={u.id}
                          userName={u.name ?? u.email}
                          workRecordCount={u._count.workRecords}
                        />
                      ) : (
                        <UnavailableAction
                          reason="You can’t delete your own account."
                          label={`Delete ${u.name ?? u.email}`}
                          className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'text-destructive' })}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </UnavailableAction>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...(search && { q: search }), page: String(page - 1) })}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?${new URLSearchParams({ ...(search && { q: search }), page: String(page + 1) })}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}

interface OrgPillsProps {
  memberships: Array<{ id: string; role: Role; organisation: { slug: string; name: string } }>
}

/** A user's organisations, each with their role. */
function OrgPills({ memberships }: OrgPillsProps) {
  return (
    <>
      {memberships.length === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {memberships.map((m) => (
                          <Link
                            key={m.id}
                            href={`/${m.organisation.slug}/team/members`}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted transition-colors"
                          >
                            {m.organisation.name}
                            <span className="text-muted-foreground">
                              ({roleLabel(m.role, DEFAULT_ROLE_LABELS)})
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
    </>
  )
}

interface InvitedRowProps {
  name: string | null
  email: string
  role: Role
  orgSlug: string | null
  orgName: string | null
  invitedAt: string
  expired: boolean
}

/** Someone invited who hasn't accepted yet: greyed out, with their invite's garden and date. */
function InvitedRow({ name, email, role, orgSlug, orgName, invitedAt, expired }: InvitedRowProps) {
  const reason = orgSlug
    ? `${name ?? email} hasn’t joined yet. Resend or cancel the invite on ${orgName}’s Members page.`
    : `${name ?? email} hasn’t joined yet.`
  const org =
    orgSlug && orgName ? (
      <Link
        href={`/${orgSlug}/team/members`}
        className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs hover:bg-muted transition-colors"
      >
        {orgName}
        <span className="text-muted-foreground">({roleLabel(role, DEFAULT_ROLE_LABELS)})</span>
      </Link>
    ) : (
      <span className="text-muted-foreground text-xs">Platform only</span>
    )
  const icon = buttonVariants({ variant: 'ghost', size: 'icon' })

  return (
    <tr className="bg-muted/20">
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-muted-foreground">{name ?? email.split('@')[0]}</p>
          <Badge variant="outline" className={cn('border-dashed text-xs text-muted-foreground', expired && 'border-destructive/50')}>
            {expired ? 'Invited, link expired' : 'Invited'}
          </Badge>
        </div>
        <p className="break-all text-xs text-muted-foreground">{email}</p>
        <div className="mt-2 sm:hidden">{org}</div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">{org}</td>
      <td className="hidden px-4 py-3 text-right text-muted-foreground text-xs sm:table-cell">
        Invited {new Date(invitedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <UnavailableAction reason={reason} label={`Edit ${name ?? email}`} className={icon}>
            <UserCog className="h-4 w-4" aria-hidden="true" />
          </UnavailableAction>
          <UnavailableAction reason={reason} label={`Delete ${name ?? email}`} className={cn(icon, 'text-destructive')}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </UnavailableAction>
        </div>
      </td>
    </tr>
  )
}
