import { Prisma, type WorkAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hasCapability, type Capability } from '@/lib/auth/capabilities'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { syncTaskCare } from '@/lib/task-care'
import { ensureWorkRecord, WORK_RECORD_SPECIMEN_SELECT } from '@/lib/work-record-db'
import { cellKey, cellsInGrid, gridResizeError, hexOf, planGridOps, SUB_CELLS } from '@/lib/scene-grid'
import { toSlug } from '@/lib/utils/slug'
import { addFromCatalogue, labelName, searchCatalogue } from '@/lib/species-catalogue'
import { nameKey } from '@/lib/taxonomy'
import type {
  CreateSpecimenOp,
  OpResult,
  PlaceSpecimenOp,
  ResizeGridOp,
  SplitHexOp,
  SyncOpInput,
  UnplaceSpecimenOp,
  UpdateSceneOp,
} from './ops'

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

// ─── Building scenes offline ─────────────────────────────────────────────────

const rejected = (id: string, error: string): OpResult => ({ id, status: 'rejected', error })
const applied = (id: string): OpResult => ({ id, status: 'applied' })

/** Run `fn` in a transaction that first claims the op, so it applies once. */
async function once(op: SyncOpInput, userId: string, fn: (tx: Prisma.TransactionClient) => Promise<void>) {
  await prisma.$transaction(
    async (tx) => {
      await claim(tx, op, userId)
      await fn(tx)
    },
    { isolationLevel: 'Serializable' },
  )
}

async function orgId(slug: string): Promise<string | null> {
  return (await prisma.organisation.findUnique({ where: { slug }, select: { id: true } }))?.id ?? null
}

/** Ranks a typed name may be matched to automatically: a species or below, never a genus. */
const SPECIES_RANKS = new Set(['species', 'subspecies', 'variety', 'form'])

/**
 * Looks up a name typed offline in the botanical catalogue, as the species
 * picker would. Only a name that matches exactly (authority aside) is taken;
 * anything less certain is left for the member to identify.
 */
async function lookUpTypedName(name: string): Promise<{ id: string; scientificName: string } | null> {
  const key = nameKey(name)
  const { existing, catalogue } = await searchCatalogue(name)
  const known = existing.find((s) => nameKey(s.scientificName) === key)
  if (known) return known
  const exact = catalogue.filter((c) => {
    return SPECIES_RANKS.has(c.rank.toLowerCase()) && nameKey(labelName(c.label)) === key
  })
  // Several taxa with the same name (different authors) can't be told apart from the name alone
  const accepted = new Set(exact.map((c) => c.existingId ?? nameKey(labelName(c.acceptedLabel ?? c.label))))
  if (exact.length === 0 || accepted.size > 1) return null
  const pick = exact[0]
  if (pick.existingId) {
    return prisma.species.findUnique({ where: { id: pick.existingId }, select: { id: true, scientificName: true } })
  }
  const added = await addFromCatalogue(pick.usageId, name)
  return added.ok ? { id: added.species.id, scientificName: added.species.scientificName } : null
}

/**
 * The species for a plant added offline: the one chosen; one already in
 * hortlog by that name; an exact match in the botanical catalogue; else
 * "Unidentified", with the typed name kept in the notes.
 */
async function speciesFor(op: CreateSpecimenOp): Promise<{ id: string; scientificName: string; unidentified: boolean } | null> {
  if (op.speciesId) {
    const s = await prisma.species.findUnique({ where: { id: op.speciesId }, select: { id: true, scientificName: true } })
    return s ? { ...s, unidentified: false } : null
  }
  const name = op.fieldName as string
  const match = await prisma.species.findFirst({
    where: {
      OR: [
        { scientificName: { equals: name, mode: 'insensitive' } },
        { commonName: { equals: name, mode: 'insensitive' } },
      ],
    },
    select: { id: true, scientificName: true },
  })
  if (match) return { ...match, unidentified: false }
  try {
    const found = await lookUpTypedName(name)
    if (found) return { ...found, unidentified: false }
  } catch (err) {
    // The catalogue being down mustn't hold up the plant; it can be identified later
    console.error('[offline-sync] Catalogue lookup failed:', err)
  }
  const unknown = await prisma.species.upsert({
    where: { slug: 'unidentified' },
    create: { slug: 'unidentified', scientificName: 'Unidentified', commonName: 'Unidentified plant' },
    update: {},
    select: { id: true, scientificName: true },
  })
  return { ...unknown, unidentified: true }
}

