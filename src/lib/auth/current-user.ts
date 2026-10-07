import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { User, Membership, Organisation } from '@prisma/client'

export type MembershipWithOrg = Membership & {
  organisation: Pick<Organisation, 'id' | 'slug' | 'name'>
}

export type UserWithMemberships = User & {
  memberships: MembershipWithOrg[]
}

/**
 * Returns the authenticated user with their org memberships, or null if unauthenticated.
 * Always reads from the database — do not call in a hot path without caching.
 */
export async function getCurrentUser(): Promise<UserWithMemberships | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) return null

  return prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      memberships: {
        include: {
          organisation: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  })
}
