import type { ZoneType } from '@prisma/client'

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  BED: 'Bed',
  WALL: 'Wall',
  HANGING: 'Hanging',
  CANOPY: 'Canopy',
}

export const ZONE_TYPE_DEFAULT_NAME: Record<ZoneType, string> = {
  BED: 'Bed',
  WALL: 'Wall',
  HANGING: 'Hanging baskets',
  CANOPY: 'Canopy',
}

export const ZONE_TYPES: ZoneType[] = ['BED', 'WALL', 'HANGING', 'CANOPY']

/** Tilt in degrees for CSS perspective rendering.
 *  Positive = top tilts away (floor/bed). Negative = bottom tilts away (overhead).
 *  WALL = 0 (upright). Tilt reduces for BED zones with many rows to maintain 44px tap targets. */
export function getZoneTilt(type: ZoneType, rows: number): number {
  if (type === 'WALL') return 0
  if (type === 'HANGING' || type === 'CANOPY') return -20
  // BED: 55deg for small grids, reduced 3deg per row above 4, min 30deg
  return Math.max(30, 55 - Math.max(0, rows - 4) * 3)
}
