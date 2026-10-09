import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'
import { ScientificName } from '@/components/ui/scientific-name'
import { PrintButton } from '@/components/print-button'

interface SharePageProps {
  params: Promise<{ token: string }>
}

export const metadata = {
  robots: { index: false, follow: false },
}

const FIELD_LABELS: Record<string, string> = {
  firstWorkedDate: 'First worked',
  determination: 'Determination',
  labelText: 'Label text',
  provenance: 'Provenance',
  workDone: 'Work done',
  observed: 'Observed',
  note: 'Note',
  sources: 'Sources',
  openQuestions: 'Open questions',
}

export default async function SharedRecordPage({ params }: SharePageProps) {
  const { token } = await params

  const record = await prisma.workRecord.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      recordNumber: true,
      firstWorkedDate: true,
      scientificName: true,
      family: true,
      determination: true,
      labelText: true,
      provenance: true,
      workDone: true,
      observed: true,
      note: true,
      sources: true,
      openQuestions: true,
      organisation: { select: { name: true } },
      specimen: {
        select: {
          species: { select: { commonName: true, powoUrl: true } },
        },
      },
      logEntries: {
        orderBy: { date: 'asc' },
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

  if (!record) return notFound()

  const recordNum = String(record.recordNumber).padStart(3, '0')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 print:max-w-full">
      <header className="mb-6">
        <p className="text-xs text-muted-foreground">
          Work record · {record.organisation.name}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">Record #{recordNum}</p>
        <ScientificName className="mt-2 text-2xl font-medium leading-tight">
          {record.scientificName}
        </ScientificName>
        {record.family && (
          <p className="text-sm text-muted-foreground">{record.family}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {record.specimen.species.commonName}
          {record.specimen.species.powoUrl && (
            <>
              {' '}·{' '}
              <a
                href={record.specimen.species.powoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                POWO
              </a>
            </>
          )}
        </p>
      </header>

      {/* Fixed-order botany fields */}
      <dl className="mb-6 space-y-3 text-sm">
        {Object.entries(FIELD_LABELS).map(([field, label]) => {
          const raw = record[field as keyof typeof record]
          const value =
            raw instanceof Date
              ? raw.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : typeof raw === 'string'
              ? raw
              : null
          return (
            <div key={field} className="grid grid-cols-[9rem_1fr] gap-2">
              <dt className="pt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className={value ? 'text-foreground' : 'text-muted-foreground/40'}>
                {value ?? '—'}
              </dd>
            </div>
          )
        })}
      </dl>

      {/* Work log */}
      {record.logEntries.length > 0 && (
        <section aria-label="Work log" className="mb-6">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Work log
          </h2>
          <ol className="space-y-3">
            {record.logEntries.map((entry) => (
              <li key={entry.id} className="flex gap-3 text-sm">
                <time
                  dateTime={entry.date.toISOString()}
                  className="w-24 shrink-0 pt-0.5 text-xs text-muted-foreground"
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
                      <span className="font-normal text-muted-foreground">
                        {' '}— {entry.actionNote}
                      </span>
                    )}
                  </p>
                  {entry.location && (
                    <p className="text-xs text-muted-foreground">{entry.location}</p>
                  )}
                  {entry.text && (
                    <p className="mt-1 leading-relaxed text-foreground/80">{entry.text}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Print */}
      <div className="print:hidden">
        <PrintButton />
      </div>
    </div>
  )
}
