/**
 * Fetch global IUCN conservation status from Wikidata (property P141, CC0).
 * Matches on scientific name; returns null when no data is found or the fetch fails.
 */

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql'
const TIMEOUT_MS = 8000

// Wikidata QID → plain-English IUCN category
const IUCN_QID: Record<string, string> = {
  Q237350: 'Extinct',
  Q3245245: 'Extinct in the Wild',
  Q219127: 'Critically Endangered',
  Q11394: 'Endangered',
  Q278113: 'Vulnerable',
  Q308360: 'Near Threatened',
  Q211005: 'Least Concern',
  Q3427016: 'Data Deficient',
  Q7281: 'Not Evaluated',
}

export interface WikidataConservationResult {
  statusCategory: string
  statusSource: 'Wikidata'
  statusUpdatedAt: Date
}

export async function fetchWikidataConservationStatus(
  scientificName: string,
): Promise<WikidataConservationResult | null> {
  const query = `
    SELECT ?status WHERE {
      ?item wdt:P225 "${scientificName.replace(/"/g, '\\"')}" .
      ?item wdt:P141 ?status .
    }
    LIMIT 1
  `
  try {
    const url = `${SPARQL_ENDPOINT}?${new URLSearchParams({ query, format: 'json' })}`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'hortlog (https://hortlog.com)',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { results: { bindings: { status: { value: string } }[] } }
    const binding = data.results.bindings[0]
    if (!binding) return null
    const qid = binding.status.value.split('/').pop() ?? ''
    const label = IUCN_QID[qid]
    if (!label) return null
    return { statusCategory: label, statusSource: 'Wikidata', statusUpdatedAt: new Date() }
  } catch {
    return null
  }
}
