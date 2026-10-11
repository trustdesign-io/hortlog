import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  requireOrgAccess,
  revalidatePath,
  org,
  scene,
  sceneAssignment,
  membership,
} = vi.hoisted(() => ({
  requireOrgAccess: vi.fn(),
  revalidatePath: vi.fn(),
  org: { findUnique: vi.fn() },
  scene: { findUnique: vi.fn() },
  sceneAssignment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  membership: { findFirst: vi.fn() },
}))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/auth/permissions', () => ({ requireOrgAccess }))
vi.mock('@/lib/prisma', () => ({
  prisma: { organisation: org, scene, sceneAssignment, membership },
}))

import { assignMemberToScene, unassignMemberFromScene } from './scene-assignment'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MANAGER = { id: 'u-mgr', email: 'mgr@example.com', isAdmin: false, memberships: [] }
const ORG = { id: 'org-1', slug: 'test-org' }
const SCENE = { id: 'scene-1' }
const TARGET_USER_ID = 'u-member'

beforeEach(() => {
  vi.clearAllMocks()
  requireOrgAccess.mockResolvedValue({ user: MANAGER, orgSlug: 'test-org' })
})

// ─── assignMemberToScene ───────────────────────────────────────────────────────

describe('assignMemberToScene', () => {
  it('rejects when requireOrgAccess throws (no can_manage_members)', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(assignMemberToScene('test-org', 'scene-1', TARGET_USER_ID)).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when org not found', async () => {
    org.findUnique.mockResolvedValue(null)
    const result = await assignMemberToScene('test-org', 'scene-1', TARGET_USER_ID)
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
    expect(sceneAssignment.create).not.toHaveBeenCalled()
  })

  it('returns error when scene not found', async () => {
    org.findUnique.mockResolvedValue(ORG)
    scene.findUnique.mockResolvedValue(null)
    const result = await assignMemberToScene('test-org', 'scene-1', TARGET_USER_ID)
    expect(result).toEqual({ success: false, error: 'Scene not found.' })
  })

  it('returns error when target user is not an org member', async () => {
    org.findUnique.mockResolvedValue(ORG)
    scene.findUnique.mockResolvedValue(SCENE)
    membership.findFirst.mockResolvedValue(null)
    const result = await assignMemberToScene('test-org', 'scene-1', TARGET_USER_ID)
    expect(result).toEqual({ success: false, error: 'User is not a member of this organisation.' })
  })

  it('returns error on duplicate assignment', async () => {
    org.findUnique.mockResolvedValue(ORG)
    scene.findUnique.mockResolvedValue(SCENE)
    membership.findFirst.mockResolvedValue({ id: 'm1' })
    sceneAssignment.create.mockRejectedValue(new Error('Unique constraint violated'))
    const result = await assignMemberToScene('test-org', 'scene-1', TARGET_USER_ID)
    expect(result).toEqual({ success: false, error: 'User is already assigned to this scene.' })
  })

  it('assigns successfully and revalidates both paths', async () => {
    org.findUnique.mockResolvedValue(ORG)
    scene.findUnique.mockResolvedValue(SCENE)
    membership.findFirst.mockResolvedValue({ id: 'm1' })
    sceneAssignment.create.mockResolvedValue({ id: 'va1' })

    const result = await assignMemberToScene('test-org', 'scene-1', TARGET_USER_ID)

    expect(result).toEqual({ success: true })
    expect(sceneAssignment.create).toHaveBeenCalledWith({
      data: { sceneId: 'scene-1', userId: TARGET_USER_ID, assignedById: MANAGER.id },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/scenes')
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/scenes/scene-1/edit')
  })
})

// ─── unassignMemberFromScene ───────────────────────────────────────────────────

describe('unassignMemberFromScene', () => {
  it('rejects when requireOrgAccess throws (no can_manage_members)', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(unassignMemberFromScene('test-org', 'va1')).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when org not found', async () => {
    org.findUnique.mockResolvedValue(null)
    const result = await unassignMemberFromScene('test-org', 'va1')
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
    expect(sceneAssignment.delete).not.toHaveBeenCalled()
  })

  it('returns error when assignment not found', async () => {
    org.findUnique.mockResolvedValue(ORG)
    sceneAssignment.findUnique.mockResolvedValue(null)
    const result = await unassignMemberFromScene('test-org', 'va1')
    expect(result).toEqual({ success: false, error: 'Assignment not found.' })
  })

  it('returns error when assignment belongs to a different org', async () => {
    org.findUnique.mockResolvedValue(ORG)
    sceneAssignment.findUnique.mockResolvedValue({
      id: 'va1',
      scene: { organisationId: 'other-org-id', id: 'scene-1' },
    })
    const result = await unassignMemberFromScene('test-org', 'va1')
    expect(result).toEqual({ success: false, error: 'Assignment not found.' })
  })

  it('unassigns successfully and revalidates both paths', async () => {
    org.findUnique.mockResolvedValue(ORG)
    sceneAssignment.findUnique.mockResolvedValue({
      id: 'va1',
      scene: { organisationId: ORG.id, id: 'scene-1' },
    })
    sceneAssignment.delete.mockResolvedValue({ id: 'va1' })

    const result = await unassignMemberFromScene('test-org', 'va1')

    expect(result).toEqual({ success: true })
    expect(sceneAssignment.delete).toHaveBeenCalledWith({ where: { id: 'va1' } })
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/scenes')
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/scenes/scene-1/edit')
  })
})
