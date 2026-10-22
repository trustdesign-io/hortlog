import { prisma } from '@/lib/prisma'
import { fetchOpenData, wcvpFields } from '@/lib/open-data'

const BATCH_SIZE = 20
const REFRESH_INTERVAL_DAYS = 25

export interface RefreshResult {
  total: number
  updated: number
  failed: number
}

/**
 * Re-fetches open data (conservation status, range, habitat…) for species.
 * `all`: every species; otherwise those never fetched or not fetched in 25 days.
 */
export async function refreshOpenData({ all = false }: { all?: boolean } = {}): Promise<RefreshResult> {
  const backfill = all
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - REFRESH_INTERVAL_DAYS)

  const species = await prisma.species.findMany({
    where: backfill ? {} : {
      OR: [
        { openDataUpdatedAt: null },
        { openDataUpdatedAt: { lt: cutoff } },
        // Names not yet checked against Kew's checklist
        { wcvpCheckedAt: null },
      ],
    },
    select: { id: true, scientificName: true, ipniId: true, authority: true },
    orderBy: { createdAt: 'asc' },
  })

  let updated = 0
  let failed = 0

  for (let i = 0; i < species.length; i += BATCH_SIZE) {
    const batch = species.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (s) => {
        try {
          const data = await fetchOpenData({ scientificName: s.scientificName, ipniId: s.ipniId, authority: s.authority })
          await prisma.species.update({
            where: { id: s.id },
            data: {
              statusCategory: data.statusCategory,
              statusSource: data.statusSource,
              statusUpdatedAt: data.statusUpdatedAt,
              nativeRegions: data.nativeRegions,
              introducedRegions: data.introducedRegions,
              lifeForm: data.lifeForm,
              climate: data.climate,
              habitatExcerpt: data.habitatExcerpt,
              habitatExcerptSource: data.habitatExcerptSource,
              gbifTaxonKey: data.gbifTaxonKey,
              openDataUpdatedAt: data.openDataUpdatedAt,
              ...wcvpFields(data.wcvp),
            },
          })
          updated++
        } catch {
          failed++
        }
      }),
    )
  }

  return { total: species.length, updated, failed }
}
