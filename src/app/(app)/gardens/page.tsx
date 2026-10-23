import { requireAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import type { GardenStatus } from '@/lib/join-requests'
import { GardenFinder } from './garden-finder'

export const metadata = { title: 'Find a garden' }
export const dynamic = 'force-dynamic'

export default async function GardensPage() {
  const user = await requireAuth()

  const [gardens, requests] = await Promise.all([
    prisma.organisation.findMany({
      where: { personal: false },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true, logoUrl: true, postcode: true },
    }),
    prisma.joinRequest.findMany({
      where: { userId: user.id },
      select: { organisation: { select: { slug: true } }, declinedAt: true },
    }),
  ])

  const status = (slug: string): GardenStatus => {
    if (user.memberships.some((m) => m.organisation.slug === slug)) return 'member'
    const r = requests.find((q) => q.organisation.slug === slug)
    return r ? (r.declinedAt ? 'declined' : 'asked') : 'none'
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Find a garden</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Volunteer or work at a garden on hortlog? Ask to join, and its managers will let you in.
        </p>
      </div>
      <GardenFinder
        gardens={gardens.map((g) => ({
          slug: g.slug,
          name: g.name,
          logoUrl: g.logoUrl,
          // The area only, e.g. DA4, never the full postcode
          area: g.postcode?.trim().split(/\s+/)[0] ?? null,
          status: status(g.slug),
        }))}
      />
    </div>
  )
}
