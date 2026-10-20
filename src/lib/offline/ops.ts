import { WORK_ACTION_LABELS } from '@/lib/work-action-labels'
import { GRID_SIDES, MAX_GRID_OPS, SUB_CELLS, type GridOp } from '@/lib/scene-grid'
import { MAX_SCENE_TITLE } from '@/lib/scene-title'
import { isPlantStage, type PlantStageValue } from '@/lib/plant-stage'

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
  /** Members who did the work too (checked again on the server) */
  coworkerIds?: string[]
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

/** A plant added on site. Its id is made on the device so later changes can refer to it. */
export interface CreateSpecimenOp extends OpBase {
  kind: 'createSpecimen'
  specimenId: string
  /** A species already in hortlog, or null to go by `fieldName` */
  speciesId: string | null
  /** Whatever the member called it, for plants not yet identified */
  fieldName: string | null
  accessionNumber: string | null
  notes: string | null
}

export interface PlaceSpecimenOp extends OpBase {
  kind: 'placeSpecimen'
  sceneId: string
  specimenId: string
  row: number
  col: number
  /** One of a split hex's small cells, or null for the whole hex */
  sub: number | null
}

/** A plant marked on its scene's bed photo, 0–1 from the left and top */
export interface PlaceOnPhotoOp extends OpBase {
  kind: 'placeOnPhoto'
  sceneId: string
  specimenId: string
  x: number
  y: number
}

export interface UnplaceSpecimenOp extends OpBase {
  kind: 'unplaceSpecimen'
  specimenId: string
}

export interface SplitHexOp extends OpBase {
  kind: 'splitHex'
  sceneId: string
  row: number
  col: number
  split: boolean
}

export interface ResizeGridOp extends OpBase {
  kind: 'resizeGrid'
  sceneId: string
  steps: GridOp[]
}

export interface UpdateSceneOp extends OpBase {
  kind: 'updateScene'
  sceneId: string
  active?: boolean
  /** null clears it */
  title?: string | null
}

/** A member saw the plant in bud, in flower, in fruit or over */
export interface SetStageOp extends OpBase {
  kind: 'setStage'
  specimenId: string
  stage: PlantStageValue
}

/** Changes sent to /api/offline-sync */
export type SyncOpInput =
  | RecordWorkOp
  | SetTaskStatusOp
  | CreateSpecimenOp
  | PlaceSpecimenOp
  | PlaceOnPhotoOp
  | UnplaceSpecimenOp
  | SplitHexOp
  | ResizeGridOp
  | UpdateSceneOp
  | SetStageOp

/**
 * An op as kept in the outbox. `error` is set when the server refused it.
 * `sentAt` is set once the server has applied it: it stays (and stays shown)
 * until a saved copy fetched after that includes it, so nothing done offline
 * vanishes from the screen in between.
 */
export type OutboxOp = SyncOpInput & { error?: string; sentAt?: string }

/** Still to be sent: not refused, not yet applied by the server */
export function isUnsent(op: OutboxOp): boolean {
  return !op.error && !op.sentAt
}

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
        coworkerIds: Array.isArray(e.coworkerIds) ? e.coworkerIds.filter((v): v is string => typeof v === 'string' && v.length <= 64).slice(0, 20) : [],
      },
    }
  }

  if (o.kind === 'setStage') {
    const specimenId = str(o.specimenId, 64)
    if (!specimenId || !isPlantStage(o.stage)) return null
    return { id, org, createdAt, kind: 'setStage', specimenId, stage: o.stage }
  }

  if (o.kind === 'setTaskStatus') {
    const taskId = str(o.taskId, 64)
    if (!taskId || (o.status !== 'OPEN' && o.status !== 'DONE')) return null
    return { id, org, createdAt, kind: 'setTaskStatus', taskId, status: o.status }
  }

  const base = { id, org, createdAt }
  const intIn = (v: unknown, min: number, max: number): v is number =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

  if (o.kind === 'createSpecimen') {
    const specimenId = typeof o.specimenId === 'string' && isDeviceId(o.specimenId) ? o.specimenId : null
    const speciesId = str(o.speciesId, 64)
    const fieldName = str(o.fieldName, 120)
    if (!specimenId || (!speciesId && !fieldName)) return null
    return {
      ...base,
      kind: 'createSpecimen',
      specimenId,
      speciesId,
      fieldName,
      accessionNumber: str(o.accessionNumber, 60),
      notes: str(o.notes),
    }
  }

  if (o.kind === 'placeSpecimen') {
    const sceneId = str(o.sceneId, 64)
    const specimenId = str(o.specimenId, 64)
    const sub = o.sub === null || o.sub === undefined ? null : o.sub
    if (!sceneId || !specimenId || !intIn(o.row, 0, 99) || !intIn(o.col, 0, 99)) return null
    if (sub !== null && !intIn(sub, 0, SUB_CELLS - 1)) return null
    return { ...base, kind: 'placeSpecimen', sceneId, specimenId, row: o.row, col: o.col, sub }
  }

  if (o.kind === 'placeOnPhoto') {
    const sceneId = str(o.sceneId, 64)
    const specimenId = str(o.specimenId, 64)
    const inUnit = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1
    if (!sceneId || !specimenId || !inUnit(o.x) || !inUnit(o.y)) return null
    return { ...base, kind: 'placeOnPhoto', sceneId, specimenId, x: o.x, y: o.y }
  }

  if (o.kind === 'unplaceSpecimen') {
    const specimenId = str(o.specimenId, 64)
    return specimenId ? { ...base, kind: 'unplaceSpecimen', specimenId } : null
  }

  if (o.kind === 'splitHex') {
    const sceneId = str(o.sceneId, 64)
    if (!sceneId || !intIn(o.row, 0, 99) || !intIn(o.col, 0, 99) || typeof o.split !== 'boolean') return null
    return { ...base, kind: 'splitHex', sceneId, row: o.row, col: o.col, split: o.split }
  }

  if (o.kind === 'resizeGrid') {
    const sceneId = str(o.sceneId, 64)
    const steps = Array.isArray(o.steps) ? (o.steps as GridOp[]) : null
    const valid =
      steps !== null &&
      steps.length > 0 &&
      steps.length <= MAX_GRID_OPS &&
      steps.every((st) => GRID_SIDES.includes(st?.side) && (st.delta === 1 || st.delta === -1))
    if (!sceneId || !valid) return null
    return { ...base, kind: 'resizeGrid', sceneId, steps: steps.map((st) => ({ side: st.side, delta: st.delta })) }
  }

  if (o.kind === 'updateScene') {
    const sceneId = str(o.sceneId, 64)
    if (!sceneId) return null
    const op: UpdateSceneOp = { ...base, kind: 'updateScene', sceneId }
    if (typeof o.active === 'boolean') op.active = o.active
    if (o.title === null) op.title = null
    else if (typeof o.title === 'string') {
      const t = o.title.trim().replace(/\s+/g, ' ')
      if (t.length > MAX_SCENE_TITLE) return null
      op.title = t || null
    }
    return op
  }

  return null
}

export function newOpId(): string {
  return crypto.randomUUID()
}

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** A cuid-shaped id made on the device, for a plant added offline. */
export function newDeviceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return 'c' + Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join('')
}

export function isDeviceId(id: string): boolean {
  return /^c[a-z0-9]{24}$/.test(id)
}

let lastOpTime = 0
/**
 * When a change was made, always later than the one before: changes are sent
 * in this order, so a new plant always goes before it's placed.
 */
export function opTime(): string {
  lastOpTime = Math.max(Date.now(), lastOpTime + 1)
  return new Date(lastOpTime).toISOString()
}
