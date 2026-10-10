import { describe, it, expect, vi } from 'vitest'

// Server actions require live Prisma + Supabase — integration tested via E2E.
// This file smoke-tests that the module exports what the UI expects, so its
// server dependencies are mocked rather than connecting to a database.
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/auth/permissions', () => ({ requireAuth: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createShareLink, revokeShareLink } from './work-record-share'

describe('work-record-share exports', () => {
  it('exports createShareLink as a function', () => {
    expect(typeof createShareLink).toBe('function')
  })

  it('exports revokeShareLink as a function', () => {
    expect(typeof revokeShareLink).toBe('function')
  })
})
