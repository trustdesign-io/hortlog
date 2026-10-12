/**
 * Fetch native/introduced ranges and life-form data from POWO (Plants of the World Online),
 * which is built on WCVP (CC BY 4.0). Requires an IPNI ID.
 */

const POWO_API = 'https://powo.science.kew.org/api/2/taxon'
const TIMEOUT_MS = 8000

export interface PowoResult {
  nativeRegions: string[]
  introducedRegions: string[]
  lifeForm: string | null
  climate: string | null
}

interface PowoDistribution {
  tdwgCode: string
  tdwgLevel: number
  establishment: string
  region: string
}

interface PowoTaxon {
  distribution?: {
    natives?: PowoDistribution[]
    introduced?: PowoDistribution[]
  }
  characteristics?: {
    lifeForm?: string[]
    climate?: string[]
  }
}

export async function fetchPowoData(ipniId: string): Promise<PowoResult | null> {
  try {
    const url = `${POWO_API}/urn:lsid:ipni.org:names:${encodeURIComponent(ipniId)}?fields=distribution,characteristics`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'hortlog (https://hortlog.com)',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = (await res.json()) as PowoTaxon

    const nativeRegions = (data.distribution?.natives ?? [])
      .filter((d) => d.tdwgLevel === 3)
      .map((d) => d.region)

    const introducedRegions = (data.distribution?.introduced ?? [])
      .filter((d) => d.tdwgLevel === 3)
      .map((d) => d.region)

    const lifeForm = data.characteristics?.lifeForm?.[0] ?? null
    const climate = data.characteristics?.climate?.[0] ?? null

    if (!nativeRegions.length && !introducedRegions.length && !lifeForm && !climate) return null

    return { nativeRegions, introducedRegions, lifeForm, climate }
  } catch {
    return null
  }
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
 * Build a generated habitat line from POWO fields:
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
