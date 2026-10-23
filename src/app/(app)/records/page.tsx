import Link from 'next/link'
import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { formatRecordDate, formatRecordNo, plantNameHtml, stripTags } from '@/lib/personal-record'
import { TaxonName } from '@/components/records/taxon-name'
import { RecordSearch } from '@/components/records/record-search'
import { SpecimenImage } from '@/components/ui/specimen-image'
import { UserAvatar } from '@/components/user-avatar'
import { AddToMyRecord } from '@/components/add-to-my-record'
import { NotMeButton } from '@/components/not-me-button'
import { SupervisorPicker } from '@/components/supervisor-picker'
import { WORK_ACTION_LABELS } from '@/lib/work-record-constants'

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
      commonNames: true,
      location: true,
      organisation: { select: { name: true } },
      specimen: {
        select: {
          imageUrl: true,
          species: { select: { photoUrl: true, commonName: true } },
        },
      },
    },
  })

  const totalEntries = await prisma.workLogEntry.count({
    where: { workRecord: { userId: user.id } },
  })

  // Work someone else logged and tagged you on: shown, not numbered into your record
  const workedWith = await prisma.workLogEntry.findMany({
    where: { coworkers: { some: { userId: user.id } } },
    orderBy: { date: 'desc' },
    take: 50,
    select: {
      id: true,
      date: true,
      action: true,
      // Your tag on it, and your copy once you've added it to your record
      coworkers: { where: { userId: user.id }, select: { acceptedEntry: { select: { workRecordId: true } } } },
      workRecord: {
        select: {
          scientificName: true,
          user: { select: { name: true, email: true } },
          organisation: { select: { slug: true } },
          specimen: { select: { slug: true } },
        },
      },
    },
  })

  const firstOrg = user.memberships[0]?.organisation ?? null

  // Who signs off your work in each of your gardens, and who you could choose
  const [supervisions, orgMembers] = await Promise.all([
    prisma.supervision.findMany({ where: { traineeId: user.id }, select: { organisationId: true, supervisorId: true } }),
    prisma.membership.findMany({
      where: { organisationId: { in: user.memberships.map((m) => m.organisation.id) }, userId: { not: user.id } },
      select: { organisationId: true, user: { select: { id: true, name: true, email: true } } },
    }),
  ])
  const supervisorChoices = user.memberships.map((m) => ({
    orgSlug: m.organisation.slug,
    orgName: m.organisation.name,
    currentId: supervisions.find((s) => s.organisationId === m.organisation.id)?.supervisorId ?? null,
    members: orgMembers
      .filter((o) => o.organisationId === m.organisation.id)
      .map((o) => ({ id: o.user.id, name: o.user.name ?? o.user.email }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }))

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
              Add or open a plant in{' '}
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
          <p className="mt-3 text-sm">
            Volunteer or work at another garden?{' '}
            <Link href="/gardens" className="underline underline-offset-2 hover:text-foreground">
              Find it and ask to join
            </Link>
            .
          </p>
        </div>
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
              r.location,
              formatRecordNo(r.recordNumber),
              String(r.recordNumber),
              formatRecordDate(r.firstWorkedDate),
            ],
            node: (
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
            ),
          }))}
        />
      )}

      {supervisorChoices.length > 0 && <SupervisorPicker choices={supervisorChoices} />}

      {workedWith.length > 0 && (
        <section aria-labelledby="worked-with" className="mt-8 space-y-3">
          <h2 id="worked-with" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Worked on with others
          </h2>
          <ol className="divide-y rounded-xl border bg-card">
            {workedWith.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <Link
                  href={`/${e.workRecord.organisation.slug}/specimens/${e.workRecord.specimen.slug}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium">
                    {WORK_ACTION_LABELS[e.action]} · <i lang="la">{e.workRecord.scientificName}</i>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={e.date.toISOString().slice(0, 10)}>{formatRecordDate(e.date, 'short')}</time>
                    {` · logged by ${e.workRecord.user.name?.trim() || e.workRecord.user.email}`}
                  </p>
                </Link>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <AddToMyRecord entryId={e.id} recordId={e.coworkers[0]?.acceptedEntry?.workRecordId ?? null} />
                  <NotMeButton entryId={e.id} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
