import Link from 'next/link'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'
import { ScientificName } from '@/components/ui/scientific-name'
import { SpecimenImage } from '@/components/ui/specimen-image'

export const metadata = {
  title: 'My record',
}

export default async function RecordsPage() {
  const user = await requireAuth()

  const records = await prisma.workRecord.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      recordNumber: true,
      scientificName: true,
      family: true,
      organisation: { select: { slug: true, name: true } },
      specimen: {
        select: {
          slug: true,
          imageUrl: true,
          species: { select: { commonName: true } },
        },
      },
      logEntries: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true, action: true, location: true },
      },
      shareToken: true,
    },
  })

  const totalEntries = await prisma.workLogEntry.count({
    where: { workRecord: { userId: user.id } },
  })

  const sites = new Set(records.map((r) => r.organisation.name))

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">My record</h1>
        {records.length > 0 && (
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <div className="flex gap-1.5">
              <dt>Records</dt>
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
          <p className="mt-1 text-sm">
            Visit a specimen page in one of your{' '}
            <Link href="/" className="underline underline-offset-2 hover:text-foreground">
              organisations
            </Link>{' '}
            and hit &ldquo;Record work&rdquo; to get started.
          </p>
        </div>
      ) : (
        <ol className="space-y-2" aria-label="Work records">
          {records.map((record) => {
            const latest = record.logEntries[0]
            return (
              <li key={record.id}>
                <Link
                  href={`/records/${record.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {record.specimen.imageUrl !== null && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <SpecimenImage
                        imageUrl={record.specimen.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-snug">
                      <ScientificName className="text-sm">
                        {record.scientificName}
                      </ScientificName>
                    </p>
                    {record.family && (
                      <p className="truncate text-xs text-muted-foreground">{record.family}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    {latest && (
                      <>
                        <p>{WORK_ACTION_LABELS[latest.action]}</p>
                        <p>
                          {latest.date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {record.organisation.name}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    #{String(record.recordNumber).padStart(3, '0')}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
