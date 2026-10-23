import { prisma } from '@/lib/prisma'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'
import { RecordWorkForm } from '@/components/record-work-form'
import { NotMeButton } from '@/components/not-me-button'
import { EntryCoworkers } from '@/components/entry-coworkers'

interface SpecimenWorkHistoryProps {
  orgSlug: string
  specimenId: string
  userId: string
}

const DATE: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }

function personName(u: { name: string | null; email: string }): string {
  return u.name?.trim() || u.email
}

export async function SpecimenWorkHistory({ orgSlug, specimenId, userId }: SpecimenWorkHistoryProps) {
  const [workRecord, taggedOn, memberships] = await Promise.all([
    prisma.workRecord.findUnique({
      where: { userId_specimenId: { userId, specimenId } },
      select: {
        id: true,
        recordNumber: true,
        logEntries: {
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            action: true,
            actionNote: true,
            location: true,
            text: true,
            coworkers: { select: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
          },
        },
      },
    }),
    // Work someone else logged on this plant and tagged you on
    prisma.workLogEntry.findMany({
      where: { coworkers: { some: { userId } }, workRecord: { specimenId } },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        action: true,
        actionNote: true,
        workRecord: { select: { user: { select: { name: true, email: true } } } },
      },
    }),
    prisma.membership.findMany({
      where: { organisation: { slug: orgSlug }, userId: { not: userId } },
      select: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { user: { name: 'asc' } },
    }),
  ])

  const members = memberships.map((m) => m.user)

  return (
    <section className="border-t pt-6 mt-6" aria-label="Your work record">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {workRecord ? `Record #${String(workRecord.recordNumber).padStart(3, '0')}` : 'Record work'}
      </h2>

      {workRecord && workRecord.logEntries.length > 0 && (
        <ol className="mb-6 space-y-3" aria-label="Work log">
          {workRecord.logEntries.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <time dateTime={entry.date.toISOString()} className="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">
                {entry.date.toLocaleDateString('en-GB', DATE)}
              </time>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">
                  {WORK_ACTION_LABELS[entry.action]}
                  {entry.actionNote && <span className="font-normal text-muted-foreground"> — {entry.actionNote}</span>}
                </p>
                <EntryCoworkers
                  orgSlug={orgSlug}
                  entryId={entry.id}
                  members={members}
                  initial={entry.coworkers.map((c) => c.user)}
                />
                {entry.location && <p className="text-xs text-muted-foreground">{entry.location}</p>}
                {entry.text && <p className="mt-1 text-sm leading-relaxed text-foreground/80">{entry.text}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {taggedOn.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You worked on it with</h3>
          <ol className="space-y-3" aria-label="Work you were tagged on">
            {taggedOn.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 text-sm">
                <time dateTime={entry.date.toISOString()} className="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">
                  {entry.date.toLocaleDateString('en-GB', DATE)}
                </time>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">
                    {WORK_ACTION_LABELS[entry.action]}
                    {entry.actionNote && <span className="font-normal text-muted-foreground"> — {entry.actionNote}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">Logged by {personName(entry.workRecord.user)}</p>
                </div>
                <NotMeButton entryId={entry.id} />
              </li>
            ))}
          </ol>
        </div>
      )}

      <RecordWorkForm orgSlug={orgSlug} specimenId={specimenId} members={members} />
    </section>
  )
}
