import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'
import { ScientificName } from '@/components/ui/scientific-name'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { ShareControls } from './share-controls'
import { PrintButton } from '@/components/print-button'

interface RecordPageProps {
  params: Promise<{ recordId: string }>
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

export default async function RecordPage({ params }: RecordPageProps) {
  const { recordId } = await params
  const user = await requireAuth()

  const record = await prisma.workRecord.findFirst({
    where: { id: recordId, userId: user.id },
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
      shareToken: true,
      organisation: { select: { slug: true, name: true } },
      specimen: {
        select: {
          slug: true,
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
    <div className="mx-auto max-w-2xl print:max-w-full">
      <Link
        href="/records"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-4 print:hidden')}
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        My record
      </Link>

      <article aria-label={`Record ${recordNum}`}>
        <header className="mb-6">
          <p className="font-mono text-xs text-muted-foreground">Record #{recordNum}</p>
          <ScientificName className="mt-1 text-2xl font-medium leading-tight">
            {record.scientificName}
          </ScientificName>
          {record.family && (
            <p className="text-sm text-muted-foreground">{record.family}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {record.organisation.name} ·{' '}
            <Link
              href={`/${record.organisation.slug}/specimens/${record.specimen.slug}`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {record.specimen.species.commonName}
            </Link>
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
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-0.5">
                  {label}
                </dt>
                <dd className={cn(value ? 'text-foreground' : 'text-muted-foreground/40')}>
                  {value ?? '—'}
                </dd>
              </div>
            )
          })}
        </dl>

        {/* Log entries — oldest first */}
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
      </article>

      {/* Print button */}
      <div className="mb-6 print:hidden">
        <PrintButton className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'no-underline')} />
      </div>

      {/* Sharing */}
      <div className="print:hidden">
        <ShareControls recordId={record.id} shareToken={record.shareToken} />
      </div>
    </div>
  )
}
