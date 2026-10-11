/** Rules for public records at /u/{username}. No Prisma import, so it stays unit-testable. */

export const USERNAME_MIN = 3
export const USERNAME_MAX = 30
const USERNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Words that would read as part of hortlog itself
const RESERVED_USERNAMES = new Set(['admin', 'hortlog', 'support', 'help', 'settings', 'records', 'new', 'me'])

/** An error message, or null when the username can be used. */
export function validateUsername(username: string): string | null {
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username can use lowercase letters, numbers and single hyphens, and must start and end with a letter or number.'
  }
  if (RESERVED_USERNAMES.has(username)) return 'That username is reserved. Please choose another.'
  return null
}

/** "Danny Clayden Chambers" → "danny-clayden-chambers": a starting suggestion. */
export function suggestUsername(name: string | null, email: string): string {
  const base = (name ?? email.split('@')[0])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, USERNAME_MAX)
    .replace(/-+$/, '')
  return base.length >= USERNAME_MIN ? base : ''
}

export interface HiddenOrgSummary {
  /** Null when the organisation chose not to be named. */
  name: string | null
  count: number
}

/** "14 plants at a private collection" / "1 plant at Lullingstone (private collection)". */
export function hiddenSummaryText({ name, count }: HiddenOrgSummary): string {
  const plants = count === 1 ? '1 plant' : `${count} plants`
  return name ? `${plants} at ${name} (private collection)` : `${plants} at a private collection`
}
