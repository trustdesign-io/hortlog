import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { toSlug } from '@/lib/utils/slug'
import { RESERVED_ORG_SLUGS } from '@/lib/reserved-slugs'

/** "Janice’s garden", or "My garden" when we don't know their name. */
export function personalGardenName(name: string | null | undefined): string {
  const first = name?.trim().split(/\s+/)[0]
  return first ? `${first}’s garden` : 'My garden'
}

/** A free-looking slug for it: "janices-garden-4k2q". The suffix keeps two Janices apart. */
export function personalGardenSlug(name: string | null | undefined, suffix: string = randomBytes(3).toString('hex').slice(0, 4)): string {
  const plain = personalGardenName(name).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/’/g, '')
  const base = toSlug(plain).slice(0, 40) || 'my-garden'
  const slug = `${base}-${suffix}`
  return RESERVED_ORG_SLUGS.has(slug) ? `garden-${suffix}` : slug
}

/**
 * Someone who signed up without a garden gets their own, as its manager, so
 * they can add plants and record work straight away. Not for anyone with a
 * garden already, or an invite to one waiting. Safe to call on every visit:
 * it only ever makes one.
 */
export async function ensurePersonalGarden(user: { id: string; name: string | null }): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    // One at a time per person, so two tabs opening at once can't make two
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`personal-garden:${user.id}`}))`
    const memberships = await tx.membership.count({ where: { userId: user.id } })
    if (memberships > 0) return false
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = personalGardenSlug(user.name)
      if (await tx.organisation.findUnique({ where: { slug }, select: { id: true } })) continue
      await tx.organisation.create({
        data: {
          slug,
          name: personalGardenName(user.name),
          personal: true,
          memberships: { create: { userId: user.id, role: 'MANAGER' } },
        },
      })
      return true
    }
    return false
  })
}
