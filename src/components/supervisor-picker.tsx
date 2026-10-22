'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setSupervisor } from '@/lib/actions/supervision'

export interface SupervisorChoice {
  orgSlug: string
  orgName: string
  currentId: string | null
  members: { id: string; name: string }[]
}

/** On My record: who signs off your work, garden by garden */
export function SupervisorPicker({ choices }: { choices: SupervisorChoice[] }) {
  const router = useRouter()
  const [values, setValues] = useState(() => Object.fromEntries(choices.map((c) => [c.orgSlug, c.currentId ?? ''])))
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function change(orgSlug: string, id: string) {
    const before = values[orgSlug]
    setValues((v) => ({ ...v, [orgSlug]: id }))
    setMessage(null)
    startTransition(async () => {
      const r = await setSupervisor(orgSlug, id || null).catch(() => ({ success: false as const, error: 'That couldn’t be saved. Try again.' }))
      if (!r.success) {
        setValues((v) => ({ ...v, [orgSlug]: before }))
        setMessage(r.error)
        return
      }
      setMessage('Saved.')
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="supervisor-heading" className="mt-8 space-y-3 rounded-xl border bg-card p-4">
      <div>
        <h2 id="supervisor-heading" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Supervisor
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For an apprenticeship or training: the person who signs off your work. They see your entries in that garden and
          can sign each off with a comment; signed entries show a tick on your record and when it&rsquo;s printed.
        </p>
      </div>
      {choices.map((c) => (
        <div key={c.orgSlug} className="space-y-1">
          <label htmlFor={`supervisor-${c.orgSlug}`} className="text-sm font-medium">
            {c.orgName}
          </label>
          <select
            id={`supervisor-${c.orgSlug}`}
            value={values[c.orgSlug]}
            disabled={isPending}
            onChange={(e) => change(c.orgSlug, e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base sm:h-9 sm:text-sm"
          >
            <option value="">No supervisor</option>
            {c.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      ))}
      <p className="min-h-4 text-xs text-muted-foreground" aria-live="polite">
        {message}
      </p>
    </section>
  )
}
