import { prisma } from '@/lib/prisma'
import { SNAPSHOT_VERSION, type OrgSnapshot } from './types'

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null)

/** How far back finished tasks are included, so the copy stays small. */
const DONE_TASK_DAYS = 30

/** Everything a member needs to use an organisation's pages offline. Server-only. */
export async function buildOrgSnapshot(
  orgSlug: string,
  user: { id: string; name: string | null },
  canManage: boolean,
): Promise<OrgSnapshot | null> {
  const org = await prisma.organisation.findUnique({ where: { slug: orgSlug }, select: { id: true, slug: true, name: true } })
  if (!org) return null

  const doneSince = new Date(Date.now() - DONE_TASK_DAYS * 86_400_000)
  const [specimens, scenes, collections, tasks, records, speciesList] = await Promise.all([
    prisma.specimen.findMany({
      where: { organisationId: org.id },
      orderBy: { species: { commonName: 'asc' } },
      select: {
        id: true,
        slug: true,
        cultivar: true,
        accessionNumber: true,
        notes: true,
        imageUrl: true,
        sceneId: true,
        gridCell: true,
        collections: { select: { collectionId: true } },
        species: {
          select: {
            commonName: true,
            scientificName: true,
            authority: true,
            family: true,
            origin: true,
            description: true,
            photoUrl: true,
            statusCategory: true,
            conservationStatus: true,
          },
        },
      },
    }),
    // Managers keep inactive scenes too: they set them up on site
    prisma.scene.findMany({
      where: { organisationId: org.id, ...(canManage ? {} : { active: true }) },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        shortCode: true,
        gridRows: true,
        gridCols: true,
        rowShift: true,
        splitCells: true,
        title: true,
        active: true,
        perspective: true,
        primaryCollectionId: true,
      },
    }),
    prisma.collection.findMany({
      where: { organisationId: org.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, description: true, type: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: { organisationId: org.id, OR: [{ status: 'OPEN' }, { completedAt: { gte: doneSince } }] },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        dueDate: true,
        completedAt: true,
        careAction: true,
        specimenId: true,
        sceneId: true,
        cells: true,
        assignees: { select: { user: { select: { name: true, email: true } } } },
      },
    }),
    prisma.workRecord.findMany({
      where: { userId: user.id, specimen: { organisationId: org.id } },
      orderBy: { recordNumber: 'asc' },
      select: {
        id: true,
        recordNumber: true,
        specimenId: true,
        scientificName: true,
        firstWorkedDate: true,
        logEntries: {
          orderBy: { date: 'desc' },
          select: { id: true, date: true, action: true, actionNote: true, location: true, text: true },
        },
      },
    }),
    // Species to name new plants by when adding them offline
    canManage
      ? prisma.species.findMany({ select: { id: true, scientificName: true, commonName: true }, orderBy: { scientificName: 'asc' } })
      : Promise.resolve(undefined),
  ])

  return {
    version: SNAPSHOT_VERSION,
    syncedAt: new Date().toISOString(),
    user: { id: user.id, name: user.name, canManage },
    org,
    specimens: specimens.map((s) => ({
      id: s.id,
      slug: s.slug,
      cultivar: s.cultivar,
      accessionNumber: s.accessionNumber,
      notes: s.notes,
      imageUrl: s.imageUrl,
      sceneId: s.sceneId,
      gridCell: s.gridCell,
      collectionIds: s.collections.map((c) => c.collectionId),
      species: {
        commonName: s.species.commonName,
        scientificName: s.species.scientificName,
        authority: s.species.authority,
        family: s.species.family,
        origin: s.species.origin,
        description: s.species.description,
        photoUrl: s.species.photoUrl,
        status: s.species.statusCategory ?? s.species.conservationStatus,
      },
    })),
    scenes,
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      typeName: c.type?.name ?? null,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      dueDate: iso(t.dueDate),
      completedAt: iso(t.completedAt),
      careAction: t.careAction,
      specimenId: t.specimenId,
      sceneId: t.sceneId,
      cells: t.cells,
      assignees: t.assignees.map((a) => a.user.name ?? a.user.email),
    })),
    myRecords: records.map((r) => ({
      id: r.id,
      recordNumber: r.recordNumber,
      specimenId: r.specimenId,
      scientificName: r.scientificName,
      firstWorkedDate: r.firstWorkedDate.toISOString(),
      entries: r.logEntries.map((e) => ({ ...e, date: e.date.toISOString() })),
    })),
    speciesList,
  }
}
