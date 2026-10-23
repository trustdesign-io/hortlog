'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { answerJoinRequest } from '@/lib/actions/join-request'

export interface JoinRequestRow {
  id: string
  name: string | null
  email: string
  message: string | null
  /** ISO */
  createdAt: string
}

/** People asking to join this garden: accept (they join as a member) or decline. */
export function JoinRequests({ orgSlug, requests }: { orgSlug: string; requests: JoinRequestRow[] }) {
  if (requests.length === 0) return null
  return (
    <section aria-labelledby="join-requests" className="space-y-3">
      <h2 id="join-requests" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Asking to join ({requests.length})
      </h2>
      <ul className="divide-y rounded-xl border bg-card">
        {requests.map((r) => (
          <JoinRequestItem key={r.id} orgSlug={orgSlug} request={r} />
        ))}
      </ul>
    </section>
  )
}

function JoinRequestItem({ orgSlug, request: r }: { orgSlug: string; request: JoinRequestRow }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function answer(accept: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await answerJoinRequest(orgSlug, r.id, accept).catch(() => ({ success: false as const, error: 'That couldn’t be saved. Try again.' }))
      if (!result.success) setError(result.error ?? 'Try again.')
      else router.refresh()
    })
  }

  return (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{r.name ?? r.email.split('@')[0]}</p>
        <p className="break-all text-xs text-muted-foreground">
          {r.email} · asked {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
        {r.message && <p className="mt-1 text-sm">&ldquo;{r.message}&rdquo;</p>}
        {error && (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" disabled={isPending} onClick={() => answer(true)}>
          Accept
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => answer(false)}>
          Decline
        </Button>
      </div>
    </li>
  )
}
