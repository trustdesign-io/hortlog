import type { OutboxOp } from './ops'
import type { OrgSnapshot } from './types'

/**
 * The device's offline store, in IndexedDB. Browser-only.
 * - snapshots: one OrgSnapshot per organisation, keyed by its slug
 * - outbox: changes made offline, waiting to be sent
 * - meta: small settings
 */
const DB_NAME = 'hortlog-offline'
const DB_VERSION = 1
export const STORES = { snapshots: 'snapshots', outbox: 'outbox', meta: 'meta' } as const
type StoreName = (typeof STORES)[keyof typeof STORES]

let dbPromise: Promise<IDBDatabase> | null = null

export function offlineStoreAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORES.snapshots)) db.createObjectStore(STORES.snapshots)
      if (!db.objectStoreNames.contains(STORES.outbox)) db.createObjectStore(STORES.outbox, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.meta)) db.createObjectStore(STORES.meta)
    }
    req.onsuccess = () => {
      const db = req.result
      // Let another tab's upgrade or a sign-out delete proceed
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

function done<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDb()
  return done(db.transaction(store).objectStore(store).get(key)) as Promise<T | undefined>
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb()
  return done(db.transaction(store).objectStore(store).getAll()) as Promise<T[]>
}

export async function idbPut(store: StoreName, value: unknown, key?: IDBValidKey): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).put(value, key)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function idbDelete(store: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).delete(key)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function getSnapshot(orgSlug: string): Promise<OrgSnapshot | undefined> {
  return idbGet<OrgSnapshot>(STORES.snapshots, orgSlug)
}

export function listSnapshots(): Promise<OrgSnapshot[]> {
  return idbGetAll<OrgSnapshot>(STORES.snapshots)
}

export function putSnapshot(snapshot: OrgSnapshot): Promise<void> {
  return idbPut(STORES.snapshots, snapshot, snapshot.org.slug)
}

/** Remove every organisation's copy except these. */
export async function pruneSnapshots(keepSlugs: string[]): Promise<void> {
  const keep = new Set(keepSlugs)
  for (const s of await listSnapshots()) {
    if (!keep.has(s.org.slug)) await idbDelete(STORES.snapshots, s.org.slug)
  }
}

/** Wipe the whole offline store, e.g. on sign-out. */
export async function deleteOfflineStore(): Promise<void> {
  if (!offlineStoreAvailable()) return
  if (dbPromise) {
    try {
      ;(await dbPromise).close()
    } catch {
      // Already closed or never opened
    }
    dbPromise = null
  }
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })
}

// ─── Outbox: changes made offline ────────────────────────────────────────────

export async function listOutbox(): Promise<OutboxOp[]> {
  if (!offlineStoreAvailable()) return []
  const ops = await idbGetAll<OutboxOp>(STORES.outbox)
  // Send in the order they were made
  return ops.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function putOutboxOp(op: OutboxOp): Promise<void> {
  return idbPut(STORES.outbox, op)
}

export function deleteOutboxOp(id: string): Promise<void> {
  return idbDelete(STORES.outbox, id)
}
