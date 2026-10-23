import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function makePrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing required environment variable: DATABASE_URL')
  }
  // Each serverless instance keeps its own pool; keep it small so a burst of
  // instances doesn't exhaust the Supabase pooler.
  const adapter = new PrismaPg({ connectionString, max: 3, idleTimeoutMillis: 10_000 })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function client(): PrismaClient {
  globalForPrisma.prisma ??= makePrismaClient()
  return globalForPrisma.prisma
}

/**
 * Made on first use, not on import: a build where the database isn't set
 * (Vercel previews) can still compile and collect pages, and only a request
 * that actually needs the database fails.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = client()
    const value = Reflect.get(c, prop, c)
    return typeof value === 'function' ? value.bind(c) : value
  },
})
