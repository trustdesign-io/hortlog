import { describe, expect, it, vi } from 'vitest'

// The sidebar module reaches the database client through its imports; it isn't used here
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
import { buildOrgNav, youNav } from '@/components/sidebar'
import { TOUR_STEPS } from './tour-steps'

describe('TOUR_STEPS', () => {
  it('runs in the order things appear: switcher, org menu, admin, then You', () => {
    const expected = [
      'org-switcher',
      ...buildOrgNav('acme', true).flatMap((i) => (i.tourId ? [i.tourId] : [])),
      'admin',
      ...youNav.flatMap((i) => (i.tourId ? [i.tourId] : [])),
    ]
    expect(TOUR_STEPS.map((s) => s.tourId)).toEqual(expected)
  })
})
