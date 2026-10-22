import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { formatRecordDate } from '@/lib/personal-record'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'
import { SignOffButton } from '@/components/sign-off-button'

export const metadata = { title: 'Supervising' }

/** The members who chose you as their supervisor, and their work to sign off, newest first */
export default async function SupervisingPage() {
  const user = await requireAuth()
  const supervisions = await prisma.supervision.findMany({
    where: { supervisorId: user.id },
    orderBy: { createdAt: 'asc' },
    select: {
      organisationId: true,
      organisation: { select: { name: true, slug: true } },
      trainee: { select: { id: true, name: true, email: true } },
    },
  })

  const trainees = await Promise.all(
    supervisions.map(async (s) => {
      const entries = await prisma.workLogEntry.findMany({
        where: { workRecord: { userId: s.trainee.id, organisationId: s.organisationId } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 60,
        select: {
          id: true,
          date: true,
          action: true,
          actionNote: true,
          text: true,
          signedOffAt: true,
          signOffComment: true,
          workRecord: { select: { scientificName: true, specimen: { select: { slug: true } } } },
        },
      })
      return { ...s, entries, toSign: entries.filter((e) => !e.signedOffAt).length }
    }),
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Supervising</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Members who chose you as their supervisor (for an apprenticeship or training). Sign off their work as you check
          it; a changed entry comes back here to sign again.
        </p>
      </div>

      {trainees.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nobody has chosen you as their supervisor yet. Members choose theirs on My record.
        </p>
      ) : (
        trainees.map((t) => (
          <section key={`${t.organisationId}-${t.trainee.id}`} aria-labelledby={`trainee-${t.trainee.id}-${t.organisationId}`} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`trainee-${t.trainee.id}-${t.organisationId}`} className="font-heading text-lg">
                {t.trainee.name ?? t.trainee.email}
                <span className="ml-2 text-sm font-normal text-muted-foreground">{t.organisation.name}</span>
              </h2>
              <span className="shrink-0 text-sm text-muted-foreground">{t.toSign} to sign off</span>
            </div>
            {t.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No work logged here yet.</p>
            ) : (
              <ol className="divide-y rounded-xl border bg-card">
                {t.entries.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {WORK_ACTION_LABELS[e.action]}
                        {e.actionNote && <span className="font-normal text-muted-foreground"> — {e.actionNote}</span>}
                        {' · '}
                        <Link href={`/${t.organisation.slug}/specimens/${e.workRecord.specimen.slug}`} className="underline-offset-2 hover:underline">
                          <i lang="la">{e.workRecord.scientificName}</i>
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <time dateTime={e.date.toISOString().slice(0, 10)}>{formatRecordDate(e.date, 'short')}</time>
                      </p>
                      {e.text && <p className="mt-1 text-sm text-foreground/80">{e.text}</p>}
                      {e.signedOffAt && (
                        <p className="mt-1 flex items-start gap-1 text-xs text-primary">
                          <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            Signed off {formatRecordDate(e.signedOffAt, 'short')}
                            {e.signOffComment && <> — &ldquo;{e.signOffComment}&rdquo;</>}
                          </span>
                        </p>
                      )}
                    </div>
                    <SignOffButton entryId={e.id} signed={e.signedOffAt !== null} />
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))
      )}
    </div>
  )
}
