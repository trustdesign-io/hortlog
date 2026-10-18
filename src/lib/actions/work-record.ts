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
      data: updateData,
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
