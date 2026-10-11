import Link from 'next/link'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import {
  CAPACITY_LABELS,
  EVENT_KIND_LABELS,
  formatRecordDate,
  formatRecordNo,
  isRecordType,
  plantNameHtml,
  RECORD_TYPE_LABELS,
  RECORD_TYPES,
  type RecordType,
} from '@/lib/personal-record'
import { TaxonName } from '@/components/records/taxon-name'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'My record',
}

interface RecordsPageProps {
  searchParams: Promise<{ type?: string }>
}

interface ListEntry {
  key: string
  type: RecordType
  recordNo: string
  date: Date
  href: string
  titleHtml: string
  detail: string | null
}

const KICKERS: Record<RecordType, string> = {
  worked: 'Worked with',
  studied: 'Studied',
  event: 'Event',
  day: 'Work day',
}

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const user = await requireAuth()
  const { type: typeParam } = await searchParams
  const filter: RecordType | null = isRecordType(typeParam) ? typeParam : null

  const [worked, studied, events, days] = await Promise.all([
    prisma.workRecord.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        recordNumber: true,
        firstWorkedDate: true,
        scientificName: true,
        nameHtml: true,
        authority: true,
        family: true,
        site: true,
        organisation: { select: { name: true } },
      },
    }),
    prisma.studiedRecord.findMany({
      where: { userId: user.id },
      select: {
        recordNumber: true,
        date: true,
        scientificName: true,
        nameHtml: true,
        authority: true,
        family: true,
      },
    }),
    prisma.eventRecord.findMany({
      where: { userId: user.id },
      select: { recordNumber: true, date: true, title: true, kind: true, site: true },
    }),
    prisma.workDay.findMany({
      where: { userId: user.id },
      select: { recordNumber: true, date: true, site: true, capacity: true, organisationName: true },
    }),
  ])

  const entries: ListEntry[] = [
    ...worked.map((r) => ({
      key: `w${r.recordNumber}`,
      type: 'worked' as const,
      recordNo: formatRecordNo('worked', r.recordNumber),
      date: r.firstWorkedDate,
      href: `/records/${r.id}`,
      titleHtml: plantNameHtml(r),
      detail: [r.family, (r.site ?? r.organisation.name).split(',')[0]].filter(Boolean).join(' · '),
    })),
    ...studied.map((r) => ({
      key: `s${r.recordNumber}`,
      type: 'studied' as const,
      recordNo: formatRecordNo('studied', r.recordNumber),
      date: r.date,
      href: `/records/studied/${r.recordNumber}`,
      titleHtml: plantNameHtml(r),
      detail: r.family,
    })),
    ...events.map((r) => ({
      key: `e${r.recordNumber}`,
      type: 'event' as const,
      recordNo: formatRecordNo('event', r.recordNumber),
      date: r.date,
      href: `/records/events/${r.recordNumber}`,
      titleHtml: r.title,
      detail: `${EVENT_KIND_LABELS[r.kind]} · ${r.site.split(',')[0]}`,
    })),
    ...days.map((r) => ({
      key: `d${r.recordNumber}`,
      type: 'day' as const,
      recordNo: formatRecordNo('day', r.recordNumber),
      date: r.date,
      href: `/records/days/${r.recordNumber}`,
      titleHtml: r.site,
      detail: [CAPACITY_LABELS[r.capacity], r.organisationName].filter(Boolean).join(' · '),
    })),
  ]
    .filter((e) => filter === null || e.type === filter)
    // Newest first; on the same day, a work day before what was done on it.
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime() ||
        RECORD_TYPES.indexOf(b.type) - RECORD_TYPES.indexOf(a.type) ||
        b.recordNo.localeCompare(a.recordNo),
    )

  const counts: Record<RecordType, number> = {
    worked: worked.length,
    studied: studied.length,
    event: events.length,
    day: days.length,
  }
  const total = worked.length + studied.length + events.length + days.length

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">My record</h1>
        {total > 0 && (
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {RECORD_TYPES.map((t) => (
              <div key={t} className="flex gap-1.5">
                <dt>{RECORD_TYPE_LABELS[t]}</dt>
                <dd className="font-medium text-foreground">{counts[t]}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">You haven&apos;t recorded any work yet.</p>
          <p className="mt-1 text-sm">
            Visit a specimen page in one of your{' '}
            <Link href="/" className="underline underline-offset-2 hover:text-foreground">
              organisations
            </Link>{' '}
            and hit &ldquo;Record work&rdquo; to get started.
          </p>
        </div>
      ) : (
        <>
          <nav aria-label="Filter by type" className="-mx-4 mb-4 overflow-x-auto px-4">
            <ul className="flex w-max gap-2">
              {[null, ...RECORD_TYPES].map((t) => {
                const active = t === filter
                return (
                  <li key={t ?? 'all'}>
                    <Link
                      href={t ? `/records?type=${t}` : '/records'}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex min-h-9 items-center rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-card hover:bg-muted/50',
                      )}
                    >
                      {t ? RECORD_TYPE_LABELS[t] : 'All'}
                      <span className={cn('ml-1.5 tabular-nums', active ? 'opacity-80' : 'text-muted-foreground')}>
                        {t ? counts[t] : total}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <ol className="space-y-2" aria-label="Records">
            {entries.map((e) => (
              <li key={e.key}>
                <Link
                  href={e.href}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="w-11 shrink-0 pt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {e.recordNo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading leading-snug">
                      <TaxonName html={e.titleHtml} />
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="sr-only">{KICKERS[e.type]}. </span>
                      <time dateTime={e.date.toISOString().slice(0, 10)}>
                        {formatRecordDate(e.date, 'short')}
                      </time>
                      {e.detail && ` · ${e.detail}`}
                    </p>
                  </div>
                  <span className="hidden shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-accent-foreground sm:inline">
                    {KICKERS[e.type]}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
