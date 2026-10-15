import { useSyncExternalStore } from 'react'
import { deleteOfflineStore, listSnapshots, offlineStoreAvailable, pruneSnapshots, putSnapshot } from './db'
import { SNAPSHOT_VERSION, snapshotImageUrls, type OrgSnapshot } from './types'

/** Browser-only: keeps the device's offline copy of each organisation up to date. */

export interface OfflineStatus {
  online: boolean
  syncing: boolean
  /** When the oldest of this member's saved copies was last refreshed */
  syncedAt: string | null
  failed: boolean
}

const INITIAL: OfflineStatus = { online: true, syncing: false, syncedAt: null, failed: false }
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
