'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireOrgAccess } from '@/lib/auth/permissions'
import { MAX_JOIN_MESSAGE } from '@/lib/join-requests'
import type { ActionResult } from '@/lib/shared/types'

/** Ask to join a garden; its managers see it on their Members page. */
export async function requestToJoin(orgSlug: string, message: string): Promise<ActionResult> {
  const user = await requireAuth()
  const note = message.trim().slice(0, MAX_JOIN_MESSAGE) || null

  const org = await prisma.organisation.findFirst({ where: { slug: orgSlug, personal: false }, select: { id: true } })
  if (!org) return { success: false, error: 'That garden couldn’t be found.' }
  if (user.memberships.some((m) => m.organisation.slug === orgSlug)) {
    return { success: false, error: 'You’re already a member.' }
  }

  const existing = await prisma.joinRequest.findUnique({
    where: { userId_organisationId: { userId: user.id, organisationId: org.id } },
    select: { declinedAt: true },
  })
  if (existing?.declinedAt) return { success: false, error: 'This garden didn’t accept your request.' }
  if (existing) return { success: true }

  try {
    await prisma.joinRequest.create({ data: { userId: user.id, organisationId: org.id, message: note } })
  } catch (err) {
    // Asked twice at once: the first one stands
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
      console.error('[requestToJoin] error:', err)
      return { success: false, error: 'That couldn’t be sent. Try again.' }
    }
  }
  revalidatePath('/gardens')
  revalidatePath(`/${orgSlug}/team/members`)
  return { success: true }
}

/** Take back a request that hasn't been answered yet. */
export async function cancelJoinRequest(orgSlug: string): Promise<ActionResult> {
  const user = await requireAuth()
  await prisma.joinRequest.deleteMany({
    where: { userId: user.id, organisation: { slug: orgSlug }, declinedAt: null },
  })
  revalidatePath('/gardens')
  revalidatePath(`/${orgSlug}/team/members`)
  return { success: true }
}

/** A manager accepts (they join as a member) or declines someone asking to join. */
export async function answerJoinRequest(orgSlug: string, requestId: string, accept: boolean): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const request = await prisma.joinRequest.findFirst({
    where: { id: requestId, organisation: { slug: orgSlug }, declinedAt: null },
    select: { id: true, userId: true, organisationId: true },
  })
  if (!request) return { success: false, error: 'That request has already been answered.' }

  try {
    if (accept) {
      await prisma.$transaction([
        prisma.membership.upsert({
          where: { userId_organisationId: { userId: request.userId, organisationId: request.organisationId } },
          create: { userId: request.userId, organisationId: request.organisationId, role: 'MEMBER' },
          update: {},
        }),
        prisma.joinRequest.delete({ where: { id: request.id } }),
      ])
    } else {
      await prisma.joinRequest.update({ where: { id: request.id }, data: { declinedAt: new Date() } })
    }
  } catch (err) {
    console.error('[answerJoinRequest] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }

  revalidatePath(`/${orgSlug}/team/members`)
  revalidatePath(`/${orgSlug}/team`)
  revalidatePath('/gardens')
  return { success: true }
}
