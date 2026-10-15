import { useSyncExternalStore } from 'react'
import {
  deleteOfflineStore,
  deleteOutboxOp,
  listOutbox,
  listSnapshots,
  offlineStoreAvailable,
  pruneSnapshots,
  putOutboxOp,
  putSnapshot,
} from './db'
import type { OpResult, OutboxOp, SyncOpInput } from './ops'
import { SNAPSHOT_VERSION, snapshotImageUrls, type OrgSnapshot } from './types'

/** Browser-only: keeps the device's offline copy of each organisation up to date. */

export interface OfflineStatus {
  online: boolean
  syncing: boolean
  /** When the oldest of this member's saved copies was last refreshed */
  syncedAt: string | null
  failed: boolean
  /** Changes made on this device waiting to be sent */
  unsent: number
  /** Changes the server refused, which the member should look at */
  refused: number
}

const INITIAL: OfflineStatus = { online: true, syncing: false, syncedAt: null, failed: false, unsent: 0, refused: 0 }
let status: OfflineStatus = INITIAL
const listeners = new Set<() => void>()

function setStatus(patch: Partial<OfflineStatus>) {
  status = { ...status, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useOfflineStatus(): OfflineStatus {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => INITIAL,
  )
}

export function setOnline(online: boolean) {
  setStatus({ online })
}

/** Oldest refresh time among the given copies, so the status never overstates freshness. */
export function oldestSync(snapshots: OrgSnapshot[]): string | null {
  if (snapshots.length === 0) return null
  return snapshots.map((s) => s.syncedAt).sort()[0]
}

function postToWorker(message: unknown) {
  if (!('serviceWorker' in navigator)) return
  // `ready` waits for a first-time install, when there's no controller yet
  void navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage(message)).catch(() => {})
}

let running: Promise<void> | null = null

/**
 * Fetch a fresh copy of each organisation and save it, then ask the service
 * worker to save the offline pages and the plants' photos.
 */
export function syncOrgs(orgSlugs: string[]): Promise<void> {
  if (running) return running
  running = (async () => {
    if (!offlineStoreAvailable()) return
    setStatus({ syncing: true })
    let failed = false
    const images: string[] = []
    for (const slug of orgSlugs) {
      try {
        const res = await fetch(`/api/offline-data/${encodeURIComponent(slug)}`, { cache: 'no-store' })
        if (!res.ok) {
          // 403/404: no longer a member, so don't keep a stale copy
          if (res.status !== 403 && res.status !== 404) failed = true
          continue
        }
        const snapshot = (await res.json()) as OrgSnapshot
        if (snapshot.version !== SNAPSHOT_VERSION) continue
        await putSnapshot(snapshot)
        images.push(...snapshotImageUrls(snapshot))
      } catch {
        failed = true
      }
    }
    if (!failed) await pruneSnapshots(orgSlugs).catch(() => {})
    const saved = await listSnapshots().catch(() => [] as OrgSnapshot[])
    setStatus({ syncing: false, failed, syncedAt: oldestSync(saved) })
    postToWorker({ type: 'CACHE_SHELL' })
    if (images.length > 0) postToWorker({ type: 'CACHE_IMAGES', urls: images })
  })().finally(() => {
    running = null
  })
  return running
}

/** Load the saved copies' refresh time into the status without fetching. */
export async function loadSavedStatus(): Promise<OrgSnapshot[]> {
  if (!offlineStoreAvailable()) return []
  const saved = await listSnapshots().catch(() => [] as OrgSnapshot[])
  setStatus({ syncedAt: oldestSync(saved) })
  return saved
}

// ─── Outbox ──────────────────────────────────────────────────────────────────

/** Fired on window whenever the outbox changes, so open pages can redraw. */
export const OUTBOX_EVENT = 'hortlog-outbox'

export async function refreshOutboxStatus(): Promise<OutboxOp[]> {
  const ops = await listOutbox().catch(() => [] as OutboxOp[])
  setStatus({ unsent: ops.filter((o) => !o.error).length, refused: ops.filter((o) => o.error).length })
  window.dispatchEvent(new Event(OUTBOX_EVENT))
  return ops
}

/** Save a change on the device, then try to send it straight away. */
export async function queueOp(op: SyncOpInput): Promise<void> {
  await putOutboxOp(op)
  await refreshOutboxStatus()
  if (!navigator.onLine) return
  // Made while a send is under way: send it straight after
  if (flushing) flushAgain = true
  else void flushOutbox()
}

/** Forget a change the server refused. */
export async function dismissOp(id: string): Promise<void> {
  await deleteOutboxOp(id)
  await refreshOutboxStatus()
}

let flushing: Promise<boolean> | null = null
let flushAgain = false

/**
 * Send waiting changes. Applied (or already applied) ones leave the outbox;
 * refused ones stay, marked, for the member to see; the rest are kept to try
 * again. Resolves true if anything was applied.
 */
export function flushOutbox(): Promise<boolean> {
  if (flushing) return flushing
  flushing = (async () => {
    if (!offlineStoreAvailable()) return false
    const waiting = (await listOutbox().catch(() => [] as OutboxOp[])).filter((o) => !o.error)
    if (waiting.length === 0) {
      await refreshOutboxStatus()
      return false
    }
    let applied = false
    for (let i = 0; i < waiting.length; i += 100) {
      const batch = waiting.slice(i, i + 100)
      let results: OpResult[]
      try {
        const res = await fetch('/api/offline-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ops: batch }),
          cache: 'no-store',
        })
        if (!res.ok) break
        results = ((await res.json()) as { results: OpResult[] }).results
      } catch {
        break
      }
      for (const r of results) {
        if (r.status === 'rejected') {
          const op = batch.find((o) => o.id === r.id)
          if (op) await putOutboxOp({ ...op, error: r.error })
        } else {
          if (r.status === 'applied') applied = true
          await deleteOutboxOp(r.id)
        }
      }
    }
    await refreshOutboxStatus()
    return applied
  })().finally(() => {
    flushing = null
    if (flushAgain) {
      flushAgain = false
      void flushOutbox()
    }
  })
  return flushing
}

/** Remove everything saved for offline use from this device. */
export async function clearOfflineData(): Promise<void> {
  try {
    await deleteOfflineStore()
    postToWorker({ type: 'CLEAR_PRIVATE' })
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k.startsWith('hortlog-private-')).map((k) => caches.delete(k)))
    }
  } catch {
    // Best effort: sign-out must not fail because of this
  }
  setStatus({ syncedAt: null })
}
