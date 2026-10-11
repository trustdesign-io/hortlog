export interface TeamMember {
  id: string
  role: 'MANAGER' | 'MEMBER'
  user: { name: string | null; email: string }
}

/** Managers first, then members; each group by name (or email when there is no name). */
export function sortTeam<T extends TeamMember>(members: T[]): T[] {
  const label = (m: T) => (m.user.name ?? m.user.email).toLocaleLowerCase('en-GB')
  return [...members].sort(
    (a, b) =>
      (a.role === b.role ? 0 : a.role === 'MANAGER' ? -1 : 1) || label(a).localeCompare(label(b), 'en-GB'),
  )
}
