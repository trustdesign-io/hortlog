'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { WorkAction } from '@prisma/client'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { syncTaskCare } from '@/lib/task-care'
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

interface TaskCareFields {
  specimenId: string | null
  careAction: WorkAction | null
}

/** The optional plant and care action from the task form, checked against the org. */
async function parseCareFields(
  formData: FormData,
  organisationId: string,
): Promise<{ error: string } | { fields: TaskCareFields }> {
  const specimenId = (formData.get('specimenId') as string | null)?.trim() || null
  const actionRaw = (formData.get('careAction') as string | null)?.trim() || null
  if (!specimenId) return { fields: { specimenId: null, careAction: null } }

  const specimen = await prisma.specimen.findFirst({ where: { id: specimenId, organisationId }, select: { id: true } })
  if (!specimen) return { error: 'Selected plant not found.' }
  if (actionRaw && !(actionRaw in WorkAction)) return { error: 'Invalid care action.' }
  return { fields: { specimenId, careAction: (actionRaw as WorkAction | null) ?? null } }
}

/** Care logged from tasks shows on plant pages. */
function revalidateCare(orgSlug: string) {
  revalidatePath(`/${orgSlug}/todo`)
  revalidatePath('/[org]/specimens/[specimen]', 'page')
  revalidatePath('/[org]/[collection]/[scene]/[specimen]', 'page')
  revalidatePath('/records')
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

  const care = await parseCareFields(formData, org.id)
  if ('error' in care) return { success: false, error: care.error }

  try {
    await prisma.task.create({
      data: {
        title,
        description,
        dueDate,
        ...care.fields,
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

  const care = await parseCareFields(formData, org.id)
  if ('error' in care) return { success: false, error: care.error }

  try {
    await prisma.$transaction(async (tx) => {
      // Replace all assignees, then bring any care logged from the task in line
      await tx.taskAssignee.deleteMany({ where: { taskId } })
      await tx.task.update({
        where: { id: taskId, organisationId: org.id },
        data: {
          title,
          description,
          dueDate,
          ...care.fields,
          assignees: assigneeIds.length
            ? { create: assigneeIds.map((userId) => ({ userId, assignedById: user.id })) }
            : undefined,
        },
      })
      await syncTaskCare(tx, taskId)
    }, { isolationLevel: 'Serializable' })
  } catch (err) {
    console.error('[updateTask] Prisma error:', err)
    return { success: false, error: 'Failed to update task. Please try again.' }
  }

  revalidateCare(orgSlug)
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
    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId, organisationId: org.id },
        data: { status, completedAt: status === 'DONE' ? new Date() : null },
      })
      // Ticking off logs the task's care for each assignee; reopening removes it
      await syncTaskCare(tx, taskId)
    }, { isolationLevel: 'Serializable' })
  } catch (err) {
    console.error('[setTaskStatus] Prisma error:', err)
    return { success: false, error: 'Failed to update task status. Please try again.' }
  }

  revalidateCare(orgSlug)
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
