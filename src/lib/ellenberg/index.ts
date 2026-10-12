import { PLANTATT, type EllenbergValues } from './data'

export type { EllenbergValues }
export const ELLENBERG_SOURCE = 'PLANTATT (Hill et al., 2004)'

/** Returns Ellenberg values for a species by scientific name, or null if not found.
 *  Matches on the binomial only (ignores infraspecific epithets and authority). */
export function lookupEllenberg(scientificName: string): EllenbergValues | null {
  // Try exact binomial match first
  const binomial = scientificName.trim().split(' ').slice(0, 2).join(' ')
  return PLANTATT[binomial] ?? PLANTATT[scientificName.trim()] ?? null
}

// ─── Plain-English sentence ───────────────────────────────────────────────────

function lightPhrase(l: number): string {
  if (l <= 2) return 'deep shade'
  if (l <= 4) return 'shade'
  if (l <= 6) return 'semi-shade'
  if (l <= 7) return 'light shade'
  return 'full sun'
}

function moisturePhrase(f: number): string {
  if (f <= 2) return 'very dry'
  if (f <= 4) return 'dry'
  if (f === 5) return 'moist'
  if (f <= 7) return 'wet'
  return 'very wet'
}

function fertilityPhrase(n: number): string {
  if (n <= 2) return 'very poor'
  if (n <= 4) return 'poor to moderate'
  if (n <= 6) return 'moderately fertile'
  if (n <= 8) return 'fertile'
  return 'very fertile'
}

function reactionPhrase(r: number): string {
  if (r <= 2) return 'strongly acidic'
  if (r <= 4) return 'acidic'
  if (r <= 6) return 'neutral'
  if (r <= 7) return 'neutral to alkaline'
  return 'alkaline'
}

/**
 * Build a plain-English ecological summary from Ellenberg values.
 * Returns null when all values are null/undefined.
 * e.g. "Grows best in light shade on moist, neutral, fertile soil."
 */
export function buildEllenbergSentence(values: Partial<EllenbergValues> | null | undefined): string | null {
  if (!values) return null
  const { L, F, R, N } = values
  if (L == null && F == null && R == null && N == null) return null

  const conditions: string[] = []
  if (F != null) conditions.push(moisturePhrase(F))
  if (R != null) conditions.push(reactionPhrase(R))
  if (N != null) conditions.push(fertilityPhrase(N))

  const lightPart = L != null ? `in ${lightPhrase(L)}` : null
  const soilPart = conditions.length ? `on ${conditions.join(', ')} soil` : null

  const parts = [lightPart, soilPart].filter(Boolean)
  if (!parts.length) return null

  const sentence = `Grows best ${parts.join(' ')}.`
  return sentence
}

// ─── Compact display string ──────────────────────────────────────────────────

/** Returns the compact indicator row: "L7 F5 R6 N8 S0". */
export function ellenbergCompact(values: Partial<EllenbergValues>): string {
  const parts: string[] = []
  if (values.L != null) parts.push(`L${values.L}`)
  if (values.F != null) parts.push(`F${values.F}`)
  if (values.R != null) parts.push(`R${values.R}`)
  if (values.N != null) parts.push(`N${values.N}`)
  if (values.S != null) parts.push(`S${values.S}`)
  return parts.join(' ')
}

// ─── Tooltip descriptions ────────────────────────────────────────────────────

export const ELLENBERG_SCALE_DESCRIPTIONS: Record<string, string> = {
  L: 'Light (L): 1 = deep shade, 5 = semi-shade, 9 = full sun',
  F: 'Moisture (F): 1 = very dry, 5 = moist, 8 = very wet, 9 = aquatic',
  R: 'Soil reaction (R): 1 = very acid, 5 = neutral, 9 = strongly basic',
  N: 'Nitrogen/fertility (N): 1 = very poor, 5 = moderate, 9 = very fertile',
  S: 'Salt tolerance (S): 0 = none, 5 = moderate salt, 9 = highly saline',
}
