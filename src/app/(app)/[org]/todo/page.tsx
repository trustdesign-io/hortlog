import { notFound } from 'next/navigation'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { TaskList } from './task-list'

interface TodoPageProps {
  params: Promise<{ org: string }>
}

export default async function TodoPage({ params }: TodoPageProps) {
  const { org: orgSlug } = await params
  const { user } = await requireOrgAccess(orgSlug, 'can_view_org')

  const org = await prisma.organisation.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })
  if (!org) return notFound()

  const canManage = canManageOrg(user, orgSlug)

  const [tasks, orgMembers, specimens] = await Promise.all([
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
        careAction: true,
        specimen: { select: { id: true, slug: true, species: { select: { commonName: true } } } },
        assignees: {
          select: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    }),
    canManage
      ? prisma.membership.findMany({
          where: { organisationId: org.id },
          select: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { user: { name: 'asc' } },
        })
      : Promise.resolve([]),
    canManage
      ? prisma.specimen.findMany({
          where: { organisationId: org.id },
          select: { id: true, accessionNumber: true, species: { select: { commonName: true, scientificName: true } } },
          orderBy: { species: { commonName: 'asc' } },
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
        assignees: t.assignees.map((a) => a.user),
        specimen: t.specimen
          ? { id: t.specimen.id, slug: t.specimen.slug, name: t.specimen.species.commonName }
          : null,
      }))}
      orgMembers={orgMembers.map((m) => m.user)}
      plants={specimens.map((sp) => ({
        id: sp.id,
        label: [sp.species.commonName, sp.accessionNumber].filter(Boolean).join(' · '),
        scientificName: sp.species.scientificName,
      }))}
    />
  )
}
