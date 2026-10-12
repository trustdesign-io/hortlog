import type { Prisma } from '@prisma/client'

/** What a new work record copies from the specimen, so the record stands alone later. */
export const WORK_RECORD_SPECIMEN_SELECT = {
  id: true,
  slug: true,
  cultivar: true,
  organisationId: true,
  organisation: { select: { name: true } },
  species: {
    select: {
      scientificName: true,
      family: true,
      authority: true,
      commonName: true,
      origin: true,
      powoUrl: true,
    },
  },
} as const satisfies Prisma.SpecimenSelect

export type WorkRecordSpecimen = Prisma.SpecimenGetPayload<{ select: typeof WORK_RECORD_SPECIMEN_SELECT }>

/**
 * The member's work record for this specimen, created on their first work with
 * it and numbered after their latest record.
 */
export async function ensureWorkRecord(
  tx: Prisma.TransactionClient,
  userId: string,
  specimen: WorkRecordSpecimen,
  date: Date,
): Promise<{ id: string }> {
  const existing = await tx.workRecord.findUnique({
    where: { userId_specimenId: { userId, specimenId: specimen.id } },
    select: { id: true },
  })
  if (existing) return existing

  const agg = await tx.workRecord.aggregate({ where: { userId }, _max: { recordNumber: true } })
  const { species } = specimen
  return tx.workRecord.create({
    data: {
      recordNumber: (agg._max.recordNumber ?? 0) + 1,
      firstWorkedDate: date,
      scientificName: species.scientificName,
      // Botanical name in italics, authority upright, then the cultivar
      nameHtml: [
        `<i>${species.scientificName}</i>`,
        species.authority,
        specimen.cultivar ? `‘${specimen.cultivar}’` : null,
      ]
        .filter(Boolean)
        .join(' '),
      family: species.family,
      authority: species.authority,
      commonNames: species.commonName,
      nativeRange: species.origin,
      powoUrl: species.powoUrl,
      site: specimen.organisation.name,
      userId,
      specimenId: specimen.id,
      organisationId: specimen.organisationId,
    },
    select: { id: true },
  })
}
