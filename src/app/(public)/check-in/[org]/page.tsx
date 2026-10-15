import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { CheckInButton } from '@/components/offline/check-in-button'
import { publicScenePath } from '@/lib/scene-urls'

interface PageProps {
  params: Promise<{ org: string }>
}

async function getVenue(slug: string) {
  return prisma.organisation.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      scenes: {
        where: { active: true },
        select: { id: true, name: true, title: true, slug: true, primaryCollection: { select: { slug: true } }, _count: { select: { specimens: true } } },
        orderBy: { name: 'asc' },
      },
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const venue = await getVenue((await params).org)
  return venue ? { title: `Check in at ${venue.name}` } : {}
}

/** A venue: save it to the phone for use without signal, and its scenes. */
export default async function VenueCheckInPage({ params }: PageProps) {
  const venue = await getVenue((await params).org)
  if (!venue) return notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Link href="/check-in" className="-ml-1 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-0.5 h-4 w-4" aria-hidden="true" />
          All gardens
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-medium">{venue.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Save the garden to your phone so its plants open even where there&rsquo;s no signal.
        </p>
      </div>

      <CheckInButton orgSlug={venue.slug} />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Scenes</h2>
        {venue.scenes.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            The garden&rsquo;s scenes are still being set up.
          </p>
        )}
        <ul role="list" className="divide-y overflow-hidden rounded-xl border bg-card empty:hidden">
          {venue.scenes.map((s) => (
            <li key={s.id}>
              <Link
                href={publicScenePath(venue.slug, s.slug, s.primaryCollection?.slug ?? null)}
                className="flex min-h-12 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1 font-medium">
                  {s.title ?? s.name}
                  {s.title && <span className="block text-xs font-normal text-muted-foreground">{s.name}</span>}
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {s._count.specimens} plant{s._count.specimens === 1 ? '' : 's'}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
