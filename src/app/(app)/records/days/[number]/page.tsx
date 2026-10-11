import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import {
  CAPACITY_LABELS,
  formatRecordDate,
  formatRecordNo,
  parseRecordNumber,
  plantNameHtml,
  weekday,
} from '@/lib/personal-record'
import { Blank, FieldGroup, RecordField } from '@/components/records/record-field'
import { RecordHeader } from '@/components/records/record-header'
import { TaxonName } from '@/components/records/taxon-name'
import { Projects, quietLink, SourcesGroup } from '@/components/records/worked-record-sheet'
import { BackToRecord } from '@/components/records/back-to-record'
import { PrintButton } from '@/components/print-button'

interface DayPageProps {
  params: Promise<{ number: string }>
}

export const metadata = { title: 'Work day' }

export default async function WorkDayPage({ params }: DayPageProps) {
  const recordNumber = parseRecordNumber((await params).number)
  if (recordNumber === null) return notFound()
  const user = await requireAuth()

  const r = await prisma.workDay.findUnique({
    where: { userId_recordNumber: { userId: user.id, recordNumber } },
  })
  if (!r) return notFound()

  // Plants worked with that day: first recorded there that day, or with a log entry for it.
  const [plants, studied] = await Promise.all([
    prisma.workRecord.findMany({
      where: {
        userId: user.id,
        OR: [
          { firstWorkedDate: r.date, site: r.site },
          { logEntries: { some: { date: r.date, site: r.site } } },
        ],
      },
      select: { id: true, recordNumber: true, scientificName: true, nameHtml: true, authority: true },
      orderBy: { recordNumber: 'asc' },
    }),
    prisma.studiedRecord.findMany({
      where: { userId: user.id, date: r.date, site: r.site },
      select: { recordNumber: true, scientificName: true, nameHtml: true, authority: true },
      orderBy: { recordNumber: 'asc' },
    }),
  ])

  return (
    <div className="mx-auto max-w-2xl print:max-w-full">
      <BackToRecord />
      <article aria-label={`Record ${formatRecordNo('day', r.recordNumber)}`}>
        <RecordHeader
          kicker={`Work day · ${CAPACITY_LABELS[r.capacity]}`}
          titleHtml={r.site}
          recordNo={formatRecordNo('day', r.recordNumber)}
        />

        <FieldGroup>
          <RecordField label="Date">
            <time dateTime={r.date.toISOString().slice(0, 10)}>
              {weekday(r.date)} {formatRecordDate(r.date)}
            </time>
          </RecordField>
          <RecordField label="Site" value={r.site} />
          <Projects projects={r.projects} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="For" value={r.organisationName} />
          <RecordField label="Capacity" value={CAPACITY_LABELS[r.capacity]} />
          <RecordField label="With" value={r.withWhom} />
          {r.hours !== null && <RecordField label="Hours" value={String(r.hours)} />}
          {r.note && <RecordField label="Note" value={r.note} small />}
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Work done">
            {r.tasks.length === 0 ? (
              <Blank />
            ) : (
              <ul className="grid gap-1">
                {r.tasks.map((task) => (
                  <li key={task}>
                    <TaxonName html={task} />
                  </li>
                ))}
              </ul>
            )}
          </RecordField>
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Plants worked with">
            {plants.length === 0 ? (
              <span className="text-muted-foreground">None recorded for this day.</span>
            ) : (
              <ul className="grid gap-1">
                {plants.map((p) => (
                  <li key={p.id}>
                    <Link href={`/records/${p.id}`} className={quietLink}>
                      <span className="font-mono text-sm tabular-nums text-muted-foreground">
                        {formatRecordNo('worked', p.recordNumber)}{' '}
                      </span>
                      <TaxonName html={plantNameHtml(p)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </RecordField>
        </FieldGroup>

        {studied.length > 0 && (
          <FieldGroup>
            <RecordField label="Species studied">
              <ul className="grid gap-1">
                {studied.map((s) => (
                  <li key={s.recordNumber}>
                    <Link href={`/records/studied/${s.recordNumber}`} className={quietLink}>
                      <span className="font-mono text-sm tabular-nums text-muted-foreground">
                        {formatRecordNo('studied', s.recordNumber)}{' '}
                      </span>
                      <TaxonName html={plantNameHtml(s)} />
                    </Link>
                  </li>
                ))}
              </ul>
            </RecordField>
          </FieldGroup>
        )}

        <SourcesGroup sources={r.sources} openQuestions={r.openQuestions} />
      </article>
      <div className="mt-2 print:hidden">
        <PrintButton />
      </div>
    </div>
  )
}
