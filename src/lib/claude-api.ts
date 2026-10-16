import { hasCapability } from '@/lib/auth/capabilities'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma'
import { scenePhotoUrl } from '@/lib/scene-photo'
import { MAX_GRID } from '@/lib/scene-grid'
import { MAX_PHOTO_PLANTS } from '@/lib/photo-layout'

/**
 * What /api/claude returns: scenes with bed photos, for Claude on a member's
 * computer to lay out. The `guide` is written for Claude, so the member only
 * has to say "process my hortlog scenes".
 */
export const CLAUDE_GUIDE = `hortlog scene layout from bed photos.

Each scene below has a photo of a real garden bed (photoUrl, valid for an hour) and a hexagonal grid (pointy-topped hexes, offset rows). Your job, for each scene with needsMapping: true:

1. Look at the photo. Choose rows and cols (1–${MAX_GRID}) so one hex is roughly one plant-sized patch, with the grid's proportions matching the bed as seen from above. Row 0 is the back of the bed (far side of the photo), col 0 is the left.
2. blockedCells: hexes "row,col" that fall outside the bed's outline (paths, lawn, walls), so the grid takes the bed's shape.
3. plants: one entry per plant you can see: { "cell": "row,col", "name": "...", "note": "...", "photo": [x, y], "cells": [...] }.
   - name: the scientific name only if you're confident (it's looked up in the botanical catalogue automatically); otherwise a short description the member will recognise, e.g. "Tall blue agave" or "Plant 3".
   - note: where it is / what it looks like, to help the member identify it later.
   - photo: where the plant is in the photo, as fractions of the image's width and height (0–1, from the top left). The member names plants by tapping numbered dots placed here, so be as accurate as you can.
   - cells (optional): for a plant bigger than one hex, the other whole hexes "row,col" it covers. Its "cell" is where its name shows.
   - Small plants can share a hex: use small cells "row,col:k", k = 0 centre, 1 top left, 2 top right, 3 right, 4 bottom right, 5 bottom left, 6 left. A hex holds either one whole-hex plant or small-cell plants, not both.
   - Up to ${MAX_PHOTO_PLANTS} plants per request. Don't repeat plants already listed in "plants" for the scene.
4. Send it: PUT layoutUrl with JSON { "rows", "cols", "rowShift": 0|1 (optional), "blockedCells": [...], "plants": [...] } and the same Authorization header. A 422 reply lists what to fix; nothing is changed until the whole layout is valid. Plants already in the scene must stay inside the grid and outside blockedCells.

Then tell the member which scenes you laid out and how many plants each has, so they can name them in hortlog. Add ?all=1 to list every scene with a photo, including ones already laid out.`

export interface ClaudeScene {
  org: string
  sceneId: string
  name: string
  title: string | null
  needsMapping: boolean
  photoTakenAt: string | null
  photoMappedAt: string | null
  photoUrl: string | null
  layoutUrl: string
  grid: { rows: number; cols: number; rowShift: number; splitCells: string[]; blockedCells: string[] }
  plants: { id: string; cell: string; cells: string[]; name: string; identified: boolean; photo: [number, number] | null }[]
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
      gridRows: true,
      gridCols: true,
      rowShift: true,
      splitCells: true,
      blockedCells: true,
      photoTakenAt: true,
      photoMappedAt: true,
      organisationId: true,
      organisation: { select: { slug: true } },
      specimens: {
        where: { gridCell: { not: null } },
        select: { id: true, gridCell: true, extraCells: true, photoX: true, photoY: true, notes: true, species: { select: { scientificName: true, slug: true } } },
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
      layoutUrl: `${origin}/api/claude/scenes/${s.id}/layout`,
      grid: { rows: s.gridRows, cols: s.gridCols, rowShift: s.rowShift, splitCells: s.splitCells, blockedCells: s.blockedCells },
      plants: s.specimens.map((p) => ({
        id: p.id,
        cell: p.gridCell as string,
        cells: p.extraCells,
        ...plantName(p.species, p.notes),
        photo: p.photoX !== null && p.photoY !== null ? ([p.photoX, p.photoY] as [number, number]) : null,
      })),
    })),
  )
}
