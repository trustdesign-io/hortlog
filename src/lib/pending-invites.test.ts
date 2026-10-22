import { describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { isPendingInviteFor, toPendingInvite } from './pending-invites'

const invited = {
  id: 'u1',
  email: 'ana@example.com',
  invited_at: '2026-10-20T10:00:00Z',
  created_at: '2026-10-20T10:00:00Z',
  last_sign_in_at: undefined,
  email_confirmed_at: undefined,
  user_metadata: { pending_org_slug: 'kew', pending_role: 'MEMBER', full_name: 'Ana' },
} as unknown as User

describe('pending invites', () => {
  it('counts someone invited to this garden who never signed in', () => {
    expect(isPendingInviteFor(invited, 'kew')).toBe(true)
    expect(isPendingInviteFor(invited, 'lullingstone')).toBe(false)
    expect(isPendingInviteFor({ ...invited, last_sign_in_at: '2026-10-21T10:00:00Z' }, 'kew')).toBe(false)
  })

  it('marks links older than a day as expired', () => {
    expect(toPendingInvite(invited, new Date('2026-10-20T20:00:00Z')).expired).toBe(false)
    expect(toPendingInvite(invited, new Date('2026-10-22T10:00:00Z'))).toMatchObject({ expired: true, name: 'Ana', role: 'MEMBER' })
  })
})
