/** Notes from the horticulture team, pinned to a scene for visitors. Pure and client-safe. */

export const MAX_SCENE_NOTE = 400
/** Visitors see the newest few; older ones stay for staff until removed */
export const VISIBLE_SCENE_NOTES = 3

/** A note as typed, tidied: blank lines kept as paragraphs, null if empty or too long */
export function cleanSceneNote(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const text = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.length > 0 && text.length <= MAX_SCENE_NOTE ? text : null
}
