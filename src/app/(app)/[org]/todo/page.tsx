import { notFound } from 'next/navigation'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { TaskList } from './task-list'

interface TodoPageProps {
  params: Promise<{ org: string }>
}

export default async function TodoPage({ params }: TodoPageProps) {
  const { org: orgSlug } = await params
  // can_edit_specimen is the minimum capability held by every org member (MANAGER + MEMBER).
  // All members can view tasks; canManage below determines who sees mutation controls.
  const { user } = await requireOrgAccess(orgSlug, 'can_edit_specimen')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const membership = user.memberships.find((m) => m.organisation.slug === orgSlug)
  const canManage = user.isAdmin || membership?.role === 'MANAGER'

  const [tasks, orgMembers] = await Promise.all([
    prisma.task.findMany({
      where: { organisationId: org.id },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        status: true,
        createdAt: true,
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    }),
    canManage
      ? prisma.membership.findMany({
          where: { organisationId: org.id },
          select: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { user: { name: 'asc' } },
        })
      : Promise.resolve([]),
  ])

  return (
    <TaskList
      orgSlug={orgSlug}
      canManage={canManage}
      tasks={tasks.map((t) => ({
        ...t,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      }))}
      orgMembers={orgMembers.map((m) => m.user)}
    />
  )
}
