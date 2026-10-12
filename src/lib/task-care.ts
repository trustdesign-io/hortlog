import type { Prisma, WorkAction } from '@prisma/client'
import { ensureWorkRecord, WORK_RECORD_SPECIMEN_SELECT } from '@/lib/work-record-db'

export interface TaskCareState {
  status: 'OPEN' | 'DONE'
  completedAt: Date | null
  specimenId: string | null
  careAction: WorkAction | null
  title: string
  assigneeIds: string[]
}

/** A care entry already logged from the task. */
export interface TaskCareEntry {
  id: string
  userId: string
  specimenId: string
}

export interface TaskCarePlan {
  /** What each assignee's entry should say; null when the task logs nothing. */
  entry: { date: Date; action: WorkAction; actionNote: string | null } | null
  update: string[]
  remove: string[]
  create: string[]
}

/** Care entries are calendar dates, stored at midnight UTC. */
export function toCareDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * A done task with a plant and a care action logs that care once for each
 * assignee. Anything else logs nothing, so reopening a task removes its entries.
 */
export function planTaskCare(task: TaskCareState, existing: TaskCareEntry[]): TaskCarePlan {
  const logs = task.status === 'DONE' && task.specimenId && task.careAction && task.assigneeIds.length > 0
  if (!logs) return { entry: null, update: [], remove: existing.map((e) => e.id), create: [] }

  const wanted = new Set(task.assigneeIds)
  const update: string[] = []
  const remove: string[] = []
  const covered = new Set<string>()
  for (const e of existing) {
    if (e.specimenId === task.specimenId && wanted.has(e.userId) && !covered.has(e.userId)) {
      update.push(e.id)
      covered.add(e.userId)
    } else {
      remove.push(e.id)
    }
  }

  return {
    entry: {
      date: toCareDate(task.completedAt ?? new Date()),
      action: task.careAction!,
      // "Other" needs words: the task title says what was done
      actionNote: task.careAction === 'OTHER' ? task.title : null,
    },
    update,
    remove,
    create: task.assigneeIds.filter((id) => !covered.has(id)),
  }
}

/** Brings the care entries logged from a task in line with the task. */
export async function syncTaskCare(tx: Prisma.TransactionClient, taskId: string): Promise<void> {
  const task = await tx.task.findUniqueOrThrow({
    where: { id: taskId },
    select: {
      id: true,
      status: true,
      completedAt: true,
      specimenId: true,
      careAction: true,
      title: true,
      assignees: { select: { userId: true } },
      careEntries: { select: { id: true, workRecord: { select: { id: true, userId: true, specimenId: true } } } },
    },
  })

  const existing = task.careEntries.map((e) => ({
    id: e.id,
    userId: e.workRecord.userId,
    specimenId: e.workRecord.specimenId,
  }))
  const plan = planTaskCare(
    { ...task, assigneeIds: task.assignees.map((a) => a.userId) },
    existing,
  )

  if (plan.remove.length) {
    const touchedRecords = task.careEntries.filter((e) => plan.remove.includes(e.id)).map((e) => e.workRecord.id)
    await tx.workLogEntry.deleteMany({ where: { id: { in: plan.remove } } })
    // A record that only existed for this task goes too
    await tx.workRecord.deleteMany({ where: { id: { in: touchedRecords }, logEntries: { none: {} } } })
  }

  if (!plan.entry) return
  const { date, action, actionNote } = plan.entry

  if (plan.update.length) {
    // Members may have added their own notes to these entries; only the task's part changes
    await tx.workLogEntry.updateMany({ where: { id: { in: plan.update } }, data: { date, action, actionNote } })
  }

  if (plan.create.length) {
    const specimen = await tx.specimen.findUniqueOrThrow({
      where: { id: task.specimenId! },
      select: WORK_RECORD_SPECIMEN_SELECT,
    })
    for (const userId of plan.create) {
      const record = await ensureWorkRecord(tx, userId, specimen, date)
      await tx.workLogEntry.create({
        data: { date, action, actionNote, workRecordId: record.id, taskId: task.id },
      })
    }
  }
}
