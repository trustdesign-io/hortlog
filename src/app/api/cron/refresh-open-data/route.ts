/**
 * Monthly cron job: re-fetches open-data for every species.
 * Secured by CRON_SECRET; configure in Vercel cron jobs as a monthly schedule.
 * Also handles the one-time backfill (same logic, no minimum age filter).
 *
 * POST /api/cron/refresh-open-data?backfill=1  → process all species regardless of age
 * POST /api/cron/refresh-open-data             → process species not refreshed in the last 25 days
 */

import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchOpenData } from '@/lib/open-data'

const BATCH_SIZE = 20
const REFRESH_INTERVAL_DAYS = 25

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('Authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const backfill = req.nextUrl.searchParams.get('backfill') === '1'
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - REFRESH_INTERVAL_DAYS)

  const species = await prisma.species.findMany({
    where: backfill ? {} : {
      OR: [
        { openDataUpdatedAt: null },
        { openDataUpdatedAt: { lt: cutoff } },
      ],
    },
    select: { id: true, scientificName: true, ipniId: true },
    orderBy: { createdAt: 'asc' },
  })

  let updated = 0
  let failed = 0

  for (let i = 0; i < species.length; i += BATCH_SIZE) {
    const batch = species.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (s) => {
        try {
          const data = await fetchOpenData({ scientificName: s.scientificName, ipniId: s.ipniId })
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
            },
          })
          updated++
        } catch {
          failed++
        }
      }),
    )
  }

  return NextResponse.json({ total: species.length, updated, failed })
}
