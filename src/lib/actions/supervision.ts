'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/current-user'
import { MAX_SIGN_OFF_COMMENT } from '@/lib/supervision'
import { invitedAssignees } from '@/lib/invited-assignees'
import type { ActionResult } from '@/lib/shared/types'

/** Choose (or, with null, remove) your supervisor in one of your gardens */
export async function setSupervisor(orgSlug: string, supervisorId: string | null): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Please sign in again.' }
  const membership = user.memberships.find((m) => m.organisation.slug === orgSlug)
  if (!membership) return { success: false, error: 'You’re not a member of this garden.' }
  const organisationId = membership.organisation.id

  try {
    if (!supervisorId) {
      await prisma.supervision.deleteMany({ where: { organisationId, traineeId: user.id } })
    } else {
      if (supervisorId === user.id) return { success: false, error: 'Choose someone else as your supervisor.' }
      const theirs = await prisma.membership.findFirst({ where: { organisationId, userId: supervisorId }, select: { id: true } })
      // Someone invited to this garden who hasn't joined yet can be chosen too
      if (!theirs && !(await invitedAssignees(orgSlug, [supervisorId]).catch(() => new Set<string>())).has(supervisorId)) {
        return { success: false, error: 'Your supervisor must be a member of this garden, or invited to it.' }
      }
      await prisma.supervision.upsert({
        where: { organisationId_traineeId: { organisationId, traineeId: user.id } },
        create: { organisationId, traineeId: user.id, supervisorId },
        update: { supervisorId },
      })
    }
  } catch (err) {
    console.error('[setSupervisor] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
  revalidatePath('/records')
  revalidatePath('/supervising')
  return { success: true }
}

/** Sign off one of your trainee's entries, with an optional comment; or (signed = false) take it back */
export async function signOffEntry(entryId: string, signed: boolean, rawComment = ''): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Please sign in again.' }
  const comment = rawComment.trim().replace(/\s+/g, ' ').slice(0, MAX_SIGN_OFF_COMMENT) || null

  try {
    const entry = await prisma.workLogEntry.findUnique({
      where: { id: entryId },
      select: { workRecord: { select: { userId: true, organisationId: true } } },
    })
    if (!entry) return { success: false, error: 'This entry has been removed.' }
    // Only the member's supervisor in that garden can sign their work off
    const supervises = await prisma.supervision.findFirst({
      where: { organisationId: entry.workRecord.organisationId, traineeId: entry.workRecord.userId, supervisorId: user.id },
      select: { id: true },
    })
    if (!supervises) return { success: false, error: 'Only their supervisor can sign this off.' }

    await prisma.workLogEntry.update({
      where: { id: entryId },
      data: signed
        ? { signedOffAt: new Date(), signedOffById: user.id, signOffComment: comment }
        : { signedOffAt: null, signedOffById: null, signOffComment: null },
    })
  } catch (err) {
    console.error('[signOffEntry] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
  revalidatePath('/supervising')
  revalidatePath('/records/[recordId]', 'page')
  return { success: true }
}
