import { hasCapability } from '@/lib/auth/capabilities'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma'
import { scenePhotoUrl } from '@/lib/scene-photo'
import { MAX_PHOTO_PLANTS } from '@/lib/photo-layout'

/**
 * What /api/claude returns: scenes with bed photos, for Claude on a member's
 * computer to lay out. The `guide` is written for Claude, so the member only
 * has to say "process my hortlog scenes".
 */
export const CLAUDE_GUIDE = `hortlog: marking plants on bed photos.

Each scene below has a photo of a real garden bed (photoUrl, valid for an hour), taken from the front where visitors stand. Visitors tap numbered dots on the photo to find out about each plant. For each scene with needsMapping: true:

1. Look at the photo and find every distinct plant (or clump of one kind).
2. For each, send { "name": "...", "note": "...", "photo": [x, y] }:
   - name: the scientific name only if you're confident (it's looked up in the botanical catalogue automatically); otherwise a short description the member will recognise, e.g. "Tall blue agave". Unmatched names are saved as Unidentified, keeping your name, for the member to name in hortlog.
   - note: where it is and what it looks like, to help the member identify it.
   - photo: where the dot goes, as fractions of the image's width and height (0–1, from the top left). Put it on the body of the plant, not its tip, and keep dots apart so they're easy to tap.
   - Up to ${MAX_PHOTO_PLANTS} plants per request. Skip plants already listed in the scene's "plants" (they have dots already).
3. Send them: PUT plantsUrl with JSON { "plants": [...] } and the same Authorization header. A 422 reply lists what to fix; nothing is added until every plant is valid.

Then tell the member which scenes you marked and how many plants each has, so they can name the amber ones in hortlog. Add ?all=1 to list every scene with a photo, including ones already marked.`

export interface ClaudeScene {
  org: string
  sceneId: string
  name: string
  title: string | null
  needsMapping: boolean
  photoTakenAt: string | null
  photoMappedAt: string | null
  photoUrl: string | null
  plantsUrl: string
  plants: { id: string; name: string; identified: boolean; photo: [number, number] | null }[]
}

/** Organisations where this member can edit scenes */
export function editableOrgIds(user: UserWithMemberships): string[] {
  return user.memberships.filter((m) => user.isAdmin || hasCapability(m.role, 'can_edit_scene')).map((m) => m.organisation.id)
}

/** A placed plant's name: its species, or for unidentified ones the name it was given */
export function plantName(species: { scientificName: string; slug: string }, notes: string | null): { name: string; identified: boolean } {
  if (species.slug !== 'unidentified') return { name: species.scientificName, identified: true }
  const field = notes ? /^Field name: (.+)$/m.exec(notes)?.[1] : undefined
  return { name: field ?? 'Unidentified plant', identified: false }
}

export async function claudeScenes(user: UserWithMemberships, origin: string, { all = false, sceneId }: { all?: boolean; sceneId?: string } = {}): Promise<ClaudeScene[]> {
  const scenes = await prisma.scene.findMany({
    where: { organisationId: { in: editableOrgIds(user) }, photoTakenAt: { not: null }, ...(sceneId ? { id: sceneId } : {}) },
    orderBy: { photoTakenAt: 'desc' },
    select: {
      id: true,
      name: true,
      title: true,
      photoTakenAt: true,
      photoMappedAt: true,
      organisationId: true,
      organisation: { select: { slug: true } },
      specimens: {
        select: { id: true, photoX: true, photoY: true, notes: true, species: { select: { scientificName: true, slug: true } } },
      },
    },
  })
  const wanted = scenes.filter((s) => all || sceneId || !s.photoMappedAt || (s.photoTakenAt && s.photoTakenAt > s.photoMappedAt))
  return Promise.all(
    wanted.map(async (s) => ({
      org: s.organisation.slug,
      sceneId: s.id,
      name: s.name,
      title: s.title,
      needsMapping: !s.photoMappedAt || (s.photoTakenAt !== null && s.photoTakenAt > s.photoMappedAt),
      photoTakenAt: s.photoTakenAt?.toISOString() ?? null,
      photoMappedAt: s.photoMappedAt?.toISOString() ?? null,
      photoUrl: await scenePhotoUrl(s.organisationId, s.id),
      plantsUrl: `${origin}/api/claude/scenes/${s.id}/plants`,
      plants: s.specimens.map((p) => ({
        id: p.id,
        ...plantName(p.species, p.notes),
        photo: p.photoX !== null && p.photoY !== null ? ([p.photoX, p.photoY] as [number, number]) : null,
      })),
    })),
  )
}
