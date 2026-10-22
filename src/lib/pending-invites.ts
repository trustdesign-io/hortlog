import type { User as AuthUser } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseRole } from '@/lib/roles'
import type { MembershipRole } from '@prisma/client'

/** Supabase invite links last a day by default; after that the person needs a new one */
export const INVITE_LINK_HOURS = 24

export interface PendingInvite {
  userId: string
  email: string
  name: string | null
  role: MembershipRole
  /** ISO */
  invitedAt: string
  expired: boolean
}

/** Invited to this garden and never signed in: the invite hasn't been accepted */
export function isPendingInviteFor(user: Pick<AuthUser, 'invited_at' | 'last_sign_in_at' | 'email_confirmed_at' | 'user_metadata'>, orgSlug: string): boolean {
  return Boolean(user.invited_at) && !user.last_sign_in_at && !user.email_confirmed_at && user.user_metadata?.pending_org_slug === orgSlug
}

export function toPendingInvite(user: AuthUser, now: Date = new Date()): PendingInvite {
  const invitedAt = user.invited_at ?? user.created_at
  return {
    userId: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.full_name as string | undefined) ?? null,
    role: parseRole(user.user_metadata?.pending_role),
    invitedAt,
    expired: now.getTime() - new Date(invitedAt).getTime() > INVITE_LINK_HOURS * 3600 * 1000,
  }
}

/** Everyone invited to this garden who hasn't accepted yet, newest first */
export async function listPendingInvites(orgSlug: string): Promise<PendingInvite[]> {
  const supabase = createAdminClient()
  const found: AuthUser[] = []
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    found.push(...data.users.filter((u) => isPendingInviteFor(u, orgSlug)))
    if (data.users.length < 1000) break
  }
  return found.map((u) => toPendingInvite(u)).sort((a, b) => b.invitedAt.localeCompare(a.invitedAt))
}
