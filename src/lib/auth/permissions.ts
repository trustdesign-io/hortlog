import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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

/** Explains that the user can't open this organisation page. */
export const NO_ACCESS_PATH = '/no-access'

/** True if an organisation with this slug exists. */
async function orgExists(orgSlug: string): Promise<boolean> {
  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  return org !== null
}

/**
 * Asserts the current user is a member of `orgSlug` and holds `capability`.
 * Platform admins can access every organisation without a membership.
 * On failure redirects to the no-access page. That page is the same whether the
 * org is missing or just not theirs, so it doesn't reveal which orgs exist.
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

  if (!membership) {
    if (user.isAdmin && (await orgExists(orgSlug))) return { user, orgSlug }
    redirect(NO_ACCESS_PATH)
  }

  const allowed = hasCapability(membership.role, capability, user.isAdmin)
  if (!allowed) redirect(NO_ACCESS_PATH)

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

  if (!membership) {
    if (user.isAdmin && (await orgExists(orgSlug))) return { allowed: true, user }
    return { allowed: false, user: null }
  }

  const allowed = hasCapability(membership.role, capability, user.isAdmin)
  if (!allowed) return { allowed: false, user: null }

  return { allowed: true, user }
}
