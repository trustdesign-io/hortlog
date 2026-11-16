'use server'

import { revalidatePath } from 'next/cache'
import { WorkAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/permissions'
import { MAX_SITE_NAME } from '@/lib/record-elsewhere'
import type { ActionResult } from '@/lib/shared/types'

export interface ElsewhereWorkInput {
  speciesId: string
  /** Where it was, e.g. "Riverview Academy" */
  site: string
  /** ISO date, e.g. 2026-11-16 */
  date: string
  action: string
  actionNote?: string
  text?: string
}

/**
 * Add work on a plant at a site not on hortlog to your record. The first time
 * makes a numbered record for that plant at that site; after that it's another
 * entry on the same record, never a second one.
 */
export async function addWorkElsewhere(input: ElsewhereWorkInput): Promise<ActionResult & { recordId?: string }> {
  const user = await requireAuth()

  const site = input.site.trim().replace(/\s+/g, ' ').slice(0, MAX_SITE_NAME)
  if (!site) return { success: false, error: 'Say where the work was.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { success: false, error: 'Choose the date of the work.' }
  const date = new Date(`${input.date}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 86_400_000) {
    return { success: false, error: 'Choose a date that isn’t in the future.' }
  }
  if (!(Object.values(WorkAction) as string[]).includes(input.action)) {
    return { success: false, error: 'Choose what you did.' }
  }
  const action = input.action as WorkAction
  const actionNote = input.actionNote?.trim() || null
  if (action === 'OTHER' && !actionNote) return { success: false, error: 'Say what you did.' }

  const species = await prisma.species.findUnique({
    where: { id: input.speciesId },
    select: { id: true, scientificName: true, authority: true, family: true, commonName: true, origin: true, powoUrl: true },
  })
  if (!species) return { success: false, error: 'Choose the plant from the list.' }

  try {
    const recordId = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.workRecord.findFirst({
          where: {
            userId: user.id,
            speciesId: species.id,
            specimenId: null,
            site: { equals: site, mode: 'insensitive' },
          },
          select: { id: true, firstWorkedDate: true },
        })
        let id = existing?.id
        if (!existing) {
          const agg = await tx.workRecord.aggregate({ where: { userId: user.id }, _max: { recordNumber: true } })
          const created = await tx.workRecord.create({
            data: {
              recordNumber: (agg._max.recordNumber ?? 0) + 1,
              firstWorkedDate: date,
              scientificName: species.scientificName,
              nameHtml: [`<i>${species.scientificName}</i>`, species.authority].filter(Boolean).join(' '),
              family: species.family,
              authority: species.authority,
              commonNames: species.commonName,
              nativeRange: species.origin,
              powoUrl: species.powoUrl,
              site,
              userId: user.id,
              speciesId: species.id,
            },
            select: { id: true },
          })
          id = created.id
        } else if (date < existing.firstWorkedDate) {
          // Earlier work turned up later: the record starts from it
          await tx.workRecord.update({ where: { id: existing.id }, data: { firstWorkedDate: date } })
        }
        await tx.workLogEntry.create({
          data: { date, action, actionNote, text: input.text?.trim() || null, workRecordId: id! },
        })
        return id!
      },
      { isolationLevel: 'Serializable' },
    )
    revalidatePath('/records', 'layout')
    return { success: true, recordId }
  } catch (err) {
    console.error('[addWorkElsewhere] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }
}
