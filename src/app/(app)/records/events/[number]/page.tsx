import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import {
  binomialKey,
  EVENT_KIND_LABELS,
  formatRecordDate,
  formatRecordNo,
  parseRecordNumber,
} from '@/lib/personal-record'
import { Blank, FieldGroup, RecordField } from '@/components/records/record-field'
import { RecordHeader } from '@/components/records/record-header'
import { TaxonName } from '@/components/records/taxon-name'
import { Projects, quietLink, SourcesGroup } from '@/components/records/worked-record-sheet'
import { BackToRecord } from '@/components/records/back-to-record'
import { PrintButton } from '@/components/print-button'

interface EventPageProps {
  params: Promise<{ number: string }>
}

export const metadata = { title: 'Event' }

export default async function EventRecordPage({ params }: EventPageProps) {
  const recordNumber = parseRecordNumber((await params).number)
  if (recordNumber === null) return notFound()
  const user = await requireAuth()

  const r = await prisma.eventRecord.findUnique({
    where: { userId_recordNumber: { userId: user.id, recordNumber } },
  })
  if (!r) return notFound()

  // Species seen link to the member's own record of them, worked-with first.
  const [worked, studied] = await Promise.all([
    prisma.workRecord.findMany({
      where: { userId: user.id },
      select: { id: true, recordNumber: true, scientificName: true },
      orderBy: { recordNumber: 'asc' },
    }),
    prisma.studiedRecord.findMany({
      where: { userId: user.id },
      select: { recordNumber: true, scientificName: true },
      orderBy: { recordNumber: 'asc' },
    }),
  ])
  const findRecord = (nameHtml: string): { href: string; no: string } | null => {
    const key = binomialKey(nameHtml)
    if (!key) return null
    const w = worked.find((x) => binomialKey(x.scientificName) === key)
    if (w) return { href: `/records/${w.id}`, no: formatRecordNo('worked', w.recordNumber) }
    const s = studied.find((x) => binomialKey(x.scientificName) === key)
    if (s) return { href: `/records/studied/${s.recordNumber}`, no: formatRecordNo('studied', s.recordNumber) }
    return null
  }

  return (
    <div className="mx-auto max-w-2xl print:max-w-full">
      <BackToRecord />
      <article aria-label={`Record ${formatRecordNo('event', r.recordNumber)}`}>
        <RecordHeader
          kicker={`Event · ${EVENT_KIND_LABELS[r.kind]}`}
          titleHtml={r.title}
          recordNo={formatRecordNo('event', r.recordNumber)}
        />

        <FieldGroup>
          <RecordField label="Date">
            <time dateTime={r.date.toISOString().slice(0, 10)}>{formatRecordDate(r.date)}</time>
          </RecordField>
          <RecordField label="Place" value={r.site} />
          <Projects projects={r.projects} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Organiser or speaker" value={r.organiser} />
          {r.url && (
            <RecordField label="Link">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                {r.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </RecordField>
          )}
          {r.note && <RecordField label="Note" value={r.note} small />}
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Notes" value={r.notes} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Species">
            {r.species.length === 0 ? (
              <Blank />
            ) : (
              <ul className="grid gap-1">
                {r.species.map((name) => {
                  const own = findRecord(name)
                  return (
                    <li key={name}>
                      {own ? (
                        <Link href={own.href} className={quietLink}>
                          <TaxonName html={name} />
                          <span className="text-sm text-muted-foreground"> · {own.no}</span>
                        </Link>
                      ) : (
                        <TaxonName html={name} />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </RecordField>
        </FieldGroup>

        <SourcesGroup sources={r.sources} openQuestions={r.openQuestions} />
      </article>
      <div className="mt-2 print:hidden">
        <PrintButton />
      </div>
    </div>
  )
}
