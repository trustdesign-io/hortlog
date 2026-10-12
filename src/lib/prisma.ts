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

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
