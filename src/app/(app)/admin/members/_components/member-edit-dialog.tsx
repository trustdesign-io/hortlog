'use client'

import { useActionState, useTransition, useEffect, useRef, useState } from 'react'
import { X, UserCog } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  adminUpdateUserName,
  adminSetUserAdmin,
  adminAddMembership,
  adminRemoveMembership,
} from '@/lib/actions/admin'

interface Membership {
  id: string
  role: 'MANAGER' | 'MEMBER'
  organisation: { name: string; slug: string }
}

interface MembershipRowProps {
  userId: string
  membership: Membership
  onRefresh: () => void
}

function MembershipRow({ userId, membership, onRefresh }: MembershipRowProps) {
  const [removing, startRemove] = useTransition()
  const [changingRole, startRoleChange] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const newRole: 'MANAGER' | 'MEMBER' = membership.role === 'MANAGER' ? 'MEMBER' : 'MANAGER'
  const isPending = removing || changingRole

  function handleRemove() {
    setError(null)
    startRemove(async () => {
      const result = await adminRemoveMembership(userId, membership.id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error ?? 'Failed to remove membership.')
      }
    })
  }

  function handleRoleChange() {
    setError(null)
    startRoleChange(async () => {
      const removeResult = await adminRemoveMembership(userId, membership.id)
      if (!removeResult.success) {
        setError(removeResult.error ?? 'Failed to change role.')
        return
      }
      const addResult = await adminAddMembership(userId, membership.organisation.slug, newRole)
      if (!addResult.success) {
        setError(addResult.error ?? 'Failed to change role.')
      }
      onRefresh()
    })
  }

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate text-sm">{membership.organisation.name}</span>
        <Badge variant="outline" className="text-xs shrink-0">
          {membership.role === 'MANAGER' ? 'Manager' : 'Member'}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRoleChange}
          disabled={isPending}
          className="text-xs text-muted-foreground h-7 px-2 shrink-0"
        >
          {changingRole ? '…' : `Make ${newRole === 'MANAGER' ? 'Manager' : 'Member'}`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove from ${membership.organisation.name}`}
          onClick={handleRemove}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </li>
  )
}

interface MemberEditDialogProps {
  userId: string
  userName: string | null
  userEmail: string
  isAdmin: boolean
  memberships: Membership[]
  allOrgs: { slug: string; name: string }[]
  currentUserId: string
}

export function MemberEditDialog({
  userId,
  userName,
  userEmail,
  isAdmin: isUserAdmin,
  memberships,
  allOrgs,
  currentUserId,
}: MemberEditDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [adminTogglePending, startAdminToggle] = useTransition()
  const [addPending, startAdd] = useTransition()
  const [adminError, setAdminError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const addFormRef = useRef<HTMLFormElement>(null)

  const boundUpdateName = adminUpdateUserName.bind(null, userId)
  const [nameState, nameAction, namePending] = useActionState(boundUpdateName, null)
  const nameFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (nameState?.success) nameFormRef.current?.reset()
  }, [nameState])

  function handleAdminToggle() {
    setAdminError(null)
    startAdminToggle(async () => {
      const result = await adminSetUserAdmin(userId, !isUserAdmin)
      if (!result.success) {
        setAdminError(result.error ?? 'Failed to update admin status.')
      } else {
        router.refresh()
      }
    })
  }

  function handleAddMembership(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddError(null)
    const fd = new FormData(e.currentTarget)
    const orgSlug = fd.get('addOrgSlug') as string
    const role = fd.get('addRole') === 'MANAGER' ? ('MANAGER' as const) : ('MEMBER' as const)
    if (!orgSlug) return
    startAdd(async () => {
      const result = await adminAddMembership(userId, orgSlug, role)
      if (result.success) {
        addFormRef.current?.reset()
        router.refresh()
      } else {
        setAddError(result.error ?? 'Failed to add membership.')
      }
    })
  }

  const isSelf = userId === currentUserId
  const availableOrgs = allOrgs.filter(
    (o) => !memberships.some((m) => m.organisation.slug === o.slug)
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${userName ?? userEmail}`}
          />
        }
      >
        <UserCog className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ── Name ── */}
          <section>
            <h3 className="mb-3 text-sm font-medium">Name</h3>
            <form ref={nameFormRef} action={nameAction} className="space-y-3">
              {nameState && !nameState.success && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {nameState.error}
                </p>
              )}
              {nameState?.success && (
                <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400" role="status">
                  Name updated.
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  name="name"
                  required
                  defaultValue={userName ?? ''}
                  placeholder="Add a name…"
                  maxLength={120}
                  className="flex-1"
                  aria-label="User name"
                />
                <Button type="submit" size="sm" disabled={namePending} aria-busy={namePending}>
                  {namePending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </section>

          {/* ── Platform admin ── */}
          {!isSelf && (
            <section>
              <h3 className="mb-3 text-sm font-medium">Platform admin</h3>
              {adminError && (
                <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {adminError}
                </p>
              )}
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {isUserAdmin ? 'Platform admin' : 'Standard user'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isUserAdmin
                      ? 'Can manage all organisations and users.'
                      : 'Access limited to their organisations.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isUserAdmin ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={handleAdminToggle}
                  disabled={adminTogglePending}
                  aria-busy={adminTogglePending}
                >
                  {adminTogglePending ? '…' : isUserAdmin ? 'Revoke admin' : 'Grant admin'}
                </Button>
              </div>
            </section>
          )}

          {/* ── Organisations ── */}
          <section>
            <h3 className="mb-3 text-sm font-medium">Organisations</h3>
            {memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not a member of any organisation.</p>
            ) : (
              <ul className="space-y-2" aria-label="Memberships">
                {memberships.map((m) => (
                  <MembershipRow
                    key={m.id}
                    userId={userId}
                    membership={m}
                    onRefresh={() => router.refresh()}
                  />
                ))}
              </ul>
            )}

            {availableOrgs.length > 0 && (
              <form
                ref={addFormRef}
                onSubmit={handleAddMembership}
                className="mt-4 space-y-3 rounded-lg border p-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Add to organisation
                </p>
                {addError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {addError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <select
                    name="addOrgSlug"
                    required
                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Organisation"
                    defaultValue=""
                  >
                    <option value="" disabled>Select organisation…</option>
                    {availableOrgs.map((o) => (
                      <option key={o.slug} value={o.slug}>{o.name}</option>
                    ))}
                  </select>
                  <select
                    name="addRole"
                    className="flex h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Role"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                  <Button type="submit" size="sm" disabled={addPending} aria-busy={addPending}>
                    {addPending ? '…' : 'Add'}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
