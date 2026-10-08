import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  requireOrgAccess,
  revalidatePath,
  org,
  task,
  membership,
} = vi.hoisted(() => ({
  requireOrgAccess: vi.fn(),
  revalidatePath: vi.fn(),
  org: { findUnique: vi.fn() },
  task: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  membership: { findFirst: vi.fn() },
}))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/auth/permissions', () => ({ requireOrgAccess }))
vi.mock('@/lib/prisma', () => ({
  prisma: { organisation: org, task, membership },
}))

import { createTask, updateTask, setTaskStatus, deleteTask } from './task'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MANAGER = { id: 'u-mgr', email: 'mgr@example.com', isAdmin: false, memberships: [] }
const ORG = { id: 'org-1', slug: 'test-org' }
const TASK = { id: 'task-1', organisationId: 'org-1', title: 'Fix the fence' }

function fd(fields: Record<string, string>): FormData {
  const f = new FormData()
  Object.entries(fields).forEach(([k, v]) => f.set(k, v))
  return f
}

beforeEach(() => {
  vi.clearAllMocks()
  requireOrgAccess.mockResolvedValue({ user: MANAGER, orgSlug: 'test-org' })
  org.findUnique.mockResolvedValue(ORG)
})

// ─── createTask ───────────────────────────────────────────────────────────────

describe('createTask', () => {
  it('rejects without can_manage_members', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(createTask('test-org', null, fd({ title: 'Test' }))).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when title is empty', async () => {
    const result = await createTask('test-org', null, fd({ title: '' }))
    expect(result).toEqual({ success: false, error: 'Title is required.' })
  })

  it('returns error when org not found', async () => {
    org.findUnique.mockResolvedValue(null)
    const result = await createTask('test-org', null, fd({ title: 'My task' }))
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
  })

  it('returns error when assignee is not an org member', async () => {
    membership.findFirst.mockResolvedValue(null)
    const result = await createTask('test-org', null, fd({ title: 'Task', assigneeId: 'u-other' }))
    expect(result).toEqual({ success: false, error: 'Assignee is not a member of this organisation.' })
  })

  it('returns error for invalid due date', async () => {
    const result = await createTask('test-org', null, fd({ title: 'Task', dueDate: 'not-a-date' }))
    expect(result).toEqual({ success: false, error: 'Invalid due date.' })
  })

  it('creates task with minimal fields', async () => {
    task.create.mockResolvedValue({ id: 'task-1' })
    const result = await createTask('test-org', null, fd({ title: 'My task' }))
    expect(result).toEqual({ success: true })
    expect(task.create).toHaveBeenCalledWith({
      data: {
        title: 'My task',
        description: null,
        dueDate: null,
        assigneeId: null,
        organisationId: ORG.id,
        createdById: MANAGER.id,
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/todo')
  })

  it('creates task with all optional fields', async () => {
    membership.findFirst.mockResolvedValue({ id: 'm1' })
    task.create.mockResolvedValue({ id: 'task-2' })

    await createTask('test-org', null, fd({
      title: 'Full task',
      description: 'A description',
      dueDate: '2026-12-01',
      assigneeId: 'u-member',
    }))

    expect(task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Full task',
        description: 'A description',
        assigneeId: 'u-member',
      }),
    })
  })

  it('creates task cross-org isolation: uses org from slug not from user', async () => {
    task.create.mockResolvedValue({ id: 'task-3' })
    await createTask('test-org', null, fd({ title: 'Task' }))
    expect(task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organisationId: 'org-1' }),
    })
  })
})

// ─── updateTask ───────────────────────────────────────────────────────────────

