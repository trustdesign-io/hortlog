import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { findDayFor, findSpeciesPhoto } from '@/lib/personal-record-queries'
import { formatRecordDate, formatRecordNo, parseRecordNumber, plantNameHtml, stripTags } from '@/lib/personal-record'
import { FieldGroup, RecordField } from '@/components/records/record-field'
import { RecordHeader } from '@/components/records/record-header'
import { ReferencePhoto } from '@/components/records/reference-photo'
import { DayLink, Projects, SourcesGroup } from '@/components/records/worked-record-sheet'
import { BackToRecord } from '@/components/records/back-to-record'
import { PrintButton } from '@/components/print-button'

interface StudiedPageProps {
  params: Promise<{ number: string }>
}

export const metadata = { title: 'Species studied' }

export default async function StudiedRecordPage({ params }: StudiedPageProps) {
  const recordNumber = parseRecordNumber((await params).number)
  if (recordNumber === null) return notFound()
  const user = await requireAuth()

  const r = await prisma.studiedRecord.findUnique({
    where: { userId_recordNumber: { userId: user.id, recordNumber } },
  })
  if (!r) return notFound()

  const [day, photo] = await Promise.all([
    findDayFor(user.id, r.date, r.site),
    findSpeciesPhoto(r.scientificName),
  ])
  const nameHtml = plantNameHtml(r)

  return (
    <div className="mx-auto max-w-2xl print:max-w-full">
      <BackToRecord />
      <article aria-label={`Record ${formatRecordNo('studied', r.recordNumber)}`}>
        <RecordHeader kicker="Species studied" titleHtml={nameHtml} recordNo={formatRecordNo('studied', r.recordNumber)} />
        {photo && <ReferencePhoto species={photo} name={stripTags(nameHtml)} />}

        <FieldGroup>
          <RecordField label="Date">
            <time dateTime={r.date.toISOString().slice(0, 10)}>{formatRecordDate(r.date)}</time>
          </RecordField>
          <RecordField label="Where" value={r.site} />
          {day && <DayLink day={day} privateLinks />}
          <Projects projects={r.projects} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Family" value={r.family} />
          <RecordField label="How studied" value={r.howStudied} />
          {r.note && <RecordField label="Note" value={r.note} small />}
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Common names" value={r.commonNames} />
          <RecordField label="Native range" value={r.nativeRange} />
          <RecordField label="Habit" value={r.habit} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Diagnostic" value={r.diagnostic} />
          <RecordField label="Near misses" value={r.nearMisses} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Observed" value={r.observed} />
        </FieldGroup>

        <SourcesGroup sources={r.sources} openQuestions={r.openQuestions} powoUrl={r.powoUrl} />
      </article>
      <div className="mt-2 print:hidden">
        <PrintButton />
      </div>
    </div>
  )
}
