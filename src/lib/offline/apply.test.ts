import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

const { syncOp, specimen, task, workLogEntry, ensureWorkRecord, syncTaskCare } = vi.hoisted(() => ({
  syncOp: { findUnique: vi.fn(), create: vi.fn() },
  specimen: { findFirst: vi.fn() },
  task: { findFirst: vi.fn(), update: vi.fn() },
  workLogEntry: { create: vi.fn() },
  ensureWorkRecord: vi.fn(),
  syncTaskCare: vi.fn(),
}))

const tx = { syncOp, task, workLogEntry }
vi.mock('@/lib/prisma', () => ({
  prisma: { syncOp, specimen, task, $transaction: (fn: (t: typeof tx) => Promise<unknown>) => fn(tx) },
}))
vi.mock('@/lib/work-record-db', () => ({ ensureWorkRecord, WORK_RECORD_SPECIMEN_SELECT: {} }))
vi.mock('@/lib/task-care', () => ({ syncTaskCare }))

import { applyOps } from './apply'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import type { SyncOpInput } from './ops'

function user(role: 'MEMBER' | 'MANAGER'): UserWithMemberships {
  return { id: 'u1', isAdmin: false, memberships: [{ role, organisation: { slug: 'acme' } }] } as unknown as UserWithMemberships
}

const work: SyncOpInput = {
  id: 'op-00000001',
  org: 'acme',
  createdAt: '2026-10-15T10:00:00.000Z',
  kind: 'recordWork',
  specimenId: 's1',
  entry: { action: 'PRUNED', date: '2026-10-14', actionNote: null, location: null, text: 'ok' },
}
const tick: SyncOpInput = { id: 'op-00000002', org: 'acme', createdAt: '2026-10-15T09:30:00.000Z', kind: 'setTaskStatus', taskId: 't1', status: 'DONE' }

beforeEach(() => {
  vi.clearAllMocks()
  syncOp.findUnique.mockResolvedValue(null)
  syncOp.create.mockResolvedValue({})
  specimen.findFirst.mockResolvedValue({ id: 's1' })
  task.findFirst.mockResolvedValue({ id: 't1', status: 'OPEN' })
  ensureWorkRecord.mockResolvedValue({ id: 'r1' })
})

describe('applyOps', () => {
  it('adds recorded work to the member’s record, dated as entered', async () => {
    expect(await applyOps(user('MEMBER'), [work])).toEqual([{ id: work.id, status: 'applied' }])
    expect(syncOp.create).toHaveBeenCalledWith({ data: { id: work.id, kind: 'recordWork', userId: 'u1' } })
    expect(workLogEntry.create.mock.calls[0][0].data).toMatchObject({ action: 'PRUNED', text: 'ok', workRecordId: 'r1' })
    expect(workLogEntry.create.mock.calls[0][0].data.date.toISOString()).toBe('2026-10-14T12:00:00.000Z')
  })

  it('applies an op only once', async () => {
    syncOp.findUnique.mockResolvedValue({ id: work.id })
    expect(await applyOps(user('MEMBER'), [work])).toEqual([{ id: work.id, status: 'duplicate' }])
    expect(workLogEntry.create).not.toHaveBeenCalled()
  })

  it('treats a resend that races the first as a duplicate', async () => {
    syncOp.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }))
    expect(await applyOps(user('MEMBER'), [work])).toEqual([{ id: work.id, status: 'duplicate' }])
    expect(workLogEntry.create).not.toHaveBeenCalled()
  })

  it('ticks a task off as of when it was ticked on the device', async () => {
    expect(await applyOps(user('MANAGER'), [tick])).toEqual([{ id: tick.id, status: 'applied' }])
    expect(task.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { status: 'DONE', completedAt: new Date(tick.createdAt) },
    })
    expect(syncTaskCare).toHaveBeenCalledWith(tx, 't1', { refreshTargets: true })
  })

  it('leaves a task alone if it already has that status', async () => {
    task.findFirst.mockResolvedValue({ id: 't1', status: 'DONE' })
    expect(await applyOps(user('MANAGER'), [tick])).toEqual([{ id: tick.id, status: 'applied' }])
    expect(task.update).not.toHaveBeenCalled()
  })

  it('refuses a member ticking tasks, and work on a removed plant', async () => {
    specimen.findFirst.mockResolvedValue(null)
    const results = await applyOps(user('MEMBER'), [tick, work])
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected'])
  })

  it('refuses everything in an organisation the member has left', async () => {
    const outsider = { id: 'u1', isAdmin: false, memberships: [] } as unknown as UserWithMemberships
    expect((await applyOps(outsider, [work]))[0].status).toBe('rejected')
  })

  it('leaves out an op that failed unexpectedly, so it is sent again', async () => {
    ensureWorkRecord.mockRejectedValue(new Error('db down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await applyOps(user('MEMBER'), [work, tick])).toEqual([{ id: tick.id, status: 'rejected', error: expect.any(String) }])
  })
})
