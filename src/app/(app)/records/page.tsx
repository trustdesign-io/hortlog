import Link from 'next/link'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { formatRecordDate, formatRecordNo, plantNameHtml } from '@/lib/personal-record'
import { TaxonName } from '@/components/records/taxon-name'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { UserAvatar } from '@/components/user-avatar'

export const metadata = {
  title: 'My record',
}

export default async function RecordsPage() {
  const user = await requireAuth()

  // Newest first, by the date the plant was first worked with
  const records = await prisma.workRecord.findMany({
    where: { userId: user.id },
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
      organisation: { select: { name: true } },
      specimen: {
        select: {
          imageUrl: true,
          species: { select: { photoUrl: true } },
        },
      },
    },
  })

  const totalEntries = await prisma.workLogEntry.count({
    where: { workRecord: { userId: user.id } },
  })

  const firstOrg = user.memberships[0]?.organisation ?? null

  const sites = new Set(records.map((r) => r.site ?? r.organisation.name))

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex flex-col items-center text-center">
        <UserAvatar user={user} className="h-20 w-20" fallbackClassName="text-xl" />
        <h1 className="mt-3 font-heading text-2xl font-semibold leading-tight">{user.name ?? user.email}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {user.recordPublic && user.username ? (
            <>
              Public:{' '}
              <Link href={`/u/${user.username}`} className="underline underline-offset-2 hover:text-foreground">
                hortlog.com/u/{user.username}
              </Link>
            </>
          ) : (
            <>
              Private ·{' '}
              <Link href="/settings" className="underline underline-offset-2 hover:text-foreground">
                Make public
              </Link>
            </>
          )}
        </p>
        {records.length > 0 && (
          <dl className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <div className="flex gap-1.5">
              <dt>Plants worked with</dt>
              <dd className="font-medium text-foreground">{records.length}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Log entries</dt>
              <dd className="font-medium text-foreground">{totalEntries}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Sites</dt>
              <dd className="font-medium text-foreground">{sites.size}</dd>
            </div>
          </dl>
        )}
      </header>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">You haven&apos;t recorded any work yet.</p>
          {firstOrg ? (
            <p className="mt-1 text-sm">
              Open a specimen in{' '}
              <Link
                href={`/${firstOrg.slug}/specimens`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {firstOrg.name}
              </Link>{' '}
              and tap &ldquo;Record work&rdquo; to get started.
            </p>
          ) : (
            <p className="mt-1 text-sm">
              Once you&apos;ve joined an organisation, open a specimen and tap &ldquo;Record work&rdquo;.
            </p>
          )}
        </div>
      ) : (
        <ol className="space-y-2" aria-label="Work records">
          {records.map((r) => (
            <li key={r.id}>
              <Link
                href={`/records/${r.id}`}
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
    </div>
  )
}
