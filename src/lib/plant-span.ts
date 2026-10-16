import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Big plants can cover more hexes than their own (Specimen.extraCells).
 * When a hex is given to something else (another plant, a split, the bed's
 * outline) it stops being part of any plant's spread.
 */
export function releaseHex(sceneId: string, hex: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
  return client.$executeRaw`UPDATE "Specimen" SET "extraCells" = array_remove("extraCells", ${hex}) WHERE "sceneId" = ${sceneId} AND ${hex} = ANY("extraCells")`
}

/** True if a plant in the scene spreads into this hex */
export async function hexIsSpreadInto(sceneId: string, hex: string): Promise<boolean> {
  return (await prisma.specimen.count({ where: { sceneId, extraCells: { has: hex } } })) > 0
}
