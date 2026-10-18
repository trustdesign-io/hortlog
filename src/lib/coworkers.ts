import { prisma } from '@/lib/prisma'

/**
 * The people tagged as having worked on an entry too: members of this
 * organisation only (no free-text names), never the person logging it, each once.
 */
export async function validCoworkers(orgSlug: string, loggedById: string, raw: readonly unknown[]): Promise<string[]> {
  const ids = [...new Set(raw.filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64))]
    .filter((id) => id !== loggedById)
    .slice(0, 20)
  if (ids.length === 0) return []
  const members = await prisma.membership.findMany({
    where: { userId: { in: ids }, organisation: { slug: orgSlug } },
    select: { userId: true },
  })
  const ok = new Set(members.map((m) => m.userId))
  return ids.filter((id) => ok.has(id))
}
