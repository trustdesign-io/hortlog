import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, type UserWithMemberships } from './current-user'
import { hasCapability, type Capability } from './capabilities'
import type { User } from '@prisma/client'

export type OrgContext = {
  user: UserWithMemberships
  orgSlug: string
}

/** True if the user has the platform-admin flag set. */
export function isAdmin(user: Pick<User, 'isAdmin'>): boolean {
  return user.isAdmin
}

/**
 * Returns the current user or redirects to /sign-in.
 * Use at the top of any authenticated server component or action.
 */
export async function requireAuth(): Promise<UserWithMemberships> {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  return user
}

/**
 * Asserts the current user is a member of `orgSlug` and holds `capability`.
 * Triggers notFound() (404) on failure — this prevents information leakage
 * about whether an org exists to unauthorised visitors.
 * For API route handlers that need a true 403, use `checkOrgAccess` instead.
 */
export async function requireOrgAccess(
  orgSlug: string,
  capability: Capability,
): Promise<OrgContext> {
  const user = await requireAuth()

  const membership = user.memberships.find(
    (m) => m.organisation.slug === orgSlug,
  )

  if (!membership) notFound()

  const allowed = hasCapability(membership.role, capability, user.isAdmin)
  if (!allowed) notFound()

  return { user, orgSlug }
}

/**
 * Checks org access without throwing — for use in route handlers / server actions
 * where you need to construct a 403 Response yourself.
 */
export async function checkOrgAccess(
  orgSlug: string,
  capability: Capability,
): Promise<{ allowed: true; user: UserWithMemberships } | { allowed: false; user: null }> {
  const user = await getCurrentUser()
  if (!user) return { allowed: false, user: null }

  const membership = user.memberships.find(
    (m) => m.organisation.slug === orgSlug,
  )

  if (!membership) return { allowed: false, user: null }

  const allowed = hasCapability(membership.role, capability, user.isAdmin)
  if (!allowed) return { allowed: false, user: null }

  return { allowed: true, user }
}
