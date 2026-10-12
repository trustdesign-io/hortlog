import { hexFrame } from './hex-grid'

export const SCENE_PERSPECTIVES = ['BED', 'WALL'] as const

export type ScenePerspective = (typeof SCENE_PERSPECTIVES)[number]

export const DEFAULT_PERSPECTIVE: ScenePerspective = 'BED'

export const MAX_BED_TILT = 50

/** Smallest height, in CSS pixels, a tappable cell may be drawn at. */
export const MIN_TARGET_PX = 44

export function parsePerspective(raw: string | null): ScenePerspective | null {
  return SCENE_PERSPECTIVES.find((p) => p === raw) ?? null
}

/**
 * Steepest tilt, up to MAX_BED_TILT, that keeps the back row's cells at least
 * MIN_TARGET_PX tall. Deep beds of small cells get a gentler tilt, or none.
 */
export function bedTilt(rows: number, cellWidthPx: number): number {
  for (let tilt = MAX_BED_TILT; tilt > 0; tilt--) {
    const back = hexFrame(0, 0, rows, 1, tilt)
    if (back.height * cellWidthPx >= MIN_TARGET_PX) return tilt
  }
  return 0
}

/** Tilt to draw a scene's grid at; walls and the editor's flat view are untilted. */
export function sceneTilt(
  perspective: ScenePerspective,
  rows: number,
  cellWidthPx: number,
  isFlat = false,
): number {
  if (perspective === 'WALL' || isFlat) return 0
  return bedTilt(rows, cellWidthPx)
}
