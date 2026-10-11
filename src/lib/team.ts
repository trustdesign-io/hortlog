import { ROLES, type Role } from '@/lib/roles'

export interface TeamMember {
  id: string
  role: Role
  user: { name: string | null; email: string }
}

/** Most senior first (directors, managers, members); each group by name, or email when there is no name. */
export function sortTeam<T extends TeamMember>(members: T[]): T[] {
  const label = (m: T) => (m.user.name ?? m.user.email).toLocaleLowerCase('en-GB')
  return [...members].sort(
    (a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || label(a).localeCompare(label(b), 'en-GB'),
  )
}

/** Directors first, then everyone else together; each group alphabetical by name (or email). */
export function sortDirectorsThenByName<T extends TeamMember>(members: T[]): T[] {
  const label = (m: T) => (m.user.name ?? m.user.email).toLocaleLowerCase('en-GB')
  const rank = (m: T) => (m.role === 'DIRECTOR' ? 0 : 1)
  return [...members].sort((a, b) => rank(a) - rank(b) || label(a).localeCompare(label(b), 'en-GB'))
}
