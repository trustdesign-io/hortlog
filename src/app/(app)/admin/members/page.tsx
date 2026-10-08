import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { MemberInviteDialog } from './_components/member-invite-dialog'
import { MemberDeleteDialog } from './_components/member-delete-dialog'
import { MemberEditDialog } from './_components/member-edit-dialog'

const PAGE_SIZE = 50

interface AdminMembersPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Admin — Members' }

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
      },
    }),
    prisma.user.count({ where }),
    prisma.organisation.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} user{total === 1 ? '' : 's'} on the platform.
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

      {users.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {search ? `No users match "${search}".` : 'No users yet.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="px-4 py-3 text-left font-medium">User</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Organisations</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Joined</th>
                <th scope="col" className="sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
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
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.memberships.length === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.memberships.map((m) => (
                          <Link
                            key={m.id}
                            href={`/${m.organisation.slug}/members`}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted transition-colors"
                          >
                            {m.organisation.name}
                            <span className="text-muted-foreground">
                              ({m.role === 'MANAGER' ? 'Manager' : 'Member'})
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {u.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MemberEditDialog
                        userId={u.id}
                        userName={u.name}
                        userEmail={u.email}
                        isAdmin={u.isAdmin}
                        memberships={u.memberships}
                        allOrgs={orgs}
                        currentUserId={user.id}
                      />
                      {u.id !== user.id && (
                        <MemberDeleteDialog
                          userId={u.id}
                          userName={u.name ?? u.email}
                        />
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
