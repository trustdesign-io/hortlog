/**
 * UK postcodes → coordinates via postcodes.io (open data, OGL; commercial use
 * allowed). Server-only; lookups fail soft.
 */

const POSTCODE = /^([A-Z]{1,2}[0-9][A-Z0-9]?) ?([0-9][A-Z]{2})$/

/** "me15 7ab " → "ME15 7AB"; null when it isn't a UK postcode shape. */
export function normalisePostcode(raw: string | null | undefined): string | null {
  const compact = (raw ?? '').toUpperCase().replace(/\s+/g, '')
  const m = POSTCODE.exec(compact)
  return m ? `${m[1]} ${m[2]}` : null
}

export interface Coordinates {
  latitude: number
  longitude: number
}

type Fetcher = (url: string) => Promise<unknown>

async function defaultFetcher(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`postcodes.io ${res.status}`)
  return res.json()
}

/**
 * Coordinates for a normalised postcode: `null` when the postcode doesn't
 * exist, `undefined` when the lookup couldn't be made.
 */
export async function geocodePostcode(postcode: string, fetcher: Fetcher = defaultFetcher): Promise<Coordinates | null | undefined> {
  try {
    const data = (await fetcher(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)) as {
      result?: { latitude?: number | null; longitude?: number | null }
    } | null
    const lat = data?.result?.latitude
    const lng = data?.result?.longitude
    if (typeof lat !== 'number' || typeof lng !== 'number') return null
    return { latitude: lat, longitude: lng }
  } catch (err) {
    console.error('[geocodePostcode]', err)
    return undefined
  }
}
