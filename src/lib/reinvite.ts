import type { SupabaseClient, User as AuthUser } from '@supabase/supabase-js'
import { parseRole } from '@/lib/roles'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hortlog.com'

/**
 * Sends a fresh invite to someone who hasn't accepted theirs. Supabase won't
 * invite an address twice, so the waiting account is removed and the person
 * invited again with the same garden, role and name.
 */
export async function reinvite(supabase: SupabaseClient, user: AuthUser): Promise<{ ok: true } | { ok: false; removed: boolean }> {
  const email = user.email
  if (!email) return { ok: false, removed: false }
  const data: Record<string, string> = {
    pending_org_slug: String(user.user_metadata?.pending_org_slug ?? ''),
    pending_role: parseRole(user.user_metadata?.pending_role),
  }
  if (typeof user.user_metadata?.full_name === 'string') data.full_name = user.user_metadata.full_name

  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('[reinvite] delete error:', deleteError)
    return { ok: false, removed: false }
  }
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: `${APP_URL}/auth/callback`, data })
  if (error) {
    console.error('[reinvite] invite error:', error)
    return { ok: false, removed: true }
  }
  return { ok: true }
}

/** The auth account for an email address, if there is one */
export async function authUserByEmail(supabase: SupabaseClient, email: string): Promise<AuthUser | null> {
  const wanted = email.trim().toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const found = data.users.find((u) => u.email?.toLowerCase() === wanted)
    if (found) return found
    if (data.users.length < 1000) return null
  }
  return null
}
