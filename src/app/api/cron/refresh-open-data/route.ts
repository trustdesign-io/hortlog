/**
 * Monthly cron job: re-fetches open-data for every species.
 * Secured by CRON_SECRET; configure in Vercel cron jobs as a monthly schedule.
 * Also handles the one-time backfill (same logic, no minimum age filter).
 *
 * POST /api/cron/refresh-open-data?backfill=1  → process all species regardless of age
 * POST /api/cron/refresh-open-data             → process species not refreshed in the last 25 days
 */

import { type NextRequest, NextResponse } from 'next/server'
import { refreshOpenData } from '@/lib/open-data/refresh'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('Authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const backfill = req.nextUrl.searchParams.get('backfill') === '1'
  return NextResponse.json(await refreshOpenData({ all: backfill }))
}
