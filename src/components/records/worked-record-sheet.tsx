import Link from 'next/link'
import { Heart } from 'lucide-react'
import { likedByLine } from '@/lib/likes'
import type { Prisma } from '@prisma/client'
import type { WORKED_RECORD_SELECT } from '@/lib/personal-record-queries'
import {
  formatRecordDate,
  formatRecordNo,
  plantNameHtml,
  renderInline,
  stripTags,
} from '@/lib/personal-record'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'
import { Blank, FIELD_LABEL_CLASS, FieldGroup, RecordField } from './record-field'
import { RecordHeader } from './record-header'
import { ReferencePhoto } from './reference-photo'

export type WorkedRecordData = Prisma.WorkRecordGetPayload<{ select: typeof WORKED_RECORD_SELECT }>

interface WorkedRecordSheetProps {
  record: WorkedRecordData
  /** False on public pages: no links into the member's private pages. */
  privateLinks?: boolean
  /**
   * Set on the public record. Exact locations and grid references are never shown;
   * Note and Open questions only when the member chose to include them.
   */
  publicView?: { showNotes: boolean }
  /** On the member's own record: who liked each entry, by entry id */
  likes?: Record<string, string[]>
}

export const quietLink = 'underline decoration-border underline-offset-2 hover:decoration-foreground'

export function Projects({ projects }: { projects: string[] }) {
  if (projects.length === 0) return null
  return <RecordField label={projects.length === 1 ? 'Project' : 'Projects'} value={projects.join('; ')} />
}

export function SourcesGroup({
  sources,
  openQuestions,
  powoUrl,
}: {
  sources: string | null
  /** Undefined leaves the field out altogether (public record without notes). */
  openQuestions?: string | null
  powoUrl?: string | null
}) {
  return (
    <FieldGroup last>
      <RecordField label="Sources" small>
        {sources ? renderInline(sources) : <Blank />}
        {powoUrl && (
          <span className="print:hidden">
            {' '}
            <a
              href={powoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap underline underline-offset-2 hover:text-foreground"
            >
              Scene on POWO
            </a>
          </span>
        )}
      </RecordField>
      {openQuestions !== undefined && <RecordField label="Open questions" value={openQuestions} small />}
    </FieldGroup>
  )
}


/** A plant worked with, in the record book's fixed field order. Blank fields stay visible. */
export function WorkedRecordSheet({
  record: r,
  privateLinks = true,
  publicView,
  likes,
}: WorkedRecordSheetProps) {
  const showLocation = !publicView
  const showNotes = !publicView || publicView.showNotes
  const nameHtml = plantNameHtml(r)
  const site = r.site ?? r.organisation.name
  const species = r.specimen.species

  return (
    <article aria-label={`Record ${formatRecordNo(r.recordNumber)}`}>
      <RecordHeader kicker="Plant record" titleHtml={nameHtml} recordNo={formatRecordNo(r.recordNumber)}>
        <p className="mt-2 text-sm text-muted-foreground">
          {privateLinks ? (
            <Link href={`/${r.organisation.slug}/specimens/${r.specimen.slug}`} className={quietLink}>
              {species.commonName}
            </Link>
          ) : (
            species.commonName
          )}
          {' · '}
          {r.organisation.name}
        </p>
      </RecordHeader>

      <ReferencePhoto species={species} name={stripTags(nameHtml)} />

      <div>
        <FieldGroup>
          <RecordField label="Date">
            <time dateTime={r.firstWorkedDate.toISOString().slice(0, 10)}>
              {formatRecordDate(r.firstWorkedDate)}
            </time>
          </RecordField>
          <RecordField label="Site" value={site} />
          {showLocation && <RecordField label="Location" value={r.location} />}
          <RecordField label="Vice-county" value={r.viceCounty} />
          {showLocation && <RecordField label="Grid ref." value={r.gridRef} />}
          <Projects projects={r.projects} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Family" value={r.family} />
          <RecordField label="Det." value={r.determination} />
          <RecordField label="Label read" value={r.labelText} />
          {showNotes && r.note && <RecordField label="Note" value={r.note} small />}
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Common names" value={r.commonNames} />
          <RecordField label="Native range" value={r.nativeRange} />
          <RecordField label="Habit" value={r.habit} />
          <RecordField label="Provenance" value={r.provenance} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Diagnostic" value={r.diagnostic} />
          <RecordField label="Near misses" value={r.nearMisses} />
        </FieldGroup>

        <FieldGroup>
          <RecordField label="Work done" value={r.workDone} />
          <RecordField label="Observed" value={r.observed} />
          {r.howStudied && <RecordField label="How studied" value={r.howStudied} />}
        </FieldGroup>

        {r.logEntries.length > 0 && (
          <FieldGroup>
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[8.5rem_1fr]">
              <dt className={FIELD_LABEL_CLASS}>Log</dt>
              <dd>
                <ol className="grid gap-4">
                  {r.logEntries.map((e) => {
                    const showAction = e.action !== 'OTHER' || e.actionNote !== null || e.text === null
                    return (
                      <li key={e.id} className="grid gap-1 border-l-2 border-border pl-3">
                        <p className="text-sm text-muted-foreground">
                          <time dateTime={e.date.toISOString().slice(0, 10)} className="text-foreground">
                            {formatRecordDate(e.date)}
                          </time>
                          {showLocation && e.location && ` · ${e.location}`}
                        </p>
                        {showAction && (
                          <p className="font-medium">
                            {WORK_ACTION_LABELS[e.action]}
                            {e.actionNote && <span className="font-normal text-muted-foreground"> — {e.actionNote}</span>}
                          </p>
                        )}
                        {e.text && <p className="min-w-0 break-words">{renderInline(e.text)}</p>}
                        {likes?.[e.id]?.length ? (
                          <p className="flex items-center gap-1 text-xs text-pink-600 dark:text-pink-400 print:hidden">
                            <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                            <span>{likedByLine(likes[e.id])}</span>
                          </p>
                        ) : null}
                      </li>
                    )
                  })}
                </ol>
              </dd>
            </div>
          </FieldGroup>
        )}

        <SourcesGroup
          sources={r.sources}
          openQuestions={showNotes ? r.openQuestions : undefined}
          powoUrl={r.powoUrl ?? species.powoUrl}
        />
      </div>
    </article>
  )
}
