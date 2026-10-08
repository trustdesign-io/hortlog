import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  requireOrgAccess,
  revalidatePath,
  org,
  user,
  membership,
  supabaseInvite,
} = vi.hoisted(() => ({
  requireOrgAccess: vi.fn(),
  revalidatePath: vi.fn(),
  org: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  membership: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  supabaseInvite: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/auth/permissions', () => ({ requireOrgAccess }))
vi.mock('@/lib/prisma', () => ({
  prisma: { organisation: org, user, membership },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { inviteUserByEmail: supabaseInvite } },
  }),
}))

import { inviteMember, changeMemberRole, removeMember } from './member'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MANAGER_CTX = {
  user: { id: 'u-mgr', email: 'mgr@example.com', isAdmin: false, memberships: [] },
  orgSlug: 'test-org',
}
const ORG = { id: 'org-1', slug: 'test-org' }

function fd(fields: Record<string, string>): FormData {
  const f = new FormData()
  Object.entries(fields).forEach(([k, v]) => f.set(k, v))
  return f
}

beforeEach(() => {
  vi.clearAllMocks()
  requireOrgAccess.mockResolvedValue(MANAGER_CTX)
  supabaseInvite.mockResolvedValue({ error: null })
})

// ─── inviteMember role handling ───────────────────────────────────────────────

describe('inviteMember — role', () => {
  it('rejects without can_manage_members', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(inviteMember('test-org', null, fd({ email: 'a@b.com' }))).rejects.toThrow('NEXT_REDIRECT')
  })

  it('defaults to MEMBER when role is not provided', async () => {
    org.findUnique.mockResolvedValue(ORG)
    user.findUnique.mockResolvedValue(null)
    supabaseInvite.mockResolvedValue({ error: null })

    const result = await inviteMember('test-org', null, fd({ email: 'new@example.com' }))

    expect(result).toEqual({ success: true })
    expect(supabaseInvite).toHaveBeenCalledWith('new@example.com', {
      redirectTo: expect.any(String),
      data: { pending_org_slug: 'test-org', pending_role: 'MEMBER' },
    })
  })

  it('invites as MANAGER when role=MANAGER is provided', async () => {
    org.findUnique.mockResolvedValue(ORG)
    user.findUnique.mockResolvedValue(null)

    const result = await inviteMember('test-org', null, fd({ email: 'mgr@example.com', role: 'MANAGER' }))

    expect(result).toEqual({ success: true })
    expect(supabaseInvite).toHaveBeenCalledWith('mgr@example.com', {
      redirectTo: expect.any(String),
      data: { pending_org_slug: 'test-org', pending_role: 'MANAGER' },
    })
  })

  it('invites as MEMBER when role=MEMBER is explicit', async () => {
    org.findUnique.mockResolvedValue(ORG)
    user.findUnique.mockResolvedValue(null)

    const result = await inviteMember('test-org', null, fd({ email: 'mem@example.com', role: 'MEMBER' }))

    expect(result).toEqual({ success: true })
    expect(supabaseInvite).toHaveBeenCalledWith('mem@example.com', {
      redirectTo: expect.any(String),
      data: { pending_org_slug: 'test-org', pending_role: 'MEMBER' },
    })
  })

  it('creates MANAGER membership for existing user when role=MANAGER', async () => {
    org.findUnique.mockResolvedValue(ORG)
    user.findUnique.mockResolvedValue({ id: 'u-existing' })
    membership.findUnique.mockResolvedValue(null)
    membership.create.mockResolvedValue({ id: 'm1' })

    await inviteMember('test-org', null, fd({ email: 'existing@example.com', role: 'MANAGER' }))

    expect(membership.create).toHaveBeenCalledWith({
      data: { userId: 'u-existing', organisationId: ORG.id, role: 'MANAGER' },
    })
  })

  it('creates MEMBER membership for existing user when role=MEMBER', async () => {
    org.findUnique.mockResolvedValue(ORG)
    user.findUnique.mockResolvedValue({ id: 'u-existing' })
    membership.findUnique.mockResolvedValue(null)
    membership.create.mockResolvedValue({ id: 'm1' })

    await inviteMember('test-org', null, fd({ email: 'existing@example.com', role: 'MEMBER' }))

    expect(membership.create).toHaveBeenCalledWith({
      data: { userId: 'u-existing', organisationId: ORG.id, role: 'MEMBER' },
    })
  })

  it('rejects invalid email', async () => {
    const result = await inviteMember('test-org', null, fd({ email: 'not-an-email' }))
    expect(result).toEqual({ success: false, error: 'Invalid email address: not-an-email' })
  })

  it('rejects empty email', async () => {
    const result = await inviteMember('test-org', null, fd({ email: '' }))
    expect(result).toEqual({ success: false, error: 'At least one email address is required.' })
  })

  it('reports already-a-member as partial failure', async () => {
    org.findUnique.mockResolvedValue(ORG)
    user.findUnique.mockResolvedValue({ id: 'u-existing' })
    membership.findUnique.mockResolvedValue({ id: 'm1' })

    const result = await inviteMember('test-org', null, fd({ email: 'existing@example.com' }))
    expect(result).toEqual({ success: false, error: 'Failed to invite: existing@example.com (already a member)' })
  })
})

