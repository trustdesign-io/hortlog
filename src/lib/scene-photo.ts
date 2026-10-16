import { createAdminClient } from '@/lib/supabase/admin'

/**
 * A photo of a scene's bed, taken on site as a reference for laying out the
 * grid. Private: only people who can edit the scene see it, never visitors.
 * One per scene, replaced when a new one is taken.
 */
const BUCKET = 'scene-photos'
// Under Vercel's 4.5 MB request limit; phones shrink photos well below this first
export const MAX_SCENE_PHOTO_BYTES = 4 * 1024 * 1024
export const SCENE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

function photoPath(orgId: string, sceneId: string): string {
  return `${orgId}/${sceneId}`
}

let bucketReady: Promise<void> | null = null
function ensureBucket(): Promise<void> {
  bucketReady ??= (async () => {
    const supabase = createAdminClient()
    const { data } = await supabase.storage.getBucket(BUCKET)
    if (data) return
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_SCENE_PHOTO_BYTES,
      allowedMimeTypes: [...SCENE_PHOTO_TYPES],
    })
    if (error && !/already exists/i.test(error.message)) throw error
  })().catch((err: unknown) => {
    bucketReady = null
    throw err
  })
  return bucketReady
}

export async function saveScenePhoto(orgId: string, sceneId: string, bytes: ArrayBuffer, contentType: string): Promise<void> {
  await ensureBucket()
  const { error } = await createAdminClient()
    .storage.from(BUCKET)
    .upload(photoPath(orgId, sceneId), bytes, { contentType, upsert: true, cacheControl: '60' })
  if (error) throw error
}

/** A short-lived link to the scene's photo, or null if it has none. */
export async function scenePhotoUrl(orgId: string, sceneId: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET)
    .createSignedUrl(photoPath(orgId, sceneId), expiresInSeconds)
  if (error || !data) return null
  return data.signedUrl
}

export async function deleteScenePhoto(orgId: string, sceneId: string): Promise<void> {
  await createAdminClient().storage.from(BUCKET).remove([photoPath(orgId, sceneId)])
}
