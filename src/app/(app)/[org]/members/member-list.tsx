'use client'

import { useActionState, useTransition, useState } from 'react'
import { inviteMember, changeMemberRole, removeMember } from '@/lib/actions/member'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import type { ActionResult } from '@trustdesign/shared/types'
import type { MembershipRole } from '@prisma/client'

interface Member {
  id: string
  role: MembershipRole
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    createdAt: string
  }
}

interface MemberListProps {
  orgSlug: string
  managerLabel: string
  memberLabel: string
  members: Member[]
}

function RoleSelect({
  orgSlug,
  membershipId,
  currentRole,
  managerLabel,
  memberLabel,
}: {
  orgSlug: string
  membershipId: string
  currentRole: MembershipRole
  managerLabel: string
  memberLabel: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(value: string | null) {
    if (value !== 'MANAGER' && value !== 'MEMBER') return
    setError(null)
    startTransition(async () => {
      const result = await changeMemberRole(orgSlug, membershipId, value)
      if (!result.success) setError(result.error ?? 'Failed to change role.')
    })
  }

  return (
    <div>
      <Select value={currentRole} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger size="sm" className="w-36" aria-label="Change role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MANAGER">{managerLabel}</SelectItem>
          <SelectItem value="MEMBER">{memberLabel}</SelectItem>
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-destructive" role="alert">{error}</p>}
    </div>
  )
}

function RemoveMemberButton({
  orgSlug,
  membershipId,
  memberName,
}: {
  orgSlug: string
  membershipId: string
  memberName: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRemove() {
    setError(null)
    startTransition(async () => {
      const result = await removeMember(orgSlug, membershipId)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error ?? 'Failed to remove member.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${memberName}`}
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            Remove <strong>{memberName}</strong> from this organisation? They will lose all access immediately.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={isPending}>
            {isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MemberList({ orgSlug, managerLabel, memberLabel, members }: MemberListProps) {
  const boundInvite = inviteMember.bind(null, orgSlug)
  const [inviteState, inviteAction, inviteIsPending] = useActionState<ActionResult | null, FormData>(boundInvite, null)

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a member</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                placeholder="colleague@example.com"
                autoComplete="email"
              />
            </div>
            <Button type="submit" disabled={inviteIsPending} className="shrink-0">
              {inviteIsPending ? 'Sending…' : 'Send invite'}
            </Button>
          </form>
          {inviteState !== null && !inviteState.success && inviteState.error && (
            <p className="mt-2 text-sm text-destructive" role="alert">{inviteState.error}</p>
          )}
          {inviteState !== null && inviteState.success && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400" role="status" aria-live="polite">
              Invite sent successfully.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Member list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y" aria-label="Organisation members">
            {members.map((member) => {
              const displayName = member.user.name ?? member.user.email
              const joinedDate = new Date(member.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              return (
                <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Avatar */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                    aria-hidden="true"
                  >
                    {displayName[0]?.toUpperCase()}
                  </div>

                  {/* Identity */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    {member.user.name && (
                      <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Joined {joinedDate}</p>
                  </div>

                  {/* Role badge (mobile) */}
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {member.role === 'MANAGER' ? managerLabel : memberLabel}
                  </Badge>

                  {/* Role change */}
                  <RoleSelect
                    orgSlug={orgSlug}
                    membershipId={member.id}
                    currentRole={member.role}
                    managerLabel={managerLabel}
                    memberLabel={memberLabel}
                  />

                  {/* Remove */}
                  <RemoveMemberButton
                    orgSlug={orgSlug}
                    membershipId={member.id}
                    memberName={displayName}
                  />
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
