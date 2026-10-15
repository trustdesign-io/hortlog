import type { Prisma, WorkAction } from '@prisma/client'
import { ensureWorkRecord, WORK_RECORD_SPECIMEN_SELECT } from '@/lib/work-record-db'
import { hexOf } from '@/lib/scene-grid'

/** What a task points at: one plant, a whole scene, or some of a scene's cells. */
export interface TaskTarget {
  specimenId: string | null
  sceneId: string | null
  /** "row,col" keys; empty means the whole scene. */
  cells: string[]
}

export function sameTarget(a: TaskTarget, b: TaskTarget): boolean {
  const cells = (t: TaskTarget) => [...t.cells].sort().join('|')
  return a.specimenId === b.specimenId && a.sceneId === b.sceneId && cells(a) === cells(b)
}

/**
 * Whether a plant placed at `gridCell` is covered by a task's cell selection.
 * Tasks pick whole hexes, so a plant in a split hex's small cell counts too.
 */
export function inCells(cells: string[], gridCell: string | null): boolean {
  if (cells.length === 0) return true
  const hex = hexOf(gridCell)
  return hex !== null && cells.includes(hex)
}

export interface TaskCareState {
  status: 'OPEN' | 'DONE'
  completedAt: Date | null
  careAction: WorkAction | null
  title: string
  assigneeIds: string[]
  /** The plants the care applies to, fixed when the task was ticked off. */
  specimenIds: string[]
}

/** A care entry already logged from the task. */
export interface TaskCareEntry {
  id: string
  userId: string
  specimenId: string
}

export interface TaskCarePlan {
  /** What each entry should say; null when the task logs nothing. */
  entry: { date: Date; action: WorkAction; actionNote: string | null } | null
  update: string[]
  remove: string[]
  create: Array<{ userId: string; specimenId: string }>
}

/** Care entries are calendar dates, stored at midnight UTC. */
export function toCareDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * A done task with plants and a care action logs that care once per plant for
 * each assignee. Anything else logs nothing, so reopening a task removes its entries.
 */
export function planTaskCare(task: TaskCareState, existing: TaskCareEntry[]): TaskCarePlan {
  const logs =
    task.status === 'DONE' && task.careAction && task.assigneeIds.length > 0 && task.specimenIds.length > 0
  if (!logs) return { entry: null, update: [], remove: existing.map((e) => e.id), create: [] }

  const key = (userId: string, specimenId: string) => `${userId} ${specimenId}`
  const wanted = new Set(task.assigneeIds.flatMap((u) => task.specimenIds.map((s) => key(u, s))))
  const covered = new Set<string>()
  const update: string[] = []
  const remove: string[] = []
  for (const e of existing) {
    const k = key(e.userId, e.specimenId)
    if (wanted.has(k) && !covered.has(k)) {
      update.push(e.id)
      covered.add(k)
    } else {
      remove.push(e.id)
    }
  }

  const create = task.assigneeIds.flatMap((userId) =>
    task.specimenIds.filter((specimenId) => !covered.has(key(userId, specimenId))).map((specimenId) => ({ userId, specimenId })),
  )

  return {
    entry: {
      date: toCareDate(task.completedAt ?? new Date()),
      action: task.careAction!,
      // "Other" needs words: the task title says what was done
      actionNote: task.careAction === 'OTHER' ? task.title : null,
    },
    update,
    remove,
    create,
  }
}

async function resolveTargets(tx: Prisma.TransactionClient, target: TaskTarget): Promise<string[]> {
  if (target.specimenId) return [target.specimenId]
  if (!target.sceneId) return []
  const placed = await tx.specimen.findMany({
    where: { sceneId: target.sceneId },
    select: { id: true, gridCell: true },
    orderBy: { gridCell: 'asc' },
  })
  return placed.filter((p) => inCells(target.cells, p.gridCell)).map((p) => p.id)
}

/**
 * Brings the care entries logged from a task in line with the task. The plants
 * are worked out when it's ticked off (or its target changes while done) and
 * kept, so moving plants around later doesn't rewrite what was done.
 */
export async function syncTaskCare(
  tx: Prisma.TransactionClient,
  taskId: string,
  { refreshTargets }: { refreshTargets: boolean },
): Promise<void> {
  const task = await tx.task.findUniqueOrThrow({
    where: { id: taskId },
    select: {
      id: true,
      status: true,
      completedAt: true,
      specimenId: true,
      sceneId: true,
      cells: true,
      careSpecimenIds: true,
      careAction: true,
      title: true,
      assignees: { select: { userId: true } },
      careEntries: { select: { id: true, workRecord: { select: { id: true, userId: true, specimenId: true } } } },
    },
  })

  let specimenIds = task.careSpecimenIds
  if (task.status === 'OPEN') {
    specimenIds = []
  } else if (refreshTargets || specimenIds.length === 0) {
    specimenIds = await resolveTargets(tx, task)
  }
  if (specimenIds.join() !== task.careSpecimenIds.join()) {
    await tx.task.update({ where: { id: task.id }, data: { careSpecimenIds: specimenIds } })
  }

  const plan = planTaskCare(
    { ...task, specimenIds, assigneeIds: task.assignees.map((a) => a.userId) },
    task.careEntries.map((e) => ({ id: e.id, userId: e.workRecord.userId, specimenId: e.workRecord.specimenId })),
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
    const specimens = await tx.specimen.findMany({
      where: { id: { in: [...new Set(plan.create.map((c) => c.specimenId))] } },
      select: WORK_RECORD_SPECIMEN_SELECT,
    })
    const byId = new Map(specimens.map((s) => [s.id, s]))
    for (const { userId, specimenId } of plan.create) {
      const specimen = byId.get(specimenId)
      if (!specimen) continue // deleted since
      const record = await ensureWorkRecord(tx, userId, specimen, date)
      await tx.workLogEntry.create({
        data: { date, action, actionNote, workRecordId: record.id, taskId: task.id },
      })
    }
  }
}
