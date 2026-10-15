import { Prisma, type WorkAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hasCapability, type Capability } from '@/lib/auth/capabilities'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { syncTaskCare } from '@/lib/task-care'
import { ensureWorkRecord, WORK_RECORD_SPECIMEN_SELECT } from '@/lib/work-record-db'
import type { OpResult, SyncOpInput } from './ops'

/** Server-only: applies changes members made offline. */

function can(user: UserWithMemberships, orgSlug: string, capability: Capability): boolean {
  if (user.isAdmin) return true
  const m = user.memberships.find((x) => x.organisation.slug === orgSlug)
  return m ? hasCapability(m.role, capability) : false
}

class AlreadyApplied extends Error {}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

/** Claim the op id inside the transaction, so a resend can't apply it twice. */
async function claim(tx: Prisma.TransactionClient, op: SyncOpInput, userId: string) {
  try {
    await tx.syncOp.create({ data: { id: op.id, kind: op.kind, userId } })
  } catch (err) {
    if (isUniqueViolation(err)) throw new AlreadyApplied()
    throw err
  }
}

async function applyRecordWork(user: UserWithMemberships, op: Extract<SyncOpInput, { kind: 'recordWork' }>): Promise<OpResult> {
  if (!can(user, op.org, 'can_record_work')) return { id: op.id, status: 'rejected', error: 'You can no longer record work here.' }
  const specimen = await prisma.specimen.findFirst({
    where: { id: op.specimenId, organisation: { slug: op.org } },
    select: WORK_RECORD_SPECIMEN_SELECT,
  })
  if (!specimen) return { id: op.id, status: 'rejected', error: 'This plant has been removed.' }

  // Noon, so the day stays the same in any UK time zone
  const date = new Date(`${op.entry.date}T12:00:00Z`)
  await prisma.$transaction(
    async (tx) => {
      await claim(tx, op, user.id)
      const record = await ensureWorkRecord(tx, user.id, specimen, date)
      await tx.workLogEntry.create({
        data: {
          date,
          action: op.entry.action as WorkAction,
          actionNote: op.entry.actionNote,
          location: op.entry.location,
          text: op.entry.text,
          workRecordId: record.id,
        },
      })
    },
    { isolationLevel: 'Serializable' },
  )
  return { id: op.id, status: 'applied' }
}

async function applyTaskStatus(user: UserWithMemberships, op: Extract<SyncOpInput, { kind: 'setTaskStatus' }>): Promise<OpResult> {
  if (!can(user, op.org, 'can_manage_members')) return { id: op.id, status: 'rejected', error: 'You can no longer change tasks here.' }
  const task = await prisma.task.findFirst({
    where: { id: op.taskId, organisation: { slug: op.org } },
    select: { id: true, status: true },
  })
  if (!task) return { id: op.id, status: 'rejected', error: 'This task has been deleted.' }

  await prisma.$transaction(
    async (tx) => {
      await claim(tx, op, user.id)
      // Someone else already made the same change: nothing more to do
      if (task.status === op.status) return
      await tx.task.update({
        where: { id: task.id },
        // Done when it was ticked on the device, not when it arrived
        data: { status: op.status, completedAt: op.status === 'DONE' ? new Date(op.createdAt) : null },
      })
      await syncTaskCare(tx, task.id, { refreshTargets: op.status === 'DONE' })
    },
    { isolationLevel: 'Serializable' },
  )
  return { id: op.id, status: 'applied' }
}

/** Apply each op in order; one failing doesn't stop the rest. */
export async function applyOps(user: UserWithMemberships, ops: SyncOpInput[]): Promise<OpResult[]> {
  const results: OpResult[] = []
  for (const op of ops) {
    try {
      const done = await prisma.syncOp.findUnique({ where: { id: op.id }, select: { id: true } })
      if (done) {
        results.push({ id: op.id, status: 'duplicate' })
        continue
      }
      results.push(op.kind === 'recordWork' ? await applyRecordWork(user, op) : await applyTaskStatus(user, op))
    } catch (err) {
      if (err instanceof AlreadyApplied) {
        results.push({ id: op.id, status: 'duplicate' })
      } else {
        // Leave it in the outbox to try again
        console.error('[offline-sync] Failed to apply op:', err)
      }
    }
  }
  return results
}
