import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUserWithMemberships, type UserWithMemberships } from '@/lib/auth/current-user'

/**
 * Personal keys for hortlog's API, so a member can let a tool on their own
 * computer (e.g. Claude) act as them. Only a hash is stored; the key is shown
 * once when made.
 */
const KEY_PREFIX = 'hk_'
export const MAX_KEYS_PER_USER = 10

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export async function createApiKey(userId: string, name: string): Promise<{ key: string; id: string }> {
  const key = KEY_PREFIX + randomBytes(24).toString('base64url')
  const row = await prisma.apiKey.create({
    data: { userId, name, prefix: key.slice(0, KEY_PREFIX.length + 6), hash: hashKey(key) },
    select: { id: true },
  })
  return { key, id: row.id }
}

/** The key's owner, from an `Authorization: Bearer hk_…` header; null if missing or unknown. */
export async function userFromApiKey(req: Request): Promise<UserWithMemberships | null> {
  const header = req.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(hk_[A-Za-z0-9_-]{20,64})$/.exec(header.trim())
  if (!match) return null
  const row = await prisma.apiKey.findUnique({ where: { hash: hashKey(match[1]) }, select: { id: true, userId: true } })
  if (!row) return null
  await prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
  return getUserWithMemberships(row.userId)
}

/** For API routes: a key if one is sent, otherwise the signed-in member. */
export async function apiUser(req: Request): Promise<UserWithMemberships | null> {
  if (req.headers.has('authorization')) return userFromApiKey(req)
  return getCurrentUser()
}
