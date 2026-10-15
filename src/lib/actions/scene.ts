'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { toSlug } from '@/lib/utils/slug'
import { GRID_SIDES, gridResizeError, MAX_GRID_OPS, planGridOps, type GridOp } from '@/lib/scene-grid'
import { DEFAULT_PERSPECTIVE, parsePerspective } from '@/lib/scene-perspective'
import type { ActionResult } from '@/lib/shared/types'

const SLUG_PATTERN = /^[a-z0-9-]+$/

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    '',
  )
}

async function uniqueShortCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateShortCode()
    const existing = await prisma.scene.findUnique({ where: { shortCode: code } })
    if (!existing) return code
  }
  throw new Error('Failed to generate a unique short code after 10 attempts.')
}

export async function createScene(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slugRaw = (formData.get('slug') as string | null)?.trim() ?? ''
  const primaryCollectionId = (formData.get('primaryCollectionId') as string | null)?.trim() || null
  const gridRowsRaw = formData.get('gridRows') as string | null
  const gridColsRaw = formData.get('gridCols') as string | null
  const perspectiveRaw = formData.get('perspective') as string | null

  const slug = slugRaw || toSlug(name)

  if (!name) return { success: false, error: 'Name is required.' }
  if (name.length > 120) return { success: false, error: 'Name must be 120 characters or fewer.' }
  if (!slug) return { success: false, error: 'Slug is required.' }
  if (slug.length < 2 || slug.length > 48) return { success: false, error: 'Slug must be 2–48 characters.' }
  if (!SLUG_PATTERN.test(slug)) {
    return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  }

  const perspective = perspectiveRaw ? parsePerspective(perspectiveRaw) : DEFAULT_PERSPECTIVE
  if (!perspective) return { success: false, error: 'Perspective must be Bed or Wall.' }

  const gridRows = gridRowsRaw ? parseInt(gridRowsRaw, 10) : 4
  const gridCols = gridColsRaw ? parseInt(gridColsRaw, 10) : 4

  if (isNaN(gridRows) || gridRows < 1 || gridRows > 20) {
    return { success: false, error: 'Grid rows must be between 1 and 20.' }
  }
  if (isNaN(gridCols) || gridCols < 1 || gridCols > 20) {
    return { success: false, error: 'Grid columns must be between 1 and 20.' }
  }

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const existing = await prisma.scene.findUnique({
    where: { slug_organisationId: { slug, organisationId: org.id } },
  })
  if (existing) return { success: false, error: `The slug "${slug}" is already in use.` }

  if (primaryCollectionId) {
    const collection = await prisma.collection.findUnique({
      where: { id: primaryCollectionId, organisationId: org.id },
    })
    if (!collection) return { success: false, error: 'Selected collection not found.' }
  }

  let shortCode: string
  try {
    shortCode = await uniqueShortCode()
  } catch {
    return { success: false, error: 'Could not generate a unique short code. Please try again.' }
  }

  let newId: string
  try {
    const created = await prisma.scene.create({
      data: {
        name,
        slug,
        perspective,
        gridRows,
        gridCols,
        shortCode,
        organisationId: org.id,
        primaryCollectionId,
      },
      select: { id: true },
    })
    newId = created.id
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already in use.` }
    }
    console.error('[createScene] error:', err)
    return { success: false, error: 'Failed to create scene. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes`)
  redirect(`/${orgSlug}/scenes/${newId}/edit`)
}

