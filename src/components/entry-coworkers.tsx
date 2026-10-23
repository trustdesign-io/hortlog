'use client'

import { useEffect, useState, useTransition } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { MultiMemberPicker } from '@/components/multi-member-picker'
import type { PickerMember } from '@/components/member-picker'
import { setEntryCoworkers } from '@/lib/actions/work-record'

interface EntryCoworkersProps {
  orgSlug: string
  entryId: string
  /** Everyone in the garden who could be tagged (not the person who logged it) */
  members: PickerMember[]
  /** Who's tagged now */
  initial: PickerMember[]
}

function personName(m: { name: string | null; email: string }): string {
  return m.name?.trim() || m.email
}

/** "With …" on a saved work entry, and a way to change who it was with. */
export function EntryCoworkers({ orgSlug, entryId, members, initial }: EntryCoworkersProps) {
  const [tagged, setTagged] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string[]>(initial.map((m) => m.id))
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  // Members who've left the garden stay listed until they're removed
  const choices = [...members, ...tagged.filter((t) => !members.some((m) => m.id === t.id))]
  const label = tagged.length > 0 ? 'Edit' : 'Add who you worked with'
  const triggerClass = 'inline-flex min-h-8 items-center gap-1 rounded px-1.5 text-xs text-primary underline-offset-2 hover:underline'

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await setEntryCoworkers(orgSlug, entryId, draft).catch(() => ({
        success: false as const,
        error: 'That couldn’t be saved. Try again.',
      }))
      if (!result.success) {
        setError(result.error)
        return
      }
      setTagged(draft.map((id) => choices.find((m) => m.id === id)).filter((m): m is PickerMember => m !== undefined))
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="mt-2 space-y-2 print:hidden">
        <MultiMemberPicker
          id={`coworkers-${entryId}`}
          name="coworkerId"
          placeholder="Add someone from the team…"
          members={choices}
          values={draft}
          onChange={setDraft}
          disabled={isPending}
        />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={save} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              setDraft(tagged.map((m) => m.id))
              setError(null)
              setEditing(false)
            }}
          >
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">It shows on their record too. They can remove themselves.</p>
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
      {tagged.length > 0 && <span>With {tagged.map(personName).join(', ')}</span>}
      {members.length === 0 && tagged.length === 0 ? null : !online ? (
        <UnavailableAction reason="You’re offline. Change who you worked with when you’re back online." className={`${triggerClass} print:hidden`}>
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </UnavailableAction>
      ) : (
        <button
          type="button"
          className={`${triggerClass} print:hidden`}
          onClick={() => {
            setDraft(tagged.map((m) => m.id))
            setEditing(true)
          }}
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </button>
      )}
    </p>
  )
}
