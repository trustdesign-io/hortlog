import { HEX_HEIGHT_RATIO, hexFrame } from './hex-grid'

export const SCENE_PERSPECTIVES = ['BED', 'WALL'] as const

export type ScenePerspective = (typeof SCENE_PERSPECTIVES)[number]

export const DEFAULT_PERSPECTIVE: ScenePerspective = 'BED'

export const MAX_BED_TILT = 50

/** Smallest visible height, in CSS pixels, a tappable cell may be drawn at. */
export const MIN_TARGET_PX = 44

/** The row in front covers a quarter of each cell's height. */
const VISIBLE_FRACTION = 0.75

export function parsePerspective(raw: string | null): ScenePerspective | null {
  return SCENE_PERSPECTIVES.find((p) => p === raw) ?? null
}

/**
 * Steepest tilt, up to MAX_BED_TILT, that keeps the back row's cells at least
 * MIN_TARGET_PX tall once the row in front has covered its share. Deep beds of small cells get a gentler tilt, or none.
 */
export function bedTilt(rows: number, cellWidthPx: number): number {
  for (let tilt = MAX_BED_TILT; tilt > 0; tilt--) {
    const back = hexFrame(0, 0, rows, 1, tilt)
    if (back.height * VISIBLE_FRACTION * cellWidthPx >= MIN_TARGET_PX) return tilt
  }
  return 0
}

/** Tilt to draw a scene's grid at; walls are untilted. */
export function sceneTilt(perspective: ScenePerspective, rows: number, cellWidthPx: number): number {
  if (perspective === 'WALL') return 0
  return bedTilt(rows, cellWidthPx)
}

/** Bed cells are drawn at most this much wider than flat ones. */
export const MAX_BED_CELL_SCALE = 1.25

/**
 * How much wider to draw a tilted grid's cells so a bed's middle row covers
 * about as much screen as the flat grid would. Lying back shrinks every cell
 * (narrower further back, and much shorter), so without this a bed looks
 * smaller than the same grid as a wall. Capped so wide beds still fit.
 */
export function sceneCellScale(rows: number, tiltDeg: number): number {
  if (tiltDeg === 0) return 1
  const middle = hexFrame(Math.floor((rows - 1) / 2), 0, rows, 1, tiltDeg)
  const areaRatio = (middle.width * middle.height) / HEX_HEIGHT_RATIO
  return Math.min(MAX_BED_CELL_SCALE, 1 / Math.sqrt(areaRatio))
}
