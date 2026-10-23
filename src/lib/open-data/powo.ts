/**
 * Native and introduced ranges, life form and climate from Kew's World
 * Checklist of Vascular Plants (WCVP, CC BY), the data behind Plants of the
 * World Online. Read from ChecklistBank's copy: POWO's own API sits behind a
 * bot check that turns server requests away.
 */

const WCVP_API = 'https://api.checklistbank.org/dataset/2232'
const TIMEOUT_MS = 8000

export interface PowoResult {
  nativeRegions: string[]
  introducedRegions: string[]
  lifeForm: string | null
  climate: string | null
}

interface WcvpInfo {
  distributions?: { area?: { name?: string }; establishmentMeans?: string | null }[]
  verbatim?: { terms?: Record<string, string> }
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

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Ranges, life form and climate from a WCVP taxon's info; null when it has none of them */
export function readWcvpInfo(info: WcvpInfo | null): PowoResult | null {
  if (!info) return null
  const regions = (means: (m: string) => boolean) => [
    ...new Set(
      (info.distributions ?? [])
        .filter((d) => d.area?.name && means((d.establishmentMeans ?? 'native').toLowerCase()))
        .map((d) => d.area!.name!),
    ),
  ].sort((a, b) => a.localeCompare(b, 'en-GB'))
  const nativeRegions = regions((m) => m === 'native')
  const introducedRegions = regions((m) => m === 'introduced')

  let props: { lifeform?: string; climate?: string } = {}
  try {
    props = JSON.parse(info.verbatim?.terms?.['dwc:dynamicProperties'] ?? '{}')
  } catch {
    props = {}
  }
  const lifeForm = props.lifeform?.trim() ? capitalise(props.lifeform.trim()) : null
  const climate = props.climate?.trim() ? capitalise(props.climate.trim()) : null

  if (!nativeRegions.length && !introducedRegions.length && !lifeForm && !climate) return null
  return { nativeRegions, introducedRegions, lifeForm, climate }
}

/** The accepted taxon's ranges for a name (a synonym gives its accepted taxon's) */
export async function fetchPowoData(scientificName: string, authority?: string | null): Promise<PowoResult | null> {
  const params = new URLSearchParams({ q: scientificName })
  if (authority) params.set('authorship', authority)
  const match = await getJson<{ type?: string; usage?: { id: string; status: string; classification?: { id: string; status: string }[] } }>(
    `${WCVP_API}/match/nameusage?${params}`,
  )
  const usage = match?.usage
  if (!usage || !match?.type || match.type === 'none' || match.type === 'ambiguous') return null
  const id = usage.status === 'accepted' ? usage.id : usage.classification?.find((u) => u.status === 'accepted')?.id
  if (!id) return null
  return readWcvpInfo(await getJson<WcvpInfo>(`${WCVP_API}/taxon/${encodeURIComponent(id)}/info`))
}

/** WGSRPD level-3 code → region name (abbreviated list of common codes). */
const WGSRPD_NAMES: Record<string, string> = {
  MAU: 'Mauritius',
  GBR: 'Great Britain',
  IRL: 'Ireland',
  FRA: 'France',
  SPA: 'Spain',
  POR: 'Portugal',
  ITA: 'Italy',
  GER: 'Germany',
  NET: 'Netherlands',
  BEL: 'Belgium',
  SWE: 'Sweden',
  NOR: 'Norway',
  DEN: 'Denmark',
  FIN: 'Finland',
  AUS: 'Australia',
  NZL: 'New Zealand',
  JPN: 'Japan',
  CHN: 'China',
  IND: 'India',
  BRA: 'Brazil',
  MEX: 'Mexico',
  USA: 'USA',
  CAN: 'Canada',
  ZAF: 'South Africa',
  KEN: 'Kenya',
  TAN: 'Tanzania',
  MDG: 'Madagascar',
}

export function wgsrpdName(code: string): string {
  return WGSRPD_NAMES[code] ?? code
}

/**
 * Build a generated habitat line from the WCVP fields:
 * e.g. "A shrub of tropical regions, native to Mauritius."
 */
export function buildHabitatLine(result: PowoResult): string | null {
  const parts: string[] = []

  if (result.lifeForm) {
    const article = /^[aeiou]/i.test(result.lifeForm) ? 'An' : 'A'
    parts.push(`${article} ${result.lifeForm.toLowerCase()}`)
  }

  if (result.climate) {
    const climatePhrase = `of ${result.climate.toLowerCase()} regions`
    if (parts.length) {
      parts[0] = `${parts[0]} ${climatePhrase}`
    } else {
      parts.push(`Found in ${result.climate.toLowerCase()} regions`)
    }
  }

  const nativeNames = result.nativeRegions.slice(0, 5)
  if (nativeNames.length) {
    const regionList = nativeNames.join(', ')
    if (parts.length) {
      parts.push(`, native to ${regionList}`)
    } else {
      parts.push(`Native to ${regionList}`)
    }
  }

  if (!parts.length) return null
  const sentence = parts.join('').trim()
  return sentence.endsWith('.') ? sentence : `${sentence}.`
}
