import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LocalScenePhoto } from './scene-photos'

const meta = new Map<string, unknown>()
vi.mock('./db', () => ({
  STORES: { snapshots: 'snapshots', outbox: 'outbox', meta: 'meta' },
  offlineStoreAvailable: () => true,
  idbGet: async (_s: string, k: string) => meta.get(k),
  idbGetAll: async () => [...meta.values()],
  idbPut: async (_s: string, v: unknown, k: string) => void meta.set(k, v),
  idbDelete: async (_s: string, k: string) => void meta.delete(k),
}))

const { countUnsentScenePhotos, sendScenePhotos } = await import('./scene-photos')

function photo(sceneId: string, extra: Partial<LocalScenePhoto> = {}): LocalScenePhoto {
  return {
    key: `scene-photo:${sceneId}`,
    org: 'kew',
    sceneId,
    blob: new Blob(['x'], { type: 'image/jpeg' }),
    takenAt: '2026-10-17T09:00:00.000Z',
    ...extra,
  }
}

describe('bed photos', () => {
  beforeEach(() => {
    meta.clear()
    meta.set('lastSync', 'not a photo')
    vi.restoreAllMocks()
  })

  it('are sent once, then kept on the device marked sent', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    meta.set('scene-photo:a', photo('a'))
    await sendScenePhotos()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/scene-photo/kew/a')
    expect((meta.get('scene-photo:a') as LocalScenePhoto).sentAt).toBeTruthy()
    await sendScenePhotos()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(await countUnsentScenePhotos()).toBe(0)
  })

  it('wait for signal', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))
    meta.set('scene-photo:a', photo('a'))
    await sendScenePhotos()
    expect((meta.get('scene-photo:a') as LocalScenePhoto).sentAt).toBeUndefined()
    expect(await countUnsentScenePhotos()).toBe(1)
  })

  it('are dropped if the scene has gone', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }))
    meta.set('scene-photo:a', photo('a'))
    await sendScenePhotos()
    expect(meta.has('scene-photo:a')).toBe(false)
  })

  it('a newer photo taken while sending stays unsent', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      meta.set('scene-photo:a', photo('a', { takenAt: '2026-10-17T09:05:00.000Z' }))
      return new Response('{}')
    })
    meta.set('scene-photo:a', photo('a'))
    await sendScenePhotos()
    expect((meta.get('scene-photo:a') as LocalScenePhoto).sentAt).toBeUndefined()
  })
})
