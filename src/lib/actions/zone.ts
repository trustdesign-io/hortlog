'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { cellsOutside, MAX_GRID, MIN_GRID, withinLimits, type GridEdge } from '@/lib/scene-grid'
import type { ActionResult } from '@/lib/shared/types'
import type { ZoneType } from '@prisma/client'

async function resolveZone(zoneId: string, orgSlug: string) {
  return prisma.sceneZone.findFirst({
    where: { id: zoneId, scene: { organisation: { slug: orgSlug } } },
    select: { id: true, sceneId: true, rows: true, cols: true, position: true },
  })
}

export async function createZone(
  orgSlug: string,
  sceneId: string,
  name: string,
  type: ZoneType,
): Promise<ActionResult<{ id: string }>> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: {
      id: true,
      gridRows: true,
      gridCols: true,
      zones: { select: { position: true }, orderBy: { position: 'desc' }, take: 1 },
    },
  })
  if (!scene) return { success: false, error: 'Scene not found.' }

  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: 'Zone name is required.' }

  const nextPosition = (scene.zones[0]?.position ?? -1) + 1

  try {
    const zone = await prisma.sceneZone.create({
      data: { name: trimmed, type, rows: scene.gridRows, cols: scene.gridCols, position: nextPosition, sceneId: scene.id },
      select: { id: true },
    })
    revalidatePath(`/${orgSlug}/scenes/${sceneId}/edit`)
    return { success: true, data: { id: zone.id } }
  } catch (err) {
    console.error('[createZone]', err)
    return { success: false, error: 'Failed to create zone.' }
  }
}

export async function updateZone(
  orgSlug: string,
  zoneId: string,
  data: { name?: string; type?: ZoneType },
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const zone = await resolveZone(zoneId, orgSlug)
  if (!zone) return { success: false, error: 'Zone not found.' }

  const update: { name?: string; type?: ZoneType } = {}
  if (data.name !== undefined) {
    const trimmed = data.name.trim()
    if (!trimmed) return { success: false, error: 'Zone name is required.' }
    update.name = trimmed
  }
  if (data.type !== undefined) update.type = data.type

  try {
    await prisma.sceneZone.update({ where: { id: zoneId }, data: update })
    revalidatePath(`/${orgSlug}/scenes/${zone.sceneId}/edit`)
    return { success: true }
  } catch (err) {
    console.error('[updateZone]', err)
    return { success: false, error: 'Failed to update zone.' }
  }
}

export async function deleteZone(orgSlug: string, zoneId: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const zone = await resolveZone(zoneId, orgSlug)
  if (!zone) return { success: false, error: 'Zone not found.' }

  const zoneCount = await prisma.sceneZone.count({ where: { sceneId: zone.sceneId } })
  if (zoneCount <= 1) return { success: false, error: 'A scene must have at least one zone.' }

  try {
    await prisma.$transaction([
      prisma.specimen.updateMany({
        where: { zoneId },
        data: { sceneId: null, zoneId: null, gridCell: null },
      }),
      prisma.sceneZone.delete({ where: { id: zoneId } }),
    ])
    revalidatePath(`/${orgSlug}/scenes/${zone.sceneId}/edit`)
    return { success: true }
  } catch (err) {
    console.error('[deleteZone]', err)
    return { success: false, error: 'Failed to delete zone.' }
  }
}

export async function resizeZone(
  orgSlug: string,
  zoneId: string,
  edge: GridEdge,
  delta: 1 | -1,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  if (edge !== 'row' && edge !== 'col') return { success: false, error: 'Invalid change.' }
  if (delta !== 1 && delta !== -1) return { success: false, error: 'Invalid change.' }

  const zone = await prisma.sceneZone.findFirst({
    where: { id: zoneId, scene: { organisation: { slug: orgSlug } } },
    select: { id: true, sceneId: true, rows: true, cols: true, specimens: { select: { gridCell: true } } },
  })
  if (!zone) return { success: false, error: 'Zone not found.' }

  const rows = edge === 'row' ? zone.rows + delta : zone.rows
  const cols = edge === 'col' ? zone.cols + delta : zone.cols
  if (!withinLimits(rows) || !withinLimits(cols)) {
    return { success: false, error: `Zones can have ${MIN_GRID} to ${MAX_GRID} rows and columns.` }
  }

  const blocked = cellsOutside(zone.specimens.map((s) => s.gridCell), rows, cols)
  if (blocked.length > 0) {
    const which = edge === 'row' ? `row ${zone.rows}` : `column ${zone.cols}`
    const n = blocked.length
    return { success: false, error: `Move or remove the ${n} plant${n === 1 ? '' : 's'} in ${which} first.` }
  }

  try {
    await prisma.sceneZone.update({ where: { id: zoneId }, data: { rows, cols } })
    revalidatePath(`/${orgSlug}/scenes/${zone.sceneId}/edit`)
    return { success: true }
  } catch (err) {
    console.error('[resizeZone]', err)
    return { success: false, error: 'Failed to resize zone.' }
  }
}

export async function moveZone(
  orgSlug: string,
  zoneId: string,
  direction: 'up' | 'down',
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const zone = await resolveZone(zoneId, orgSlug)
  if (!zone) return { success: false, error: 'Zone not found.' }

  const neighborPosition = direction === 'up' ? zone.position - 1 : zone.position + 1
  const neighbor = await prisma.sceneZone.findFirst({
    where: { sceneId: zone.sceneId, position: neighborPosition },
    select: { id: true, position: true },
  })
  if (!neighbor) return { success: false, error: 'Cannot move further in that direction.' }

  try {
    await prisma.$transaction([
      prisma.sceneZone.update({ where: { id: zoneId }, data: { position: neighbor.position } }),
      prisma.sceneZone.update({ where: { id: neighbor.id }, data: { position: zone.position } }),
    ])
    revalidatePath(`/${orgSlug}/scenes/${zone.sceneId}/edit`)
    return { success: true }
  } catch (err) {
    console.error('[moveZone]', err)
    return { success: false, error: 'Failed to reorder zones.' }
  }
}

/** Place a specimen in a specific cell of a zone. */
export async function placeSpecimenInZone(
  orgSlug: string,
  zoneId: string,
  specimenId: string,
  row: number,
  col: number,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const zone = await prisma.sceneZone.findFirst({
    where: { id: zoneId, scene: { organisationId: org.id } },
    select: { id: true, sceneId: true, rows: true, cols: true },
  })
  if (!zone) return { success: false, error: 'Zone not found.' }

  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= zone.rows || col >= zone.cols) {
    return { success: false, error: 'That cell is outside the zone.' }
  }

  const specimen = await prisma.specimen.findUnique({
    where: { id: specimenId, organisationId: org.id },
    select: { id: true },
  })
  if (!specimen) return { success: false, error: 'Specimen not found.' }

  const cell = `${row},${col}`

  try {
    await prisma.$transaction([
      prisma.specimen.updateMany({
        where: { sceneId: zone.sceneId, zoneId, gridCell: cell, id: { not: specimenId } },
        data: { sceneId: null, zoneId: null, gridCell: null },
      }),
      prisma.specimen.update({
        where: { id: specimenId, organisationId: org.id },
        data: { sceneId: zone.sceneId, zoneId, gridCell: cell },
      }),
    ])
  } catch (err) {
    console.error('[placeSpecimenInZone]', err)
    return { success: false, error: 'Failed to place specimen. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/scenes/${zone.sceneId}/edit`)
  return { success: true }
}
