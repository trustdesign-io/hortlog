/**
 * Orchestrates all open-data sources for a species.
 * All fetches are done in parallel; failures are silently swallowed —
 * missing data is fine, wrong data is not.
 */

import { fetchWikidataConservationStatus } from './wikidata'
import { fetchPowoData, buildHabitatLine } from './powo'
import { fetchGbifTaxonKey } from './gbif'
import { fetchWikipediaExcerpt } from './wikipedia'
import { checkWcvp, type WcvpResult } from './wcvp'

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
  /** Kew's view of the name; null when the checklist couldn't be reached */
  wcvp: WcvpResult | null
  openDataUpdatedAt: Date
}

/** The species fields for a checklist result (nothing, if it couldn't be reached) */
export function wcvpFields(wcvp: WcvpResult | null) {
  if (!wcvp) return {}
  return {
    wcvpStatus: wcvp.status,
    wcvpAcceptedName: wcvp.acceptedName,
    wcvpAcceptedAuthority: wcvp.acceptedAuthority,
    wcvpAcceptedIpniId: wcvp.acceptedIpniId,
    wcvpPowoUrl: wcvp.powoUrl,
    wcvpCheckedAt: new Date(),
  }
}

export async function fetchOpenData(opts: {
  scientificName: string
  ipniId: string | null
  authority?: string | null
}): Promise<OpenDataResult> {
  const [conservation, powo, gbifKey, wikipedia, wcvp] = await Promise.allSettled([
    fetchWikidataConservationStatus(opts.scientificName),
    fetchPowoData(opts.scientificName, opts.authority),
    fetchGbifTaxonKey(opts.scientificName),
    fetchWikipediaExcerpt(opts.scientificName),
    checkWcvp(opts.scientificName, opts.authority),
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
    wcvp: wcvp.status === 'fulfilled' ? wcvp.value : null,
    openDataUpdatedAt: new Date(),
  }
}
