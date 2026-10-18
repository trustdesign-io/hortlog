'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { cleanLocationName, MAX_LOCATION_NAME, wouldNestInItself } from '@/lib/locations'
import type { ActionResult } from '@/lib/shared/types'

const NAME_ERROR = `Give the place a name, up to ${MAX_LOCATION_NAME} characters.`

async function orgLocations(orgSlug: string) {
  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return null
  const locations = await prisma.location.findMany({
    where: { organisationId: org.id },
    select: { id: true, name: true, parentId: true },
  })
  return { orgId: org.id, locations }
}

function refresh(orgSlug: string): void {
  revalidatePath(`/${orgSlug}/locations`)
  revalidatePath(`/${orgSlug}/scenes`, 'layout')
  revalidatePath(`/${orgSlug}/specimens`, 'layout')
  // Visitor pages show the breadcrumb
  revalidatePath('/[org]/[collection]/[scene]', 'page')
  revalidatePath('/[org]/scene/[scene]', 'page')
}

/** Two places side by side can't share a name: "Arid" inside the Conservatory once */
function nameTaken(locations: { id: string; name: string; parentId: string | null }[], name: string, parentId: string | null, exceptId?: string): boolean {
  return locations.some((l) => l.id !== exceptId && l.parentId === parentId && l.name.toLowerCase() === name.toLowerCase())
}

export async function createLocation(orgSlug: string, nameRaw: string, parentIdRaw: string | null): Promise<ActionResult<{ id: string }>> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const name = cleanLocationName(nameRaw)
  if (!name) return { success: false, error: NAME_ERROR }
  const ctx = await orgLocations(orgSlug)
  if (!ctx) return { success: false, error: 'Organisation not found.' }
  const parentId = parentIdRaw || null
  if (parentId && !ctx.locations.some((l) => l.id === parentId)) return { success: false, error: 'That place wasn’t found. Reload and try again.' }
  if (nameTaken(ctx.locations, name, parentId)) return { success: false, error: `There’s already a “${name}” there.` }

  try {
    const created = await prisma.location.create({ data: { name, parentId, organisationId: ctx.orgId }, select: { id: true } })
    refresh(orgSlug)
    return { success: true, data: { id: created.id } }
  } catch (err) {
    console.error('[createLocation] error:', err)
    return { success: false, error: 'The place couldn’t be added. Try again.' }
  }
}

/** Rename a place, or move it inside another (everything inside it moves too) */
export async function updateLocation(orgSlug: string, id: string, nameRaw: string, parentIdRaw: string | null): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const name = cleanLocationName(nameRaw)
  if (!name) return { success: false, error: NAME_ERROR }
  const ctx = await orgLocations(orgSlug)
  if (!ctx) return { success: false, error: 'Organisation not found.' }
  if (!ctx.locations.some((l) => l.id === id)) return { success: false, error: 'That place has been removed.' }
  const parentId = parentIdRaw || null
  if (parentId && !ctx.locations.some((l) => l.id === parentId)) return { success: false, error: 'That place wasn’t found. Reload and try again.' }
  if (wouldNestInItself(ctx.locations, id, parentId)) return { success: false, error: 'A place can’t go inside itself or somewhere within it.' }
  if (nameTaken(ctx.locations, name, parentId, id)) return { success: false, error: `There’s already a “${name}” there.` }

  try {
    await prisma.location.update({ where: { id }, data: { name, parentId } })
    refresh(orgSlug)
    return { success: true }
  } catch (err) {
    console.error('[updateLocation] error:', err)
    return { success: false, error: 'The change couldn’t be saved. Try again.' }
  }
}

/**
 * Remove a place. What was inside it isn't lost: the places, scenes and plants
 * in it move up to the place it was in (or to no place, at the top).
 */
export async function deleteLocation(orgSlug: string, id: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const ctx = await orgLocations(orgSlug)
  if (!ctx) return { success: false, error: 'Organisation not found.' }
  const target = ctx.locations.find((l) => l.id === id)
  if (!target) return { success: false, error: 'That place has already been removed.' }
  const up = target.parentId

  // A child moving up mustn't clash with a sibling's name there
  const siblings = ctx.locations.filter((l) => l.parentId === up && l.id !== id)
  const clash = ctx.locations.find((c) => c.parentId === id && siblings.some((s) => s.name.toLowerCase() === c.name.toLowerCase()))
  if (clash) return { success: false, error: `“${clash.name}” would clash with a place of the same name. Rename one first.` }

  try {
    await prisma.$transaction([
      prisma.location.updateMany({ where: { parentId: id }, data: { parentId: up } }),
      prisma.scene.updateMany({ where: { locationId: id }, data: { locationId: up } }),
      prisma.specimen.updateMany({ where: { locationId: id }, data: { locationId: up } }),
      prisma.location.delete({ where: { id } }),
    ])
    refresh(orgSlug)
    return { success: true }
  } catch (err) {
    console.error('[deleteLocation] error:', err)
    return { success: false, error: 'The place couldn’t be removed. Try again.' }
  }
}
