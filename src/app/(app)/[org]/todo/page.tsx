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

  const [tasks, orgMembers, specimens, scenes] = await Promise.all([
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
        cells: true,
        careSpecimenIds: true,
        specimen: { select: { id: true, slug: true, species: { select: { commonName: true } } } },
        scene: { select: { id: true, name: true, _count: { select: { specimens: true } } } },
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
    // Only scenes with plants placed can be a task's target
    canManage
      ? prisma.scene.findMany({
          where: { organisationId: org.id, specimens: { some: { gridCell: { not: null } } } },
          select: {
            id: true,
            name: true,
            gridRows: true,
            gridCols: true,
            specimens: {
              where: { gridCell: { not: null }, zoneId: null },
              select: { id: true, gridCell: true, species: { select: { commonName: true } } },
            },
            zones: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                name: true,
                type: true,
                rows: true,
                cols: true,
                specimens: {
                  where: { gridCell: { not: null } },
                  select: { id: true, gridCell: true, species: { select: { commonName: true } } },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])

  return (
    <TaskList
      orgSlug={orgSlug}
      canManage={canManage}
      tasks={tasks.map(({ careSpecimenIds, ...t }) => ({
        ...t,
        dueDate: t.dueDate?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        assignees: t.assignees.map((a) => a.user),
        specimen: t.specimen
          ? { id: t.specimen.id, slug: t.specimen.slug, name: t.specimen.species.commonName }
          : null,
        scene: t.scene
          ? {
              id: t.scene.id,
              name: t.scene.name,
              // Done tasks report the plants care was logged on; open ones what's there now
              plantCount: t.status === 'DONE' && careSpecimenIds.length ? careSpecimenIds.length : t.cells.length || t.scene._count.specimens,
            }
          : null,
      }))}
      scenes={scenes.map((sc) => ({
        id: sc.id,
        name: sc.name,
        gridRows: sc.gridRows,
        gridCols: sc.gridCols,
        plants: sc.specimens.map((sp) => ({ id: sp.id, cell: sp.gridCell!, name: sp.species.commonName })),
        zones: sc.zones.map((z) => ({
          id: z.id,
          name: z.name,
          type: z.type,
          rows: z.rows,
          cols: z.cols,
          plants: z.specimens.map((sp) => ({ id: sp.id, cell: sp.gridCell!, name: sp.species.commonName })),
        })),
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
