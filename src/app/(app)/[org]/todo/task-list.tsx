'use client'

import { useActionState, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTask, updateTask, setTaskStatus, deleteTask } from '@/lib/actions/task'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react'
import type { ActionResult } from '@trustdesign/shared/types'

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  status: 'OPEN' | 'DONE'
  createdAt: string
  assignee: { id: string; name: string | null; email: string } | null
}

interface OrgMember {
  id: string
  name: string | null
  email: string
}

interface TaskListProps {
  orgSlug: string
  canManage: boolean
  tasks: Task[]
  orgMembers: OrgMember[]
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dueDateIso(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

// ─── Task form (shared by create and edit dialogs) ────────────────────────────

interface TaskFormProps {
  orgSlug: string
  orgMembers: OrgMember[]
  task?: Task
  onClose: () => void
}

function TaskForm({ orgSlug, orgMembers, task, onClose }: TaskFormProps) {
  const router = useRouter()
  const isEdit = !!task

  const boundCreate = createTask.bind(null, orgSlug)
  const boundUpdate = task ? updateTask.bind(null, orgSlug, task.id) : null

  const action = isEdit ? boundUpdate! : boundCreate
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(action, null)

  const [assigneeId, setAssigneeId] = useState<string>(task?.assignee?.id ?? '')

  if (state?.success) {
    router.refresh()
    onClose()
  }

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
        <Label htmlFor="task-assignee">Assignee</Label>
        <Select
          name="assigneeId"
          value={assigneeId}
          onValueChange={(v) => setAssigneeId(v ?? '')}
        >
          <SelectTrigger id="task-assignee">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {orgMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name ?? m.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

function CreateTaskDialog({ orgSlug, orgMembers }: { orgSlug: string; orgMembers: OrgMember[] }) {
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
        <TaskForm orgSlug={orgSlug} orgMembers={orgMembers} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit task dialog ─────────────────────────────────────────────────────────

function EditTaskDialog({ orgSlug, orgMembers, task }: { orgSlug: string; orgMembers: OrgMember[]; task: Task }) {
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
        <TaskForm orgSlug={orgSlug} orgMembers={orgMembers} task={task} onClose={() => setOpen(false)} />
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

  function handleToggle() {
    startTransition(async () => {
      const next = task.status === 'OPEN' ? 'DONE' : 'OPEN'
      const result = await setTaskStatus(orgSlug, task.id, next)
      if (result.success) router.refresh()
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-label={task.status === 'OPEN' ? `Mark "${task.title}" done` : `Reopen "${task.title}"`}
      aria-pressed={task.status === 'DONE'}
      className="shrink-0 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
    >
      {task.status === 'DONE' ? (
        <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
      ) : (
        <Circle className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  )
}

// ─── TaskList ─────────────────────────────────────────────────────────────────

export function TaskList({ orgSlug, canManage, tasks, orgMembers }: TaskListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium">To do</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks for your organisation.
          </p>
        </div>
        {canManage && (
          <CreateTaskDialog orgSlug={orgSlug} orgMembers={orgMembers} />
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
          {canManage && (
            <p className="mt-1 text-sm text-muted-foreground">Add the first one above.</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <ul role="list" aria-label="Tasks">
            {tasks.map((task) => {
              const assigneeDisplay = task.assignee
                ? (task.assignee.name ?? task.assignee.email)
                : null
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
                    <div className="shrink-0 mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={isDone ? 'text-sm font-medium line-through text-muted-foreground' : 'text-sm font-medium'}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {assigneeDisplay && (
                        <span className="text-xs text-muted-foreground">
                          {assigneeDisplay}
                        </span>
                      )}
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

                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1">
                      <EditTaskDialog orgSlug={orgSlug} orgMembers={orgMembers} task={task} />
                      <DeleteTaskDialog orgSlug={orgSlug} task={task} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
