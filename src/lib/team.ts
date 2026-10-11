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
