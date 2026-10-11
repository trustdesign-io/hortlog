/**
 * Species reference photos from iNaturalist. Only licences that allow use on a
 * commercial site with credit are accepted, so nobody has to upload photos.
 */

const API = 'https://api.inaturalist.org/v1'
const TIMEOUT_MS = 6000

const OPEN_LICENCES: Record<string, string> = {
  cc0: 'CC0',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
}

export interface ReferencePhoto {
  inatTaxonId: number
  photoUrl: string | null
  photoAttribution: string | null
  photoLicence: string | null
  photoSourceUrl: string | null
}

interface InatPhoto {
  id: number
  url: string
  medium_url?: string
  attribution: string
  license_code: string | null
}

interface InatTaxon {
  id: number
  name: string
  matched_term?: string
  taxon_photos?: { photo: InatPhoto }[]
}

type Fetcher = (url: string) => Promise<unknown>

async function defaultFetcher(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'hortlog (https://hortlog.com)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`iNaturalist ${res.status}`)
  return res.json()
}

function toPhoto(taxonId: number, photo: InatPhoto): ReferencePhoto | null {
  const licence = photo.license_code ? OPEN_LICENCES[photo.license_code] : undefined
  if (!licence) return null
  return {
    inatTaxonId: taxonId,
    photoUrl: photo.medium_url ?? photo.url.replace('/square.', '/medium.'),
    photoAttribution: photo.attribution,
    photoLicence: licence,
    photoSourceUrl: `https://www.inaturalist.org/photos/${photo.id}`,
  }
}

/** The search term for a name: the italic part, without cultivar or authority, e.g. "Acer negundo". */
export function inatQuery(scientificName: string): string {
  return scientificName
    .replace(/[‘'"].*$/, '')
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .filter((w, i) => i === 0 || /^[a-z×-]+$/.test(w))
    .join(' ')
}

/**
 * Finds an openly licensed photo of a species: the taxon's own photos first, then
 * research-grade observations. Returns null when there is none or iNaturalist
 * can't be reached; never throws.
 */
export async function findReferencePhoto(
  scientificName: string,
  fetcher: Fetcher = defaultFetcher,
): Promise<ReferencePhoto | null> {
  const q = inatQuery(scientificName)
  if (!q) return null
  try {
    const search = (await fetcher(`${API}/taxa?${new URLSearchParams({ q, per_page: '10', is_active: 'true' })}`)) as {
      results: InatTaxon[]
    }
    const wanted = q.toLowerCase()
    const hit =
      search.results.find((t) => t.name.toLowerCase() === wanted) ??
      search.results.find((t) => t.matched_term?.toLowerCase() === wanted)
    if (!hit) return null

    const taxon = ((await fetcher(`${API}/taxa/${hit.id}`)) as { results: InatTaxon[] }).results[0]
    for (const { photo } of taxon?.taxon_photos ?? []) {
      const found = toPhoto(hit.id, photo)
      if (found) return found
    }

    const obs = (await fetcher(
      `${API}/observations?${new URLSearchParams({
        taxon_id: String(hit.id),
        photo_license: 'cc0,cc-by,cc-by-sa',
        quality_grade: 'research',
        order_by: 'votes',
        per_page: '10',
      })}`,
    )) as { results: { photos?: InatPhoto[] }[] }
    for (const o of obs.results) {
      for (const photo of o.photos ?? []) {
        const found = toPhoto(hit.id, photo)
        if (found) return found
      }
    }
    return { inatTaxonId: hit.id, photoUrl: null, photoAttribution: null, photoLicence: null, photoSourceUrl: null }
  } catch (err) {
    console.error('[findReferencePhoto]', scientificName, err)
    return null
  }
}
