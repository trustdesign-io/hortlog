/**
 * Checks a name against Kew's World Checklist of Vascular Plants (WCVP, CC BY),
 * the checklist behind Plants of the World Online, via ChecklistBank's copy of it.
 * Tells us whether Kew accepts the name, and if not, which name it accepts.
 */

const WCVP_DATASET = 2232
const API = `https://api.checklistbank.org/dataset/${WCVP_DATASET}`
const TIMEOUT_MS = 8000

export type WcvpStatus = 'accepted' | 'synonym' | 'unplaced' | 'not-found'

export interface WcvpResult {
  status: WcvpStatus
  /** Kew's accepted name, set for accepted names and synonyms */
  acceptedName: string | null
  acceptedAuthority: string | null
  acceptedIpniId: string | null
  /** The accepted taxon's page in Plants of the World Online */
  powoUrl: string | null
}

interface Usage {
  id: string
  name: string
  authorship?: string
  rank?: string
  status: string
  classification?: Usage[]
}

interface MatchResponse {
  type?: string
  usage?: Usage
}

interface UsageDetail {
  link?: string
  name?: { identifier?: string[]; link?: string }
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'hortlog (https://hortlog.com)' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

/** "ipni:60254-2" → "60254-2" */
export function ipniFromIdentifiers(identifiers: string[] | undefined): string | null {
  const id = identifiers?.find((i) => i.startsWith('ipni:'))
  return id ? id.slice(5) : null
}

/** What a match says, before looking up the accepted taxon's IPNI id */
export function readMatch(match: MatchResponse | null): { status: WcvpStatus; accepted: Usage | null } | null {
  if (!match) return null
  const usage = match.usage
  // No usable match: the name isn't in Kew's checklist (or the lookup was ambiguous)
  if (!usage || !match.type || match.type === 'none' || match.type === 'ambiguous') return { status: 'not-found', accepted: null }
  if (usage.status === 'accepted') return { status: 'accepted', accepted: usage }
  if (usage.status === 'synonym' || usage.status === 'ambiguous synonym' || usage.status === 'misapplied') {
    // The first in its classification is the taxon it belongs to
    const accepted = usage.classification?.find((u) => u.status === 'accepted') ?? null
    return { status: accepted ? 'synonym' : 'unplaced', accepted }
  }
  return { status: 'unplaced', accepted: null }
}

/** Null when the checklist couldn't be reached: keep what we had */
export async function checkWcvp(scientificName: string, authority?: string | null): Promise<WcvpResult | null> {
  const params = new URLSearchParams({ q: scientificName })
  if (authority) params.set('authorship', authority)
  const read = readMatch(await getJson<MatchResponse>(`${API}/match/nameusage?${params}`))
  if (!read) return null
  if (!read.accepted) return { status: read.status, acceptedName: null, acceptedAuthority: null, acceptedIpniId: null, powoUrl: null }

  const detail = await getJson<UsageDetail>(`${API}/nameusage/${encodeURIComponent(read.accepted.id)}`)
  const ipni = ipniFromIdentifiers(detail?.name?.identifier)
  return {
    status: read.status,
    acceptedName: read.accepted.name,
    acceptedAuthority: read.accepted.authorship ?? null,
    acceptedIpniId: ipni,
    powoUrl: detail?.link ?? detail?.name?.link ?? (ipni ? `https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:${ipni}` : null),
  }
}
