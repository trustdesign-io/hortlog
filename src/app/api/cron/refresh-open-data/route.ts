/**
 * Daily cron job: re-fetches open data for species not refreshed in 25 days (so each about monthly).
 * Secured by CRON_SECRET (set in Vercel); scheduled in vercel.json, 03:17 UTC daily.
 * Also handles the one-time backfill (same logic, no minimum age filter).
 *
 * POST /api/cron/refresh-open-data?backfill=1  → process all species regardless of age
 * POST /api/cron/refresh-open-data             → process species not refreshed in the last 25 days
 */

import { type NextRequest, NextResponse } from 'next/server'
import { refreshOpenData } from '@/lib/open-data/refresh'

// Vercel Cron calls with GET (daily: only species not refreshed in 25 days are fetched)
export async function GET(req: NextRequest): Promise<NextResponse> {
  return POST(req)
}

export const maxDuration = 300

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('Authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const backfill = req.nextUrl.searchParams.get('backfill') === '1'
  return NextResponse.json(await refreshOpenData({ all: backfill }))
}
