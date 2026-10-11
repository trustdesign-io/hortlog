'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import type { ActionResult } from '@/lib/shared/types'

export async function assignMemberToScene(
  orgSlug: string,
  sceneId: string,
  userId: string,
): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_manage_members')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const scene = await prisma.scene.findUnique({ where: { id: sceneId, organisationId: org.id }, select: { id: true } })
  if (!scene) return { success: false, error: 'Scene not found.' }

  const member = await prisma.membership.findFirst({
    where: { userId, organisationId: org.id },
    select: { id: true },
  })
  if (!member) return { success: false, error: 'User is not a member of this organisation.' }

  try {
    await prisma.sceneAssignment.create({
      data: { sceneId, userId, assignedById: user.id },
    })
  } catch {
    return { success: false, error: 'User is already assigned to this scene.' }
  }

  revalidatePath(`/${orgSlug}/scenes`)
  revalidatePath(`/${orgSlug}/scenes/${sceneId}/edit`)
  return { success: true }
}

export async function unassignMemberFromScene(
  orgSlug: string,
  assignmentId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const assignment = await prisma.sceneAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, scene: { select: { organisationId: true, id: true } } },
  })
  if (!assignment || assignment.scene.organisationId !== org.id) {
    return { success: false, error: 'Assignment not found.' }
  }

  await prisma.sceneAssignment.delete({ where: { id: assignmentId } })

  revalidatePath(`/${orgSlug}/scenes`)
  revalidatePath(`/${orgSlug}/scenes/${assignment.scene.id}/edit`)
  return { success: true }
}
