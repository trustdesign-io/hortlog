'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/permissions'
import { createApiKey, MAX_KEYS_PER_USER } from '@/lib/api-keys'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/shared/types'

/** Make a key; the key itself is returned this once and never again. */
export async function createApiKeyAction(
  _prev: ActionResult<{ key: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ key: string }>> {
  const user = await requireAuth()
  const name = ((formData.get('name') as string | null) ?? '').trim() || 'Claude on my computer'
  if (name.length > 60) return { success: false, error: 'Keep the name to 60 characters or fewer.' }
  try {
    const count = await prisma.apiKey.count({ where: { userId: user.id } })
    if (count >= MAX_KEYS_PER_USER) return { success: false, error: `You can have up to ${MAX_KEYS_PER_USER} keys. Delete one first.` }
    const { key } = await createApiKey(user.id, name)
    revalidatePath('/settings')
    return { success: true, data: { key } }
  } catch {
    return { success: false, error: 'The key couldn’t be made. Try again.' }
  }
}

export async function deleteApiKeyAction(id: string): Promise<ActionResult> {
  const user = await requireAuth()
  try {
    await prisma.apiKey.deleteMany({ where: { id, userId: user.id } })
    revalidatePath('/settings')
    return { success: true }
  } catch {
    return { success: false, error: 'The key couldn’t be deleted. Try again.' }
  }
}
