import { idbDelete, idbGet, idbGetAll, idbPut, offlineStoreAvailable, STORES } from './db'

/**
 * Bed photos taken on this device. Kept here (in the offline store's meta
 * store, keyed "scene-photo:<sceneId>") so they show without signal, and
 * uploaded when there's a connection. Browser-only.
 */
export interface LocalScenePhoto {
  key: string
  org: string
  sceneId: string
  blob: Blob
  takenAt: string
  /** Set once hortlog has it */
  sentAt?: string
}

/** Fired on window when a photo is taken or sent, so open pages can redraw. */
export const SCENE_PHOTO_EVENT = 'hortlog-scene-photo'
const PREFIX = 'scene-photo:'
/** Longest side, in pixels: plenty to lay out a bed, small enough to send on a weak signal */
const MAX_SIDE = 2048

function keyFor(sceneId: string): string {
  return `${PREFIX}${sceneId}`
}

export function scenePhotoApiPath(org: string, sceneId: string): string {
  return `/api/scene-photo/${encodeURIComponent(org)}/${encodeURIComponent(sceneId)}`
}

/** Shrink a camera photo to a JPEG no bigger than MAX_SIDE on its longest side. */
export async function shrinkPhoto(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Couldn’t read the photo'))), 'image/jpeg', 0.82),
  )
}

export async function getLocalScenePhoto(sceneId: string): Promise<LocalScenePhoto | undefined> {
  if (!offlineStoreAvailable()) return undefined
  return idbGet<LocalScenePhoto>(STORES.meta, keyFor(sceneId)).catch(() => undefined)
}

async function listLocalScenePhotos(): Promise<LocalScenePhoto[]> {
  const all = await idbGetAll<unknown>(STORES.meta).catch(() => [] as unknown[])
  return all.filter((v): v is LocalScenePhoto => typeof v === 'object' && v !== null && String((v as LocalScenePhoto).key ?? '').startsWith(PREFIX))
}

/** Keep a new photo on the device, then send it if there's signal. */
export async function takeScenePhoto(org: string, sceneId: string, file: Blob): Promise<void> {
  const blob = await shrinkPhoto(file)
  const photo: LocalScenePhoto = { key: keyFor(sceneId), org, sceneId, blob, takenAt: new Date().toISOString() }
  await idbPut(STORES.meta, photo, photo.key)
  window.dispatchEvent(new Event(SCENE_PHOTO_EVENT))
  if (navigator.onLine) void sendScenePhotos()
}

export async function forgetScenePhoto(sceneId: string): Promise<void> {
  await idbDelete(STORES.meta, keyFor(sceneId)).catch(() => {})
}

let sending: Promise<void> | null = null

/** Upload photos not yet sent. Unsent ones stay to try again; resolves when done. */
export function sendScenePhotos(): Promise<void> {
  sending ??= (async () => {
    if (!offlineStoreAvailable()) return
    for (const photo of await listLocalScenePhotos()) {
      if (photo.sentAt) continue
      try {
        const res = await fetch(scenePhotoApiPath(photo.org, photo.sceneId), {
          method: 'PUT',
          headers: { 'Content-Type': photo.blob.type || 'image/jpeg' },
          body: photo.blob,
          cache: 'no-store',
        })
        if (res.status === 404 || res.status === 415 || res.status === 413) {
          // Scene gone, or a photo hortlog won't take: nothing to retry
          await forgetScenePhoto(photo.sceneId)
          continue
        }
        if (!res.ok) break
        // Taken again while sending? Keep the newer one unsent
        const now = await getLocalScenePhoto(photo.sceneId)
        if (now?.takenAt === photo.takenAt) await idbPut(STORES.meta, { ...now, sentAt: new Date().toISOString() }, photo.key)
      } catch {
        break
      }
    }
    window.dispatchEvent(new Event(SCENE_PHOTO_EVENT))
  })().finally(() => {
    sending = null
  })
  return sending
}

/** Photos taken on this device that hortlog doesn't have yet */
export async function countUnsentScenePhotos(): Promise<number> {
  if (!offlineStoreAvailable()) return 0
  return (await listLocalScenePhotos()).filter((p) => !p.sentAt).length
}
