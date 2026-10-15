import type { OutboxOp } from './ops'
import type { OrgSnapshot } from './types'

/**
 * The saved copy with the member's unsent changes laid over it, so what they
 * did offline shows straight away, marked as waiting to send.
 */
export function applyPending(snap: OrgSnapshot, ops: OutboxOp[]): OrgSnapshot {
  const mine = ops.filter((op) => op.org === snap.org.slug && !op.error)
  if (mine.length === 0) return snap

  const tasks = snap.tasks.map((t) => ({ ...t }))
  let records = snap.myRecords.map((r) => ({ ...r, entries: [...r.entries] }))

  for (const op of mine) {
    if (op.kind === 'setTaskStatus') {
      const t = tasks.find((x) => x.id === op.taskId)
      if (!t) continue
      t.status = op.status
      t.completedAt = op.status === 'DONE' ? op.createdAt : null
      t.pending = true
      continue
    }

    const specimen = snap.specimens.find((s) => s.id === op.specimenId)
    if (!specimen) continue
    const entry = {
      id: op.id,
      date: new Date(`${op.entry.date}T12:00:00`).toISOString(),
      action: op.entry.action,
      actionNote: op.entry.actionNote,
      location: op.entry.location,
      text: op.entry.text,
      pending: true,
    }
    const record = records.find((r) => r.specimenId === op.specimenId)
    if (record) {
      record.entries = [entry, ...record.entries].sort((a, b) => b.date.localeCompare(a.date))
    } else {
      records = [
        ...records,
        {
          id: `pending-${op.id}`,
          recordNumber: 0,
          specimenId: op.specimenId,
          scientificName: specimen.species.scientificName,
          firstWorkedDate: entry.date,
          entries: [entry],
          pending: true,
        },
      ]
    }
  }

  return { ...snap, tasks, myRecords: records }
}
