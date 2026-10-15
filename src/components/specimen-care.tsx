import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatRecordDate } from '@/lib/personal-record'
import {
  MEMBER_CARE_LIMIT,
  PUBLIC_CARE_LIMIT,
  toCareEntry,
} from '@/lib/specimen-care'

interface SpecimenCareProps {
  specimenId: string
  /** Members of the specimen's organisation see everyone's names and notes. */
  audience: 'public' | 'members'
}

/** Care logged on this plant by everyone who has worked with it, newest first. */
export async function SpecimenCare({ specimenId, audience }: SpecimenCareProps) {
  const rows = await prisma.workLogEntry.findMany({
    where: { workRecord: { specimenId } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: audience === 'public' ? PUBLIC_CARE_LIMIT : MEMBER_CARE_LIMIT,
    select: {
      id: true,
      date: true,
      action: true,
      actionNote: true,
      text: true,
      workRecord: {
        select: {
          user: { select: { name: true, username: true, recordPublic: true, creditOnPlants: true } },
        },
      },
    },
  })
  const entries = rows.map((row) => toCareEntry(row, audience))
  const isMembers = audience === 'members'

  // Nothing to say publicly about a plant nobody has logged yet
  if (entries.length === 0 && !isMembers) return null

  return (
    <section className="mt-6 border-t pt-6" aria-labelledby="care-heading">
      <h2 id="care-heading" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {isMembers ? 'Care history' : 'Recent care'}
      </h2>
      {isMembers && (
        <p className="mt-1 text-xs text-muted-foreground">
          Everyone&apos;s work on this plant. Visitors see the latest {PUBLIC_CARE_LIMIT}, without notes, and only
          the names of people who chose to be credited.
        </p>
      )}

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No care logged yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <time
                dateTime={entry.date.toISOString().slice(0, 10)}
                className="w-24 shrink-0 pt-0.5 text-xs text-muted-foreground"
              >
                {formatRecordDate(entry.date, 'short')}
              </time>
              <span className="sr-only">: </span>
              <div className="min-w-0 flex-1">
                <p className="leading-snug">
                  <span className="font-medium">{entry.label}</span>
                  {entry.by && (
                    <span className="text-muted-foreground">
                      {' by '}
                      {entry.by.href ? (
                        <Link href={entry.by.href} className="underline underline-offset-2 hover:text-foreground">
                          {entry.by.name}
                        </Link>
                      ) : (
                        entry.by.name
                      )}
                    </span>
                  )}
                </p>
                {entry.note && <p className="mt-1 leading-relaxed text-foreground/80">{entry.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
