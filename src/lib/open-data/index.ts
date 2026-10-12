/**
 * Orchestrates all open-data sources for a species.
 * All fetches are done in parallel; failures are silently swallowed —
 * missing data is fine, wrong data is not.
 */

import { fetchWikidataConservationStatus } from './wikidata'
import { fetchPowoData, buildHabitatLine } from './powo'
import { fetchGbifTaxonKey } from './gbif'
import { fetchWikipediaExcerpt } from './wikipedia'

export interface OpenDataResult {
  statusCategory: string | null
  statusSource: string | null
  statusUpdatedAt: Date | null
  nativeRegions: string[]
  introducedRegions: string[]
  lifeForm: string | null
  climate: string | null
  habitatLine: string | null
  habitatExcerpt: string | null
  habitatExcerptSource: string | null
  gbifTaxonKey: number | null
  openDataUpdatedAt: Date
}

export async function fetchOpenData(opts: {
  scientificName: string
  ipniId: string | null
}): Promise<OpenDataResult> {
  const [conservation, powo, gbifKey, wikipedia] = await Promise.allSettled([
    fetchWikidataConservationStatus(opts.scientificName),
    opts.ipniId ? fetchPowoData(opts.ipniId) : Promise.resolve(null),
    fetchGbifTaxonKey(opts.scientificName),
    fetchWikipediaExcerpt(opts.scientificName),
  ])

  const conservationData = conservation.status === 'fulfilled' ? conservation.value : null
  const powoData = powo.status === 'fulfilled' ? powo.value : null
  const gbifData = gbifKey.status === 'fulfilled' ? gbifKey.value : null
  const wikiData = wikipedia.status === 'fulfilled' ? wikipedia.value : null

  return {
    statusCategory: conservationData?.statusCategory ?? null,
    statusSource: conservationData?.statusSource ?? null,
    statusUpdatedAt: conservationData?.statusUpdatedAt ?? null,
    nativeRegions: powoData?.nativeRegions ?? [],
    introducedRegions: powoData?.introducedRegions ?? [],
    lifeForm: powoData?.lifeForm ?? null,
    climate: powoData?.climate ?? null,
    habitatLine: powoData ? buildHabitatLine(powoData) : null,
    habitatExcerpt: wikiData?.habitatExcerpt ?? null,
    habitatExcerptSource: wikiData?.habitatExcerptSource ?? null,
    gbifTaxonKey: gbifData,
    openDataUpdatedAt: new Date(),
  }
}
