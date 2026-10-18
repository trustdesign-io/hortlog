import { NextResponse } from 'next/server'
import { apiUser } from '@/lib/api-keys'
import { refreshOpenData } from '@/lib/open-data/refresh'

const NO_STORE = { 'Cache-Control': 'no-store' }

// Up to a few minutes for a full catch-up
export const maxDuration = 300

/**
 * Platform admins only: fetch open data (conservation status, range…) for
 * species never fetched or not fetched in 25 days; `?all=1` for every species.
 */
export async function POST(req: Request) {
  const user = await apiUser(req)
  if (!user) return NextResponse.json({ error: 'Send a hortlog key: Authorization: Bearer hk_…' }, { status: 401, headers: NO_STORE })
  if (!user.isAdmin) return NextResponse.json({ error: 'Only platform admins can do this.' }, { status: 403, headers: NO_STORE })
  const all = new URL(req.url).searchParams.get('all') === '1'
  return NextResponse.json(await refreshOpenData({ all }), { headers: NO_STORE })
}
