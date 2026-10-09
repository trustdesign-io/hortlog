import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  requireOrgAccess,
  revalidatePath,
  org,
  task,
  taskAssignee,
  membership,
  $transaction,
} = vi.hoisted(() => {
  const $transaction = vi.fn((ops: unknown[]) => Promise.all(ops))
  return {
    requireOrgAccess: vi.fn(),
    revalidatePath: vi.fn(),
    org: { findUnique: vi.fn() },
    task: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    taskAssignee: { deleteMany: vi.fn() },
    membership: { findMany: vi.fn() },
    $transaction,
  }
})

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/auth/permissions', () => ({ requireOrgAccess }))
vi.mock('@/lib/prisma', () => ({
  prisma: { organisation: org, task, taskAssignee, membership, $transaction },
}))

import { createTask, updateTask, setTaskStatus, deleteTask } from './task'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MANAGER = { id: 'u-mgr', email: 'mgr@example.com', isAdmin: false, memberships: [] }
const ORG = { id: 'org-1', slug: 'test-org' }
const TASK = { id: 'task-1', organisationId: 'org-1', title: 'Fix the fence' }

function fd(fields: Record<string, string | string[]>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) {
      for (const val of v) f.append(k, val)
    } else {
      f.set(k, v)
    }
  }
  return f
}

beforeEach(() => {
  vi.clearAllMocks()
  requireOrgAccess.mockResolvedValue({ user: MANAGER, orgSlug: 'test-org' })
  org.findUnique.mockResolvedValue(ORG)
  // Default: membership check returns all requested members (valid)
  membership.findMany.mockImplementation(({ where }: { where: { userId: { in: string[] } } }) =>
    Promise.resolve(where.userId.in.map((id: string) => ({ userId: id }))),
  )
  task.findUnique.mockResolvedValue(TASK)
  task.create.mockResolvedValue({ id: 'task-1' })
  task.update.mockResolvedValue(TASK)
  task.delete.mockResolvedValue(TASK)
  taskAssignee.deleteMany.mockResolvedValue({ count: 0 })
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
    membership.findMany.mockResolvedValue([]) // 1 requested, 0 found
    const result = await createTask('test-org', null, fd({ title: 'Task', assigneeId: 'u-other' }))
    expect(result).toEqual({
      success: false,
      error: 'One or more assignees are not members of this organisation.',
    })
  })

  it('returns error for invalid due date', async () => {
    const result = await createTask('test-org', null, fd({ title: 'Task', dueDate: 'not-a-date' }))
    expect(result).toEqual({ success: false, error: 'Invalid due date.' })
  })

  it('creates task with no assignees', async () => {
    const result = await createTask('test-org', null, fd({ title: 'My task' }))
    expect(result).toEqual({ success: true })
    expect(task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'My task',
        description: null,
        dueDate: null,
        organisationId: ORG.id,
        createdById: MANAGER.id,
      }),
    })
    const createArg = task.create.mock.calls[0][0]
    expect(createArg.data.assignees).toBeUndefined()
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/todo')
  })

  it('creates task with a single assignee', async () => {
    await createTask('test-org', null, fd({ title: 'Task', assigneeId: 'u-member' }))

    expect(task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assignees: {
          create: [{ userId: 'u-member', assignedById: MANAGER.id }],
        },
      }),
    })
  })

  it('creates task with multiple assignees', async () => {
    await createTask('test-org', null, fd({ title: 'Task', assigneeId: ['u-a', 'u-b'] }))

    expect(task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assignees: {
          create: [
            { userId: 'u-a', assignedById: MANAGER.id },
            { userId: 'u-b', assignedById: MANAGER.id },
          ],
        },
      }),
    })
  })

  it('rejects when only some assignees are org members', async () => {
    // 2 requested, only 1 found
    membership.findMany.mockResolvedValue([{ userId: 'u-a' }])
    const result = await createTask('test-org', null, fd({ title: 'Task', assigneeId: ['u-a', 'u-outsider'] }))
    expect(result).toEqual({
      success: false,
      error: 'One or more assignees are not members of this organisation.',
    })
    expect(task.create).not.toHaveBeenCalled()
  })

  it('uses org from slug, not from user (cross-org isolation)', async () => {
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

  it('rejects cross-org access', async () => {
    task.findUnique.mockResolvedValue(null)
    const result = await updateTask('test-org', 'task-other', null, fd({ title: 'Hacked' }))
    expect(result).toEqual({ success: false, error: 'Task not found.' })
    expect($transaction).not.toHaveBeenCalled()
  })

  it('returns error when an assignee is not an org member', async () => {
    membership.findMany.mockResolvedValue([]) // invalid
    const result = await updateTask('test-org', 'task-1', null, fd({ title: 'Task', assigneeId: 'u-bad' }))
    expect(result).toEqual({
      success: false,
      error: 'One or more assignees are not members of this organisation.',
    })
    expect($transaction).not.toHaveBeenCalled()
  })

  it('updates task with no assignees: deletes old, sets no new', async () => {
    const result = await updateTask('test-org', 'task-1', null, fd({ title: 'Updated title' }))
    expect(result).toEqual({ success: true })
    expect($transaction).toHaveBeenCalledOnce()
    const [ops] = $transaction.mock.calls[0]
    expect(ops).toHaveLength(2)
    expect(taskAssignee.deleteMany).toHaveBeenCalledWith({ where: { taskId: 'task-1' } })
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/todo')
  })

  it('updates task with multiple assignees atomically', async () => {
    const result = await updateTask(
      'test-org',
      'task-1',
      null,
      fd({ title: 'Updated', assigneeId: ['u-a', 'u-b'] }),
    )
    expect(result).toEqual({ success: true })
    expect($transaction).toHaveBeenCalledOnce()
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

  it('rejects cross-org deletion', async () => {
    task.findUnique.mockResolvedValue(null)
    const result = await deleteTask('test-org', 'task-other-org')
    expect(result).toEqual({ success: false, error: 'Task not found.' })
    expect(task.delete).not.toHaveBeenCalled()
  })

  it('deletes task and revalidates', async () => {
    const result = await deleteTask('test-org', 'task-1')
    expect(result).toEqual({ success: true })
    expect(task.delete).toHaveBeenCalledWith({
      where: { id: 'task-1', organisationId: ORG.id },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/test-org/todo')
  })
})
