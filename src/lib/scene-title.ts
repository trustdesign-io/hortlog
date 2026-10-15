/** Longest title a scene can have */
export const MAX_SCENE_TITLE = 80

/** A scene's title from a form: trimmed, empty means none; too long is an error. */
export function parseSceneTitle(raw: FormDataEntryValue | null): { ok: true; title: string | null } | { ok: false } {
  if (raw === null) return { ok: true, title: null }
  const title = String(raw).trim().replace(/\s+/g, ' ')
  if (title.length > MAX_SCENE_TITLE) return { ok: false }
  return { ok: true, title: title || null }
}
