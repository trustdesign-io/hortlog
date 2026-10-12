import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lookupEllenberg, ELLENBERG_SOURCE } from '@/lib/ellenberg'

/**
 * POST /api/cron/backfill-ellenberg
 *
 * One-off (and re-runnable) backfill that sets British Ellenberg indicator
 * values on species records that don't have them yet.
 *
 * Authentication: Bearer token matching CRON_SECRET env var.
 * Query params:
 *   ?force=1   — overwrite existing values (default: skip species that already have them)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('Authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const force = req.nextUrl.searchParams.get('force') === '1'

  const species = await prisma.species.findMany({
    where: force ? undefined : { ellenbergL: null },
    select: { id: true, scientificName: true },
  })

  let updated = 0
  let skipped = 0

  for (const s of species) {
    const values = lookupEllenberg(s.scientificName)
    if (!values) { skipped++; continue }

    await prisma.species.update({
      where: { id: s.id },
      data: {
        ellenbergL: values.L,
        ellenbergF: values.F,
        ellenbergR: values.R,
        ellenbergN: values.N,
        ellenbergS: values.S,
        ellenbergSource: ELLENBERG_SOURCE,
      },
    })
    updated++
  }

  return NextResponse.json({
    processed: species.length,
    updated,
    skipped,
  })
}
