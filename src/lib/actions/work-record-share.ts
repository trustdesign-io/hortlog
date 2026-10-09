'use server'

import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/permissions'
import type { ActionResult } from '@trustdesign/shared/types'

export async function createShareLink(recordId: string): Promise<ActionResult<{ token: string }>> {
  const user = await requireAuth()

  const record = await prisma.workRecord.findFirst({
    where: { id: recordId, userId: user.id },
    select: { id: true, shareToken: true },
  })
  if (!record) return { success: false, error: 'Record not found.' }
  if (record.shareToken) return { success: true, data: { token: record.shareToken } }

  const token = randomBytes(24).toString('base64url')
  await prisma.workRecord.update({
    where: { id: recordId },
    data: { shareToken: token },
  })

  revalidatePath('/records')
  return { success: true, data: { token } }
}

export async function revokeShareLink(recordId: string): Promise<ActionResult> {
  const user = await requireAuth()

  const record = await prisma.workRecord.findFirst({
    where: { id: recordId, userId: user.id },
    select: { id: true },
  })
  if (!record) return { success: false, error: 'Record not found.' }

  await prisma.workRecord.update({
    where: { id: recordId },
    data: { shareToken: null },
  })

  revalidatePath('/records')
  return { success: true }
}
