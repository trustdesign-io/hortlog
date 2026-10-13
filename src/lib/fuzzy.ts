/** Lowercase, accents removed, punctuation turned to spaces. */
export function normaliseForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function isSubsequence(needle: string, hay: string): boolean {
  let i = 0
  for (const ch of hay) if (ch === needle[i]) i++
  return i === needle.length
}

/** True when a and b differ by at most one insertion, deletion or substitution. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    if (++edits > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else {
      i++
      j++
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

/** How well one typed word matches the text: higher is better, 0 is no match. */
function wordScore(word: string, text: string, words: string[]): number {
  if (words.some((w) => w.startsWith(word))) return 4
  if (text.includes(word)) return 3
  if (word.length >= 4 && words.some((w) => withinOneEdit(word, w.slice(0, word.length + 1)) || withinOneEdit(word, w))) {
    return 2
  }
  // Initials or squashed letters across the whole text, e.g. "wgna" in "world garden north america"
  if (word.length >= 2 && isSubsequence(word, text.replace(/ /g, ''))) return 1
  return 0
}

/**
 * Scores how well `query` matches any of `fields`; 0 means it doesn't. Every
 * typed word must match somewhere, by prefix, substring, a one-letter typo or
 * letters in order.
 */
export function fuzzyScore(query: string, fields: Array<string | null | undefined>): number {
  const typed = normaliseForSearch(query).split(' ').filter(Boolean)
  if (typed.length === 0) return 1
  const text = normaliseForSearch(fields.filter(Boolean).join(' '))
  const words = text.split(' ')
  let total = 0
  for (const word of typed) {
    const s = wordScore(word, text, words)
    if (s === 0) return 0
    total += s
  }
  return total
}
