import { prisma } from '@/lib/prisma'
import { WORKED_RECORD_SELECT } from '@/lib/personal-record-queries'
import type { HiddenOrgSummary } from '@/lib/public-record'

/** The owner of a public record, or null when there is none or it isn't public. Never exposes email. */
export async function findPublicOwner(username: string) {
  return prisma.user.findFirst({
    where: { username, recordPublic: true },
    select: { id: true, name: true, username: true, avatarUrl: true, recordShowNotes: true },
  })
}

/** Records from organisations that allow it, plus a count per organisation that doesn't. */
export async function getPublicRecordList(userId: string) {
  const [records, hiddenRows] = await Promise.all([
    prisma.workRecord.findMany({
      where: { userId, organisation: { recordsPublic: true } },
      orderBy: [{ firstWorkedDate: 'desc' }, { recordNumber: 'desc' }],
      select: {
        id: true,
        recordNumber: true,
        firstWorkedDate: true,
        scientificName: true,
        nameHtml: true,
        authority: true,
        family: true,
        site: true,
        organisation: { select: { name: true } },
        specimen: { select: { imageUrl: true, species: { select: { photoUrl: true } } } },
      },
    }),
    prisma.workRecord.groupBy({
      by: ['organisationId'],
      where: { userId, organisation: { recordsPublic: false } },
      _count: { _all: true },
    }),
  ])

  const hiddenOrgs = hiddenRows.length
    ? await prisma.organisation.findMany({
        where: { id: { in: hiddenRows.map((r) => r.organisationId) } },
        select: { id: true, name: true, privateRecordsShowName: true },
      })
    : []
  const hidden: HiddenOrgSummary[] = hiddenRows.map((row) => {
    const org = hiddenOrgs.find((o) => o.id === row.organisationId)
    return { name: org?.privateRecordsShowName ? org.name : null, count: row._count._all }
  })

  return { records, hidden }
}

/** One public record, or null if it doesn't exist or its organisation keeps it private. */
export async function findPublicRecord(userId: string, recordNumber: number) {
  return prisma.workRecord.findFirst({
    where: { userId, recordNumber, organisation: { recordsPublic: true } },
    select: WORKED_RECORD_SELECT,
  })
}
