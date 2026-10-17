/**
 * Checks plants marked on a bed photo (by Claude, via /api/claude) before any
 * are added. Pure, so it's testable.
 */
export interface PhotoPlantsInput {
  plants?: { name: string; note?: string; photo: [number, number] }[]
}

export interface PlannedPlant {
  name: string
  note: string | null
  /** 0–1 from the left and top of the photo */
  x: number
  y: number
}

export const MAX_PHOTO_PLANTS = 200
const MAX_NAME = 120
const MAX_NOTE = 500

export function planPhotoPlants(input: unknown): { ok: true; plants: PlannedPlant[] } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const raw = (input as Partial<PhotoPlantsInput> | null)?.plants
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, errors: ['Send at least one plant in "plants".'] }
  if (raw.length > MAX_PHOTO_PLANTS) errors.push(`At most ${MAX_PHOTO_PLANTS} plants at once.`)
  const plants: PlannedPlant[] = []
  for (const [i, pl] of raw.slice(0, MAX_PHOTO_PLANTS).entries()) {
    const where = `plants[${i}]`
    const name = typeof pl?.name === 'string' ? pl.name.trim() : ''
    const note = typeof pl?.note === 'string' && pl.note.trim() ? pl.note.trim().slice(0, MAX_NOTE) : null
    const photo = pl?.photo
    const spot =
      Array.isArray(photo) && photo.length === 2 && photo.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)
        ? { x: photo[0], y: photo[1] }
        : null
    if (!name || name.length > MAX_NAME) errors.push(`${where}: name is required (up to ${MAX_NAME} characters).`)
    else if (!spot) errors.push(`${where} (${name}): photo must be [x, y], each from 0 to 1.`)
    else plants.push({ name, note, ...spot })
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, plants }
}
