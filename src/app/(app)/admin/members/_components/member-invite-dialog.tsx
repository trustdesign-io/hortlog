'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { adminInviteUser } from '@/lib/actions/admin'

interface MemberInviteDialogProps {
  orgs: { slug: string; name: string }[]
}

export function MemberInviteDialog({ orgs }: MemberInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(adminInviteUser, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success === true) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false)
      formRef.current?.reset()
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Invite user
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={action} className="space-y-4">
          {state && !state.success && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Field>
            <FieldLabel htmlFor="invite-email">Email address *</FieldLabel>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="user@example.com"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-name">Name (optional)</FieldLabel>
            <Input
              id="invite-name"
              name="name"
              type="text"
              placeholder="Alice Smith"
              maxLength={120}
            />
          </Field>
          {orgs.length > 0 && (
            <>
              <Field>
                <FieldLabel htmlFor="invite-org">Add to organisation (optional)</FieldLabel>
                <select
                  id="invite-org"
                  name="orgSlug"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— No organisation —</option>
                  {orgs.map((org) => (
                    <option key={org.slug} value={org.slug}>{org.name}</option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                <select
                  id="invite-role"
                  name="role"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </Field>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
