'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { adminCreateOrg } from '@/lib/actions/admin'

export function OrgCreateDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(adminCreateOrg, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success === true) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false)
      formRef.current?.reset()
    }
  }, [state])

  function handleSlugify(e: React.ChangeEvent<HTMLInputElement>) {
    const form = formRef.current
    if (!form) return
    const slugField = form.elements.namedItem('slug') as HTMLInputElement | null
    if (!slugField || slugField.value) return
    slugField.value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New organisation
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New organisation</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={action} className="space-y-4">
          {state && !state.success && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Field>
            <FieldLabel htmlFor="create-name">Name *</FieldLabel>
            <Input
              id="create-name"
              name="name"
              required
              placeholder="e.g. Acme Nursery"
              onChange={handleSlugify}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="create-slug">URL slug *</FieldLabel>
            <Input
              id="create-slug"
              name="slug"
              required
              placeholder="e.g. acme-nursery"
              pattern="[a-z0-9\-]+"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="create-manager">First manager email *</FieldLabel>
            <Input
              id="create-manager"
              name="managerEmail"
              type="email"
              required
              placeholder="manager@example.com"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="create-manager-name">First manager name (optional)</FieldLabel>
            <Input
              id="create-manager-name"
              name="managerName"
              type="text"
              placeholder="Alice Smith"
              maxLength={120}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
