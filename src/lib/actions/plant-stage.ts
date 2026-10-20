'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireOrgAccess } from '@/lib/auth/permissions'
import { isPlantStage } from '@/lib/plant-stage'
import { saveStageObservation } from '@/lib/plant-stage-db'
import type { ActionResult } from '@/lib/shared/types'

/** A member saw this plant in bud, in flower, in fruit or over, today. */
export async function setPlantStage(orgSlug: string, specimenId: string, stage: string): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_record_work')
  if (!isPlantStage(stage)) return { success: false, error: 'Choose a stage.' }

  const specimen = await prisma.specimen.findFirst({
    where: { id: specimenId, organisation: { slug: orgSlug } },
    select: { id: true, slug: true },
  })
  if (!specimen) return { success: false, error: 'This plant has been removed.' }

  try {
    await prisma.$transaction((tx) =>
      saveStageObservation(tx, { specimenId: specimen.id, userId: user.id, stage, at: new Date() }),
    )
  } catch (err) {
    console.error('[setPlantStage] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }

  revalidatePath(`/${orgSlug}/specimens/${specimen.slug}`)
  revalidatePath('/[org]/[collection]/[scene]', 'layout')
  revalidatePath('/[org]/scene/[scene]', 'layout')
  revalidatePath(`/${orgSlug}/flowering`)
  return { success: true }
}
