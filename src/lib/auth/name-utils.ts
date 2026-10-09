/**
 * Reads the display name from Supabase user_metadata.
 * Prefers `full_name` (current canonical key) and falls back to `name` (legacy key).
 * Returns null when neither key is present or both are empty strings.
 */
export function getNameFromMetadata(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  if (!meta) return null
  const value = meta.full_name ?? meta.name ?? null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}
