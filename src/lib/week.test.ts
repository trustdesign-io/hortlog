import { describe, expect, it } from 'vitest'
import { startOfWeek } from './week'

describe('startOfWeek', () => {
  it('is Monday midnight London time during British Summer Time', () => {
    // Tue 13 Oct 2026, 19:45 BST
    expect(startOfWeek(new Date('2026-10-13T18:45:00Z')).toISOString()).toBe('2026-10-11T23:00:00.000Z')
  })

  it('is Monday midnight London time in winter', () => {
    // Thu 10 Dec 2026, 09:00 GMT
    expect(startOfWeek(new Date('2026-12-10T09:00:00Z')).toISOString()).toBe('2026-12-07T00:00:00.000Z')
  })

  it('counts Sunday night as the end of the week, not the start of the next', () => {
    // Sun 18 Oct 2026, 23:30 BST
    expect(startOfWeek(new Date('2026-10-18T22:30:00Z')).toISOString()).toBe('2026-10-11T23:00:00.000Z')
  })

  it('starts a new week from Monday 00:00 London time', () => {
    // Mon 19 Oct 2026, 00:10 BST, which is still Sunday in UTC
    expect(startOfWeek(new Date('2026-10-18T23:10:00Z')).toISOString()).toBe('2026-10-18T23:00:00.000Z')
  })
})