describe('updateTask', () => {
  it('rejects without can_manage_members', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(updateTask('test-org', 'task-1', null, fd({ title: 'New' }))).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when task not found', async () => {
    task.findUnique.mockResolvedValue(null)
    const result = await updateTask('test-org', 'task-1', null, fd({ title: 'New' }))
    expect(result).toEqual({ success: false, error: 'Task not found.' })
  })

  it('rejects cross-org access: task in a different org', async () => {
    task.findUnique.mockResolvedValue(null)
    const result = await updateTask('test-org', 'task-other', null, fd({ title: 'Hacked' }))
    expect(result).toEqual({ success: false, error: 'Task not found.' })
    expect(task.update).not.toHaveBeenCalled()
  })

  it('updates task successfully', async () => {
    task.findUnique.mockResolvedValue(TASK)
    task.update.mockResolvedValue({ id: 'task-1' })

    const result = await updateTask('test-org', 'task-1', null, fd({ title: 'Updated title' }))
    expect(result).toEqual({ success: true })
    expect(task.update).toHaveBeenCalledWith({
      where: { id: 'task-1', organisationId: ORG.id },
      data: expect.objectContaining({ title: 'Updated title' }),
    })
  })
})

// ─── setTaskStatus ────────────────────────────────────────────────────────────

describe('setTaskStatus', () => {
  it('rejects without can_manage_members', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(setTaskStatus('test-org', 'task-1', 'DONE')).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when task not found', async () => {
    task.findUnique.mockResolvedValue(null)
    const result = await setTaskStatus('test-org', 'task-1', 'DONE')
    expect(result).toEqual({ success: false, error: 'Task not found.' })
  })

  it('marks task as done', async () => {
    task.findUnique.mockResolvedValue(TASK)
    task.update.mockResolvedValue({ ...TASK, status: 'DONE' })

    const result = await setTaskStatus('test-org', 'task-1', 'DONE')
    expect(result).toEqual({ success: true })
    expect(task.update).toHaveBeenCalledWith({
      where: { id: 'task-1', organisationId: ORG.id },
      data: { status: 'DONE' },
    })
  })

  it('reopens task', async () => {
    task.findUnique.mockResolvedValue({ ...TASK, status: 'DONE' })
    task.update.mockResolvedValue({ ...TASK, status: 'OPEN' })

    const result = await setTaskStatus('test-org', 'task-1', 'OPEN')
    expect(result).toEqual({ success: true })
    expect(task.update).toHaveBeenCalledWith({
      where: { id: 'task-1', organisationId: ORG.id },
      data: { status: 'OPEN' },
    })
  })
})

// ─── deleteTask ───────────────────────────────────────────────────────────────

describe('deleteTask', () => {
  it('rejects without can_manage_members', async () => {
    requireOrgAccess.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(deleteTask('test-org', 'task-1')).rejects.toThrow('NEXT_REDIRECT')
  })

  it('returns error when org not found', async () => {
    org.findUnique.mockResolvedValue(null)
    const result = await deleteTask('test-org', 'task-1')
    expect(result).toEqual({ success: false, error: 'Organisation not found.' })
    expect(task.delete).not.toHaveBeenCalled()
  })

  it('returns error when task not found', async () => {
    task.findUnique.mockResolvedValue(null)
    const result = await deleteTask('test-org', 'task-1')
    expect(result).toEqual({ success: false, error: 'Task not found.' })
    expect(task.delete).not.toHaveBeenCalled()
  })

  it('rejects cross-org deletion: task belongs to a different org', async () => {
    task.findUnique.mockResolvedValue(null)
    const result = await deleteTask('test-org', 'task-other-org')
    expect(result).toEqual({ success: false, error: 'Task not found.' })
    expect(task.delete).not.toHaveBeenCalled()
  })

  it('deletes task and revalidates', async () => {
    task.findUnique.mockResolvedValue(TASK)
    task.delete.mockResolvedValue(TASK)

    const result = await deleteTask('test-org', 'task-1')
    expect(result).toEqual({ success: true })
    expect(task.delete).toHaveBeenCalledWith({
      where: { id: 'task-1', organisationId: ORG.id },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/todo')
  })
})
