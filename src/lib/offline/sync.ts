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
import { sendScenePhotos } from './scene-photos'
import { isUnsent, type OpResult, type OutboxOp, type SyncOpInput } from './ops'
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
  /** The server said this device is signed out, so changes wait until sign-in */
  signedOut: boolean
}

const INITIAL: OfflineStatus = { online: true, syncing: false, syncedAt: null, failed: false, unsent: 0, refused: 0, signedOut: false }
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

/** Re-save the offline app page, so the device always has the latest version of it. */
export function refreshOfflineShell() {
  postToWorker({ type: 'CACHE_SHELL' })
}

/** Fired on window when a saved copy is refreshed, so open pages can redraw. */
export const SNAPSHOTS_EVENT = 'hortlog-snapshots'

/** Sent changes stop being shown on top after this long, even if no fresh copy has arrived. */
const SENT_OP_TTL_MS = 24 * 60 * 60_000

/** Drop sent changes for an organisation that a copy fetched after `before` already includes. */
async function forgetSentOps(org: string, before: number) {
  for (const op of await listOutbox().catch(() => [] as OutboxOp[])) {
    if (op.org === org && op.sentAt && Date.parse(op.sentAt) <= before) await deleteOutboxOp(op.id).catch(() => {})
  }
}

let running: Promise<void> | null = null
/** Organisations asked for while a refresh was running; fetched straight after it */
let queuedSlugs: Set<string> | null = null
let queuedPrune = false

/**
 * Fetch a fresh copy of each organisation and save it, then ask the service
 * worker to save the offline pages and the plants' photos. `prune` removes
 * saved copies of organisations not listed (for a full refresh only).
 */
export function syncOrgs(orgSlugs: string[], { prune = true }: { prune?: boolean } = {}): Promise<void> {
  if (running) {
    // Changes may have been sent since this refresh began: fetch again after it
    queuedSlugs = new Set([...(queuedSlugs ?? []), ...orgSlugs])
    queuedPrune ||= prune
    return running
  }
  running = (async () => {
    if (!offlineStoreAvailable()) return
    setStatus({ syncing: true })
    let failed = false
    const images: string[] = []
    for (const slug of orgSlugs) {
      const startedAt = Date.now()
      try {
        const res = await fetch(`/api/offline-data/${encodeURIComponent(slug)}`, { cache: 'no-store' })
        if (!res.ok) {
          // 403/404: no longer a member, so don't keep a stale copy
          if (res.status !== 403 && res.status !== 404) failed = true
          else await forgetSentOps(slug, Infinity)
          continue
        }
        const snapshot = (await res.json()) as OrgSnapshot
        if (snapshot.version !== SNAPSHOT_VERSION) continue
        await putSnapshot(snapshot)
        // The fresh copy has every change sent before it was asked for
        await forgetSentOps(slug, startedAt)
        images.push(...snapshotImageUrls(snapshot))
      } catch {
        failed = true
      }
    }
    if (prune && !failed) await pruneSnapshots(orgSlugs).catch(() => {})
    const saved = await listSnapshots().catch(() => [] as OrgSnapshot[])
    setStatus({ syncing: false, failed, syncedAt: oldestSync(saved) })
    // Open pages reload the copies and the outbox together, so a change is
    // never shown twice or not at all while they catch up
    await countOutbox()
    window.dispatchEvent(new Event(SNAPSHOTS_EVENT))
    postToWorker({ type: 'CACHE_SHELL' })
    if (images.length > 0) postToWorker({ type: 'CACHE_IMAGES', urls: images })
  })().finally(() => {
    running = null
    if (queuedSlugs) {
      const next = [...queuedSlugs]
      const prune = queuedPrune
      queuedSlugs = null
      queuedPrune = false
      void syncOrgs(next, { prune })
    }
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

/** Update the waiting/refused counts without telling open pages. */
async function countOutbox(): Promise<OutboxOp[]> {
  let ops = await listOutbox().catch(() => [] as OutboxOp[])
  // Sent long ago and never confirmed by a fresh copy: stop showing it
  const stale = ops.filter((o) => o.sentAt && Date.now() - Date.parse(o.sentAt) > SENT_OP_TTL_MS)
  if (stale.length > 0) {
    for (const o of stale) await deleteOutboxOp(o.id).catch(() => {})
    ops = ops.filter((o) => !stale.includes(o))
  }
  setStatus({ unsent: ops.filter(isUnsent).length, refused: ops.filter((o) => o.error).length })
  return ops
}

export async function refreshOutboxStatus(): Promise<OutboxOp[]> {
  const ops = await countOutbox()
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
 * Send waiting changes. Applied (or already applied) ones are marked sent and
 * kept until a fresh copy, fetched straight after, includes them; refused ones
 * stay, marked, for the member to see; the rest are kept to try again.
 * Resolves true if anything was applied.
 */
export function flushOutbox(): Promise<boolean> {
  if (flushing) return flushing
  flushing = (async () => {
    if (!offlineStoreAvailable()) return false
    // Bed photos go separately; they don't hold up the changes
    void sendScenePhotos()
    const waiting = (await listOutbox().catch(() => [] as OutboxOp[])).filter(isUnsent)
    if (waiting.length === 0) {
      await refreshOutboxStatus()
      return false
    }
    let applied = false
    const sentOrgs = new Set<string>()
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
        if (res.status === 401) {
          // Kept on the device; sent once the member signs in again
          setStatus({ signedOut: true })
          break
        }
        if (!res.ok) break
        setStatus({ signedOut: false })
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
          // Kept, and still shown, until a fresh copy includes it
          const op = batch.find((o) => o.id === r.id)
          if (op) {
            await putOutboxOp({ ...op, sentAt: new Date().toISOString() })
            sentOrgs.add(op.org)
          }
        }
      }
    }
    await refreshOutboxStatus()
    // Fetch the copies these changes went into, so the screen moves onto hortlog's version
    if (sentOrgs.size > 0) void syncOrgs([...sentOrgs], { prune: false })
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
