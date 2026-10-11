import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findPublicOwner, getPublicRecordList } from '@/lib/public-record-queries'
import { hiddenSummaryText } from '@/lib/public-record'
import { formatRecordDate, formatRecordNo, plantNameHtml } from '@/lib/personal-record'
import { TaxonName } from '@/components/records/taxon-name'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { UserAvatar } from '@/components/user-avatar'

interface PublicProfilePageProps {
  params: Promise<{ username: string }>
}

// Shared by link; search engines are asked not to list it
export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const owner = await findPublicOwner((await params).username)
  return {
    title: owner ? `${owner.name ?? owner.username} — work record` : 'Record not found',
    robots: { index: false, follow: false },
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const owner = await findPublicOwner((await params).username)
  if (!owner || !owner.username) return notFound()

  const { records, hidden } = await getPublicRecordList(owner.id)
  const displayName = owner.name ?? owner.username
  const sites = new Set(records.map((r) => r.site ?? r.organisation.name))
  const hiddenCount = hidden.reduce((n, h) => n + h.count, 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col items-center text-center">
        <UserAvatar
          user={{ name: owner.name, email: owner.username, avatarUrl: owner.avatarUrl }}
          className="h-20 w-20"
          fallbackClassName="text-xl"
        />
        <h1 className="mt-3 font-heading text-2xl font-semibold leading-tight">{displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Work record</p>
        <dl className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <div className="flex gap-1.5">
            <dt>Plants worked with</dt>
            <dd className="font-medium text-foreground">{records.length + hiddenCount}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Sites</dt>
            <dd className="font-medium text-foreground">{sites.size + hidden.length}</dd>
          </div>
        </dl>
      </header>

      {records.length === 0 && hidden.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing recorded yet.
        </p>
      ) : (
        <>
          {records.length > 0 && (
            <ol className="space-y-2" aria-label="Work records">
              {records.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/u/${owner.username}/${r.recordNumber}`}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
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
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          {hidden.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground" aria-label="Private collections">
              {hidden.map((h, i) => (
                <li key={i}>{hiddenSummaryText(h)}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
