import type { ReactNode } from 'react'

/** Worked-with records are numbered per member: 7 → "007". */
export function formatRecordNo(n: number): string {
  return String(n).padStart(3, '0')
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Record dates are calendar dates stored at midnight UTC, so they are read in UTC. */
export function formatRecordDate(date: Date, style: 'long' | 'short' = 'long'): string {
  const month = MONTHS[date.getUTCMonth()]
  return `${date.getUTCDate()} ${style === 'short' ? month.slice(0, 3) : month} ${date.getUTCFullYear()}`
}

/**
 * Renders record text, turning <i>…</i> into italics (botanical names). Everything
 * else is output as plain text, so stored data can never inject markup.
 */
export function renderInline(text: string): ReactNode[] {
  return text
    .split(/(<i>.*?<\/i>)/g)
    .filter(Boolean)
    .map((part, i) => {
      const m = /^<i>(.*)<\/i>$/.exec(part)
      if (m) {
        return (
          <i key={i} lang="la">
            {m[1].replace(/<[^>]*>/g, '')}
          </i>
        )
      }
      return <span key={i}>{part.replace(/<[^>]*>/g, '')}</span>
    })
}

/** Plain text of a name stored with <i> tags. */
export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * The name to show for a plant: the stored name with its authority upright, or
 * the scientific name in italics followed by the authority when that is all there is.
 */
export function plantNameHtml(r: {
  nameHtml: string | null
  scientificName: string
  authority: string | null
}): string {
  if (r.nameHtml) return r.nameHtml
  const name = `<i>${r.scientificName}</i>`
  return r.authority ? `${name} ${r.authority}` : name
}

const LICENCE_URLS: Record<string, string> = {
  CC0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC BY': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA': 'https://creativecommons.org/licenses/by-sa/4.0/',
}

export function licenceUrl(licence: string | null): string | null {
  return licence ? (LICENCE_URLS[licence] ?? null) : null
}

