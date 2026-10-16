import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { hasCapability } from '@/lib/auth/capabilities'
import { prisma } from '@/lib/prisma'
import { MAX_SCENE_PHOTO_BYTES, SCENE_PHOTO_TYPES, saveScenePhoto, scenePhotoUrl } from '@/lib/scene-photo'

const NO_STORE = { 'Cache-Control': 'no-store' }

interface RouteParams {
  params: Promise<{ org: string; sceneId: string }>
}

/** The scene, if the signed-in member may edit it */
async function editableScene(orgSlug: string, sceneId: string): Promise<{ orgId: string; sceneId: string } | 'signed-out' | null> {
  const user = await getCurrentUser()
  if (!user) return 'signed-out'
  const membership = user.memberships.find((m) => m.organisation.slug === orgSlug)
  if (!user.isAdmin && !(membership && hasCapability(membership.role, 'can_edit_scene'))) return null
  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, organisation: { slug: orgSlug } },
    select: { id: true, organisationId: true },
  })
  return scene ? { orgId: scene.organisationId, sceneId: scene.id } : null
}

/** Redirects to the scene's bed photo; 404 if it has none. */
export async function GET(_req: Request, { params }: RouteParams) {
  const { org, sceneId } = await params
  const scene = await editableScene(org, sceneId)
  if (scene === 'signed-out') return NextResponse.json({ error: 'Sign in to see this photo.' }, { status: 401, headers: NO_STORE })
  if (!scene) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: NO_STORE })
  const url = await scenePhotoUrl(scene.orgId, scene.sceneId)
  if (!url) return NextResponse.json({ error: 'No photo yet.' }, { status: 404, headers: NO_STORE })
  return NextResponse.redirect(url, { status: 302, headers: NO_STORE })
}

/** Saves a new bed photo (the image as the request body), replacing any before it. */
export async function PUT(req: Request, { params }: RouteParams) {
  const { org, sceneId } = await params
  const scene = await editableScene(org, sceneId)
  if (scene === 'signed-out') return NextResponse.json({ error: 'Sign in to send this photo.' }, { status: 401, headers: NO_STORE })
  if (!scene) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: NO_STORE })

  const type = (req.headers.get('content-type') ?? '').split(';')[0].trim()
  if (!(SCENE_PHOTO_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: 'The photo must be a JPEG, PNG or WebP image.' }, { status: 415, headers: NO_STORE })
  }
  const bytes = await req.arrayBuffer()
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_SCENE_PHOTO_BYTES) {
    return NextResponse.json({ error: 'The photo must be 4 MB or smaller.' }, { status: 413, headers: NO_STORE })
  }
  try {
    await saveScenePhoto(scene.orgId, scene.sceneId, bytes, type)
  } catch {
    return NextResponse.json({ error: 'The photo couldn’t be saved. Try again.' }, { status: 500, headers: NO_STORE })
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}
