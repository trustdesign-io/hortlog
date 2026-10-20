/** Label problems: what can be wrong with a plant's label. Pure and client-safe. */

export const LABEL_PROBLEMS = ['MISSING', 'DAMAGED', 'WRONG_NAME', 'HIDDEN'] as const
export type LabelProblemValue = (typeof LABEL_PROBLEMS)[number]

export const LABEL_PROBLEM_LABELS: Record<LabelProblemValue, string> = {
  MISSING: 'Missing',
  DAMAGED: 'Damaged or unreadable',
  WRONG_NAME: 'Wrong name',
  HIDDEN: 'Hidden or hard to see',
}

export const MAX_LABEL_NOTE = 500
/** A visitor can send this many reports an hour */
export const VISITOR_REPORTS_PER_HOUR = 5

export function isLabelProblem(v: unknown): v is LabelProblemValue {
  return typeof v === 'string' && (LABEL_PROBLEMS as readonly string[]).includes(v)
}

/** A note as typed, tidied; null if empty */
export function cleanLabelNote(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim().replace(/\s+/g, ' ')
  return t ? t.slice(0, MAX_LABEL_NOTE) : null
}

interface ReportLine {
  problem: LabelProblemValue
  note: string | null
  fromVisitor: boolean
  createdAt: Date
  by: string | null
}

/** "Label: Missing — Didierea trollii", or every problem reported when they differ */
export function labelTaskTitle(problems: LabelProblemValue[], plantName: string): string {
  const distinct = [...new Set(problems)].map((p) => LABEL_PROBLEM_LABELS[p])
  return `Label: ${distinct.join(' / ')} — ${plantName}`
}

/** The to-do's description: every report, oldest first */
export function labelTaskDescription(reports: ReportLine[]): string {
  const lines = [...reports]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((r) => {
      const day = r.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })
      const who = r.fromVisitor ? 'a visitor' : (r.by ?? 'a member')
      return `• ${day}, ${who}: ${LABEL_PROBLEM_LABELS[r.problem]}${r.note ? ` — “${r.note}”` : ''}`
    })
  const head = reports.length === 1 ? 'Reported once.' : `Reported ${reports.length} times.`
  return [head, ...lines].join('\n')
}
