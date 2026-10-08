'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignMemberToView, unassignMemberFromView } from '@/lib/actions/view-assignment'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

interface Assignment {
  id: string
  user: { id: string; name: string | null; email: string }
}

interface OrgMember {
  id: string
  name: string | null
  email: string
}

interface AssignmentPanelProps {
  orgSlug: string
  viewId: string
  assignments: Assignment[]
  orgMembers: OrgMember[]
}

export function AssignmentPanel({ orgSlug, viewId, assignments, orgMembers }: AssignmentPanelProps) {
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const assignedUserIds = new Set(assignments.map((a) => a.user.id))
  const availableMembers = orgMembers.filter((m) => !assignedUserIds.has(m.id))

  function handleAssign() {
    if (!selectedUserId) return
    setError(null)
    startTransition(async () => {
      const result = await assignMemberToView(orgSlug, viewId, selectedUserId)
      if (result.success) {
        setSelectedUserId('')
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to assign member.')
      }
    })
  }

  function handleUnassign(assignmentId: string) {
    setError(null)
    startTransition(async () => {
      const result = await unassignMemberFromView(orgSlug, assignmentId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to remove assignment.')
      }
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <h2 className="font-heading text-base font-medium">Assigned members</h2>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members assigned to this view.</p>
      ) : (
        <ul className="space-y-2" aria-label="Assigned members">
          {assignments.map((a) => {
            const display = a.user.name ?? a.user.email
            return (
              <li key={a.id} className="flex items-center gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                  aria-hidden="true"
                >
                  {display[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{display}</p>
                  {a.user.name && (
                    <p className="text-xs text-muted-foreground truncate">{a.user.email}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${display}`}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                  onClick={() => handleUnassign(a.id)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {availableMembers.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? '')} disabled={isPending}>
            <SelectTrigger className="flex-1" aria-label="Select member to assign">
              <SelectValue placeholder="Select a member…" />
            </SelectTrigger>
            <SelectContent>
              {availableMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAssign} disabled={!selectedUserId || isPending}>
            Assign
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
