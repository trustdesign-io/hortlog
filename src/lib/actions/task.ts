'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import type { ActionResult } from '@trustdesign/shared/types'

async function getOrg(orgSlug: string) {
  return prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
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

  const assigneeId = (formData.get('assigneeId') as string | null)?.trim() || null

  const org = await getOrg(orgSlug)
  if (!org) return { success: false, error: 'Organisation not found.' }

  if (assigneeId) {
    const member = await prisma.membership.findFirst({
      where: { userId: assigneeId, organisationId: org.id },
      select: { id: true },
    })
    if (!member) return { success: false, error: 'Assignee is not a member of this organisation.' }
  }

  try {
    await prisma.task.create({
      data: {
        title,
        description,
        dueDate,
        assigneeId,
        organisationId: org.id,
        createdById: user.id,
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
  await requireOrgAccess(orgSlug, 'can_manage_members')

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  if (!title) return { success: false, error: 'Title is required.' }

  const description = (formData.get('description') as string | null)?.trim() || null
  const dueDateRaw = (formData.get('dueDate') as string | null)?.trim() || null
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null
  if (dueDate && isNaN(dueDate.getTime())) return { success: false, error: 'Invalid due date.' }

  const assigneeId = (formData.get('assigneeId') as string | null)?.trim() || null

  const org = await getOrg(orgSlug)
  if (!org) return { success: false, error: 'Organisation not found.' }

  const task = await prisma.task.findUnique({
    where: { id: taskId, organisationId: org.id },
    select: { id: true },
  })
  if (!task) return { success: false, error: 'Task not found.' }

  if (assigneeId) {
    const member = await prisma.membership.findFirst({
      where: { userId: assigneeId, organisationId: org.id },
      select: { id: true },
    })
    if (!member) return { success: false, error: 'Assignee is not a member of this organisation.' }
  }

  try {
    await prisma.task.update({
      where: { id: taskId, organisationId: org.id },
      data: { title, description, dueDate, assigneeId },
    })
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
