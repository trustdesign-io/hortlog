'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import type { ActionResult } from '@/lib/shared/types'

async function getOrg(orgSlug: string) {
  return prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
}

async function validateAssignees(
  assigneeIds: string[],
  organisationId: string,
): Promise<string | null> {
  if (assigneeIds.length === 0) return null
  const memberships = await prisma.membership.findMany({
    where: { userId: { in: assigneeIds }, organisationId },
    select: { userId: true },
  })
  if (memberships.length !== assigneeIds.length) {
    return 'One or more assignees are not members of this organisation.'
  }
  return null
}

export async function createTask(
  orgSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_manage_members')

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  if (!title) return { success: false, error: 'Title is required.' }

  const description = (formData.get('description') as string | null)?.trim() || null
  const dueDateRaw = (formData.get('dueDate') as string | null)?.trim() || null
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null
  if (dueDate && isNaN(dueDate.getTime())) return { success: false, error: 'Invalid due date.' }

  const assigneeIds = [...new Set((formData.getAll('assigneeId') as string[]).filter(Boolean))]

  const org = await getOrg(orgSlug)
  if (!org) return { success: false, error: 'Organisation not found.' }

  const assigneeError = await validateAssignees(assigneeIds, org.id)
  if (assigneeError) return { success: false, error: assigneeError }

  try {
    await prisma.task.create({
      data: {
        title,
        description,
        dueDate,
        organisationId: org.id,
        createdById: user.id,
        assignees: assigneeIds.length
          ? {
              create: assigneeIds.map((userId) => ({
                userId,
                assignedById: user.id,
              })),
            }
          : undefined,
      },
    })
  } catch (err) {
    console.error('[createTask] Prisma error:', err)
    return { success: false, error: 'Failed to create task. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/todo`)
  return { success: true }
}

export async function updateTask(
  orgSlug: string,
  taskId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_manage_members')

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  if (!title) return { success: false, error: 'Title is required.' }

  const description = (formData.get('description') as string | null)?.trim() || null
  const dueDateRaw = (formData.get('dueDate') as string | null)?.trim() || null
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null
  if (dueDate && isNaN(dueDate.getTime())) return { success: false, error: 'Invalid due date.' }

  const assigneeIds = [...new Set((formData.getAll('assigneeId') as string[]).filter(Boolean))]

  const org = await getOrg(orgSlug)
  if (!org) return { success: false, error: 'Organisation not found.' }

  const task = await prisma.task.findUnique({
    where: { id: taskId, organisationId: org.id },
    select: { id: true },
  })
  if (!task) return { success: false, error: 'Task not found.' }

  const assigneeError = await validateAssignees(assigneeIds, org.id)
  if (assigneeError) return { success: false, error: assigneeError }

  try {
    await prisma.$transaction([
      // Replace all assignees atomically
      prisma.taskAssignee.deleteMany({ where: { taskId } }),
      prisma.task.update({
        where: { id: taskId, organisationId: org.id },
        data: {
          title,
          description,
          dueDate,
          assignees: assigneeIds.length
            ? {
                create: assigneeIds.map((userId) => ({
                  userId,
                  assignedById: user.id,
                })),
              }
            : undefined,
        },
      }),
    ])
  } catch (err) {
    console.error('[updateTask] Prisma error:', err)
    return { success: false, error: 'Failed to update task. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/todo`)
  return { success: true }
}

export async function setTaskStatus(
  orgSlug: string,
  taskId: string,
  status: 'OPEN' | 'DONE',
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  if (status !== 'OPEN' && status !== 'DONE') {
    return { success: false, error: 'Invalid status.' }
  }

  const org = await getOrg(orgSlug)
  if (!org) return { success: false, error: 'Organisation not found.' }

  const task = await prisma.task.findUnique({
    where: { id: taskId, organisationId: org.id },
    select: { id: true },
  })
  if (!task) return { success: false, error: 'Task not found.' }

  try {
    await prisma.task.update({
      where: { id: taskId, organisationId: org.id },
      data: { status },
    })
  } catch (err) {
    console.error('[setTaskStatus] Prisma error:', err)
    return { success: false, error: 'Failed to update task status. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/todo`)
  return { success: true }
}

export async function deleteTask(
  orgSlug: string,
  taskId: string,
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const org = await getOrg(orgSlug)
  if (!org) return { success: false, error: 'Organisation not found.' }

  const task = await prisma.task.findUnique({
    where: { id: taskId, organisationId: org.id },
    select: { id: true },
  })
  if (!task) return { success: false, error: 'Task not found.' }

  try {
    await prisma.task.delete({ where: { id: taskId, organisationId: org.id } })
  } catch (err) {
    console.error('[deleteTask] Prisma error:', err)
    return { success: false, error: 'Failed to delete task. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/todo`)
  return { success: true }
}
