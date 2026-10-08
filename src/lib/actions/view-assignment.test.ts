import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  requireOrgAccess,
  revalidatePath,
  org,
  view,
  viewAssignment,
  membership,
} = vi.hoisted(() => ({
  requireOrgAccess: vi.fn(),
  revalidatePath: vi.fn(),
  org: { findUnique: vi.fn() },
  view: { findUnique: vi.fn() },
  viewAssignment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  membership: { findFirst: vi.fn() },
}))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/auth/permissions', () => ({ requireOrgAccess }))
vi.mock('@/lib/prisma', () => ({
  prisma: { organisation: org, view, viewAssignment, membership },
}))

import { assignMemberToView, unassignMemberFromView } from './view-assignment'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MANAGER = { id: 'u-mgr', email: 'mgr@example.com', isAdmin: false, memberships: [] }
const ORG = { id: 'org-1', slug: 'test-org' }
const VIEW = { id: 'view-1' }
const TARGET_USER_ID = 'u-member'

beforeEach(() => {
  vi.clearAllMocks()
  requireOrgAccess.mockResolvedValue({ user: MANAGER, orgSlug: 'test-org' })
})

// ─── assignMemberToView ───────────────────────────────────────────────────────

describe('assignMemberToView', () => {
  it('rejects when requireOrgAccess throws (no can_manage_members)', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(assignMemberToView('test-org', 'view-1', TARGET_USER_ID)).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when org not found', async () => {
    org.findUnique.mockResolvedValue(null)
    const result = await assignMemberToView('test-org', 'view-1', TARGET_USER_ID)
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
    expect(viewAssignment.create).not.toHaveBeenCalled()
  })

  it('returns error when view not found', async () => {
    org.findUnique.mockResolvedValue(ORG)
    view.findUnique.mockResolvedValue(null)
    const result = await assignMemberToView('test-org', 'view-1', TARGET_USER_ID)
    expect(result).toEqual({ success: false, error: 'View not found.' })
  })

  it('returns error when target user is not an org member', async () => {
    org.findUnique.mockResolvedValue(ORG)
    view.findUnique.mockResolvedValue(VIEW)
    membership.findFirst.mockResolvedValue(null)
    const result = await assignMemberToView('test-org', 'view-1', TARGET_USER_ID)
    expect(result).toEqual({ success: false, error: 'User is not a member of this organisation.' })
  })

  it('returns error on duplicate assignment', async () => {
    org.findUnique.mockResolvedValue(ORG)
    view.findUnique.mockResolvedValue(VIEW)
    membership.findFirst.mockResolvedValue({ id: 'm1' })
    viewAssignment.create.mockRejectedValue(new Error('Unique constraint violated'))
    const result = await assignMemberToView('test-org', 'view-1', TARGET_USER_ID)
    expect(result).toEqual({ success: false, error: 'User is already assigned to this view.' })
  })

  it('assigns successfully and revalidates both paths', async () => {
    org.findUnique.mockResolvedValue(ORG)
    view.findUnique.mockResolvedValue(VIEW)
    membership.findFirst.mockResolvedValue({ id: 'm1' })
    viewAssignment.create.mockResolvedValue({ id: 'va1' })

    const result = await assignMemberToView('test-org', 'view-1', TARGET_USER_ID)

    expect(result).toEqual({ success: true })
    expect(viewAssignment.create).toHaveBeenCalledWith({
      data: { viewId: 'view-1', userId: TARGET_USER_ID, assignedById: MANAGER.id },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/views')
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/views/view-1/edit')
  })
})

// ─── unassignMemberFromView ───────────────────────────────────────────────────

describe('unassignMemberFromView', () => {
  it('rejects when requireOrgAccess throws (no can_manage_members)', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(unassignMemberFromView('test-org', 'va1')).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when org not found', async () => {
    org.findUnique.mockResolvedValue(null)
    const result = await unassignMemberFromView('test-org', 'va1')
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
    expect(viewAssignment.delete).not.toHaveBeenCalled()
  })

  it('returns error when assignment not found', async () => {
    org.findUnique.mockResolvedValue(ORG)
    viewAssignment.findUnique.mockResolvedValue(null)
    const result = await unassignMemberFromView('test-org', 'va1')
    expect(result).toEqual({ success: false, error: 'Assignment not found.' })
  })

  it('returns error when assignment belongs to a different org', async () => {
    org.findUnique.mockResolvedValue(ORG)
    viewAssignment.findUnique.mockResolvedValue({
      id: 'va1',
      view: { organisationId: 'other-org-id', id: 'view-1' },
    })
    const result = await unassignMemberFromView('test-org', 'va1')
    expect(result).toEqual({ success: false, error: 'Assignment not found.' })
  })

  it('unassigns successfully and revalidates both paths', async () => {
    org.findUnique.mockResolvedValue(ORG)
    viewAssignment.findUnique.mockResolvedValue({
      id: 'va1',
      view: { organisationId: ORG.id, id: 'view-1' },
    })
    viewAssignment.delete.mockResolvedValue({ id: 'va1' })

    const result = await unassignMemberFromView('test-org', 'va1')

    expect(result).toEqual({ success: true })
    expect(viewAssignment.delete).toHaveBeenCalledWith({ where: { id: 'va1' } })
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/views')
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/views/view-1/edit')
  })
})
