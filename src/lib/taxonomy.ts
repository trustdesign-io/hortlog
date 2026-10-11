/**
 * Botanical names from the Catalogue of Life (via ChecklistBank). For plants it is
 * built on Kew's World Checklist of Vascular Plants, the same data as POWO, and it
 * gives each name its status, accepted name, IPNI id and POWO link. Typos fall back
 * to GBIF's fuzzy matcher. Server-only; every call fails soft.
 */

const COL = 'https://api.checklistbank.org/dataset/3LR'
const GBIF = 'https://api.gbif.org/v1'
const TIMEOUT_MS = 6000

type Fetcher = (url: string) => Promise<unknown>

async function defaultFetcher(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'hortlog (https://hortlog.com)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}`)
  return res.json()
}

export interface NameSuggestion {
  /** Catalogue of Life id of this name. */
  usageId: string
  /** The name as written, with authority: "Sansevieria trifasciata Prain". */
  label: string
  status: 'accepted' | 'synonym' | 'other'
  /** For synonyms: the accepted name it now goes under. */
  acceptedLabel: string | null
  family: string | null
  rank: string
}

interface ColSuggestion {
  match: string
  context?: string
  usageId: string
  acceptedName?: string
  rank: string
  status: string
  nomCode?: string
}

function toSuggestion(s: ColSuggestion): NameSuggestion {
  return {
    usageId: s.usageId,
    label: s.match,
    status: s.status === 'accepted' ? 'accepted' : s.status.includes('synonym') ? 'synonym' : 'other',
    acceptedLabel: s.status === 'accepted' ? null : (s.acceptedName ?? null),
    family: s.context ?? null,
    rank: s.rank,
  }
}

const RANKS = new Set(['genus', 'species', 'subspecies', 'variety', 'form'])

/** Names starting with what was typed; if none, the closest spelling. */
export async function suggestNames(query: string, fetcher: Fetcher = defaultFetcher): Promise<NameSuggestion[]> {
  const q = query.trim().replace(/\s+/g, ' ')
  if (q.length < 3) return []
  const col = async (term: string) =>
    ((await fetcher(`${COL}/nameusage/suggest?${new URLSearchParams({ q: term, limit: '12' })}`)) as ColSuggestion[])
      .filter((s) => s.nomCode === 'botanical' && RANKS.has(s.rank))
      .map(toSuggestion)
  try {
    const direct = await col(q)
    if (direct.length > 0) return direct.slice(0, 10)
    // Typo in a botanical name (two words or more): let GBIF find the nearest name,
    // then look that up. Single words are left alone: they're usually common names.
    if (q.split(' ').length < 2) return []
    const match = (await fetcher(
      `${GBIF}/species/match?${new URLSearchParams({ name: q, kingdom: 'Plantae' })}`,
    )) as { canonicalName?: string; matchType?: string; confidence?: number }
    if (!match.canonicalName || match.matchType === 'NONE' || (match.confidence ?? 0) < 90) return []
    return (await col(match.canonicalName)).slice(0, 10)
  } catch (err) {
    console.error('[suggestNames]', q, err)
    return []
  }
}

export interface ResolvedTaxon {
  colId: string
  /** Without authority: "Dracaena trifasciata". */
  scientificName: string
  authority: string | null
  rank: string
  family: string | null
  ipniId: string | null
  powoUrl: string | null
  nativeRange: string | null
}

interface ColUsage {
  id: string
  status: string
  accepted?: { id: string }
  name: { scientificName: string; authorship?: string; rank: string; identifier?: string[]; link?: string }
  link?: string
  remarks?: string
}

/** The accepted taxon for a picked name (a synonym resolves to the name it now goes under). */
export async function resolveTaxon(usageId: string, fetcher: Fetcher = defaultFetcher): Promise<ResolvedTaxon | null> {
  try {
    let usage = (await fetcher(`${COL}/nameusage/${encodeURIComponent(usageId)}`)) as ColUsage
    if (usage.status !== 'accepted' && usage.accepted?.id) {
      usage = (await fetcher(`${COL}/nameusage/${encodeURIComponent(usage.accepted.id)}`)) as ColUsage
    }
    if (usage.status !== 'accepted') return null
    const classification = (await fetcher(`${COL}/taxon/${encodeURIComponent(usage.id)}/classification`)) as {
      rank: string
      name: string
    }[]
    const ipni = usage.name.identifier?.find((i) => i.startsWith('ipni:'))?.slice(5) ?? null
    return {
      colId: usage.id,
      scientificName: usage.name.scientificName,
      authority: usage.name.authorship || null,
      rank: usage.name.rank,
      family: classification.find((c) => c.rank === 'family')?.name ?? null,
      ipniId: ipni,
      powoUrl: ipni ? `https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:${ipni}` : (usage.link ?? null),
      nativeRange: usage.remarks?.trim() || null,
    }
  } catch (err) {
    console.error('[resolveTaxon]', usageId, err)
    return null
  }
}

/** Comparable form of a botanical name: case, accents, spacing and the hybrid sign don't matter. */
export function nameKey(scientificName: string): string {
  return scientificName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/×/g, 'x')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** The IPNI id in a POWO link, e.g. ".../urn:lsid:ipni.org:names:529214-1" → "529214-1". */
export function ipniIdFromPowoUrl(url: string | null): string | null {
  const m = url?.match(/(?:names:|taxon\/)(\d+-\d)$/)
  return m ? m[1] : null
}
