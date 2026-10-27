import { prisma } from '@/lib/prisma'
import { listPendingInvites } from '@/lib/pending-invites'

/**
 * Of these people, the ones invited to this garden who haven't joined yet,
 * each given a hortlog account (the same id their sign-in account has, and
 * keeps when they join) so they can be assigned tasks, or chosen as
 * someone's supervisor, now.
 */
export async function invitedAssignees(orgSlug: string, userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set()
  const invites = (await listPendingInvites(orgSlug)).filter((i) => userIds.includes(i.userId))
  for (const i of invites) {
    await prisma.user.upsert({
      where: { id: i.userId },
      create: { id: i.userId, email: i.email, name: i.name },
      update: {},
    })
  }
  return new Set(invites.map((i) => i.userId))
}
