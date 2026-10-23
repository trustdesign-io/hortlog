'use server'

import { revalidatePath } from 'next/cache'
import { WorkAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { canManageOrg, requireOrgAccess } from '@/lib/auth/permissions'
import { getCurrentUser } from '@/lib/auth/current-user'
import { validCoworkers } from '@/lib/coworkers'
import { ensureWorkRecord, WORK_RECORD_SPECIMEN_SELECT } from '@/lib/work-record-db'
import type { ActionResult } from '@/lib/shared/types'

// ─── Record work (create record or append log entry) ─────────────────────────

export async function recordWork(
  orgSlug: string,
  specimenId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_record_work')

  const actionRaw = formData.get('action')
  const actionNote = (formData.get('actionNote') as string | null)?.trim() || null
  const location = (formData.get('location') as string | null)?.trim() || null
  const text = (formData.get('text') as string | null)?.trim() || null
  const dateRaw = formData.get('date') as string | null
  const parsedDate = dateRaw ? new Date(dateRaw) : null
  if (parsedDate !== null && isNaN(parsedDate.getTime())) {
    return { success: false, error: 'Invalid date.' }
  }
  const date = parsedDate ?? new Date()

  if (typeof actionRaw !== 'string' || !(actionRaw in WorkAction)) {
    return { success: false, error: 'Please select an action.' }
  }
  const action = actionRaw as WorkAction

  const specimen = await prisma.specimen.findFirst({
    where: { id: specimenId, organisation: { slug: orgSlug } },
    select: WORK_RECORD_SPECIMEN_SELECT,
  })
  if (!specimen) return { success: false, error: 'Specimen not found.' }

  const coworkerIds = await validCoworkers(orgSlug, user.id, formData.getAll('coworkerId'))

  try {
    // Create the record on first work, then append the entry, atomically
    await prisma.$transaction(async (tx) => {
      const workRecord = await ensureWorkRecord(tx, user.id, specimen, date)

      await tx.workLogEntry.create({
        data: {
          date,
          action,
          actionNote,
          location,
          text,
          workRecordId: workRecord.id,
          coworkers: { create: coworkerIds.map((userId) => ({ userId })) },
        },
      })
    }, { isolationLevel: 'Serializable' })
  } catch {
    return { success: false, error: 'Failed to record work. Please try again.' }
  }

  revalidatePath(`/${orgSlug}/specimens/${specimen.slug}`)
  revalidatePath('/[org]/[collection]/[scene]/[specimen]', 'page')
  revalidatePath(`/${orgSlug}`)
  if (coworkerIds.length > 0) revalidatePath('/records')

  return { success: true }
}

/** "Not me": take yourself off an entry someone else tagged you on. */
export async function removeMeFromEntry(entryId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Please sign in again.' }
  try {
    await prisma.workLogEntryCoworker.deleteMany({ where: { entryId, userId: user.id } })
  } catch (err) {
    console.error('[removeMeFromEntry] error:', err)
    return { success: false, error: 'That couldn’t be changed. Try again.' }
  }
  revalidatePath('/records')
  revalidatePath('/[org]/specimens/[specimen]', 'page')
  return { success: true }
}

/**
 * Change who's tagged as having worked on an entry, after it's saved: the
 * person who logged it only, members of the garden only. Kept in the edit
 * history. Doesn't clear a sign-off, as the work itself hasn't changed.
 */
export async function setEntryCoworkers(orgSlug: string, entryId: string, coworkerIds: string[]): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_record_work')

  const entry = await prisma.workLogEntry.findFirst({
    where: { id: entryId, workRecord: { userId: user.id, organisation: { slug: orgSlug } } },
    select: {
      id: true,
      workRecord: { select: { specimen: { select: { slug: true } } } },
      coworkers: { select: { userId: true, user: { select: { name: true, email: true } } } },
    },
  })
  if (!entry) return { success: false, error: 'Only the person who logged this work can change who it was with.' }

  const ids = await validCoworkers(orgSlug, user.id, Array.isArray(coworkerIds) ? coworkerIds : [])
  const before = entry.coworkers.map((c) => c.userId)
  if (before.length === ids.length && before.every((id) => ids.includes(id))) return { success: true }

  const named = async (userIds: string[]) => {
    if (userIds.length === 0) return null
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    return userIds
      .map((id) => users.find((u) => u.id === id))
      .map((u) => u?.name?.trim() || u?.email || 'a member')
      .join(', ')
  }

  try {
    const [oldValue, newValue] = await Promise.all([named(before), named(ids)])
    await prisma.$transaction([
      prisma.workLogEntryCoworker.deleteMany({ where: { entryId, userId: { notIn: ids } } }),
      prisma.workLogEntryCoworker.createMany({
        data: ids.filter((id) => !before.includes(id)).map((userId) => ({ entryId, userId })),
        skipDuplicates: true,
      }),
      prisma.workLogEntryEdit.create({
        data: { field: 'coworkers', oldValue, newValue, editedById: user.id, workLogEntryId: entryId },
      }),
    ])
  } catch (err) {
    console.error('[setEntryCoworkers] error:', err)
    return { success: false, error: 'That couldn’t be saved. Try again.' }
  }

  revalidatePath('/records', 'layout')
  revalidatePath(`/${orgSlug}/specimens/${entry.workRecord.specimen.slug}`)
  revalidatePath('/[org]/[collection]/[scene]/[specimen]', 'page')
  return { success: true }
}