async function applyCreateSpecimen(user: UserWithMemberships, op: CreateSpecimenOp): Promise<OpResult> {
  if (!can(user, op.org, 'can_edit_specimen')) return rejected(op.id, 'You can no longer add plants here.')
  const org = await orgId(op.org)
  if (!org) return rejected(op.id, 'This organisation no longer exists.')

  const existing = await prisma.specimen.findUnique({ where: { id: op.specimenId }, select: { organisationId: true } })
  if (existing) {
    if (existing.organisationId !== org) return rejected(op.id, 'This plant could not be added.')
    await once(op, user.id, async () => {})
    return applied(op.id)
  }

  const species = await speciesFor(op)
  if (!species) return rejected(op.id, 'The species chosen has been removed.')

  // Never lose the plant over its details: a clashing accession number goes in the notes
  let accessionNumber = op.accessionNumber
  const notes: string[] = []
  if (species.unidentified && op.fieldName) notes.push(`Field name: ${op.fieldName}`)
  if (accessionNumber) {
    const clash = await prisma.specimen.findFirst({ where: { organisationId: org, accessionNumber }, select: { id: true } })
    if (clash) {
      notes.push(`Accession number ${accessionNumber} was already in use when this plant was added.`)
      accessionNumber = null
    }
  }
  if (op.notes) notes.push(op.notes)

  const base = toSlug([species.unidentified ? (op.fieldName ?? 'unidentified') : species.scientificName, accessionNumber].filter(Boolean).join(' ')) || 'plant'
  const taken = await prisma.specimen.findFirst({ where: { organisationId: org, slug: base }, select: { id: true } })
  const slug = taken ? `${base}-${op.specimenId.slice(-6)}` : base

  await once(op, user.id, async (tx) => {
    await tx.specimen.create({
      data: {
        id: op.specimenId,
        slug,
        accessionNumber,
        notes: notes.length ? notes.join('\n\n') : null,
        organisationId: org,
        speciesId: species.id,
        createdAt: new Date(op.createdAt),
      },
    })
  })
  return applied(op.id)
}

async function sceneFor(op: { sceneId: string; org: string }) {
  return prisma.scene.findFirst({
    where: { id: op.sceneId, organisation: { slug: op.org } },
    select: { id: true, organisationId: true, gridRows: true, gridCols: true, rowShift: true, splitCells: true },
  })
}

async function applyPlaceSpecimen(user: UserWithMemberships, op: PlaceSpecimenOp): Promise<OpResult> {
  if (!can(user, op.org, 'can_edit_scene')) return rejected(op.id, 'You can no longer change scenes here.')
  const scene = await sceneFor(op)
  if (!scene) return rejected(op.id, 'This scene has been deleted.')
  const specimen = await prisma.specimen.findFirst({
    where: { id: op.specimenId, organisationId: scene.organisationId },
    select: { id: true },
  })
  if (!specimen) return rejected(op.id, 'This plant has been removed.')
  if (op.row >= scene.gridRows || op.col >= scene.gridCols) return rejected(op.id, 'That cell is no longer in the grid.')

  // If someone has split or merged the hex since, use the nearest fit rather than lose the placement
  const hex = cellKey(op.row, op.col)
  const isSplit = scene.splitCells.includes(hex)
  let cell = cellKey(op.row, op.col, op.sub)
  if (op.sub !== null && !isSplit) cell = hex
  if (op.sub === null && isSplit) {
    const used = new Set(
      (await prisma.specimen.findMany({ where: { sceneId: scene.id, gridCell: { startsWith: `${hex}:` } }, select: { gridCell: true } })).map(
        (s) => s.gridCell,
      ),
    )
    const free = Array.from({ length: SUB_CELLS }, (_, k) => cellKey(op.row, op.col, k)).find((c) => !used.has(c))
    if (!free) return rejected(op.id, 'Every small cell in that hex is taken.')
    cell = free
  }

  await once(op, user.id, async (tx) => {
    await tx.specimen.updateMany({
      where: { sceneId: scene.id, gridCell: cell, id: { not: specimen.id } },
      data: { sceneId: null, gridCell: null },
    })
    await tx.specimen.update({ where: { id: specimen.id }, data: { sceneId: scene.id, gridCell: cell } })
  })
  return applied(op.id)
}

async function applyUnplaceSpecimen(user: UserWithMemberships, op: UnplaceSpecimenOp): Promise<OpResult> {
  if (!can(user, op.org, 'can_edit_scene')) return rejected(op.id, 'You can no longer change scenes here.')
  const specimen = await prisma.specimen.findFirst({
    where: { id: op.specimenId, organisation: { slug: op.org } },
    select: { id: true },
  })
  if (!specimen) return rejected(op.id, 'This plant has been removed.')
  await once(op, user.id, async (tx) => {
    await tx.specimen.update({ where: { id: specimen.id }, data: { sceneId: null, gridCell: null } })
  })
  return applied(op.id)
}

