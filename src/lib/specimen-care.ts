import type { WorkAction } from '@prisma/client'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'

/** A log entry as read for a specimen's care history. */
export interface CareEntrySource {
  id: string
  date: Date
  action: WorkAction
  actionNote: string | null
  text: string | null
  workRecord: {
    user: {
      name: string | null
      username: string | null
      recordPublic: boolean
      creditOnPlants: boolean
    }
  }
}

export interface CareCredit {
  name: string
  /** Link to their public record, when they have one. */
  href: string | null
}

export interface CareEntry {
  id: string
  date: Date
  /** "Pruned", or "Other: tied in to the frame" */
  label: string
  /** Null when the person hasn't opted in to be named (public pages only). */
  by: CareCredit | null
  /** Only for organisation members. */
  note: string | null
}

export const PUBLIC_CARE_LIMIT = 5
export const MEMBER_CARE_LIMIT = 50

export function careLabel(action: WorkAction, actionNote: string | null): string {
  const label = WORK_ACTION_LABELS[action]
  if (!actionNote) return label
  return action === 'OTHER' ? actionNote : `${label}: ${actionNote}`
}

function credit(user: CareEntrySource['workRecord']['user']): CareCredit | null {
  if (!user.name) return null
  return { name: user.name, href: user.recordPublic && user.username ? `/u/${user.username}` : null }
}

/**
 * Public plant pages name someone only if they have opted in, and never show
 * their notes. Organisation members see everyone's names and notes.
 */
export function toCareEntry(entry: CareEntrySource, audience: 'public' | 'members'): CareEntry {
  const user = entry.workRecord.user
  const isPublic = audience === 'public'
  return {
    id: entry.id,
    date: entry.date,
    label: careLabel(entry.action, entry.actionNote),
    by: isPublic && !user.creditOnPlants ? null : credit(user),
    note: isPublic ? null : entry.text,
  }
}
