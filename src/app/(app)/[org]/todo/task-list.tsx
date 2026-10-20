'use client'

import { useActionState, useTransition, useState, useEffect } from 'react'
import { EmptyState } from '@/components/empty-state'
import { useRouter } from 'next/navigation'
import { createTask, updateTask, setTaskStatus, deleteTask } from '@/lib/actions/task'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { CellPicker, type PickerScene } from './cell-picker'
import { getMemberInitials } from '@/components/member-picker'
import { MultiMemberPicker } from '@/components/multi-member-picker'
import { WORK_ACTION_LABELS } from '@/lib/work-action-labels'
import { newOpId } from '@/lib/offline/ops'
import { queueOp } from '@/lib/offline/sync'
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Sprout, LayoutGrid } from 'lucide-react'
import type { WorkAction } from '@prisma/client'
import type { ActionResult } from '@/lib/shared/types'

interface Assignee {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
}

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  status: 'OPEN' | 'DONE'
  createdAt: string
  assignees: Assignee[]
  careAction: WorkAction | null
  specimen: { id: string; slug: string; name: string } | null
  scene: { id: string; name: string; plantCount: number } | null
  cells: string[]
}

interface PlantOption {
  id: string
  label: string
  scientificName: string
}

interface OrgMember {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
}

interface TaskListProps {
  orgSlug: string
  canManage: boolean
  tasks: Task[]
  orgMembers: OrgMember[]
  plants: PlantOption[]
  scenes: PickerScene[]
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dueDateIso(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

// ─── Stacked avatars for task row ─────────────────────────────────────────────

function AssigneeAvatars({ assignees }: { assignees: Assignee[] }) {
  if (assignees.length === 0) return null
  const visible = assignees.slice(0, 3)
  const overflow = assignees.length - 3

  const allNames = assignees.map((a) => a.name ?? a.email).join(', ')

  return (
    <div className="flex items-center gap-1" title={allNames} aria-label={`Assigned to ${allNames}`}>
      <div className="flex -space-x-1.5">
        {visible.map((a) => (
          <Avatar key={a.id} size="sm" className="ring-2 ring-background">
            <AvatarImage src={a.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{getMemberInitials(a)}</AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[10px] font-medium text-muted-foreground">
            +{overflow}
          </div>
        )}
      </div>
      {assignees.length === 1 && (
        <span className="max-w-[12rem] truncate text-xs text-muted-foreground">
          {assignees[0].name ?? assignees[0].email}
        </span>
      )}
    </div>
  )
}

// ─── Task form (shared by create and edit dialogs) ────────────────────────────

interface TaskFormProps {
  orgSlug: string
  orgMembers: OrgMember[]
  plants: PlantOption[]
  scenes: PickerScene[]
  task?: Task
  onClose: () => void
}

type Target = 'none' | 'plant' | 'scene'

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'

function TaskForm({ orgSlug, orgMembers, plants, scenes, task, onClose }: TaskFormProps) {
  const router = useRouter()
  const isEdit = !!task

  const boundCreate = createTask.bind(null, orgSlug)
  const boundUpdate = task ? updateTask.bind(null, orgSlug, task.id) : null

  const action = isEdit ? boundUpdate! : boundCreate
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(action, null)

  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task?.assignees.map((a) => a.id) ?? [],
  )
  const [target, setTarget] = useState<Target>(task?.scene ? 'scene' : task?.specimen ? 'plant' : 'none')
  const [plantId, setPlantId] = useState(task?.specimen?.id ?? '')
  const [sceneId, setSceneId] = useState(task?.scene?.id ?? scenes[0]?.id ?? '')
  const [cells, setCells] = useState<string[]>(task?.cells ?? [])
  const [careAction, setCareAction] = useState<string>(task?.careAction ?? '')
  const scene = scenes.find((sc) => sc.id === sceneId)
  const hasTarget = (target === 'plant' && plantId) || (target === 'scene' && scene)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onClose()
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-title">Title <span aria-hidden="true">*</span></Label>
        <Input
          id="task-title"
          name="title"
          required
          defaultValue={task?.title ?? ''}
          placeholder="Task title"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          name="description"
          rows={3}
          defaultValue={task?.description ?? ''}
          placeholder="Optional description"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-due-date">Due date</Label>
        <Input
          id="task-due-date"
          name="dueDate"
          type="date"
          defaultValue={dueDateIso(task?.dueDate ?? null)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="task-assignees">Assignees</Label>
        <MultiMemberPicker
          name="assigneeId"
          placeholder="Add assignee…"
          id="task-assignees"
          members={orgMembers}
          values={assigneeIds}
          onChange={setAssigneeIds}
          disabled={isPending}
        />
      </div>

      {(plants.length > 0 || scenes.length > 0) && (
        <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
          <legend className="px-1 text-sm font-medium">Where</legend>
          <input type="hidden" name="target" value={target} />
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Task applies to">
            {(
              [
                ['none', 'Nowhere specific'],
                ['plant', 'One plant'],
                ...(scenes.length ? [['scene', 'A scene']] : []),
              ] as Array<[Target, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={target === value}
                onClick={() => setTarget(value)}
                disabled={isPending}
                className={
                  target === value
                    ? 'rounded-full border border-primary bg-primary px-3 py-1 text-xs text-primary-foreground'
                    : 'rounded-full border px-3 py-1 text-xs hover:bg-muted'
                }
              >
                {label}
              </button>
            ))}
          </div>

          {target === 'plant' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-plant">Plant</Label>
              <select
                id="task-plant"
                name="specimenId"
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                disabled={isPending}
                required
                className={selectClass}
              >
                <option value="">Choose a plant…</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.scientificName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {target === 'scene' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-scene">Scene</Label>
                <select
                  id="task-scene"
                  name="sceneId"
                  value={sceneId}
                  onChange={(e) => {
                    setSceneId(e.target.value)
                    setCells([])
                  }}
                  disabled={isPending}
                  className={selectClass}
                >
                  {scenes.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>
              {scene && <CellPicker scene={scene} selected={cells} onChange={setCells} disabled={isPending} />}
            </>
          )}

          {hasTarget && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-care-action">Care to log when done</Label>
              <select
                id="task-care-action"
                name="careAction"
                value={careAction}
                onChange={(e) => setCareAction(e.target.value)}
                disabled={isPending}
                className={selectClass}
              >
                <option value="">Don&apos;t log anything</option>
                {(Object.keys(WORK_ACTION_LABELS) as WorkAction[]).map((a) => (
                  <option key={a} value={a}>{WORK_ACTION_LABELS[a]}</option>
                ))}
              </select>
              {careAction && (
                <p className="text-xs text-muted-foreground">
                  {assigneeIds.length > 0
                    ? `Ticking this off logs it on ${target === 'scene' ? 'each plant' : 'the plant'} for each assignee.`
                    : 'Add assignees: care is logged for the people who did it.'}
                </p>
              )}
            </div>
          )}
        </fieldset>
      )}

      {state && !state.success && state.error && (
        <p className="text-sm text-destructive" role="alert">{state.error}</p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create task')}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Create task dialog ───────────────────────────────────────────────────────

function CreateTaskDialog({ orgSlug, orgMembers, plants, scenes }: { orgSlug: string; orgMembers: OrgMember[]; plants: PlantOption[]; scenes: PickerScene[] }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Add task
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>Create a new task for your organisation.</DialogDescription>
        </DialogHeader>
        <TaskForm orgSlug={orgSlug} orgMembers={orgMembers} plants={plants} scenes={scenes} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit task dialog ─────────────────────────────────────────────────────────

function EditTaskDialog({ orgSlug, orgMembers, plants, scenes, task }: { orgSlug: string; orgMembers: OrgMember[]; plants: PlantOption[]; scenes: PickerScene[]; task: Task }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${task.title}`}
            className="text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Update the details for this task.</DialogDescription>
        </DialogHeader>
        <TaskForm orgSlug={orgSlug} orgMembers={orgMembers} plants={plants} scenes={scenes} task={task} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete task dialog ───────────────────────────────────────────────────────

function DeleteTaskDialog({ orgSlug, task }: { orgSlug: string; task: Task }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteTask(orgSlug, task.id)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to delete task.')
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
            aria-label={`Delete ${task.title}`}
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete task</DialogTitle>
          <DialogDescription>
            Delete <strong>{task.title}</strong>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Toggle status button ─────────────────────────────────────────────────────

function ToggleStatusButton({ orgSlug, task }: { orgSlug: string; task: Task }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Set when the change was saved on the device because there's no connection
  const [queued, setQueued] = useState<'OPEN' | 'DONE' | null>(null)
  const status = queued ?? task.status

  function handleToggle() {
    setError(null)
    const next = status === 'OPEN' ? 'DONE' : 'OPEN'
    const saveOnDevice = async () => {
      await queueOp({ id: newOpId(), org: orgSlug, createdAt: new Date().toISOString(), kind: 'setTaskStatus', taskId: task.id, status: next })
      setQueued(next)
    }
    startTransition(async () => {
      if (!navigator.onLine) return saveOnDevice()
      let result
      try {
        result = await setTaskStatus(orgSlug, task.id, next)
      } catch {
        return saveOnDevice()
      }
      if (result.success) {
        setQueued(null)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to update status.')
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleToggle}
        disabled={isPending}
        aria-label={status === 'OPEN' ? `Mark "${task.title}" done` : `Reopen "${task.title}"`}
        aria-pressed={status === 'DONE'}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
      >
        {status === 'DONE' ? (
          <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
        ) : (
          <Circle className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      {queued && <p className="text-xs text-muted-foreground" role="status">Waiting to send</p>}
    </div>
  )
}

// ─── TaskList ─────────────────────────────────────────────────────────────────

export function TaskList({ orgSlug, canManage, tasks, orgMembers, plants, scenes }: TaskListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">To do</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks for your organisation.
          </p>
        </div>
        {canManage ? (
          <CreateTaskDialog orgSlug={orgSlug} orgMembers={orgMembers} plants={plants} scenes={scenes} />
        ) : (
          <UnavailableAction reason="Your role can’t add tasks." className={buttonVariants({ size: 'sm' })}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Add task
          </UnavailableAction>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState message="No tasks yet." hint={canManage ? 'Use Add task to add the first one.' : null} />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <ul role="list" aria-label="Tasks">
            {tasks.map((task) => {
              const dueDateFormatted = formatDate(task.dueDate)
              const isDone = task.status === 'DONE'

              return (
                <li
                  key={task.id}
                  className="flex items-start gap-3 border-b px-4 py-3 last:border-0"
                >
                  {canManage ? (
                    <ToggleStatusButton orgSlug={orgSlug} task={task} />
                  ) : (
                    <UnavailableAction
                      reason={isDone ? 'Your role can’t reopen tasks.' : 'Your role can’t mark tasks done.'}
                      label={isDone ? `Reopen ${task.title}` : `Mark ${task.title} done`}
                      className="mt-0.5 shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </UnavailableAction>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={isDone ? 'text-sm font-medium line-through text-muted-foreground' : 'text-sm font-medium'}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {task.specimen && (
                        <Link
                          href={`/${orgSlug}/specimens/${task.specimen.slug}`}
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                        >
                          <Sprout className="h-3 w-3" aria-hidden="true" />
                          {task.specimen.name}
                          {task.careAction && (
                            <span className="text-muted-foreground">· {WORK_ACTION_LABELS[task.careAction]}</span>
                          )}
                        </Link>
                      )}
                      {task.scene && (
                        <Link
                          href={canManage ? `/${orgSlug}/scenes/${task.scene.id}/edit` : `/${orgSlug}/scenes`}
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                        >
                          <LayoutGrid className="h-3 w-3" aria-hidden="true" />
                          {task.scene.name}
                          <span className="text-muted-foreground">
                            · {task.cells.length ? `${task.scene.plantCount} plant${task.scene.plantCount === 1 ? '' : 's'}` : 'whole scene'}
                            {task.careAction && ` · ${WORK_ACTION_LABELS[task.careAction]}`}
                          </span>
                        </Link>
                      )}
                      <AssigneeAvatars assignees={task.assignees} />
                      {dueDateFormatted && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {dueDateFormatted}
                        </Badge>
                      )}
                      {isDone && (
                        <Badge variant="secondary" className="text-xs">Done</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {canManage ? (
                      <>
                        <EditTaskDialog orgSlug={orgSlug} orgMembers={orgMembers} plants={plants} scenes={scenes} task={task} />
                        <DeleteTaskDialog orgSlug={orgSlug} task={task} />
                      </>
                    ) : (
                      <>
                        <UnavailableAction
                          reason="Your role can’t edit tasks."
                          label={`Edit ${task.title}`}
                          className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: 'text-muted-foreground' })}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </UnavailableAction>
                        <UnavailableAction
                          reason="Your role can’t delete tasks."
                          label={`Delete ${task.title}`}
                          className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: 'text-muted-foreground' })}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </UnavailableAction>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
