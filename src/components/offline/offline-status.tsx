'use client'

import { useEffect, useState } from 'react'
import { CloudCheck, CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import { offlineAppHref } from '@/lib/offline/routes'
import { useOfflineStatus } from '@/lib/offline/sync'
import { cn } from '@/lib/utils'

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

/** Note on the offline copy, shown with the member's details: when it was saved, that the app is offline, or changes waiting to send. */
export function OfflineStatusChip({ className }: { className?: string }) {
  const { online, syncing, syncedAt, unsent, refused } = useOfflineStatus()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  const changes = (n: number) => `${n} change${n === 1 ? '' : 's'}`

  if (refused > 0) {
    return (
      <a
        href={offlineAppHref('/records')}
        className={cn('flex items-center gap-1 font-medium text-destructive underline underline-offset-2', className)}
        role="status"
      >
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        {changes(refused)} not saved
      </a>
    )
  }
  if (!online) {
    return (
      <p className={cn('flex items-center gap-1 font-medium text-foreground', className)} role="status">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        Offline{unsent > 0 && ` · ${changes(unsent)} waiting to send`}
      </p>
    )
  }
  if (unsent > 0) {
    return (
      <p className={cn('flex items-center gap-1', className)} role="status">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        {changes(unsent)} waiting to send
      </p>
    )
  }
  if (syncing && !syncedAt) {
    return (
      <p className={cn('flex items-center gap-1', className)} role="status">
        <RefreshCw className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Saving for offline
      </p>
    )
  }
  if (!syncedAt) return null
  return (
    <p className={cn('flex items-center gap-1', className)} role="status" title="A copy is saved on this device for use offline">
      <CloudCheck className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Saved offline {timeAgo(syncedAt, now)}</span>
    </p>
  )
}
