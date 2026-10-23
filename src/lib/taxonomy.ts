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

const RANK_MARKER = /^(?:subsp|ssp|var|f|fo|cv)\.?$/i

/**
 * What to look up for a typed name: descriptions in brackets and cultivar
 * names in quotes left out ("Echinopsis (Red)" → "Echinopsis"), and a third
 * lowercase word read as a subspecies or variety when no rank was written
 * ("Trichocereus chiloensis panhoplites").
 */
export function typedNameVariants(query: string): string[] {
  const cleaned = query
    .replace(/\([^)]*\)/g, ' ')
    .replace(/['‘’"“”][^'‘’"“”]*['‘’"“”]?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const out = [query.trim().replace(/\s+/g, ' ')]
  if (cleaned && cleaned !== out[0]) out.push(cleaned)
  const words = cleaned.split(' ')
  if (words.length === 3 && /^[a-z-]+$/.test(words[1]) && /^[a-z-]+$/.test(words[2]) && !RANK_MARKER.test(words[2])) {
    out.push(`${words[0]} ${words[1]} subsp. ${words[2]}`, `${words[0]} ${words[1]} var. ${words[2]}`)
  }
  return [...new Set(out.filter((v) => v.length >= 3))]
}

/**
 * A word as it sounds on paper: case, doubled letters and the common spelling
 * variants of epithets ("-ii"/"-i", "ae"/"e") don't matter. "leninghausii" and
 * "lenninghausii" are the same.
 */
export function orthoKey(word: string): string {
  return word
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ae/g, 'e')
    .replace(/(.)\1+/g, '$1')
    .replace(/i$/, '')
}

/** The genus and epithets of a name, without authority or rank markers */
function nameWords(name: string): string[] {
  const words = name.trim().split(/\s+/)
  const out = [words[0]]
  for (const w of words.slice(1)) {
    if (RANK_MARKER.test(w)) continue
    if (!/^[a-z×-]+$/.test(w)) break
    out.push(w)
  }
  return out
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

/**
 * How far a catalogue name is from a typed one, word by word, ignoring
 * authority, rank markers and spelling variants. 0 is the same name;
 * Infinity is a different genus or a different number of epithets.
 */
export function spellingDistance(typed: string, label: string): number {
  const a = nameWords(typed).map(orthoKey)
  const b = nameWords(label).map(orthoKey)
  if (a.length !== b.length || a[0] !== b[0]) return Infinity
  return a.slice(1).reduce((sum, w, i) => sum + editDistance(w, b[i + 1]), 0)
}

/** Close enough to offer for a misspelt name: two letters off, more for long epithets */
function closeEnough(typed: string, label: string): boolean {
  const epithets = nameWords(typed).slice(1)
  const allowed = Math.max(2, Math.floor(epithets.join('').length / 5))
  return spellingDistance(typed, label) <= allowed
}

/** Names starting with what was typed; if none, the same name spelt differently, then the closest spelling. */
export async function suggestNames(query: string, fetcher: Fetcher = defaultFetcher): Promise<NameSuggestion[]> {
  const q = query.trim().replace(/\s+/g, ' ')
  if (q.length < 3) return []
  const col = async (term: string) =>
    ((await fetcher(`${COL}/nameusage/suggest?${new URLSearchParams({ q: term, limit: '12' })}`)) as ColSuggestion[])
      .filter((s) => s.nomCode === 'botanical' && RANKS.has(s.rank))
      .map(toSuggestion)

  /** The catalogue's names that start like it (genus and first letters of the epithet), spelt close to it */
  const respelt = async (name: string) => {
    const words = nameWords(name)
    if (words.length < 2 || words[1].length < 4) return []
    const near = await col(`${words[0]} ${words[1].slice(0, 3)}`)
    return near
      .filter((s) => closeEnough(name, s.label))
      .sort((a, b) => spellingDistance(name, a.label) - spellingDistance(name, b.label))
  }

  const lookUp = async (name: string) => {
    for (const variant of typedNameVariants(name)) {
      const found = await col(variant)
      if (found.length > 0) return found
    }
    for (const variant of typedNameVariants(name).slice(1).concat(name)) {
      const found = await respelt(variant)
      if (found.length > 0) return found
    }
    return []
  }

  try {
    const direct = await lookUp(q)
    if (direct.length > 0) return direct.slice(0, 10)
    // Typo in a botanical name (two words or more): let GBIF find the nearest name,
    // then look that up. Single words are left alone: they're usually common names.
    if (q.split(' ').length < 2) return []
    const match = (await fetcher(
      `${GBIF}/species/match?${new URLSearchParams({ name: q, kingdom: 'Plantae' })}`,
    )) as { canonicalName?: string; matchType?: string; confidence?: number }
    if (!match.canonicalName || match.matchType === 'NONE' || (match.confidence ?? 0) < 90) return []
    return (await lookUp(match.canonicalName)).slice(0, 10)
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
