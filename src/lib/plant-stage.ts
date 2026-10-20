/** Flowering and fruiting stages. Pure and client-safe, so it can be tested and used anywhere. */

export const PLANT_STAGES = ['BUD', 'FLOWER', 'FRUIT', 'OVER'] as const
export type PlantStageValue = (typeof PLANT_STAGES)[number]

export const STAGE_LABELS: Record<PlantStageValue, string> = {
  BUD: 'In bud',
  FLOWER: 'In flower',
  FRUIT: 'In fruit',
  OVER: 'Over',
}

/** A stage counts as current for this long after someone last confirmed it */
export const STAGE_FRESH_DAYS = 21
const DAY_MS = 24 * 60 * 60 * 1000

export function isPlantStage(v: unknown): v is PlantStageValue {
  return typeof v === 'string' && (PLANT_STAGES as readonly string[]).includes(v)
}

/** The earliest sighting that still counts as current at `now` */
export function freshSince(now: Date = new Date()): Date {
  return new Date(now.getTime() - STAGE_FRESH_DAYS * DAY_MS)
}

/**
 * What the plant is doing now, for visitors: its latest stage while it's
 * fresh, or null once it's stale or over.
 */
export function currentStage(
  stage: PlantStageValue | null | undefined,
  seenAt: Date | string | null | undefined,
  now: Date = new Date(),
): Exclude<PlantStageValue, 'OVER'> | null {
  if (!stage || stage === 'OVER' || !seenAt) return null
  const seen = typeof seenAt === 'string' ? new Date(seenAt) : seenAt
  if (isNaN(seen.getTime()) || seen < freshSince(now)) return null
  return stage
}

/** "seen 12 Oct" */
export function seenLabel(seenAt: Date | string): string {
  const d = typeof seenAt === 'string' ? new Date(seenAt) : seenAt
  return `seen ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })}`
}
