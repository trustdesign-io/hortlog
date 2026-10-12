/**
 * Fetch a habitat/distribution excerpt from Wikipedia (CC BY-SA 4.0).
 * Uses the REST summary API — returns the first 500 characters of the extract.
 */

const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary'
const TIMEOUT_MS = 8000
const MAX_EXCERPT_CHARS = 500

export interface WikipediaResult {
  habitatExcerpt: string
  habitatExcerptSource: string
}

export async function fetchWikipediaExcerpt(scientificName: string): Promise<WikipediaResult | null> {
  const title = encodeURIComponent(scientificName.replace(/ /g, '_'))
  try {
    const res = await fetch(`${WIKIPEDIA_API}/${title}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'hortlog (https://hortlog.com)',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      extract?: string
      content_urls?: { desktop?: { page?: string } }
      type?: string
    }
    if (data.type === 'disambiguation' || !data.extract) return null
    const excerpt = data.extract.slice(0, MAX_EXCERPT_CHARS).trim()
    if (excerpt.length < 50) return null
    const sourceUrl = data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${title}`
    return { habitatExcerpt: excerpt, habitatExcerptSource: sourceUrl }
  } catch {
    return null
  }
}
