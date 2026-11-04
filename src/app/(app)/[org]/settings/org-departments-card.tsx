'use client'

import { useState, useTransition } from 'react'
import { createDepartment, deleteDepartment, saveDepartment } from '@/lib/actions/department'
import { MAX_DEPARTMENT_NAME } from '@/lib/departments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiMemberPicker } from '@/components/multi-member-picker'
import type { PickerMember } from '@/components/member-picker'

export interface DepartmentRow {
  id: string
  name: string
  memberIds: string[]
  managerIds: string[]
}

interface OrgDepartmentsCardProps {
  orgSlug: string
  departments: DepartmentRow[]
  /** Members of the garden, and anyone invited who hasn't joined yet */
  people: PickerMember[]
}

/** Departments group the Team page. People can be in several; managers are a title only. */
export function OrgDepartmentsCard({ orgSlug, departments, people }: OrgDepartmentsCardProps) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function add(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createDepartment(orgSlug, newName)
      if (res.success) setNewName('')
      else setError(res.error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Departments</CardTitle>
        <CardDescription>
          Group people on the Team page, e.g. Glasshouse or Arboretum. Someone can be in more than one, and each
          department can have managers. Departments don’t change what anyone can do in hortlog.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {departments.map((d) => (
          <DepartmentEditor key={d.id} orgSlug={orgSlug} department={d} people={people} />
        ))}
        <form onSubmit={add} className="flex flex-col gap-2" aria-busy={isPending}>
          <label htmlFor="new-department" className="text-sm font-medium">
            {departments.length === 0 ? 'Add your first department' : 'Add a department'}
          </label>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              id="new-department"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={MAX_DEPARTMENT_NAME}
              placeholder="e.g. Glasshouse"
              className="h-11 text-base sm:h-9 sm:text-sm"
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending || !newName.trim()} className="h-11 sm:h-9">
              {isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function DepartmentEditor({
  orgSlug,
  department,
  people,
}: {
  orgSlug: string
  department: DepartmentRow
  people: PickerMember[]
}) {
  const [name, setName] = useState(department.name)
  const [memberIds, setMemberIds] = useState(department.memberIds)
  const [managerIds, setManagerIds] = useState(department.managerIds)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fieldId = `dept-${department.id}`

  function onManagers(ids: string[]) {
    setManagerIds(ids)
    // A manager is in the department too
    setMemberIds((m) => [...m, ...ids.filter((id) => !m.includes(id))])
  }

  function onMembers(ids: string[]) {
    setMemberIds(ids)
    setManagerIds((m) => m.filter((id) => ids.includes(id)))
  }

  function save() {
    setStatus(null)
    startTransition(async () => {
      const res = await saveDepartment(orgSlug, department.id, { name, memberIds, managerIds })
      setStatus(res.success ? { ok: true, text: 'Saved.' } : { ok: false, text: res.error })
    })
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteDepartment(orgSlug, department.id)
      if (!res.success) setStatus({ ok: false, text: res.error })
    })
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-3" aria-busy={isPending}>
      <legend className="sr-only">{department.name}</legend>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${fieldId}-name`} className="text-sm font-medium">
          Name
        </label>
        <Input
          id={`${fieldId}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_DEPARTMENT_NAME}
          className="h-11 text-base sm:h-9 sm:text-sm"
          disabled={isPending}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${fieldId}-managers`} className="text-sm font-medium">
          Managers
        </label>
        <MultiMemberPicker
          id={`${fieldId}-managers`}
          members={people}
          values={managerIds}
          onChange={onManagers}
          name="managerIds"
          placeholder="Add a manager…"
          disabled={isPending}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${fieldId}-members`} className="text-sm font-medium">
          People
        </label>
        <MultiMemberPicker
          id={`${fieldId}-members`}
          members={people}
          values={memberIds}
          onChange={onMembers}
          name="memberIds"
          placeholder="Add someone…"
          disabled={isPending}
        />
      </div>
      {status && (
        <p
          className={status.ok ? 'text-sm text-green-600 dark:text-green-400' : 'text-sm text-destructive'}
          role={status.ok ? 'status' : 'alert'}
          aria-live="polite"
        >
          {status.text}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={isPending || !name.trim()}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
        {confirmDelete ? (
          <>
            <Button type="button" variant="destructive" onClick={remove} disabled={isPending}>
              Delete {department.name}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={isPending}>
              Keep it
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)} disabled={isPending}>
            Delete
          </Button>
        )}
      </div>
    </fieldset>
  )
}
