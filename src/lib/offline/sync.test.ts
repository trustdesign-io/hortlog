import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OutboxOp } from './ops'
import { SNAPSHOT_VERSION, type OrgSnapshot } from './types'

// In-memory stand-in for the device store
const outbox = new Map<string, OutboxOp>()
const snapshots = new Map<string, OrgSnapshot>()
vi.mock('./db', () => ({
  offlineStoreAvailable: () => true,
  listOutbox: async () => [...outbox.values()],
  putOutboxOp: async (op: OutboxOp) => void outbox.set(op.id, op),
  deleteOutboxOp: async (id: string) => void outbox.delete(id),
  listSnapshots: async () => [...snapshots.values()],
  putSnapshot: async (s: OrgSnapshot) => void snapshots.set(s.org.slug, s),
  pruneSnapshots: async () => {},
  deleteOfflineStore: async () => {},
}))

vi.mock('./scene-photos', () => ({ sendScenePhotos: async () => {} }))

const { flushOutbox, queueOp, SNAPSHOTS_EVENT } = await import('./sync')

const snapshot = { version: SNAPSHOT_VERSION, org: { slug: 'kew' }, syncedAt: new Date().toISOString() } as unknown as OrgSnapshot

function op(id: string): OutboxOp {
  return { id, org: 'kew', kind: 'updateScene', sceneId: 's1', title: 'New', createdAt: new Date().toISOString() } as unknown as OutboxOp
}

function nextSnapshotsEvent(): Promise<void> {
  return new Promise((resolve) => window.addEventListener(SNAPSHOTS_EVENT, () => resolve(), { once: true }))
}

describe('sent changes', () => {
  beforeEach(() => {
    outbox.clear()
    snapshots.clear()
    vi.restoreAllMocks()
  })

  it('stay in the outbox, marked sent, until a fresh copy arrives', async () => {
    let releaseSnapshot: () => void = () => {}
    const snapshotGate = new Promise<void>((r) => (releaseSnapshot = r))
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('/api/offline-sync')) {
        return new Response(JSON.stringify({ results: [{ id: 'a', status: 'applied' }] }))
      }
      await snapshotGate
      return new Response(JSON.stringify(snapshot))
    })
    outbox.set('a', op('a'))
    const refreshed = nextSnapshotsEvent()

    expect(await flushOutbox()).toBe(true)
    // Applied, but the copy on the device doesn't have it yet: still shown
    expect(outbox.get('a')?.sentAt).toBeTruthy()

    releaseSnapshot()
    await refreshed
    expect(outbox.has('a')).toBe(false)
    expect(snapshots.has('kew')).toBe(true)
  })

  it('are kept if the fresh copy can’t be fetched', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('/api/offline-sync')) {
        return new Response(JSON.stringify({ results: [{ id: 'a', status: 'applied' }] }))
      }
      throw new TypeError('offline')
    })
    outbox.set('a', op('a'))
    const refreshed = nextSnapshotsEvent()
    await flushOutbox()
    await refreshed
    expect(outbox.get('a')?.sentAt).toBeTruthy()
  })

  it('are not sent twice', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('{}', { status: 500 }))
    outbox.set('a', { ...op('a'), sentAt: new Date().toISOString() })
    expect(await flushOutbox()).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a change made while offline is kept unsent', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await queueOp(op('b'))
    expect(outbox.get('b')?.sentAt).toBeUndefined()
  })
})
