'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { invitedAssignees } from '@/lib/invited-assignees'
import { MAX_DEPARTMENT_NAME } from '@/lib/departments'
import type { ActionResult } from '@/lib/shared/types'

function refresh(orgSlug: string): void {
  revalidatePath(`/${orgSlug}/settings`)
  revalidatePath(`/${orgSlug}/team`)
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, MAX_DEPARTMENT_NAME)
}

async function orgId(orgSlug: string): Promise<string | null> {
  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true } })
  return org?.id ?? null
}

function isTaken(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

/** Add a department to a garden. Directors and managers only. */
export async function createDepartment(orgSlug: string, name: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')
  const clean = cleanName(name)
  if (!clean) return { success: false, error: 'Give the department a name.' }
  const organisationId = await orgId(orgSlug)
  if (!organisationId) return { success: false, error: 'That garden couldn’t be found.' }

  try {
    await prisma.department.create({ data: { organisationId, name: clean } })
  } catch (err) {
    if (isTaken(err)) return { success: false, error: `There’s already a department called ${clean}.` }
    console.error('[createDepartment] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
  refresh(orgSlug)
  return { success: true }
}

/**
 * Save a department's name, its people and which of them manage it. Anyone
 * made a manager is in it too. People must be members of the garden, or
 * invited to it.
 */
export async function saveDepartment(
  orgSlug: string,
  departmentId: string,
  input: { name: string; memberIds: string[]; managerIds: string[] },
): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')
  const clean = cleanName(input.name)
  if (!clean) return { success: false, error: 'Give the department a name.' }

  const department = await prisma.department.findFirst({
    where: { id: departmentId, organisation: { slug: orgSlug } },
    select: { id: true, organisationId: true },
  })
  if (!department) return { success: false, error: 'That department has been deleted.' }

  const managers = new Set(input.managerIds)
  const people = [...new Set([...input.memberIds, ...input.managerIds])]

  const members = await prisma.membership.findMany({
    where: { organisationId: department.organisationId, userId: { in: people } },
    select: { userId: true },
  })
  const allowed = new Set(members.map((m) => m.userId))
  const rest = people.filter((id) => !allowed.has(id))
  if (rest.length > 0) {
    const invited = await invitedAssignees(orgSlug, rest).catch(() => new Set<string>())
    for (const id of invited) allowed.add(id)
  }
  if (people.some((id) => !allowed.has(id))) {
    return { success: false, error: 'Everyone in a department must be a member of this garden, or invited to it.' }
  }

  try {
    await prisma.$transaction([
      prisma.department.update({ where: { id: department.id }, data: { name: clean } }),
      prisma.departmentMember.deleteMany({ where: { departmentId: department.id, userId: { notIn: people } } }),
      ...people.map((userId) =>
        prisma.departmentMember.upsert({
          where: { departmentId_userId: { departmentId: department.id, userId } },
          create: { departmentId: department.id, userId, isManager: managers.has(userId) },
          update: { isManager: managers.has(userId) },
        }),
      ),
    ])
  } catch (err) {
    if (isTaken(err)) return { success: false, error: `There’s already a department called ${clean}.` }
    console.error('[saveDepartment] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
  refresh(orgSlug)
  return { success: true }
}

/** Remove a department. Its people stay in the garden. */
export async function deleteDepartment(orgSlug: string, departmentId: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_org_settings')
  try {
    await prisma.department.deleteMany({ where: { id: departmentId, organisation: { slug: orgSlug } } })
  } catch (err) {
    console.error('[deleteDepartment] error:', err)
    return { success: false, error: 'That couldn’t be deleted. Try again.' }
  }
  refresh(orgSlug)
  return { success: true }
}
