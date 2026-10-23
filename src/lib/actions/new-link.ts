'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { authUserByEmail, reinvite } from '@/lib/reinvite'
import type { ActionResult } from '@/lib/shared/types'

/** Not more than once in this long for the same person, so the form can't be used to flood an inbox */
const MIN_MINUTES_BETWEEN = 10

/**
 * "Send me a new link": for someone whose invite expired or was used up.
 * Always answers the same way, so it doesn't reveal who has been invited.
 */
export async function requestNewInviteLink(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { success: false, error: 'Enter the email address the invite was sent to.' }
  }
  try {
    const supabase = createAdminClient()
    const user = await authUserByEmail(supabase, email)
    const waiting = user && user.invited_at && !user.last_sign_in_at && !user.email_confirmed_at
    const recent = user?.invited_at && Date.now() - new Date(user.invited_at).getTime() < MIN_MINUTES_BETWEEN * 60 * 1000
    if (user && waiting && !recent) await reinvite(supabase, user)
  } catch (err) {
    console.error('[requestNewInviteLink] error:', err)
  }
  return { success: true }
}
