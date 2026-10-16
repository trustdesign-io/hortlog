'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { isUnsent, newOpId, type OutboxOp } from '@/lib/offline/ops'
import { dismissOp, queueOp } from '@/lib/offline/sync'
import type { OfflineTask, OrgSnapshot } from '@/lib/offline/types'
import { WORK_ACTION_LABELS } from '@/lib/work-action-labels'
import { cn } from '@/lib/utils'

const FIELD = 'flex h-11 w-full rounded-md border border-input bg-background px-3 text-base'

/** Marks something done on this device that hasn't reached hortlog yet. */
export function WaitingBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground', className)}>
      Waiting to send
    </span>
  )
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Record work on a plant without a connection; it's sent when the connection returns. */
export function RecordWorkPanel({ org, specimenId }: { org: string; specimenId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const action = String(fd.get('action') ?? '')
    const date = String(fd.get('date') ?? '')
    if (!(action in WORK_ACTION_LABELS)) return setError('Please select an action.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Please choose a date.')
    const text = (name: string) => String(fd.get(name) ?? '').trim() || null
    try {
      await queueOp({
        id: newOpId(),
        org,
        createdAt: new Date().toISOString(),
        kind: 'recordWork',
        specimenId,
        entry: { action, date, actionNote: text('actionNote'), location: text('location'), text: text('text') },
      })
    } catch {
      return setError('Couldn’t save on this device. Please try again.')
    }
    form.reset()
    setError(null)
    setSaved(true)
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          onClick={() => {
            setOpen(true)
            setSaved(false)
          }}
          className="w-full sm:w-auto"
        >
          Record work
        </Button>
        {saved && (
          <p className="text-sm text-muted-foreground" role="status">
            Saved on this device. It will be added to your record when you&rsquo;re back online.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="off-action">Action</Label>
        <NativeSelect id="off-action" name="action" required className="[&_select]:h-11">
          <option value="">Select an action…</option>
          {Object.entries(WORK_ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="off-date">Date</Label>
        <input type="date" id="off-date" name="date" defaultValue={today()} required className={FIELD} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="off-action-note">Notes on action</Label>
        <Textarea id="off-action-note" name="actionNote" rows={2} placeholder="What specifically was done?" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="off-location">Location</Label>
        <input type="text" id="off-location" name="location" placeholder="e.g. Glasshouse A, bed 3" className={FIELD} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="off-text">General notes</Label>
        <Textarea id="off-text" name="text" rows={3} placeholder="Observations, conditions, next steps…" />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/** Tick a task off (or reopen it) without a connection. */
export function TaskToggle({ task, org }: { task: OfflineTask; org: string }) {
  const done = task.status === 'DONE'
  return (
    <button
      type="button"
      onClick={() =>
        void queueOp({
          id: newOpId(),
          org,
          createdAt: new Date().toISOString(),
          kind: 'setTaskStatus',
          taskId: task.id,
          status: done ? 'OPEN' : 'DONE',
        })
      }
      aria-label={done ? `Reopen "${task.title}"` : `Mark "${task.title}" done`}
      aria-pressed={done}
      className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {done ? <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" /> : <Circle className="h-5 w-5" aria-hidden="true" />}
    </button>
  )
}

function describeOp(op: OutboxOp, snapshots: OrgSnapshot[]): string {
  const snap = snapshots.find((s) => s.org.slug === op.org)
  const plant = (id: string) => snap?.specimens.find((s) => s.id === id)?.species.scientificName ?? 'a plant'
  const scene = (id: string) => {
    const sc = snap?.scenes.find((s) => s.id === id)
    return sc ? (sc.title ?? sc.name) : 'a scene'
  }
  switch (op.kind) {
    case 'recordWork':
      return `${WORK_ACTION_LABELS[op.entry.action as keyof typeof WORK_ACTION_LABELS] ?? op.entry.action} – ${plant(op.specimenId)}`
    case 'setTaskStatus': {
      const title = snap?.tasks.find((t) => t.id === op.taskId)?.title ?? 'a task'
      return `${op.status === 'DONE' ? 'Ticked off' : 'Reopened'} – ${title}`
    }
    case 'createSpecimen':
      return `New plant – ${op.fieldName ?? snap?.speciesList?.find((s) => s.id === op.speciesId)?.scientificName ?? 'a plant'}`
    case 'placeSpecimen':
      return `Placed ${plant(op.specimenId)} – ${scene(op.sceneId)}`
    case 'unplaceSpecimen':
      return `Took ${plant(op.specimenId)} off its scene`
    case 'splitHex':
      return `${op.split ? 'Split' : 'Merged'} a cell – ${scene(op.sceneId)}`
    case 'resizeGrid':
      return `Changed rows or columns – ${scene(op.sceneId)}`
    case 'updateScene':
      return `Changed ${scene(op.sceneId)}`
  }
}

/** Changes on this device: how many are waiting, and any hortlog refused. */
export function OutboxList({ ops, snapshots }: { ops: OutboxOp[]; snapshots: OrgSnapshot[] }) {
  const refused = ops.filter((o) => o.error)
  const waiting = ops.filter(isUnsent).length
  if (waiting === 0 && refused.length === 0) return null
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">Changes on this device</h2>
      {waiting > 0 && (
        <p className="text-sm text-muted-foreground">
          {waiting} change{waiting === 1 ? '' : 's'} waiting to send. They&rsquo;ll be sent when you&rsquo;re back online.
        </p>
      )}
      {refused.length > 0 && (
        <ul className="space-y-2">
          {refused.map((op) => (
            <li key={op.id} className="flex items-start justify-between gap-3 rounded-lg border border-destructive/40 p-3 text-sm">
              <span>
                <span className="block font-medium">{describeOp(op, snapshots)}</span>
                <span className="text-destructive">Not saved: {op.error}</span>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => void dismissOp(op.id)}>
                Dismiss
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
