import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  requireAuth,
  redirect,
  revalidatePath,
  org,
  user,
  membership,
  adminDelete,
  adminInvite,
} = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT') }),
  revalidatePath: vi.fn(),
  org: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  membership: {
    create: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
  },
  adminDelete: vi.fn(),
  adminInvite: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/auth/permissions', () => ({
  requireAuth,
  isAdmin: (u: { isAdmin: boolean }) => u.isAdmin,
}))
vi.mock('@/lib/prisma', () => ({
  prisma: { organisation: org, user, membership },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        deleteUser: adminDelete,
        inviteUserByEmail: adminInvite,
      },
    },
  }),
}))

import {
  adminDeleteOrg,
  adminCreateOrg,
  adminUpdateOrg,
  adminDeleteUser,
  adminSetUserAdmin,
  adminAddMembership,
  adminRemoveMembership,
  adminInviteUser,
} from './admin'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 'u-admin', email: 'admin@example.com', isAdmin: true, memberships: [] }
const PLAIN_USER = { id: 'u-plain', email: 'plain@example.com', isAdmin: false, memberships: [] }
const ORG = { id: 'org1', slug: 'test-org', name: 'Test Org' }

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.set(k, v))
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  adminDelete.mockResolvedValue({ error: null })
  adminInvite.mockResolvedValue({ error: null })
})

// ─── adminDeleteOrg ───────────────────────────────────────────────────────────

describe('adminDeleteOrg', () => {
  it('rejects non-admins', async () => {
    requireAuth.mockResolvedValue(PLAIN_USER)
    const result = await adminDeleteOrg('test-org')
    expect(result).toEqual({ success: false, error: 'Admin access required.' })
    expect(org.delete).not.toHaveBeenCalled()
  })

  it('returns error when org does not exist', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(null)
    const result = await adminDeleteOrg('no-such-org')
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
  })

  it('deletes the org and redirects', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(ORG)
    org.delete.mockResolvedValue(ORG)
    await expect(adminDeleteOrg('test-org')).rejects.toThrow('NEXT_REDIRECT')
    expect(org.delete).toHaveBeenCalledWith({ where: { id: ORG.id } })
    expect(redirect).toHaveBeenCalledWith('/admin/organisations')
  })
})

// ─── adminCreateOrg ───────────────────────────────────────────────────────────

describe('adminCreateOrg', () => {
  it('rejects non-admins', async () => {
    requireAuth.mockResolvedValue(PLAIN_USER)
    const result = await adminCreateOrg(null, formData({ name: 'X', slug: 'x', managerEmail: 'a@b.com' }))
    expect(result).toEqual({ success: false, error: 'Admin access required.' })
  })

  it('validates required name', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    const result = await adminCreateOrg(null, formData({ name: '', slug: 'x', managerEmail: 'a@b.com' }))
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('name')
  })

  it('validates slug format', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    const result = await adminCreateOrg(null, formData({ name: 'Test', slug: 'INVALID SLUG', managerEmail: 'a@b.com' }))
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('lowercase')
  })

  it('rejects reserved slugs', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    const result = await adminCreateOrg(null, formData({ name: 'Admin', slug: 'admin', managerEmail: 'a@b.com' }))
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('reserved')
  })

  it('rejects duplicate slugs', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(ORG)
    const result = await adminCreateOrg(null, formData({ name: 'Test', slug: 'test-org', managerEmail: 'a@b.com' }))
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('taken')
  })

  it('creates org and adds existing manager as membership', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(null)
    org.create.mockResolvedValue({ id: 'org-new', slug: 'new-org' })
    user.findUnique.mockResolvedValue({ id: 'u-existing' })
    membership.create.mockResolvedValue({})
    await expect(
      adminCreateOrg(null, formData({ name: 'New Org', slug: 'new-org', managerEmail: 'existing@example.com' }))
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(membership.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'MANAGER' }) })
    )
    expect(adminInvite).not.toHaveBeenCalled()
  })

  it('invites new manager via Supabase when user does not exist', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(null)
    org.create.mockResolvedValue({ id: 'org-new', slug: 'new-org' })
    user.findUnique.mockResolvedValue(null)
    adminInvite.mockResolvedValue({ error: null })
    await expect(
      adminCreateOrg(null, formData({ name: 'New Org', slug: 'new-org', managerEmail: 'new@example.com' }))
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(adminInvite).toHaveBeenCalledWith(
      'new@example.com',
      expect.objectContaining({ data: expect.objectContaining({ pending_org_slug: 'new-org', pending_role: 'MANAGER' }) })
    )
  })

  it('rolls back org creation when invite fails', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(null)
    org.create.mockResolvedValue({ id: 'org-new', slug: 'new-org' })
    user.findUnique.mockResolvedValue(null)
    adminInvite.mockResolvedValue({ error: new Error('invite failed') })
    org.delete.mockResolvedValue({})
    const result = await adminCreateOrg(null, formData({ name: 'New Org', slug: 'new-org', managerEmail: 'fail@example.com' }))
    expect(result).toMatchObject({ success: false })
    expect(org.delete).toHaveBeenCalledWith({ where: { id: 'org-new' } })
  })
})

