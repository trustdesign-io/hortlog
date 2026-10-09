'use client'

import { useActionState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { recordWork, WORK_ACTION_LABELS } from '@/lib/actions/work-record'
import type { ActionResult } from '@trustdesign/shared/types'

interface RecordWorkFormProps {
  orgSlug: string
  specimenId: string
  onSuccess?: () => void
}

export function RecordWorkForm({ orgSlug, specimenId, onSuccess }: RecordWorkFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const boundAction = useMemo(
    () => recordWork.bind(null, orgSlug, specimenId),
    [orgSlug, specimenId],
  )
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null,
  )

  const prevSuccess = useRef(false)
  useEffect(() => {
    if (state?.success && !prevSuccess.current) {
      formRef.current?.reset()
      onSuccess?.()
    }
    prevSuccess.current = !!state?.success
  }, [state?.success, onSuccess])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="work-action">Action</Label>
        <NativeSelect id="work-action" name="action" required disabled={isPending}>
          <option value="">Select an action…</option>
          {Object.entries(WORK_ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="work-date">Date</Label>
        <input
          type="date"
          id="work-date"
          name="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="work-action-note">Notes on action</Label>
        <Textarea
          id="work-action-note"
          name="actionNote"
          placeholder="What specifically was done?"
          rows={2}
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="work-location">Location</Label>
        <input
          type="text"
          id="work-location"
          name="location"
          placeholder="e.g. Glasshouse A, bed 3"
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="work-text">General notes</Label>
        <Textarea
          id="work-text"
          name="text"
          placeholder="Observations, conditions, next steps…"
          rows={3}
          disabled={isPending}
        />
      </div>

      {state && !state.success && state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700 dark:text-green-400">Work recorded.</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Recording…' : 'Record work'}
      </Button>
    </form>
  )
}
