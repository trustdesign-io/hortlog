export const CAPABILITIES = [
  'can_view_org',       // see the organisation's specimens, views, collections, team and to-dos
  'can_record_work',    // add to their own work record
  'can_edit_specimen',
  'can_edit_view',
  'can_manage_members',
  'can_edit_org_settings',
  'can_manage_species',  // platform admin only
] as const

export type Capability = (typeof CAPABILITIES)[number]

/** Kept as string literals so this module has no Prisma dependency and stays unit-testable. */
type MemberRole = 'MANAGER' | 'MEMBER'

const ROLE_CAPABILITIES: Record<MemberRole, readonly Capability[]> = {
  MANAGER: [
    'can_view_org',
    'can_record_work',
    'can_edit_specimen',
    'can_edit_view',
    'can_manage_members',
    'can_edit_org_settings',
  ],
  // Members can look and record their own work; creating, editing and deleting is for managers.
  MEMBER: [
    'can_view_org',
    'can_record_work',
  ],
}

/**
 * Returns true if the given role (or a platform admin) has the requested capability.
 * Use capability names in business logic — never compare role strings directly.
 */
export function hasCapability(
  role: MemberRole,
  capability: Capability,
  isAdmin = false,
): boolean {
  if (isAdmin) return true
  const caps = ROLE_CAPABILITIES[role as keyof typeof ROLE_CAPABILITIES]
  if (!caps) return false
  return caps.includes(capability)
}