// ─── adminUpdateOrg ───────────────────────────────────────────────────────────

describe('adminUpdateOrg', () => {
  it('rejects non-admins', async () => {
    requireAuth.mockResolvedValue(PLAIN_USER)
    const result = await adminUpdateOrg('test-org', null, formData({ name: 'X', slug: 'test-org' }))
    expect(result).toEqual({ success: false, error: 'Admin access required.' })
  })

  it('rejects slug rename to reserved name', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    const result = await adminUpdateOrg('test-org', null, formData({ name: 'Dashboard', slug: 'dashboard' }))
    expect(result).toMatchObject({ success: false })
  })

  it('rejects slug rename to existing slug', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(ORG)
    const result = await adminUpdateOrg('other-org', null, formData({ name: 'Test Org', slug: 'test-org' }))
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('taken')
  })

  it('updates org and returns success', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.update.mockResolvedValue({ ...ORG, name: 'Updated' })
    const result = await adminUpdateOrg('test-org', null, formData({ name: 'Updated', slug: 'test-org' }))
    expect(result).toEqual({ success: true })
    expect(org.update).toHaveBeenCalled()
  })
})

// ─── adminDeleteUser ──────────────────────────────────────────────────────────

describe('adminDeleteUser', () => {
  it('rejects non-admins', async () => {
    requireAuth.mockResolvedValue(PLAIN_USER)
    const result = await adminDeleteUser('u-other')
    expect(result).toEqual({ success: false, error: 'Admin access required.' })
  })

  it('prevents deleting your own account', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    const result = await adminDeleteUser(ADMIN_USER.id)
    expect(result).toEqual({ success: false, error: 'You cannot delete your own account.' })
  })

  it('prevents deleting the last platform admin', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.count.mockResolvedValue(1)
    user.findUnique.mockResolvedValue({ isAdmin: true })
    const result = await adminDeleteUser('u-other-admin')
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('last')
  })

  it('deletes auth and db user then redirects', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.count.mockResolvedValue(2)
    user.findUnique.mockResolvedValue({ isAdmin: false })
    adminDelete.mockResolvedValue({ error: null })
    user.delete.mockResolvedValue({})
    await expect(adminDeleteUser('u-other')).rejects.toThrow('NEXT_REDIRECT')
    expect(adminDelete).toHaveBeenCalledWith('u-other')
    expect(user.delete).toHaveBeenCalledWith({ where: { id: 'u-other' } })
  })

  it('returns error when Supabase delete fails', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.count.mockResolvedValue(2)
    user.findUnique.mockResolvedValue({ isAdmin: false })
    adminDelete.mockResolvedValue({ error: new Error('auth failed') })
    const result = await adminDeleteUser('u-other')
    expect(result).toMatchObject({ success: false })
    expect(user.delete).not.toHaveBeenCalled()
  })

  it('returns error when user not found', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.count.mockResolvedValue(2)
    user.findUnique.mockResolvedValue(null)
    const result = await adminDeleteUser('u-nobody')
    expect(result).toEqual({ success: false, error: 'User not found.' })
  })
})

// ─── adminSetUserAdmin ────────────────────────────────────────────────────────

describe('adminSetUserAdmin', () => {
  it('rejects non-admins', async () => {
    requireAuth.mockResolvedValue(PLAIN_USER)
    const result = await adminSetUserAdmin('u-other', true)
    expect(result).toEqual({ success: false, error: 'Admin access required.' })
  })

  it('prevents removing your own admin flag', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    const result = await adminSetUserAdmin(ADMIN_USER.id, false)
    expect(result).toEqual({ success: false, error: 'You cannot remove your own admin flag.' })
  })

  it('prevents removing the last platform admin', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.count.mockResolvedValue(1)
    const result = await adminSetUserAdmin('u-other', false)
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('last')
  })

  it('grants admin flag and returns success', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.update.mockResolvedValue({})
    const result = await adminSetUserAdmin('u-other', true)
    expect(result).toEqual({ success: true })
    expect(user.update).toHaveBeenCalledWith({ where: { id: 'u-other' }, data: { isAdmin: true } })
  })
})

// ─── adminAddMembership ───────────────────────────────────────────────────────

