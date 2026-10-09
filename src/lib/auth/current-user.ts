import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getNameFromMetadata } from './name-utils'
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
 *
 * Syncs name from Supabase auth metadata when the User row has no name set.
 * This handles the gap between sign-up (trigger creates User without name) and
 * first sign-in if the trigger was applied before the name column was added.
 */
export async function getCurrentUser(): Promise<UserWithMemberships | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) return null

  const dbUser = await prisma.user.findUnique({
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

  if (!dbUser) return null

  if (!dbUser.name) {
    const name = getNameFromMetadata(authUser.user_metadata)
    if (name) {
      return prisma.user.update({
        where: { id: authUser.id },
        data: { name },
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
  }

  return dbUser
}
