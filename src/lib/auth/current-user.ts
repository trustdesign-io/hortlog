import { cache } from 'react'
import type { User as AuthUser } from '@supabase/supabase-js'
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
const WITH_MEMBERSHIPS = {
  memberships: {
    orderBy: { createdAt: 'asc' as const },
    include: { organisation: { select: { id: true, slug: true, name: true } } },
  },
}

/**
 * The signed-in Supabase user, checked once per request however many layouts
 * and pages ask (each check is a call to the sign-in service).
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/** A user with their memberships, by id (for API keys, which act as their owner). */
export function getUserWithMemberships(id: string): Promise<UserWithMemberships | null> {
  return prisma.user.findUnique({ where: { id }, include: WITH_MEMBERSHIPS })
}

export const getCurrentUser = cache(async (): Promise<UserWithMemberships | null> => {
  const authUser = await getAuthUser()

  if (!authUser) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      memberships: {
        orderBy: { createdAt: 'asc' },
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
            orderBy: { createdAt: 'asc' },
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
})
