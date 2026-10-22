'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { cleanSceneNote, MAX_SCENE_NOTE } from '@/lib/scene-notes'
import type { ActionResult } from '@/lib/shared/types'

function refresh(orgSlug: string, sceneId: string) {
  revalidatePath(`/${orgSlug}/scenes/${sceneId}/details`)
  revalidatePath('/[org]/[collection]/[scene]', 'page')
  revalidatePath('/[org]/scene/[scene]', 'page')
}

/** Pin a note to a scene for visitors */
export async function addSceneNote(orgSlug: string, sceneId: string, text: string): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_edit_scene')
  const clean = cleanSceneNote(text)
  if (!clean) return { success: false, error: `Write a note of up to ${MAX_SCENE_NOTE} characters.` }
  try {
    const scene = await prisma.scene.findFirst({ where: { id: sceneId, organisation: { slug: orgSlug } }, select: { id: true } })
    if (!scene) return { success: false, error: 'This scene has been removed.' }
    await prisma.sceneNote.create({ data: { sceneId: scene.id, text: clean, authorId: user.id } })
  } catch (err) {
    console.error('[addSceneNote] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
  refresh(orgSlug, sceneId)
  return { success: true }
}

/** Change a note's wording */
export async function updateSceneNote(orgSlug: string, noteId: string, text: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  const clean = cleanSceneNote(text)
  if (!clean) return { success: false, error: `Write a note of up to ${MAX_SCENE_NOTE} characters.` }
  try {
    const note = await prisma.sceneNote.findFirst({ where: { id: noteId, scene: { organisation: { slug: orgSlug } } }, select: { id: true, sceneId: true } })
    if (!note) return { success: false, error: 'This note has been removed.' }
    await prisma.sceneNote.update({ where: { id: note.id }, data: { text: clean } })
    refresh(orgSlug, note.sceneId)
  } catch (err) {
    console.error('[updateSceneNote] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
  return { success: true }
}

/** Take a note down */
export async function removeSceneNote(orgSlug: string, noteId: string): Promise<ActionResult> {
  await requireOrgAccess(orgSlug, 'can_edit_scene')
  try {
    const note = await prisma.sceneNote.findFirst({ where: { id: noteId, scene: { organisation: { slug: orgSlug } } }, select: { id: true, sceneId: true } })
    if (!note) return { success: true }
    await prisma.sceneNote.delete({ where: { id: note.id } })
    refresh(orgSlug, note.sceneId)
  } catch (err) {
    console.error('[removeSceneNote] error:', err)
    return { success: false, error: 'That couldn’t be removed. Try again.' }
  }
  return { success: true }
}
