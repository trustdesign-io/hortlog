import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { buildOrgSnapshot } from '@/lib/offline/snapshot'
import { bedPhotoUrl, type OrgSnapshot } from '@/lib/offline/types'

/** The scene the demo shows: Lullingstone's first mapped bed, for now */
export const DEMO_ORG = 'lullingstone-castle-and-the-world-garden'
export const DEMO_SCENE = 'scene-001'
/** What the demo calls the garden, so the real one isn't named */
export const DEMO_GARDEN_NAME = 'Demo Garden'
/** The demo's own visitor view, so "See what visitors see" doesn't open the real garden's page */
export const DEMO_VISIT_PATH = '/demo/visit'

/**
 * The real scene, read live, cut down to what the demo needs: just this
 * scene and its plants, with none of the garden's to-dos or members' records.
 */
export const loadDemo = cache(async function loadDemo() {
  const scene = await prisma.scene.findFirst({
    where: { slug: DEMO_SCENE, organisation: { slug: DEMO_ORG }, active: true, photoTakenAt: { not: null } },
    select: {
      id: true,
      name: true,
      title: true,
      slug: true,
      shortCode: true,
      active: true,
      perspective: true,
      locationId: true,
      photoTakenAt: true,
      organisationId: true,
      primaryCollection: { select: { id: true, name: true, slug: true } },
      _count: { select: { specimens: true } },
    },
  })
  if (!scene || !scene.photoTakenAt) return null

  const full = await buildOrgSnapshot(DEMO_ORG, { id: 'demo', name: 'Demo' }, true)
  if (!full) return null
  const snap: OrgSnapshot = {
    ...full,
    org: { ...full.org, name: DEMO_GARDEN_NAME },
    user: { id: 'demo', name: 'Demo', canManage: true },
    specimens: full.specimens.filter((s) => s.sceneId === scene.id),
    scenes: full.scenes.filter((s) => s.id === scene.id),
    collections: [],
    tasks: [],
    myRecords: [],
    speciesList: [],
  }

  const locations = await prisma.location.findMany({
    where: { organisationId: scene.organisationId },
    select: { id: true, name: true, parentId: true },
  })

  return {
    snap,
    scene,
    locations,
    photoUrl: bedPhotoUrl(DEMO_ORG, scene.id, scene.photoTakenAt.toISOString()),
    publicPath: DEMO_VISIT_PATH,
  }
})
