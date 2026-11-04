import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireAuth, isAdmin } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { formatRecordDate, formatRecordNo, plantNameHtml, stripTags } from '@/lib/personal-record'
import { TaxonName } from '@/components/records/taxon-name'
import { RecordSearch } from '@/components/records/record-search'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { UserAvatar } from '@/components/user-avatar'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'

export const metadata = { title: 'Admin — Work record', robots: { index: false, follow: false } }

interface AdminUserRecordPageProps {
  params: Promise<{ userId: string }>
}

/** A platform admin's read-only view of anyone's whole work record, private gardens included. */
export default async function AdminUserRecordPage({ params }: AdminUserRecordPageProps) {
  const viewer = await requireAuth()
  if (!isAdmin(viewer)) return notFound()
  const { userId } = await params

  const person = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true, username: true, recordPublic: true },
  })
  if (!person) return notFound()

  const records = await prisma.workRecord.findMany({
    where: { userId },
    orderBy: [{ firstWorkedDate: 'desc' }, { recordNumber: 'desc' }],
    select: {
      id: true,
      recordNumber: true,
      firstWorkedDate: true,
      scientificName: true,
      nameHtml: true,
      authority: true,
      family: true,
      site: true,
      commonNames: true,
      organisation: { select: { name: true } },
      specimen: { select: { imageUrl: true, species: { select: { photoUrl: true, commonName: true } } } },
      logEntries: {
        orderBy: { date: 'desc' },
        select: { id: true, date: true, action: true, actionNote: true, location: true, text: true },
      },
    },
  })

  const displayName = person.name ?? person.email
  const sites = new Set(records.map((r) => r.site ?? r.organisation.name))
  const entryCount = records.reduce((n, r) => n + r.logEntries.length, 0)

  return (
    <div className="space-y-6">
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        All users
      </Link>

      <header className="flex items-center gap-4">
        <UserAvatar user={person} className="h-14 w-14" fallbackClassName="text-base" />
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-medium leading-tight">{displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {records.length} plant{records.length === 1 ? '' : 's'} · {entryCount} entr{entryCount === 1 ? 'y' : 'ies'} ·{' '}
            {sites.size} site{sites.size === 1 ? '' : 's'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {person.recordPublic && person.username ? (
              <>
                Public record:{' '}
                <Link href={`/u/${person.username}`} className="underline underline-offset-2">
                  hortlog.com/u/{person.username}
                </Link>
              </>
            ) : (
              'Their record is private. Only admins can see this page.'
            )}
          </p>
        </div>
      </header>

      {records.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing recorded yet.
        </p>
      ) : (
        <RecordSearch
          records={records.map((r) => ({
            id: r.id,
            fields: [
              stripTags(plantNameHtml(r)),
              r.scientificName,
              r.commonNames,
              r.specimen.species.commonName,
              r.family,
              r.site ?? r.organisation.name,
              r.organisation.name,
              formatRecordNo(r.recordNumber),
              String(r.recordNumber),
              formatRecordDate(r.firstWorkedDate),
            ],
            node: (
              <details className="group rounded-lg border bg-card text-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    <SpecimenImage
                      imageUrl={r.specimen.imageUrl ?? r.specimen.species.photoUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatRecordNo(r.recordNumber)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading leading-snug">
                      <TaxonName html={plantNameHtml(r)} />
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <time dateTime={r.firstWorkedDate.toISOString().slice(0, 10)}>
                        {formatRecordDate(r.firstWorkedDate, 'short')}
                      </time>
                      {[r.family, (r.site ?? r.organisation.name).split(',')[0]]
                        .filter(Boolean)
                        .map((part) => ` · ${part}`)}
                      {` · ${r.logEntries.length} entr${r.logEntries.length === 1 ? 'y' : 'ies'}`}
                    </p>
                  </div>
                </summary>
                <ol className="space-y-2 border-t px-3 py-3" aria-label="Work entries">
                  {r.logEntries.map((e) => (
                    <li key={e.id}>
                      <p className="text-xs text-muted-foreground">
                        <time dateTime={e.date.toISOString().slice(0, 10)}>{formatRecordDate(e.date, 'short')}</time>
                        {' · '}
                        <span className="font-medium text-foreground">
                          {e.action === 'OTHER' && e.actionNote ? e.actionNote : WORK_ACTION_LABELS[e.action]}
                        </span>
                        {e.location && ` · ${e.location}`}
                      </p>
                      {e.text && <p className="mt-0.5 whitespace-pre-line">{e.text}</p>}
                    </li>
                  ))}
                </ol>
              </details>
            ),
          }))}
        />
      )}
    </div>
  )
}
