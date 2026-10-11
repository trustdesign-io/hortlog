import type { ReactNode } from 'react'
import type { EventKind, WorkCapacity } from '@prisma/client'

/**
 * The personal record holds four kinds of entry, each numbered on its own:
 * plants worked with (001), species studied (S001), events (E001) and work days (D001).
 */
export type RecordType = 'worked' | 'studied' | 'event' | 'day'

export const RECORD_TYPES: RecordType[] = ['worked', 'studied', 'event', 'day']

const PREFIX: Record<RecordType, string> = { worked: '', studied: 'S', event: 'E', day: 'D' }

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  worked: 'Worked with',
  studied: 'Studied',
  event: 'Events',
  day: 'Work days',
}

export const CAPACITY_LABELS: Record<WorkCapacity, string> = {
  VOLUNTEER: 'Volunteer',
  CONTRACT: 'Contract',
  OWN: 'Own project',
}

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  LECTURE: 'Lecture',
  VISIT: 'Visit',
  COURSE: 'Course',
  OTHER: 'Event',
}

/** 7, 'studied' → "S007". */
export function formatRecordNo(type: RecordType, n: number): string {
  return `${PREFIX[type]}${String(n).padStart(3, '0')}`
}

export function isRecordType(value: unknown): value is RecordType {
  return typeof value === 'string' && (RECORD_TYPES as string[]).includes(value)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Record dates are calendar dates stored at midnight UTC, so they are read in UTC. */
export function formatRecordDate(date: Date, style: 'long' | 'short' = 'long'): string {
  const month = MONTHS[date.getUTCMonth()]
  return `${date.getUTCDate()} ${style === 'short' ? month.slice(0, 3) : month} ${date.getUTCFullYear()}`
}

export function weekday(date: Date): string {
  return WEEKDAYS[date.getUTCDay()]
}

/** "2026-10-03": the calendar date of a record, for matching entries on the same day. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Renders record text, turning <i>…</i> into italics (botanical names). Everything
 * else is output as plain text, so stored data can never inject markup.
 */
export function renderInline(text: string): ReactNode[] {
  return text
    .split(/(<i>.*?<\/i>)/g)
    .filter(Boolean)
    .map((part, i) => {
      const m = /^<i>(.*)<\/i>$/.exec(part)
      if (m) {
        return (
          <i key={i} lang="la">
            {m[1].replace(/<[^>]*>/g, '')}
          </i>
        )
      }
      return <span key={i}>{part.replace(/<[^>]*>/g, '')}</span>
    })
}

/** Plain text of a name stored with <i> tags. */
export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * The name to show for a plant: the stored name with its authority upright, or
 * the scientific name in italics followed by the authority when that is all there is.
 */
export function plantNameHtml(r: {
  nameHtml: string | null
  scientificName: string
  authority: string | null
}): string {
  if (r.nameHtml) return r.nameHtml
  const name = `<i>${r.scientificName}</i>`
  return r.authority ? `${name} ${r.authority}` : name
}

const LICENCE_URLS: Record<string, string> = {
  CC0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC BY': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA': 'https://creativecommons.org/licenses/by-sa/4.0/',
}

export function licenceUrl(licence: string | null): string | null {
  return licence ? (LICENCE_URLS[licence] ?? null) : null
}

/** "7" → 7; anything that is not a positive whole number → null. */
export function parseRecordNumber(raw: string): number | null {
  if (!/^\d{1,6}$/.test(raw)) return null
  const n = Number(raw)
  return n > 0 ? n : null
}

/** First two words of a name, lower-cased: "Nesocodon mauritianus". */
export function binomialKey(nameHtmlOrText: string): string | null {
  const words = stripTags(nameHtmlOrText).trim().split(/\s+/).slice(0, 2)
  return words.length === 2 ? words.join(' ').toLowerCase() : null
}
