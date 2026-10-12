/**
 * Fetch the GBIF backbone taxon key for a species.
 * The key is used to embed occurrence maps and query CC0/CC BY records.
 */

const GBIF_API = 'https://api.gbif.org/v1'
const TIMEOUT_MS = 8000

export async function fetchGbifTaxonKey(scientificName: string): Promise<number | null> {
  try {
    const url = `${GBIF_API}/species/match?${new URLSearchParams({ name: scientificName, kingdom: 'Plantae' })}`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'hortlog (https://hortlog.com)',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      usageKey?: number
      matchType?: string
      confidence?: number
    }
    if (!data.usageKey || data.matchType === 'NONE' || (data.confidence ?? 0) < 80) return null
    return data.usageKey
  } catch {
    return null
  }
}

/** URL for a GBIF occurrence density tile — embed in an <img> or <canvas>. */
export function gbifMapTileUrl(taxonKey: number): string {
  return `https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}.png?taxonKey=${taxonKey}&style=classic-noborder.poly&bin=square`
}
