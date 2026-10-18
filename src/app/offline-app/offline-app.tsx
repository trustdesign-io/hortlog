'use client'

import { useCallback, useEffect, useState, useSyncExternalStore, type MouseEvent } from 'react'
import { CloudOff, Wifi } from 'lucide-react'
import { listOutbox, listSnapshots, offlineStoreAvailable } from '@/lib/offline/db'
import type { OutboxOp } from '@/lib/offline/ops'
import { flushOutbox, keepSending, oldestSync, OUTBOX_EVENT, refreshOutboxStatus, SNAPSHOTS_EVENT, useOfflineStatus } from '@/lib/offline/sync'
import { offlineAppHref, resolveOfflineRoute, type OfflineRoute } from '@/lib/offline/routes'
import type { OrgSnapshot } from '@/lib/offline/types'
import { timeAgo } from '@/components/offline/offline-status'
import { OfflineView } from './offline-views'
import { Sidebar } from '@/components/sidebar'
import { MobilePanelsProvider } from '@/components/layout/mobile-panels'
import { OfflineNavProvider } from '@/components/layout/offline-nav'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

/** A full page load: the offline app isn't part of the live app's routing */
const SIGN_IN_PATH = '/sign-in'

/** Don't send someone back more than once a minute, in case the live site keeps timing out */
const RETURN_KEY = 'hortlog-auto-return'
const RETURN_GAP_MS = 60_000

/** Sent here automatically (a page didn't load), rather than by choosing "Work offline" */
function cameAutomatically(): boolean {
  return new URLSearchParams(window.location.search).get('auto') === '1'
}

/** Back to the live page if hortlog answers; resolves false if it doesn't, or did so just now. */
async function returnToLive(path: string): Promise<boolean> {
  try {
    const last = Number(sessionStorage.getItem(RETURN_KEY) ?? 0)
    if (Date.now() - last < RETURN_GAP_MS) return false
  } catch {
    // No session storage: still fine to try once
  }
  try {
    const res = await fetch('/api/ping', { cache: 'no-store', signal: AbortSignal.timeout(6000) })
    if (!res.ok) return false
  } catch {
    return false
  }
  try {
    sessionStorage.setItem(RETURN_KEY, String(Date.now()))
  } catch {
    // Ignore
  }
  window.location.replace(path)
  return true
}

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
  const { signedOut, unsent } = useOfflineStatus()
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
    // Don't rely on the browser's online signal: keep trying while anything waits
    const stopSending = keepSending()
    window.addEventListener(OUTBOX_EVENT, reloadOps)
    window.addEventListener(SNAPSHOTS_EVENT, reloadAll)
    window.addEventListener('online', sendAndRefresh)
    return () => {
      cancelled = true
      window.removeEventListener(OUTBOX_EVENT, reloadOps)
      window.removeEventListener(SNAPSHOTS_EVENT, reloadAll)
      window.removeEventListener('online', sendAndRefresh)
      stopSending()
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

  // Sent here only because a page was slow or the signal dropped: go back as soon as hortlog answers
  useEffect(() => {
    if (!cameAutomatically() || signedOut) return
    const tryReturn = () => {
      if (navigator.onLine) void returnToLive(currentPath())
    }
    tryReturn()
    window.addEventListener('online', tryReturn)
    return () => window.removeEventListener('online', tryReturn)
  }, [signedOut])

  if (path === null || saved === null) {
    return <p className="p-6 text-sm text-muted-foreground">Opening the saved copy…</p>
  }

  const route: OfflineRoute = resolveOfflineRoute(path)
  const orgSlug = 'org' in route ? route.org : null
  const { snapshots, loadedAt } = saved
  const syncedAt = oldestSync(snapshots)

  return (
    // The app's own sidebar and menus, as on the live site; pages that need a connection are greyed out
    <OfflineNavProvider path={path} disabled={needsConnection}>
      <MobilePanelsProvider>
        <div className="flex h-dvh overflow-hidden" onClickCapture={onClick}>
          <Sidebar user={offlineUser(snapshots)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-[4.25rem] sm:px-6 md:p-6">
              {/* Where this copy stands, and the way back to the live site */}
              <div
                className={cn(
                  'mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2 text-sm',
                  online ? 'border-primary/30 bg-primary/10' : 'bg-muted',
                )}
                role="status"
              >
                {online ? <Wifi className="h-4 w-4 shrink-0" aria-hidden="true" /> : <CloudOff className="h-4 w-4 shrink-0" aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  {!online
                    ? `Offline: using the copy saved on this device${syncedAt ? ` ${timeAgo(syncedAt, loadedAt)}` : ''}.`
                    : signedOut
                      ? `You’re signed out.${unsent > 0 ? ' Your changes are kept here until you sign in.' : ''}`
                      : 'This is the copy saved on this device.'}
                </span>
                {online && (
                  <a
                    href={signedOut ? SIGN_IN_PATH : path}
                    data-live=""
                    className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')}
                  >
                    {signedOut ? (unsent > 0 ? 'Sign in to send' : 'Sign in') : 'Back to the live site'}
                  </a>
                )}
              </div>
              <main className="flex-1">
                <OfflineView route={route} orgSlug={orgSlug} snapshots={snapshots} ops={ops} />
              </main>
            </div>
          </div>
        </div>
      </MobilePanelsProvider>
    </OfflineNavProvider>
  )
}

/** Pages the saved copy can't show: greyed out in the menus */
function needsConnection(href: string): boolean {
  return resolveOfflineRoute(href).kind === 'unavailable'
}

/** Enough of the signed-in member, from the saved copies, for the app's menus */
function offlineUser(snapshots: OrgSnapshot[]): UserWithMemberships {
  const me = snapshots[0]?.user
  return {
    id: me?.id ?? 'offline',
    name: me?.name ?? null,
    email: '',
    avatarUrl: null,
    isAdmin: false,
    memberships: snapshots.map((s) => ({
      role: s.user.canManage ? 'MANAGER' : 'MEMBER',
      organisation: s.org,
      organisationId: s.org.id,
      userId: s.user.id,
    })),
  } as unknown as UserWithMemberships
}
