import { createAdminClient } from '@/lib/supabase/admin'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export type UploadResult =
  | { success: true; url: string }
  | { success: false; error: string }

function validateImageFile(file: File): string | null {
  if (!MIME_TO_EXT[file.type]) return 'File must be a JPEG, PNG, WebP, GIF, or AVIF image.'
  if (file.size > MAX_FILE_SIZE) return 'File must be 2 MB or smaller.'
  return null
}

function sanitisedFilename(mimeType: string): string {
  const ext = MIME_TO_EXT[mimeType] ?? 'jpg'
  return `${Date.now()}.${ext}`
}

export async function uploadOrgLogo(file: File, orgId: string): Promise<UploadResult> {
  const err = validateImageFile(file)
  if (err) return { success: false, error: err }

  const supabase = createAdminClient()
  const path = `${orgId}/${sanitisedFilename(file.type)}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('org-logos')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return { success: false, error: error.message }

  const { data } = supabase.storage.from('org-logos').getPublicUrl(path)
  return { success: true, url: data.publicUrl }
}

export async function uploadSpecimenImage(
  file: File,
  specimenId: string,
  orgId: string,
): Promise<UploadResult> {
  const err = validateImageFile(file)
  if (err) return { success: false, error: err }

  const supabase = createAdminClient()
  const path = `${orgId}/${specimenId}/${sanitisedFilename(file.type)}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('specimen-images')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return { success: false, error: error.message }

  const { data } = supabase.storage.from('specimen-images').getPublicUrl(path)
  return { success: true, url: data.publicUrl }
}

export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  const err = validateImageFile(file)
  if (err) return { success: false, error: err }

  const supabase = createAdminClient()
  const path = `${userId}/${sanitisedFilename(file.type)}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return { success: false, error: error.message }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return { success: true, url: data.publicUrl }
}
