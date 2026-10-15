'use client'

import { useEffect, useState } from 'react'
import { CloudCheck, CloudOff, RefreshCw } from 'lucide-react'
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

/** Footer note on the offline copy: when it was saved, or that the app is offline. */
export function OfflineStatusChip({ className }: { className?: string }) {
  const { online, syncing, syncedAt } = useOfflineStatus()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  if (!online) {
    return (
      <p className={cn('flex items-center gap-1 font-medium text-foreground', className)} role="status">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        Offline
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