// ─── Update a work record field (with edit history) ──────────────────────────

export async function updateWorkRecordField(
  orgSlug: string,
  recordId: string,
  field: string,
  newValue: string,
): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_record_work')

  const EDITABLE_FIELDS = [
    'firstWorkedDate', 'determination', 'labelText', 'provenance',
    'workDone', 'observed', 'note', 'sources', 'openQuestions',
  ] as const

  if (!EDITABLE_FIELDS.includes(field as (typeof EDITABLE_FIELDS)[number])) {
    return { success: false, error: 'Invalid field.' }
  }

  const record = await prisma.workRecord.findFirst({
    where: { id: recordId, userId: user.id, organisation: { slug: orgSlug } },
    select: { id: true, [field]: true },
  })
  if (!record) return { success: false, error: 'Record not found.' }

  const oldValue = String(record[field as keyof typeof record] ?? '')
  const trimmed = newValue.trim()

  await prisma.$transaction([
    prisma.workRecord.update({
      where: { id: recordId },
      data: { [field]: trimmed || null },
    }),
    prisma.workRecordEdit.create({
      data: {
        field,
        oldValue: oldValue || null,
        newValue: trimmed || null,
        editedById: user.id,
        workRecordId: recordId,
      },
    }),
  ])

  revalidatePath(`/${orgSlug}`)
  return { success: true }
}

// ─── Update a log entry field (with edit history) ────────────────────────────

export async function updateLogEntryField(
  orgSlug: string,
  entryId: string,
  field: string,
  newValue: string,
): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_record_work')

  const EDITABLE_FIELDS = ['date', 'action', 'actionNote', 'location', 'text'] as const

  if (!EDITABLE_FIELDS.includes(field as (typeof EDITABLE_FIELDS)[number])) {
    return { success: false, error: 'Invalid field.' }
  }

  // Verify ownership: only owner can edit their entries
  const entry = await prisma.workLogEntry.findFirst({
    where: {
      id: entryId,
      workRecord: { userId: user.id, organisation: { slug: orgSlug } },
    },
    select: { id: true, [field]: true },
  })
  if (!entry) return { success: false, error: 'Log entry not found.' }

  const oldValue = String(entry[field as keyof typeof entry] ?? '')
  const trimmed = newValue.trim()

  if (field === 'date') {
    const parsed = new Date(trimmed)
    if (isNaN(parsed.getTime())) return { success: false, error: 'Invalid date.' }
  }

  const updateData: Record<string, string | Date | null> =
    field === 'date' ? { date: new Date(trimmed) } : { [field]: trimmed || null }

  await prisma.$transaction([
    prisma.workLogEntry.update({
      where: { id: entryId },
      // A changed entry needs signing off again
      data: { ...updateData, signedOffAt: null, signedOffById: null, signOffComment: null },
    }),
    prisma.workLogEntryEdit.create({
      data: {
        field,
        oldValue: oldValue || null,
        newValue: trimmed || null,
        editedById: user.id,
        workLogEntryId: entryId,
      },
    }),
  ])

  revalidatePath(`/${orgSlug}`)
  return { success: true }
}

// ─── Delete a log entry (owner or manager; history kept) ─────────────────────

