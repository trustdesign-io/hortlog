import { prisma } from '@/lib/prisma'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'
import { RecordWorkForm } from '@/components/record-work-form'

interface SpecimenWorkHistoryProps {
  orgSlug: string
  specimenId: string
  userId: string
}

export async function SpecimenWorkHistory({ orgSlug, specimenId, userId }: SpecimenWorkHistoryProps) {
  const workRecord = await prisma.workRecord.findUnique({
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
        },
      },
    },
  })

  return (
    <section className="border-t pt-6 mt-6" aria-label="Your work record">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {workRecord ? `Record #${String(workRecord.recordNumber).padStart(3, '0')}` : 'Record work'}
      </h2>

      {workRecord && workRecord.logEntries.length > 0 && (
        <ol className="mb-6 space-y-3" aria-label="Work log">
          {workRecord.logEntries.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <time
                dateTime={entry.date.toISOString()}
                className="w-24 shrink-0 text-xs text-muted-foreground pt-0.5"
              >
                {entry.date.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </time>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">
                  {WORK_ACTION_LABELS[entry.action]}
                  {entry.actionNote && (
                    <span className="font-normal text-muted-foreground"> — {entry.actionNote}</span>
                  )}
                </p>
                {entry.location && (
                  <p className="text-xs text-muted-foreground">{entry.location}</p>
                )}
                {entry.text && (
                  <p className="mt-1 text-sm leading-relaxed text-foreground/80">{entry.text}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <RecordWorkForm orgSlug={orgSlug} specimenId={specimenId} />
    </section>
  )
}
