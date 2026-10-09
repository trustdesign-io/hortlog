import { prisma } from '@/lib/prisma'

/**
 * Returns the post-sign-in landing path for a user.
 * Platform admins with no org memberships land on the admin dashboard;
 * everyone else lands on My record.
 * This is the single source of truth for the landing decision.
 */
export async function getLandingPath(userId: string): Promise<'/admin/organisations' | '/records'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, _count: { select: { memberships: true } } },
  })
  if (user?.isAdmin && user._count.memberships === 0) {
    return '/admin/organisations'
  }
  return '/records'
}
