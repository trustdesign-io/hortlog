import { describe, it, expect } from 'vitest'

// Server actions require live Prisma + Supabase — integration tested via E2E.
// This file smoke-tests that the module exports what the UI expects.

import { createShareLink, revokeShareLink } from './work-record-share'

describe('work-record-share exports', () => {
  it('exports createShareLink as a function', () => {
    expect(typeof createShareLink).toBe('function')
  })

  it('exports revokeShareLink as a function', () => {
    expect(typeof revokeShareLink).toBe('function')
  })
})