async function applySplitHex(user: UserWithMemberships, op: SplitHexOp): Promise<OpResult> {
  if (!can(user, op.org, 'can_edit_scene')) return rejected(op.id, 'You can no longer change scenes here.')
  const scene = await sceneFor(op)
  if (!scene) return rejected(op.id, 'This scene has been deleted.')
  if (op.row >= scene.gridRows || op.col >= scene.gridCols) return rejected(op.id, 'That cell is no longer in the grid.')
  const hex = cellKey(op.row, op.col)
  const isSplit = scene.splitCells.includes(hex)
  if (isSplit === op.split) {
    await once(op, user.id, async () => {})
    return applied(op.id)
  }
  const inHex = (
    await prisma.specimen.findMany({ where: { sceneId: scene.id, gridCell: { startsWith: hex } }, select: { id: true, gridCell: true } })
  ).filter((s) => hexOf(s.gridCell) === hex)
  if (!op.split && inHex.length > 1) return rejected(op.id, 'That cell holds more than one plant, so it can’t be merged.')

  await once(op, user.id, async (tx) => {
    await tx.scene.update({
      where: { id: scene.id },
      data: { splitCells: op.split ? [...scene.splitCells, hex] : scene.splitCells.filter((c) => c !== hex) },
    })
    for (const s of inHex) {
      await tx.specimen.update({ where: { id: s.id }, data: { gridCell: op.split ? cellKey(op.row, op.col, 0) : hex } })
    }
  })
  return applied(op.id)
}

async function applyResizeGrid(user: UserWithMemberships, op: ResizeGridOp): Promise<OpResult> {
  if (!can(user, op.org, 'can_edit_scene')) return rejected(op.id, 'You can no longer change scenes here.')
  const scene = await prisma.scene.findFirst({
    where: { id: op.sceneId, organisation: { slug: op.org } },
    select: {
      id: true,
      gridRows: true,
      gridCols: true,
      rowShift: true,
      splitCells: true,
      blockedCells: true,
      specimens: { where: { gridCell: { not: null } }, select: { id: true, gridCell: true } },
      tasks: { where: { NOT: { cells: { isEmpty: true } } }, select: { id: true, cells: true } },
    },
  })
  if (!scene) return rejected(op.id, 'This scene has been deleted.')
  const plan = planGridOps(
    { rows: scene.gridRows, cols: scene.gridCols, rowShift: scene.rowShift },
    op.steps,
    scene.specimens.map((s) => s.gridCell),
  )
  if (!plan.ok) return rejected(op.id, gridResizeError(plan))

  await once(op, user.id, async (tx) => {
    await tx.scene.update({
      where: { id: scene.id },
      data: {
        gridRows: plan.shape.rows,
        gridCols: plan.shape.cols,
        rowShift: plan.shape.rowShift,
        splitCells: scene.splitCells.map(plan.moveCell).filter((c): c is string => c !== null),
        blockedCells: cellsInGrid(scene.blockedCells.map(plan.moveCell), plan.shape.rows, plan.shape.cols),
      },
    })
    for (const s of scene.specimens) {
      const after = plan.moveCell(s.gridCell as string)
      if (after !== s.gridCell) await tx.specimen.update({ where: { id: s.id }, data: { gridCell: after } })
    }
    for (const t of scene.tasks) {
      const after = t.cells.map(plan.moveCell).filter((c): c is string => c !== null)
      if (after.join('|') !== t.cells.join('|')) await tx.task.update({ where: { id: t.id }, data: { cells: after } })
    }
  })
  return applied(op.id)
}

async function applyUpdateScene(user: UserWithMemberships, op: UpdateSceneOp): Promise<OpResult> {
  if (!can(user, op.org, 'can_edit_scene')) return rejected(op.id, 'You can no longer change scenes here.')
  const scene = await sceneFor(op)
  if (!scene) return rejected(op.id, 'This scene has been deleted.')
  await once(op, user.id, async (tx) => {
    await tx.scene.update({
      where: { id: scene.id },
      data: {
        ...(op.active !== undefined ? { active: op.active } : {}),
        ...(op.title !== undefined ? { title: op.title } : {}),
      },
    })
  })
  return applied(op.id)
}

function applyOne(user: UserWithMemberships, op: SyncOpInput): Promise<OpResult> {
  switch (op.kind) {
    case 'recordWork':
      return applyRecordWork(user, op)
    case 'setTaskStatus':
      return applyTaskStatus(user, op)
    case 'createSpecimen':
      return applyCreateSpecimen(user, op)
    case 'placeSpecimen':
      return applyPlaceSpecimen(user, op)
    case 'unplaceSpecimen':
      return applyUnplaceSpecimen(user, op)
    case 'splitHex':
      return applySplitHex(user, op)
    case 'resizeGrid':
      return applyResizeGrid(user, op)
    case 'updateScene':
      return applyUpdateScene(user, op)
  }
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
      results.push(await applyOne(user, op))
    } catch (err) {
      if (err instanceof AlreadyApplied) {
        results.push({ id: op.id, status: 'duplicate' })
      } else {
        // Leave it and everything after it in the outbox to try again, in order:
        // later changes may depend on this one (a plant placed after it's added)
        console.error('[offline-sync] Failed to apply op:', err)
        break
      }
    }
  }
  return results
}
