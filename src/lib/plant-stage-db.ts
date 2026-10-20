import type { Prisma } from '@prisma/client'
import type { PlantStageValue } from '@/lib/plant-stage'

/**
 * Save a sighting and keep the plant's latest stage up to date. A sighting
 * that arrives late (made offline) is kept in the history but doesn't
 * overwrite a newer one.
 */
export async function saveStageObservation(
  tx: Prisma.TransactionClient,
  args: { specimenId: string; userId: string; stage: PlantStageValue; at: Date },
): Promise<void> {
  await tx.stageObservation.create({
    data: { specimenId: args.specimenId, userId: args.userId, stage: args.stage, observedAt: args.at },
  })
  await tx.specimen.updateMany({
    where: {
      id: args.specimenId,
      OR: [{ stageSeenAt: null }, { stageSeenAt: { lte: args.at } }],
    },
    data: { stage: args.stage, stageSeenAt: args.at },
  })
}
