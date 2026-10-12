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
    take: 5000,
  })

  type Update = {
    id: string
    L: number
    F: number
    R: number
    N: number
    S: number
  }

  const updates: Update[] = []
  let skipped = 0

  for (const s of species) {
    const values = lookupEllenberg(s.scientificName)
    if (!values) { skipped++; continue }
    updates.push({ id: s.id, ...values })
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map(({ id, L, F, R, N, S }) =>
        prisma.species.update({
          where: { id },
          data: {
            ellenbergL: L,
            ellenbergF: F,
            ellenbergR: R,
            ellenbergN: N,
            ellenbergS: S,
            ellenbergSource: ELLENBERG_SOURCE,
          },
        }),
      ),
    )
  }

  return NextResponse.json({
    processed: species.length,
    updated: updates.length,
    skipped,
  })
}