export async function deleteLogEntry(
  orgSlug: string,
  entryId: string,
): Promise<ActionResult> {
  const { user } = await requireOrgAccess(orgSlug, 'can_record_work')

  const isManager = canManageOrg(user, orgSlug)

  const entry = await prisma.workLogEntry.findFirst({
    where: {
      id: entryId,
      workRecord: { organisation: { slug: orgSlug } },
    },
    select: {
      id: true,
      workRecord: { select: { userId: true } },
    },
  })
  if (!entry) return { success: false, error: 'Log entry not found.' }

  const isOwner = entry.workRecord.userId === user.id
  if (!isOwner && !isManager) {
    return { success: false, error: 'Only the owner or a manager can delete this entry.' }
  }

  // Keep edit history by logging the deletion before deleting
  await prisma.$transaction([
    prisma.workLogEntryEdit.create({
      data: {
        field: '_deleted',
        oldValue: null,
        newValue: null,
        editedById: user.id,
        workLogEntryId: entryId,
      },
    }),
    prisma.workLogEntry.delete({ where: { id: entryId } }),
  ])

  revalidatePath(`/${orgSlug}`)
  return { success: true }
}

// ─── Add work you were tagged on to your own record ──────────────────────────

/** The parts of the logger's record copied into a new record, so nobody types it twice */
const COPIED_RECORD_FIELDS = [
  'scientificName', 'nameHtml', 'family', 'authority', 'commonNames', 'nativeRange', 'habit',
  'diagnostic', 'nearMisses', 'powoUrl', 'site', 'location', 'viceCounty', 'gridRef',
  'determination', 'labelText', 'provenance', 'workDone', 'observed', 'note', 'sources', 'openQuestions',
] as const

/**
 * Someone tagged you on their work: add it to your own record, numbered like
 * your other records. A new record copies theirs (names, det., provenance,
 * notes…) for you to edit; the entry is copied with them tagged on it.
 */
export async function addTaggedWorkToMyRecord(entryId: string): Promise<ActionResult & { recordId?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Please sign in again.' }

  const tag = await prisma.workLogEntryCoworker.findUnique({
    where: { entryId_userId: { entryId, userId: user.id } },
    select: {
      acceptedEntry: { select: { workRecordId: true } },
      entry: {
        select: {
          id: true,
          date: true,
          action: true,
          actionNote: true,
          location: true,
          text: true,
          workRecord: {
            select: {
              userId: true,
              organisation: { select: { slug: true } },
              specimen: { select: WORK_RECORD_SPECIMEN_SELECT },
              ...Object.fromEntries(COPIED_RECORD_FIELDS.map((f) => [f, true])),
            },
          },
        },
      },
    },
  })
  if (!tag) return { success: false, error: 'You’re not tagged on that work.' }
  if (tag.acceptedEntry) return { success: true, recordId: tag.acceptedEntry.workRecordId }

  const { entry } = tag
  const source = entry.workRecord as typeof entry.workRecord & Record<(typeof COPIED_RECORD_FIELDS)[number], unknown>
  const orgSlug = source.organisation.slug
  await requireOrgAccess(orgSlug, 'can_record_work')

  try {
    const recordId = await prisma.$transaction(async (tx) => {
      const existed = await tx.workRecord.findUnique({
        where: { userId_specimenId: { userId: user.id, specimenId: source.specimen.id } },
        select: { id: true },
      })
      const record = await ensureWorkRecord(tx, user.id, source.specimen, entry.date)
      if (!existed) {
        const copied = Object.fromEntries(
          COPIED_RECORD_FIELDS.filter((f) => source[f] !== null && source[f] !== undefined).map((f) => [f, source[f]]),
        )
        await tx.workRecord.update({ where: { id: record.id }, data: copied })
      }
      const copy = await tx.workLogEntry.create({
        data: {
          date: entry.date,
          action: entry.action,
          actionNote: entry.actionNote,
          location: entry.location,
          text: entry.text,
          workRecordId: record.id,
          // The person who logged it, already holding the original
          coworkers: { create: [{ userId: source.userId, acceptedEntryId: entry.id }] },
        },
        select: { id: true },
      })
      await tx.workLogEntryCoworker.update({
        where: { entryId_userId: { entryId, userId: user.id } },
        data: { acceptedEntryId: copy.id },
      })
      return record.id
    }, { isolationLevel: 'Serializable' })

    revalidatePath('/records', 'layout')
    revalidatePath(`/${orgSlug}/specimens/${source.specimen.slug}`)
    return { success: true, recordId }
  } catch (err) {
    console.error('[addTaggedWorkToMyRecord] error:', err)
    return { success: false, error: 'That couldn’t be added. Try again.' }
  }
}