describe('adminAddMembership', () => {
  it('rejects non-admins', async () => {
    requireAuth.mockResolvedValue(PLAIN_USER)
    const result = await adminAddMembership('u1', 'test-org', 'MEMBER')
    expect(result).toEqual({ success: false, error: 'Admin access required.' })
  })

  it('returns error when org not found', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(null)
    const result = await adminAddMembership('u1', 'no-org', 'MEMBER')
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
  })

  it('returns error on duplicate membership', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(ORG)
    const { PrismaClientKnownRequestError } = await import('@prisma/client')
    membership.create.mockRejectedValue(
      new PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: '5.0.0' })
    )
    const result = await adminAddMembership('u1', 'test-org', 'MEMBER')
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('already a member')
  })

  it('creates membership and returns success', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    org.findUnique.mockResolvedValue(ORG)
    membership.create.mockResolvedValue({})
    const result = await adminAddMembership('u1', 'test-org', 'MANAGER')
    expect(result).toEqual({ success: true })
    expect(membership.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'MANAGER' }) })
    )
  })
})

// ─── adminRemoveMembership ────────────────────────────────────────────────────

describe('adminRemoveMembership', () => {
  it('rejects non-admins', async () => {
    requireAuth.mockResolvedValue(PLAIN_USER)
    const result = await adminRemoveMembership('u1', 'm1')
    expect(result).toEqual({ success: false, error: 'Admin access required.' })
  })

  it('returns error when membership not found', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    membership.findUnique.mockResolvedValue(null)
    const result = await adminRemoveMembership('u1', 'm-gone')
    expect(result).toEqual({ success: false, error: 'Membership not found.' })
  })

  it('prevents removing the last manager from an org', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    membership.findUnique.mockResolvedValue({ role: 'MANAGER', organisationId: 'org1' })
    membership.count.mockResolvedValue(1)
    const result = await adminRemoveMembership('u1', 'm1')
    expect(result).toMatchObject({ success: false })
    expect(result.success === false && result.error).toContain('last manager')
  })

  it('removes membership and returns success when multiple managers exist', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    membership.findUnique.mockResolvedValue({ role: 'MANAGER', organisationId: 'org1' })
    membership.count.mockResolvedValue(2)
    membership.delete.mockResolvedValue({})
    const result = await adminRemoveMembership('u1', 'm1')
    expect(result).toEqual({ success: true })
    expect(membership.delete).toHaveBeenCalledWith({ where: { id: 'm1' } })
  })

  it('removes a MEMBER membership without manager count check', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    membership.findUnique.mockResolvedValue({ role: 'MEMBER', organisationId: 'org1' })
    membership.delete.mockResolvedValue({})
    const result = await adminRemoveMembership('u1', 'm1')
    expect(result).toEqual({ success: true })
    expect(membership.count).not.toHaveBeenCalled()
  })
})

// ─── adminInviteUser ──────────────────────────────────────────────────────────

describe('adminInviteUser', () => {
  it('rejects non-admins', async () => {
    requireAuth.mockResolvedValue(PLAIN_USER)
    const result = await adminInviteUser(null, formData({ email: 'x@x.com' }))
    expect(result).toEqual({ success: false, error: 'Admin access required.' })
  })

  it('validates email format', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    const result = await adminInviteUser(null, formData({ email: 'not-an-email' }))
    expect(result).toMatchObject({ success: false })
  })

  it('adds existing user to org instead of inviting', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.findUnique.mockResolvedValue({ id: 'u-existing' })
    org.findUnique.mockResolvedValue(ORG)
    membership.create.mockResolvedValue({})
    const result = await adminInviteUser(null, formData({ email: 'existing@example.com', orgSlug: 'test-org', role: 'MEMBER' }))
    expect(result).toEqual({ success: true })
    expect(membership.create).toHaveBeenCalled()
    expect(adminInvite).not.toHaveBeenCalled()
  })

  it('sends invite to new user with org metadata', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.findUnique.mockResolvedValue(null)
    adminInvite.mockResolvedValue({ error: null })
    const result = await adminInviteUser(null, formData({ email: 'new@example.com', orgSlug: 'test-org', role: 'MANAGER' }))
    expect(result).toEqual({ success: true })
    expect(adminInvite).toHaveBeenCalledWith(
      'new@example.com',
      expect.objectContaining({ data: expect.objectContaining({ pending_org_slug: 'test-org', pending_role: 'MANAGER' }) })
    )
  })

  it('sends invite without org metadata when no org selected', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.findUnique.mockResolvedValue(null)
    adminInvite.mockResolvedValue({ error: null })
    const result = await adminInviteUser(null, formData({ email: 'new@example.com', orgSlug: '' }))
    expect(result).toEqual({ success: true })
    expect(adminInvite).toHaveBeenCalledWith(
      'new@example.com',
      expect.objectContaining({ data: {} })
    )
  })

  it('returns error when Supabase invite fails', async () => {
    requireAuth.mockResolvedValue(ADMIN_USER)
    user.findUnique.mockResolvedValue(null)
    adminInvite.mockResolvedValue({ error: new Error('quota exceeded') })
    const result = await adminInviteUser(null, formData({ email: 'fail@example.com', orgSlug: '' }))
    expect(result).toMatchObject({ success: false })
  })
})
