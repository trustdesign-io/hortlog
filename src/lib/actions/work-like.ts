'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/current-user'
import type { ActionResult } from '@/lib/shared/types'

/** Like or unlike a work entry. Only fellow members of its organisation can, and not on their own work. */
export async function setWorkLike(entryId: string, liked: boolean): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Please sign in again.' }

  try {
    const entry = await prisma.workLogEntry.findUnique({
      where: { id: entryId },
      select: { workRecord: { select: { userId: true, organisation: { select: { slug: true } } } } },
    })
    if (!entry) return { success: false, error: 'This entry has been removed.' }
    const orgSlug = entry.workRecord.organisation.slug
    if (entry.workRecord.userId === user.id) return { success: false, error: 'You can’t like your own work.' }
    if (!user.memberships.some((m) => m.organisation.slug === orgSlug)) {
      return { success: false, error: 'Only members of this garden can like its work.' }
    }

    if (liked) {
      await prisma.workLogEntryLike.upsert({
        where: { entryId_userId: { entryId, userId: user.id } },
        create: { entryId, userId: user.id },
        update: {},
      })
    } else {
      await prisma.workLogEntryLike.deleteMany({ where: { entryId, userId: user.id } })
    }
    revalidatePath('/[org]/specimens/[specimen]', 'page')
    revalidatePath('/records/[recordId]', 'page')
    return { success: true }
  } catch (err) {
    console.error('[setWorkLike] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
}
