'use client'

import { useCallback, useEffect, useState, useSyncExternalStore, type MouseEvent } from 'react'
import { CloudOff, Wifi } from 'lucide-react'
import { listOutbox, listSnapshots, offlineStoreAvailable } from '@/lib/offline/db'
import type { OutboxOp } from '@/lib/offline/ops'
import { flushOutbox, oldestSync, OUTBOX_EVENT, refreshOutboxStatus, SNAPSHOTS_EVENT } from '@/lib/offline/sync'
import { offlineAppHref, resolveOfflineRoute, type OfflineRoute } from '@/lib/offline/routes'
import type { OrgSnapshot } from '@/lib/offline/types'
import { timeAgo } from '@/components/offline/offline-status'
import { OfflineView } from './offline-views'
import { cn } from '@/lib/utils'

function currentPath(): string {
  const p = new URLSearchParams(window.location.search).get('path')
  return p && p.startsWith('/') ? p : '/'
}

/**
 * The app without a connection. Links are ordinary hortlog addresses; clicks
 * on them are handled here so moving between pages never waits on the network.
 */
const NAV_EVENT = 'offline-app-navigate'

function subscribePath(cb: () => void): () => void {
  window.addEventListener('popstate', cb)
  window.addEventListener(NAV_EVENT, cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener(NAV_EVENT, cb)
  }
}

function subscribeOnline(cb: () => void): () => void {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

async function loadSnapshots(): Promise<OrgSnapshot[]> {
  if (!offlineStoreAvailable()) return []
  const list = await listSnapshots().catch(() => [] as OrgSnapshot[])
  return list.sort((a, b) => a.org.name.localeCompare(b.org.name))
}

/**
 * The app without a connection. Links are ordinary hortlog addresses; clicks
 * on them are handled here so moving between pages never waits on the network.
 */
export function OfflineApp() {
  const path = useSyncExternalStore(subscribePath, currentPath, () => null)
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
  const [saved, setSaved] = useState<{ snapshots: OrgSnapshot[]; loadedAt: number } | null>(null)
  const [ops, setOps] = useState<OutboxOp[]>([])

  useEffect(() => {
    let cancelled = false
    const reloadOps = () =>
      void listOutbox()
        .catch(() => [] as OutboxOp[])
        .then((o) => {
          if (!cancelled) setOps(o)
        })
    const reloadSnapshots = () =>
      loadSnapshots().then((snapshots) => {
        if (!cancelled) setSaved({ snapshots, loadedAt: Date.now() })
        return snapshots
      })

    // A fresh copy arrived: load it with the outbox in one go, so changes it
    // now includes stop being laid on top at the same moment
    const reloadAll = () =>
      void Promise.all([loadSnapshots(), listOutbox().catch(() => [] as OutboxOp[])]).then(([snapshots, o]) => {
        if (cancelled) return
        setSaved({ snapshots, loadedAt: Date.now() })
        setOps(o)
      })

    // Back online: send what was done here (which then refreshes the saved copy)
    function sendAndRefresh() {
      if (navigator.onLine) void flushOutbox()
    }

    void reloadSnapshots()
    void refreshOutboxStatus()
    void sendAndRefresh()
    window.addEventListener(OUTBOX_EVENT, reloadOps)
    window.addEventListener(SNAPSHOTS_EVENT, reloadAll)
    window.addEventListener('online', sendAndRefresh)
    return () => {
      cancelled = true
      window.removeEventListener(OUTBOX_EVENT, reloadOps)
      window.removeEventListener(SNAPSHOTS_EVENT, reloadAll)
      window.removeEventListener('online', sendAndRefresh)
    }
  }, [])

  const onClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as HTMLElement).closest('a')
    if (!a || a.dataset.live !== undefined || a.target) return
    const href = a.getAttribute('href')
    if (!href || !href.startsWith('/') || href.startsWith('//')) return
    e.preventDefault()
    window.history.pushState(null, '', offlineAppHref(href))
    window.dispatchEvent(new Event(NAV_EVENT))
    window.scrollTo(0, 0)
  }, [])

  if (path === null || saved === null) {
    return <p className="p-6 text-sm text-muted-foreground">Opening the saved copy…</p>
  }

  const route: OfflineRoute = resolveOfflineRoute(path)
  const orgSlug = 'org' in route ? route.org : null
  const { snapshots, loadedAt } = saved
  const syncedAt = oldestSync(snapshots)

  return (
    <div className="min-h-dvh bg-background" onClick={onClick}>
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-xs sm:px-6',
          online ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
        role="status"
      >
        {online ? (
          <>
            <Wifi className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">You&rsquo;re back online.</span>
            <a href={path} data-live="" className="shrink-0 font-medium underline underline-offset-2">
              Open the live page
            </a>
          </>
        ) : (
          <>
            <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              You&rsquo;re offline.{syncedAt ? ` Showing the copy saved ${timeAgo(syncedAt, loadedAt)}.` : ''}
            </span>
          </>
        )}
      </div>

      <OfflineView route={route} orgSlug={orgSlug} snapshots={snapshots} ops={ops} />
    </div>
  )
}
