import { NextResponse } from 'next/server'
import { apiUser } from '@/lib/api-keys'
import { CLAUDE_GUIDE, claudeScenes } from '@/lib/claude-api'

const NO_STORE = { 'Cache-Control': 'no-store' }

/** Scenes with bed photos waiting to be laid out (all with ?all=1), with instructions for Claude. */
export async function GET(req: Request) {
  const user = await apiUser(req)
  if (!user) {
    return NextResponse.json(
      { error: 'Send a hortlog key: Authorization: Bearer hk_… (make one in hortlog under Settings → Keys for Claude).' },
      { status: 401, headers: NO_STORE },
    )
  }
  const url = new URL(req.url)
  const scenes = await claudeScenes(user, url.origin, { all: url.searchParams.get('all') === '1' })
  return NextResponse.json({ guide: CLAUDE_GUIDE, scenes }, { headers: NO_STORE })
}