export async function placeSpecimen(
  orgSlug: string,
  sceneId: string,
  specimenId: string,
  row: number,
  col: number,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const scene = await prisma.scene.findUnique({
    where: { id: sceneId, organisationId: org.id },
    select: { id: true, gridRows: true, gridCols: true },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= scene.gridRows || col >= scene.gridCols) {
    return { success: false, error: 'That cell is outside the grid.' }
  }

  const specimen = await prisma.specimen.findUnique({
    where: { id: specimenId, organisationId: org.id },
    select: { id: true },
  })
  if (!specimen) return { success: false, error: 'Specimen not found.' }

  const cell = `${row},${col}`

  try {
    await prisma.$transaction([
      // Evict any current occupant of this cell
      prisma.specimen.updateMany({
        where: { sceneId, gridCell: cell, id: { not: specimenId } },
        data: { sceneId: null, gridCell: null },
      }),
      // Place (or move) the specimen into this cell
      prisma.specimen.update({
        where: { id: specimenId, organisationId: org.id },
        data: { sceneId, gridCell: cell },
      }),
    ])
  } catch (err) {
    console.error('[placeSpecimen] error:', err)
    return { success: false, error: 'Failed to place specimen. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes/${sceneId}/edit`)
  return { success: true }
}

export async function regenerateShortCode(
  orgSlug: string,
  sceneId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const scene = await prisma.scene.findUnique({
    where: { id: sceneId, organisationId: org.id },
    select: { id: true },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }

  let shortCode: string
  try {
    shortCode = await uniqueShortCode()
  } catch {
    return { success: false, error: 'Could not generate a unique short code. Please try again.' }
  }

  try {
    await prisma.scene.update({
      where: { id: sceneId, organisationId: org.id },
      data: { shortCode },
    })
  } catch (err) {
    console.error('[regenerateShortCode] error:', err)
    return { success: false, error: 'Failed to regenerate short code. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes`)
  revalidatePath(`/${orgSlug}/scenes/${sceneId}/qr`)
  return { success: true }
}

export async function removeSpecimenFromCell(
  orgSlug: string,
  sceneId: string,
  specimenId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  try {
    await prisma.specimen.update({
      where: { id: specimenId, organisationId: org.id, sceneId },
      data: { sceneId: null, gridCell: null },
    })
  } catch (err) {
    console.error('[removeSpecimenFromCell] error:', err)
    return { success: false, error: 'Failed to remove specimen. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes/${sceneId}/edit`)
  return { success: true }
}

/**
 * Adds or removes rows and columns on any side, in order, as one save. Plants
 * and task targets are renumbered so everything stays where it was on the ground.
 */
export async function resizeSceneGrid(
  orgSlug: string,
  sceneId: string,
  ops: GridOp[],
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const valid =
    Array.isArray(ops) &&
    ops.length > 0 &&
    ops.length <= MAX_GRID_OPS &&
    ops.every((op) => GRID_SIDES.includes(op?.side) && (op.delta === 1 || op.delta === -1))
  if (!valid) return { success: false, error: 'Invalid change.' }

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: {
      id: true,
      gridRows: true,
      gridCols: true,
      rowShift: true,
      specimens: { where: { gridCell: { not: null } }, select: { id: true, gridCell: true } },
      tasks: { where: { NOT: { cells: { isEmpty: true } } }, select: { id: true, cells: true } },
    },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }

  const plan = planGridOps(
    { rows: scene.gridRows, cols: scene.gridCols, rowShift: scene.rowShift },
    ops,
    scene.specimens.map((s) => s.gridCell),
  )
  if (!plan.ok) return { success: false, error: gridResizeError(plan) }

  const { rows, cols, rowShift } = plan.shape
  const moved = scene.specimens
    .map((s) => ({ id: s.id, before: s.gridCell as string, after: plan.moveCell(s.gridCell as string) }))
    .filter((s) => s.after !== s.before)
  const tasks = scene.tasks
    .map((t) => ({
      id: t.id,
      before: t.cells,
      after: t.cells.map(plan.moveCell).filter((c): c is string => c !== null),
    }))
    .filter((t) => t.after.join('|') !== t.before.join('|'))

  try {
    await prisma.$transaction([
      prisma.scene.update({ where: { id: scene.id }, data: { gridRows: rows, gridCols: cols, rowShift } }),
      ...moved.map((s) => prisma.specimen.update({ where: { id: s.id }, data: { gridCell: s.after } })),
      ...tasks.map((t) => prisma.task.update({ where: { id: t.id }, data: { cells: t.after } })),
    ])
  } catch (err) {
    console.error('[resizeSceneGrid] error:', err)
    return { success: false, error: 'Failed to resize the grid. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes/${sceneId}`, 'layout')
  revalidatePath(`/${orgSlug}/scenes`)
  revalidatePath(`/${orgSlug}/todo`)
  return { success: true }
}

/** Switches a scene between a bed (lies back) and a wall (upright). */
export async function setScenePerspective(
  orgSlug: string,
  sceneId: string,
  value: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const perspective = parsePerspective(value)
  if (!perspective) return { success: false, error: 'Perspective must be Bed or Wall.' }

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: { id: true },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }

  try {
    await prisma.scene.update({ where: { id: scene.id }, data: { perspective } })
  } catch (err) {
    console.error('[setScenePerspective] error:', err)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes/${sceneId}`, 'layout')
  return { success: true }
}

/**
 * Changes a scene's primary collection or perspective. A scene's name and slug
 * are permanent: the name is printed on its QR label, so neither can change
 * after creation and any attempt is refused.
 */
export async function updateScene(
  orgSlug: string,
  sceneId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  if (formData.has('name') || formData.has('slug')) {
    return { success: false, error: "A scene's name can't be changed: it's printed on its QR label." }
  }

  const primaryCollectionId = (formData.get('primaryCollectionId') as string | null)?.trim() || null
  const perspectiveRaw = formData.get('perspective') as string | null
  const perspective = perspectiveRaw === null ? undefined : parsePerspective(perspectiveRaw)
  if (perspectiveRaw !== null && !perspective) {
    return { success: false, error: 'Perspective must be Bed or Wall.' }
  }

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: { id: true, organisationId: true },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }

  if (primaryCollectionId) {
    const collection = await prisma.collection.findFirst({
      where: { id: primaryCollectionId, organisationId: scene.organisationId },
      select: { id: true },
    })
    if (!collection) return { success: false, error: 'Selected collection not found.' }
  }

  try {
    await prisma.scene.update({
      where: { id: scene.id },
      data: { primaryCollectionId, perspective: perspective ?? undefined },
    })
  } catch (err) {
    console.error('[updateScene] error:', err)
    return { success: false, error: 'Failed to save. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes`)
  revalidatePath(`/${orgSlug}/scenes/${sceneId}`, 'layout')
  return { success: true }
}

/** Deletes a scene. Its plants stay in the organisation, just no longer placed. */
export async function deleteScene(orgSlug: string, sceneId: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: { id: true },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }

  try {
    await prisma.$transaction([
      prisma.specimen.updateMany({ where: { sceneId: scene.id }, data: { sceneId: null, gridCell: null } }),
      prisma.scene.delete({ where: { id: scene.id } }),
    ])
  } catch (err) {
    console.error('[deleteScene] error:', err)
    return { success: false, error: 'Failed to delete the scene. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes`)
  revalidatePath(`/${orgSlug}`)
  redirect(`/${orgSlug}/scenes`)
}
