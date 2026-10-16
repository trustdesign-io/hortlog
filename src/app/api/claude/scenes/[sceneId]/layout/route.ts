import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { apiUser } from '@/lib/api-keys'
import { claudeScenes, editableOrgIds, plantName } from '@/lib/claude-api'
import { applyOps } from '@/lib/offline/apply'
import { newDeviceId, newOpId, type SyncOpInput } from '@/lib/offline/ops'
import { planPhotoLayout } from '@/lib/photo-layout'
import { prisma } from '@/lib/prisma'

const NO_STORE = { 'Cache-Control': 'no-store' }

interface RouteParams {
  params: Promise<{ sceneId: string }>
}

/**
 * Lays a scene out from its bed photo: grid size, the bed's shape, and the
 * plants seen. All or nothing: a 422 lists what to fix.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  const user = await apiUser(req)
  if (!user) return NextResponse.json({ error: 'Send a hortlog key: Authorization: Bearer hk_…' }, { status: 401, headers: NO_STORE })
  const { sceneId } = await params

  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisationId: { in: editableOrgIds(user) } },
    select: {
      id: true,
      splitCells: true,
      organisation: { select: { slug: true } },
      specimens: {
        where: { gridCell: { not: null } },
        select: { id: true, gridCell: true, extraCells: true, notes: true, species: { select: { scientificName: true, slug: true } } },
      },
    },
  })
  if (!scene) return NextResponse.json({ error: 'No such scene, or you can’t edit it.' }, { status: 404, headers: NO_STORE })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Send the layout as JSON.' }, { status: 400, headers: NO_STORE })
  }

  const existing = scene.specimens.map((s) => ({
    id: s.id,
    cell: s.gridCell as string,
    extraCells: s.extraCells,
    name: plantName(s.species, s.notes).name,
  }))
  const result = planPhotoLayout(scene, existing, body)
  if (!result.ok) return NextResponse.json({ error: 'The layout wasn’t saved.', problems: result.errors }, { status: 422, headers: NO_STORE })
  const { plan } = result

  await prisma.scene.update({
    where: { id: scene.id },
    data: {
      gridRows: plan.rows,
      gridCols: plan.cols,
      rowShift: plan.rowShift,
      blockedCells: plan.blockedCells,
      splitCells: plan.splitCells,
      photoMappedAt: new Date(),
    },
  })

  // Plants go through the same path as ones added offline, so typed names are looked up the same way
  const org = scene.organisation.slug
  const now = new Date().toISOString()
  const extras: { specimenId: string; extraCells: string[]; photo: [number, number] | null }[] = []
  const ops: SyncOpInput[] = plan.plants.flatMap((p) => {
    const specimenId = newDeviceId()
    extras.push({ specimenId, extraCells: p.extraCells, photo: p.photo })
    return [
      {
        kind: 'createSpecimen',
        id: newOpId(),
        org,
        createdAt: now,
        specimenId,
        speciesId: null,
        fieldName: p.name,
        accessionNumber: null,
        notes: ['Added from the bed photo.', p.note].filter(Boolean).join(' '),
      },
      { kind: 'placeSpecimen', id: newOpId(), org, createdAt: now, sceneId: scene.id, specimenId, row: p.row, col: p.col, sub: p.sub },
    ] satisfies SyncOpInput[]
  })
  const results = ops.length > 0 ? await applyOps(user, ops) : []
  const refused = results.filter((r) => r.status === 'rejected')
  const createIds = new Set(ops.filter((o) => o.kind === 'createSpecimen').map((o) => o.id))
  const added = results.filter((r) => createIds.has(r.id) && r.status !== 'rejected').length

  // Spread and photo spot, for the plants that made it in
  for (const x of extras) {
    if (x.extraCells.length === 0 && !x.photo) continue
    await prisma.specimen
      .updateMany({
        where: { id: x.specimenId, sceneId: scene.id },
        data: { extraCells: x.extraCells, photoX: x.photo?.[0] ?? null, photoY: x.photo?.[1] ?? null },
      })
      .catch(() => {})
  }

  revalidatePath(`/${org}`, 'layout')
  const [updated] = await claudeScenes(user, new URL(req.url).origin, { sceneId: scene.id })
  return NextResponse.json(
    { ok: refused.length === 0, added, refused, scene: updated },
    { headers: NO_STORE },
  )
}
