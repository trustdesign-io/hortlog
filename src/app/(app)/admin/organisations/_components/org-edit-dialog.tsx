'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
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
import { adminUpdateOrg } from '@/lib/actions/admin'

interface OrgEditDialogProps {
  orgSlug: string
  orgName: string
  managerLabel: string
  memberLabel: string
}

export function OrgEditDialog({ orgSlug, orgName, managerLabel, memberLabel }: OrgEditDialogProps) {
  const [open, setOpen] = useState(false)
  const boundAction = adminUpdateOrg.bind(null, orgSlug)
  const [state, action, pending] = useActionState(boundAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success === true) {
      setOpen(false)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${orgName}`}
          />
        }
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit organisation</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={action} className="space-y-4">
          {state && !state.success && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400" role="status">
              Organisation updated.
            </p>
          )}
          <Field>
            <FieldLabel htmlFor="edit-org-name">Name *</FieldLabel>
            <Input
              id="edit-org-name"
              name="name"
              required
              defaultValue={orgName}
              maxLength={120}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-org-slug">URL slug *</FieldLabel>
            <Input
              id="edit-org-slug"
              name="slug"
              required
              defaultValue={orgSlug}
              pattern="[a-z0-9\-]+"
              minLength={2}
              maxLength={48}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="edit-manager-label">Manager label</FieldLabel>
              <Input
                id="edit-manager-label"
                name="managerLabel"
                defaultValue={managerLabel}
                placeholder="Manager"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-member-label">Member label</FieldLabel>
              <Input
                id="edit-member-label"
                name="memberLabel"
                defaultValue={memberLabel}
                placeholder="Member"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
