export const CAPABILITIES = [
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
    'can_edit_specimen',
    'can_edit_view',
    'can_manage_members',
    'can_edit_org_settings',
  ],
  MEMBER: [
    'can_edit_specimen',
    'can_edit_view',
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
  return (ROLE_CAPABILITIES[role] as readonly string[]).includes(capability)
}
