'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { MultiMemberPicker } from '@/components/multi-member-picker'
import type { PickerMember } from '@/components/member-picker'
import { recordWork } from '@/lib/actions/work-record'
import { newOpId } from '@/lib/offline/ops'
import { queueOp } from '@/lib/offline/sync'
import { WORK_ACTION_LABELS } from '@/lib/work-action-labels'
import type { ActionResult } from '@/lib/shared/types'

/** `queued`: saved on the device to send later, as there was no connection */
type FormResult = ActionResult | { success: true; queued: true }

interface RecordWorkFormProps {
  orgSlug: string
  specimenId: string
  /** Other members of the organisation, to tag as having worked on it too */
  members?: PickerMember[]
  onSuccess?: () => void
}

export function RecordWorkForm({ orgSlug, specimenId, members = [], onSuccess }: RecordWorkFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [coworkerIds, setCoworkerIds] = useState<string[]>([])
  const boundAction = useMemo(
    () =>
      async (prev: FormResult | null, formData: FormData): Promise<FormResult> => {
        // No connection: keep the entry on the device and send it later
        const saveOnDevice = async (): Promise<FormResult> => {
          const field = (name: string) => String(formData.get(name) ?? '').trim() || null
          const action = String(formData.get('action') ?? '')
          const date = String(formData.get('date') ?? '')
          if (!(action in WORK_ACTION_LABELS)) return { success: false, error: 'Please select an action.' }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, error: 'Please choose a date.' }
          try {
            await queueOp({
              id: newOpId(),
              org: orgSlug,
              createdAt: new Date().toISOString(),
              kind: 'recordWork',
              specimenId,
              entry: {
                action,
                date,
                actionNote: field('actionNote'),
                location: field('location'),
                text: field('text'),
                coworkerIds: formData.getAll('coworkerId').map(String),
              },
            })
          } catch {
            return { success: false, error: 'Failed to record work. Please try again.' }
          }
          return { success: true, queued: true }
        }
        if (!navigator.onLine) return saveOnDevice()
        try {
          return await recordWork(orgSlug, specimenId, prev, formData)
        } catch {
          return saveOnDevice()
        }
      },
    [orgSlug, specimenId],
  )
  const [state, formAction, isPending] = useActionState<FormResult | null, FormData>(
    boundAction,
    null,
  )

  // Clear the people chosen once per successful save
  const [handled, setHandled] = useState(state)
  if (state !== handled) {
    setHandled(state)
    if (state?.success) setCoworkerIds([])
  }

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

      {members.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="work-coworkers">Worked with (optional)</Label>
          <MultiMemberPicker
            id="work-coworkers"
            name="coworkerId"
            placeholder="Add someone from the team…"
            members={members}
            values={coworkerIds}
            onChange={setCoworkerIds}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">It shows on their record too. They can remove themselves.</p>
        </div>
      )}

      {state && !state.success && state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700 dark:text-green-400">
          {'queued' in state && state.queued
            ? 'No connection, so it’s saved on this device. It will be added to your record when you’re back online.'
            : 'Work recorded.'}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Recording…' : 'Record work'}
      </Button>
    </form>
  )
}
