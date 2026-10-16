import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { VenuePicker } from './venue-picker'

export const metadata: Metadata = {
  title: 'Check in',
  description: 'Choose the garden you’re visiting to explore its plants.',
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
        <p className="mt-2 text-muted-foreground">Choose the garden you&rsquo;re visiting.</p>
      </div>
      <VenuePicker venues={venues.map((v) => ({ slug: v.slug, name: v.name, scenes: v._count.scenes }))} />
    </div>
  )
}
