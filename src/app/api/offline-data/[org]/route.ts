import { NextResponse } from 'next/server'
import { canManageOrg, checkOrgAccess } from '@/lib/auth/permissions'
import { buildOrgSnapshot } from '@/lib/offline/snapshot'
import type { NextRequest } from 'next/server'

/** The signed-in member's offline copy of an organisation. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ org: string }> }) {
  const { org: orgSlug } = await params
  const access = await checkOrgAccess(orgSlug, 'can_view_org')
  if (!access.allowed) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const snapshot = await buildOrgSnapshot(
      orgSlug,
      { id: access.user.id, name: access.user.name },
      canManageOrg(access.user, orgSlug),
    )
    if (!snapshot) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[offline-data] Failed to build snapshot:', err)
    return NextResponse.json({ error: 'Could not build the offline copy' }, { status: 500 })
  }
}
