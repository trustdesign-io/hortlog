/**
 * Membership roles, most senior first. A Director has exactly a Manager's
 * permissions; only the title differs. No Prisma import so this stays testable.
 */
export const ROLES = ['DIRECTOR', 'MANAGER', 'MEMBER'] as const
export type Role = (typeof ROLES)[number]

/** Roles that run an organisation: they can manage members, content and settings. */
export const LEADER_ROLES: Role[] = ['DIRECTOR', 'MANAGER']

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/** A role from form data or metadata; anything unknown becomes MEMBER. */
export function parseRole(value: unknown): Role {
  return isRole(value) ? value : 'MEMBER'
}

export function isLeader(role: Role): boolean {
  return LEADER_ROLES.includes(role)
}

export interface RoleLabels {
  directorLabel: string
  managerLabel: string
  memberLabel: string
}

/** The organisation's own title for a role. */
export function roleLabel(role: Role, labels: RoleLabels): string {
  if (role === 'DIRECTOR') return labels.directorLabel
  if (role === 'MANAGER') return labels.managerLabel
  return labels.memberLabel
}

export const DEFAULT_ROLE_LABELS: RoleLabels = {
  directorLabel: 'Director',
  managerLabel: 'Manager',
  memberLabel: 'Member',
}
