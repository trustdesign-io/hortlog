'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { UnavailableAction } from '@/components/ui/unavailable-action'
import { buttonVariants } from '@/components/ui/button-variants'
import { fuzzyScore } from '@/lib/fuzzy'
import { MAX_JOIN_MESSAGE, type GardenStatus } from '@/lib/join-requests'
import { cancelJoinRequest, requestToJoin } from '@/lib/actions/join-request'

interface Garden {
  slug: string
  name: string
  logoUrl: string | null
  area: string | null
  status: GardenStatus
}

function useOnline(): boolean {
  const [online, setOnline] = useState(true)
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
  return online
}

/** Search the gardens on hortlog and ask to join one. */
export function GardenFinder({ gardens }: { gardens: Garden[] }) {
  const [query, setQuery] = useState('')
  const shown = useMemo(() => {
    if (!query.trim()) return gardens
    return gardens
      .map((g, i) => ({ g, i, score: fuzzyScore(query, [g.name, g.slug, g.area]) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map((x) => x.g)
  }, [query, gardens])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gardens…"
          aria-label="Search gardens"
          className="h-11 pl-9 text-base sm:text-sm"
          autoComplete="off"
        />
      </div>
      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {gardens.length === 0 ? 'No gardens are listed yet.' : 'No gardens match.'}
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Gardens">
          {shown.map((g) => (
            <GardenRow key={g.slug} garden={g} />
          ))}
        </ul>
      )}
    </div>
  )
}

function GardenRow({ garden: g }: { garden: Garden }) {
  const online = useOnline()
  const [status, setStatus] = useState(g.status)
  const [asking, setAsking] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function run(action: () => Promise<{ success: boolean; error?: string }>, next: GardenStatus) {
    setError(null)
    startTransition(async () => {
      const result = await action().catch(() => ({ success: false, error: 'That couldn’t be sent. Try again.' }))
      if (!result.success) {
        setError(result.error ?? 'Try again.')
        return
      }
      setStatus(next)
      setAsking(false)
    })
  }

  const offline = 'You’re offline. Try again when you’re back online.'
  let action: React.ReactNode
  if (status === 'member') {
    action = (
      <Link href={`/${g.slug}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        Open
      </Link>
    )
  } else if (status === 'declined') {
    action = (
      <UnavailableAction reason="This garden’s managers didn’t accept your request." className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        Ask to join
      </UnavailableAction>
    )
  } else if (status === 'asked') {
    action = (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Asked
        </span>
        {online ? (
          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => run(() => cancelJoinRequest(g.slug), 'none')}>
            {isPending ? 'Cancelling…' : 'Cancel'}
          </Button>
        ) : (
          <UnavailableAction reason={offline} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Cancel
          </UnavailableAction>
        )}
      </div>
    )
  } else if (!asking) {
    action = online ? (
      <Button type="button" variant="outline" size="sm" onClick={() => setAsking(true)}>
        Ask to join
      </Button>
    ) : (
      <UnavailableAction reason={offline} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        Ask to join
      </UnavailableAction>
    )
  }

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-sm font-medium text-muted-foreground">
          {g.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.logoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            g.name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{g.name}</p>
          {g.area && <p className="text-xs text-muted-foreground">{g.area}</p>}
        </div>
        {action}
      </div>
      {asking && status === 'none' && (
        <div className="mt-3 space-y-2">
          <label htmlFor={`join-${g.slug}`} className="text-xs text-muted-foreground">
            Message to the managers (optional)
          </label>
          <Textarea
            id={`join-${g.slug}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_JOIN_MESSAGE}
            rows={2}
            placeholder="e.g. I volunteer on Fridays"
            disabled={isPending}
          />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" disabled={isPending} onClick={() => run(() => requestToJoin(g.slug, message), 'asked')}>
              {isPending ? 'Sending…' : 'Send request'}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => setAsking(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </li>
  )
}
