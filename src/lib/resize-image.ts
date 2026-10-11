/**
 * Shrinks a photo in the browser before upload, so phone photos fit the 2 MB
 * limit: longest side at most `maxSide`, saved as JPEG (WebP for PNGs, to keep
 * transparency in logos). Small images, GIFs
 * and anything the browser can't decode are returned unchanged.
 */
export async function resizeImage(file: File, maxSide = 1600, quality = 0.85): Promise<File> {
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= 1024 * 1024 && file.type !== 'image/heic') {
    bitmap.close()
    return file
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const type = file.type === 'image/png' ? 'image/webp' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) return file
  const ext = type === 'image/webp' ? '.webp' : '.jpg'
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, { type })
}
