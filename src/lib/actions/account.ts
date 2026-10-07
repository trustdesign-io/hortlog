'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/permissions'
import { uploadAvatar } from '@/lib/storage'
import type { ActionResult } from '@trustdesign/shared/types'

export async function updateProfile(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth()
  const name = (formData.get('name') as string | null)?.trim() ?? ''

  if (!name) return { success: false, error: 'Display name is required.' }
  if (name.length > 120) return { success: false, error: 'Display name must be 120 characters or fewer.' }

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  })

  const supabase = await createClient()
  await supabase.auth.updateUser({ data: { full_name: name } })

  revalidatePath('/settings')
  return { success: true }
}

export async function uploadAvatarAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth()

  const file = formData.get('avatar')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Please select an image file.' }
  }

  const result = await uploadAvatar(file, user.id)
  if (!result.success) return result

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: result.url },
  })

  const supabase = await createClient()
  await supabase.auth.updateUser({ data: { avatar_url: result.url } })

  revalidatePath('/settings')
  return { success: true }
}

export async function changePassword(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth()
  const currentPassword = (formData.get('currentPassword') as string | null) ?? ''
  const newPassword = (formData.get('newPassword') as string | null) ?? ''
  const confirmPassword = (formData.get('confirmPassword') as string | null) ?? ''

  if (!currentPassword) return { success: false, error: 'Current password is required.' }
  if (!newPassword) return { success: false, error: 'New password is required.' }
  if (newPassword.length < 8) return { success: false, error: 'New password must be at least 8 characters.' }
  if (newPassword !== confirmPassword) return { success: false, error: 'Passwords do not match.' }
  if (newPassword === currentPassword) return { success: false, error: 'New password must differ from current password.' }

  const supabase = await createClient()

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) return { success: false, error: 'Current password is incorrect.' }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) return { success: false, error: updateError.message }

  return { success: true }
}
