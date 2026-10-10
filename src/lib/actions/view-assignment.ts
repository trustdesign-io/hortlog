'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import type { ActionResult } from '@/lib/shared/types'

export async function assignMemberToView(
  orgSlug: string,
  viewId: string,
  userId: string,
): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_manage_members')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const view = await prisma.view.findUnique({ where: { id: viewId, organisationId: org.id }, select: { id: true } })
  if (!view) return { success: false, error: 'View not found.' }

  const member = await prisma.membership.findFirst({
    where: { userId, organisationId: org.id },
    select: { id: true },
  })
  if (!member) return { success: false, error: 'User is not a member of this organisation.' }

  try {
    await prisma.viewAssignment.create({
      data: { viewId, userId, assignedById: user.id },
    })
  } catch {
    return { success: false, error: 'User is already assigned to this view.' }
  }

  revalidatePath(`/${orgSlug}/views`)
  revalidatePath(`/${orgSlug}/views/${viewId}/edit`)
  return { success: true }
}

export async function unassignMemberFromView(
  orgSlug: string,
  assignmentId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  if (!org) return { success: false, error: 'Organisation not found.' }

  const assignment = await prisma.viewAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, view: { select: { organisationId: true, id: true } } },
  })
  if (!assignment || assignment.view.organisationId !== org.id) {
    return { success: false, error: 'Assignment not found.' }
  }

  await prisma.viewAssignment.delete({ where: { id: assignmentId } })

  revalidatePath(`/${orgSlug}/views`)
  revalidatePath(`/${orgSlug}/views/${assignment.view.id}/edit`)
  return { success: true }
}
