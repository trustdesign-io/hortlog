'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CloudCheck, CloudOff, RefreshCw, TriangleAlert, X } from 'lucide-react'
import { offlineAppHref } from '@/lib/offline/routes'
import { useOfflineStatus } from '@/lib/offline/sync'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button-variants'

/** "5 min ago", "2 h ago", "3 days ago" */
export function timeAgo(iso: string, now: number): string {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

interface CardState {
  Icon: typeof CloudCheck
  title: string
  detail: string
  tone?: 'warning'
  spin?: boolean
}

/**
 * The offline copy, in one small card: whether it's saved (and when), that
 * the app is offline, or changes waiting; with a way into the saved copy.
 */
export function OfflineCard({ className }: { className?: string }) {
  const { online, syncing, syncedAt, unsent, refused } = useOfflineStatus()
  const pathname = usePathname()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  const changes = (n: number) => `${n} change${n === 1 ? '' : 's'}`
  const state: CardState =
    refused > 0
      ? { Icon: TriangleAlert, title: `${changes(refused)} not saved`, detail: 'Review them in the saved copy', tone: 'warning' }
      : !online
        ? { Icon: CloudOff, title: 'Offline', detail: unsent > 0 ? `${changes(unsent)} waiting to send` : 'Using the saved copy' }
        : unsent > 0
          ? { Icon: RefreshCw, title: `${changes(unsent)} waiting`, detail: 'Sending as the signal allows' }
          : syncedAt
            ? { Icon: CloudCheck, title: 'Saved for offline', detail: timeAgo(syncedAt, now) }
            : syncing
              ? { Icon: RefreshCw, title: 'Saving for offline', detail: 'This takes a moment', spin: true }
              : { Icon: CloudOff, title: 'Not saved for offline', detail: 'Saves when there’s signal' }

  const { Icon } = state
  return (
    // Narrow places (the sidebar, the You panel): the button sits under the status
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-xl border bg-card p-3', className)} role="status">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          state.tone === 'warning' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className={cn('h-4 w-4', state.spin && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm font-medium">{state.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{state.detail}</span>
      </span>
      <a
        href={offlineAppHref(refused > 0 ? '/records' : pathname)}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
      >
        {refused > 0 ? 'Review' : 'Work offline'}
      </a>
    </div>
  )
}

/**
 * The offline card, kept in the bottom-right corner of every app page: a small
 * round button showing the status, which opens the full card.
 */
export function FloatingOfflineCard() {
  const { online, syncing, syncedAt, unsent, refused } = useOfflineStatus()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const Icon = refused > 0 ? TriangleAlert : !online ? CloudOff : unsent > 0 || syncing ? RefreshCw : syncedAt ? CloudCheck : CloudOff
  const count = refused > 0 ? refused : unsent
  const label = refused > 0 ? `${refused} change${refused === 1 ? '' : 's'} not saved` : !online ? 'Offline' : unsent > 0 ? `${unsent} change${unsent === 1 ? '' : 's'} waiting` : syncedAt ? 'Saved for offline' : 'Not saved for offline'

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div className="w-72 max-w-[calc(100vw-2rem)] shadow-lg">
          <OfflineCard />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close offline status' : `${label}. Show offline status`}
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-full border bg-card shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          refused > 0 ? 'text-destructive' : 'text-primary',
        )}
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Icon className={cn('h-5 w-5', syncing && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" />
        )}
        {!open && count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-primary-foreground" aria-hidden="true">
            {count}
          </span>
        )}
      </button>
    </div>
  )
}
