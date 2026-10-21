import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { VenuePicker } from './venue-picker'

export const metadata: Metadata = {
  title: 'Check in',
  description: 'Save a garden’s plants to your phone, so its labels still open where there’s no signal.',
}

export default async function CheckInPage() {
  // Venues with at least one scene in use
  const venues = await prisma.organisation.findMany({
    where: { scenes: { some: { active: true } } },
    select: { slug: true, name: true, _count: { select: { scenes: { where: { active: true } } } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div data-daylight="" className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-heading text-3xl font-medium">Check in</h1>
        <p className="mt-2 text-muted-foreground">
          Visiting a garden? Checking in saves its plants to your phone, so every label you scan still opens when
          there&rsquo;s no signal &mdash; deep in a glasshouse, or at the far end of the grounds.
        </p>
      </div>

      <section aria-labelledby="how-check-in-works" className="rounded-xl border bg-card p-4">
        <h2 id="how-check-in-works" className="text-sm font-medium">
          How it works
        </h2>
        <ol className="mt-3 space-y-3 text-sm">
          {[
            ['Choose the garden', 'Pick it from the list below, before you lose signal.'],
            ['Save it to your phone', 'One tap. It takes a moment, and stays on your phone for 30 days.'],
            ['Explore', 'Scan a QR label, or browse the beds, to find out what each plant is and where it comes from.'],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span>
                <span className="font-medium">{title}.</span>{' '}
                <span className="text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">No account needed.</p>
      </section>

      <h2 className="font-heading text-lg font-medium">Choose the garden you&rsquo;re visiting</h2>
      <VenuePicker venues={venues.map((v) => ({ slug: v.slug, name: v.name, scenes: v._count.scenes }))} />
    </div>
  )
}
