/**
 * Botanical names said aloud. Speech recognition hears Latin as English:
 * "Cleistocactus strausii" comes back as "Cleisto cactus Strauss eye". These
 * turn what was heard into names worth looking up, and say how close a name
 * sounds. Pure, so it can be tested.
 */

/** Spoken endings and how they're usually written in an epithet (vowels heard before -ii are dropped) */
const ENDINGS: [RegExp, string][] = [
  [/[aeiouy]*(?:eye|aye|ee|ie|ii|ey|y)$/, 'ii'],
  [/(?:ay|eh)$/, 'ae'],
]

const tidy = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** The epithet as it's usually written: "strauss eye" → "straussii", "trolley" → "trollii" */
function fixEpithet(words: string[]): string {
  const joined = words.join('')
  for (const [ending, written] of ENDINGS) if (ending.test(joined)) return joined.replace(ending, written)
  return joined
}

/** Genus spellings to try: as heard, and with a heard trailing r dropped ("didier ear" → "didierea") */
function genusVariants(genus: string): string[] {
  return /ear$/.test(genus) ? [genus, genus.slice(0, -1)] : [genus]
}

/**
 * Names to look up for one thing heard, most likely first: as heard; then the
 * genus made from the first one, two or three words with the rest as the
 * epithet; then the genus alone.
 */
export function spokenCandidates(heard: string): string[] {
  const words = tidy(heard).split(' ').filter(Boolean).slice(0, 6)
  if (words.length === 0) return []
  const out: string[] = [words.join(' ')]
  for (let k = 1; k <= Math.min(3, words.length); k++) {
    const rest = words.slice(k)
    for (const genus of genusVariants(words.slice(0, k).join(''))) {
      out.push(rest.length > 0 ? `${genus} ${fixEpithet(rest)}` : genus)
    }
  }
  return [...new Set(out.filter((c) => c.replace(/ /g, '').length >= 3))]
}

/** A rough sound of a name: spelling differences that sound alike are made the same */
export function phoneticKey(name: string): string {
  return tidy(name)
    .replace(/ /g, '')
    .replace(/ph/g, 'f')
    .replace(/(?:ae|oe)/g, 'e')
    .replace(/y/g, 'i')
    .replace(/(?:ck|k|q)/g, 'c')
    .replace(/ch/g, 'c')
    .replace(/z/g, 's')
    .replace(/x/g, 'cs')
    .replace(/([bcdfgjlmnprstvw])h/g, '$1')
    .replace(/(.)\1+/g, '$1')
}

function distance(a: string, b: string): number {
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

/** Close enough to what was heard to offer: the GBIF fallback can return unrelated names */
export const SOUND_MATCH_MAX = 0.45

/** 0 (sounds the same) to 1 (nothing alike): how far a name is from what was heard */
export function soundDistance(heard: string, name: string): number {
  const a = phoneticKey(heard)
  const b = phoneticKey(name)
  if (!a || !b) return 1
  return distance(a, b) / Math.max(a.length, b.length)
}
