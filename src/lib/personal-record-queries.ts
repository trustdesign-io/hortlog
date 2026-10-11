import { prisma } from '@/lib/prisma'
import type { ReferencePhotoData } from '@/components/records/reference-photo'

/** Everything a worked-with record sheet shows. */
export const WORKED_RECORD_SELECT = {
  id: true,
  recordNumber: true,
  firstWorkedDate: true,
  scientificName: true,
  nameHtml: true,
  authority: true,
  family: true,
  site: true,
  location: true,
  viceCounty: true,
  gridRef: true,
  projects: true,
  determination: true,
  labelText: true,
  note: true,
  commonNames: true,
  nativeRange: true,
  habit: true,
  provenance: true,
  diagnostic: true,
  nearMisses: true,
  workDone: true,
  observed: true,
  howStudied: true,
  sources: true,
  openQuestions: true,
  powoUrl: true,
  shareToken: true,
  userId: true,
  organisation: { select: { slug: true, name: true } },
  specimen: {
    select: {
      slug: true,
      species: {
        select: {
          commonName: true,
          powoUrl: true,
          photoUrl: true,
          photoAttribution: true,
          photoLicence: true,
          photoSourceUrl: true,
        },
      },
    },
  },
  logEntries: {
    orderBy: { date: 'asc' as const },
    select: {
      id: true,
      date: true,
      action: true,
      actionNote: true,
      location: true,
      site: true,
      text: true,
    },
  },
} as const

export interface DayRef {
  recordNumber: number
  date: Date
  site: string
  capacity: 'VOLUNTEER' | 'CONTRACT' | 'OWN'
  organisationName: string | null
}

const DAY_REF_SELECT = {
  recordNumber: true,
  date: true,
  site: true,
  capacity: true,
  organisationName: true,
} as const

/** The work day a plant was recorded on: same member, same date, same site. */
export async function findDayFor(
  userId: string,
  date: Date,
  site: string | null,
): Promise<DayRef | null> {
  if (!site) return null
  return prisma.workDay.findFirst({ where: { userId, date, site }, select: DAY_REF_SELECT })
}

/** Work days for a set of (date, site) pairs, keyed "YYYY-MM-DD|site". */
export async function findDaysFor(
  userId: string,
  pairs: { date: Date; site: string | null }[],
): Promise<Map<string, DayRef>> {
  const wanted = pairs.filter((p): p is { date: Date; site: string } => p.site !== null)
  if (wanted.length === 0) return new Map()
  const days = await prisma.workDay.findMany({
    where: { userId, OR: wanted.map((p) => ({ date: p.date, site: p.site })) },
    select: DAY_REF_SELECT,
  })
  return new Map(days.map((d) => [`${d.date.toISOString().slice(0, 10)}|${d.site}`, d]))
}

/** The reference photo for a species, looked up by its scientific name. */
export async function findSpeciesPhoto(scientificName: string): Promise<ReferencePhotoData | null> {
  return prisma.species.findFirst({
    where: { scientificName, photoUrl: { not: null } },
    select: { photoUrl: true, photoAttribution: true, photoLicence: true, photoSourceUrl: true },
  })
}