// ─── changeMemberRole ─────────────────────────────────────────────────────────

describe('changeMemberRole', () => {
  it('rejects without can_manage_members', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(changeMemberRole('test-org', 'm1', 'MEMBER')).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when org not found', async () => {
    org.findUnique.mockResolvedValue(null)
    const result = await changeMemberRole('test-org', 'm1', 'MEMBER')
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
  })

  it('prevents downgrading the last manager', async () => {
    org.findUnique.mockResolvedValue(ORG)
    membership.count.mockResolvedValue(1)
    membership.findUnique.mockResolvedValue({ role: 'MANAGER' })
    const result = await changeMemberRole('test-org', 'm1', 'MEMBER')
    expect(result).toEqual({ success: false, error: 'Cannot downgrade the last manager.' })
  })

  it('updates role successfully', async () => {
    org.findUnique.mockResolvedValue(ORG)
    membership.count.mockResolvedValue(2)
    membership.findUnique.mockResolvedValue({ role: 'MANAGER' })
    membership.update.mockResolvedValue({ id: 'm1', role: 'MEMBER' })

    const result = await changeMemberRole('test-org', 'm1', 'MEMBER')
    expect(result).toEqual({ success: true })
    expect(membership.update).toHaveBeenCalledWith({
      where: { id: 'm1', organisationId: ORG.id },
      data: { role: 'MEMBER' },
    })
  })
})

// ─── removeMember ─────────────────────────────────────────────────────────────

describe('removeMember', () => {
  it('rejects without can_manage_members', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(removeMember('test-org', 'm1')).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when org not found', async () => {
    org.findUnique.mockResolvedValue(null)
    const result = await removeMember('test-org', 'm1')
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
  })

  it('prevents removing the last manager', async () => {
    org.findUnique.mockResolvedValue(ORG)
    membership.findUnique.mockResolvedValue({ role: 'MANAGER' })
    membership.count.mockResolvedValue(1)
    const result = await removeMember('test-org', 'm1')
    expect(result).toEqual({ success: false, error: 'Cannot remove the last manager.' })
  })

  it('removes member successfully', async () => {
    org.findUnique.mockResolvedValue(ORG)
    membership.findUnique.mockResolvedValue({ role: 'MEMBER' })
    membership.delete.mockResolvedValue({ id: 'm1' })

    const result = await removeMember('test-org', 'm1')
    expect(result).toEqual({ success: true })
    expect(membership.delete).toHaveBeenCalledWith({
      where: { id: 'm1', organisationId: ORG.id },
    })
  })
})
