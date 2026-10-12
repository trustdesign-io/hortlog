'use server'

import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { toSlug } from '@/lib/utils/slug'
import { cellsOutside, MAX_GRID, MIN_GRID, withinLimits, type GridEdge } from '@/lib/scene-grid'
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

  const slug = slugRaw || toSlug(name)

  if (!name) return { success: false, error: 'Name is required.' }
  if (name.length > 120) return { success: false, error: 'Name must be 120 characters or fewer.' }
  if (!slug) return { success: false, error: 'Slug is required.' }
  if (slug.length < 2 || slug.length > 48) return { success: false, error: 'Slug must be 2–48 characters.' }
  if (!SLUG_PATTERN.test(slug)) {
    return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  }

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
    const created = await prisma.$transaction(async (tx) => {
      const scene = await tx.scene.create({
        data: {
          name,
          slug,
          gridRows,
          gridCols,
          shortCode,
          organisationId: org.id,
          primaryCollectionId,
        },
        select: { id: true },
      })
      await tx.sceneZone.create({
        data: { name: 'Bed', type: 'BED', rows: gridRows, cols: gridCols, position: 0, sceneId: scene.id },
      })
      return scene
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
      data: { sceneId: null, zoneId: null, gridCell: null },
    })
  } catch (err) {
    console.error('[removeSpecimenFromCell] error:', err)
    return { success: false, error: 'Failed to remove specimen. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes/${sceneId}/edit`)
  return { success: true }
}

/** Adds or removes the last row or column. Removing only works when it's empty. */
export async function resizeSceneGrid(
  orgSlug: string,
  sceneId: string,
  edge: GridEdge,
  delta: 1 | -1,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  if (edge !== 'row' && edge !== 'col') return { success: false, error: 'Invalid change.' }
  if (delta !== 1 && delta !== -1) return { success: false, error: 'Invalid change.' }

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: { id: true, gridRows: true, gridCols: true, specimens: { select: { gridCell: true } } },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }

  const rows = edge === 'row' ? scene.gridRows + delta : scene.gridRows
  const cols = edge === 'col' ? scene.gridCols + delta : scene.gridCols
  if (!withinLimits(rows) || !withinLimits(cols)) {
    return { success: false, error: `Grids can have ${MIN_GRID} to ${MAX_GRID} rows and columns.` }
  }

  const blocked = cellsOutside(scene.specimens.map((s) => s.gridCell), rows, cols)
  if (blocked.length > 0) {
    const which = edge === 'row' ? `row ${scene.gridRows}` : `column ${scene.gridCols}`
    const n = blocked.length
    return { success: false, error: `Move or remove the ${n} plant${n === 1 ? '' : 's'} in ${which} first.` }
  }

  try {
    await prisma.scene.update({ where: { id: scene.id }, data: { gridRows: rows, gridCols: cols } })
  } catch (err) {
    console.error('[resizeSceneGrid] error:', err)
    return { success: false, error: 'Failed to resize the grid. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes/${sceneId}/edit`)
  revalidatePath(`/${orgSlug}/scenes`)
  return { success: true }
}

/** Renames a scene, changes its slug or primary collection. */
export async function updateScene(
  orgSlug: string,
  sceneId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() || toSlug(name)
  const primaryCollectionId = (formData.get('primaryCollectionId') as string | null)?.trim() || null

  if (!name) return { success: false, error: 'Name is required.' }
  if (name.length > 120) return { success: false, error: 'Name must be 120 characters or fewer.' }
  if (slug.length < 2 || slug.length > 48) return { success: false, error: 'Slug must be 2–48 characters.' }
  if (!SLUG_PATTERN.test(slug)) {
    return { success: false, error: 'Slug may only contain lowercase letters, numbers, and hyphens.' }
  }

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: { id: true, organisationId: true },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }

  const clash = await prisma.scene.findFirst({
    where: { organisationId: scene.organisationId, slug, id: { not: scene.id } },
    select: { id: true },
  })
  if (clash) return { success: false, error: `The slug "${slug}" is already in use.` }

  if (primaryCollectionId) {
    const collection = await prisma.collection.findFirst({
      where: { id: primaryCollectionId, organisationId: scene.organisationId },
      select: { id: true },
    })
    if (!collection) return { success: false, error: 'Selected collection not found.' }
  }

  try {
    await prisma.scene.update({ where: { id: scene.id }, data: { name, slug, primaryCollectionId } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, error: `The slug "${slug}" is already in use.` }
    }
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
      prisma.specimen.updateMany({ where: { sceneId: scene.id }, data: { sceneId: null, zoneId: null, gridCell: null } }),
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
