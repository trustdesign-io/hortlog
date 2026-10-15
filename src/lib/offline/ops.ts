import { WORK_ACTION_LABELS } from '@/lib/work-action-labels'

/**
 * Changes a member makes without a connection. Each is saved on the device
 * (the outbox) and sent to /api/offline-sync when the connection returns.
 * Safe for client and server.
 */

export interface WorkEntryInput {
  action: string
  /** yyyy-mm-dd */
  date: string
  actionNote: string | null
  location: string | null
  text: string | null
}

interface OpBase {
  /** Made on the device; the server applies each id once */
  id: string
  org: string
  /** When the member made the change (ISO) */
  createdAt: string
}

export interface RecordWorkOp extends OpBase {
  kind: 'recordWork'
  specimenId: string
  entry: WorkEntryInput
}

export interface SetTaskStatusOp extends OpBase {
  kind: 'setTaskStatus'
  taskId: string
  status: 'OPEN' | 'DONE'
}

export type SyncOpInput = RecordWorkOp | SetTaskStatusOp

/** An op as kept in the outbox; `error` is set when the server refused it. */
export type OutboxOp = SyncOpInput & { error?: string }

export type OpResult =
  | { id: string; status: 'applied' | 'duplicate' }
  | { id: string; status: 'rejected'; error: string }

export const MAX_OPS_PER_PUSH = 100
const MAX_TEXT = 5000

function str(v: unknown, max = MAX_TEXT): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

function validDate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v))
}

/** Check and tidy an op that arrived from a device; null if it's malformed. */
export function parseOp(raw: unknown): SyncOpInput | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = str(o.id, 64)
  const org = str(o.org, 200)
  const createdAt = typeof o.createdAt === 'string' && !isNaN(Date.parse(o.createdAt)) ? o.createdAt : null
  if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id) || !org || !createdAt) return null

  if (o.kind === 'recordWork') {
    const specimenId = str(o.specimenId, 64)
    const e = (o.entry ?? {}) as Record<string, unknown>
    if (!specimenId || typeof e.action !== 'string' || !(e.action in WORK_ACTION_LABELS) || !validDate(e.date)) return null
    return {
      id,
      org,
      createdAt,
      kind: 'recordWork',
      specimenId,
      entry: {
        action: e.action,
        date: e.date,
        actionNote: str(e.actionNote),
        location: str(e.location, 500),
        text: str(e.text),
      },
    }
  }

  if (o.kind === 'setTaskStatus') {
    const taskId = str(o.taskId, 64)
    if (!taskId || (o.status !== 'OPEN' && o.status !== 'DONE')) return null
    return { id, org, createdAt, kind: 'setTaskStatus', taskId, status: o.status }
  }

  return null
}

export function newOpId(): string {
  return crypto.randomUUID()
}
