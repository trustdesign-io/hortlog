import { describe, it, expect, vi, beforeEach } from 'vitest'

const { requireOrgAccess, revalidatePath, invitedAssignees, department, departmentMember, membership, transaction } =
  vi.hoisted(() => ({
    requireOrgAccess: vi.fn(),
    revalidatePath: vi.fn(),
    invitedAssignees: vi.fn(),
    department: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    departmentMember: { deleteMany: vi.fn(), upsert: vi.fn() },
    membership: { findMany: vi.fn() },
    transaction: vi.fn(),
  }))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/auth/permissions', () => ({ requireOrgAccess }))
vi.mock('@/lib/invited-assignees', () => ({ invitedAssignees }))
vi.mock('@/lib/prisma', () => ({
  prisma: { department, departmentMember, membership, organisation: { findUnique: vi.fn() }, $transaction: transaction },
}))

import { saveDepartment } from './department'

describe('saveDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireOrgAccess.mockResolvedValue({})
    department.findFirst.mockResolvedValue({ id: 'd1', organisationId: 'o1' })
    transaction.mockResolvedValue([])
    invitedAssignees.mockResolvedValue(new Set())
  })

  it('puts managers in the department and saves who manages it', async () => {
    membership.findMany.mockResolvedValue([{ userId: 'a' }, { userId: 'b' }])
    const res = await saveDepartment('lull', 'd1', { name: ' Glasshouse ', memberIds: ['a'], managerIds: ['b'] })
    expect(res).toEqual({ success: true })
    expect(department.update).toHaveBeenCalledWith({ where: { id: 'd1' }, data: { name: 'Glasshouse' } })
    expect(departmentMember.deleteMany).toHaveBeenCalledWith({ where: { departmentId: 'd1', userId: { notIn: ['a', 'b'] } } })
    expect(departmentMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { departmentId: 'd1', userId: 'b', isManager: true } }),
    )
    expect(departmentMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { departmentId: 'd1', userId: 'a', isManager: false } }),
    )
  })

  it('accepts someone invited who hasn’t joined yet', async () => {
    membership.findMany.mockResolvedValue([{ userId: 'a' }])
    invitedAssignees.mockResolvedValue(new Set(['tom']))
    const res = await saveDepartment('lull', 'd1', { name: 'Glasshouse', memberIds: ['a', 'tom'], managerIds: [] })
    expect(res).toEqual({ success: true })
  })

  it('refuses people from outside the garden', async () => {
    membership.findMany.mockResolvedValue([{ userId: 'a' }])
    const res = await saveDepartment('lull', 'd1', { name: 'Glasshouse', memberIds: ['a', 'stranger'], managerIds: [] })
    expect(res.success).toBe(false)
    expect(transaction).not.toHaveBeenCalled()
  })

  it('needs a name', async () => {
    const res = await saveDepartment('lull', 'd1', { name: '   ', memberIds: [], managerIds: [] })
    expect(res.success).toBe(false)
  })
})
