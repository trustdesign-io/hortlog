import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { apiUser } from '@/lib/api-keys'
import { claudeScenes, editableOrgIds } from '@/lib/claude-api'
import { applyOps } from '@/lib/offline/apply'
import { newDeviceId, newOpId, opTime, type SyncOpInput } from '@/lib/offline/ops'
import { planPhotoPlants } from '@/lib/photo-layout'
import { prisma } from '@/lib/prisma'

const NO_STORE = { 'Cache-Control': 'no-store' }

interface RouteParams {
  params: Promise<{ sceneId: string }>
}

/**
 * Adds plants seen on a scene's bed photo, each with its dot. All or nothing:
 * a 422 lists what to fix.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  const user = await apiUser(req)
  if (!user) return NextResponse.json({ error: 'Send a hortlog key: Authorization: Bearer hk_…' }, { status: 401, headers: NO_STORE })
  const { sceneId } = await params

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisationId: { in: editableOrgIds(user) } },
    select: { id: true, organisation: { select: { slug: true } } },
  })
  if (!scene) return NextResponse.json({ error: 'No such scene, or you can’t edit it.' }, { status: 404, headers: NO_STORE })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Send the plants as JSON.' }, { status: 400, headers: NO_STORE })
  }
  const result = planPhotoPlants(body)
  if (!result.ok) return NextResponse.json({ error: 'Nothing was added.', problems: result.errors }, { status: 422, headers: NO_STORE })

  // Plants go through the same path as ones added in the app, so typed names are looked up the same way
  const org = scene.organisation.slug
  const ops: SyncOpInput[] = result.plants.flatMap((p) => {
    const specimenId = newDeviceId()
    return [
      {
        kind: 'createSpecimen',
        id: newOpId(),
        org,
        createdAt: opTime(),
        specimenId,
        speciesId: null,
        fieldName: p.name,
        accessionNumber: null,
        notes: ['Added from the bed photo.', p.note].filter(Boolean).join(' '),
      },
      { kind: 'placeOnPhoto', id: newOpId(), org, createdAt: opTime(), sceneId: scene.id, specimenId, x: p.x, y: p.y },
    ] satisfies SyncOpInput[]
  })
  const results = await applyOps(user, ops)
  const refused = results.filter((r) => r.status === 'rejected')
  const createIds = new Set(ops.filter((o) => o.kind === 'createSpecimen').map((o) => o.id))
  const added = results.filter((r) => createIds.has(r.id) && r.status !== 'rejected').length
  await prisma.scene.update({ where: { id: scene.id }, data: { photoMappedAt: new Date() } })

  revalidatePath(`/${org}`, 'layout')
  const [updated] = await claudeScenes(user, new URL(req.url).origin, { sceneId: scene.id })
  return NextResponse.json({ ok: refused.length === 0, added, refused, scene: updated }, { headers: NO_STORE })
}
