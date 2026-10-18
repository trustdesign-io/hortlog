import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))

const { fieldNameOf, isPlaceholderSlug } = await import('./specimen-slug')

const notes = 'Field name: Tangled grey-stemmed succulent\n\nAdded from the bed photo.'

describe('placeholder slugs', () => {
  it('reads the field name from the notes', () => {
    expect(fieldNameOf(notes)).toBe('Tangled grey-stemmed succulent')
    expect(fieldNameOf(null)).toBeUndefined()
  })

  it('spots slugs made from the field name', () => {
    expect(isPlaceholderSlug('tangled-grey-stemmed-succulent', notes, null)).toBe(true)
    expect(isPlaceholderSlug('tangled-grey-stemmed-succulent-a1b2c3', notes, null)).toBe(true)
    expect(isPlaceholderSlug('unidentified-2', null, null)).toBe(true)
  })

  it('keeps slugs a member chose or that follow a botanical name', () => {
    expect(isPlaceholderSlug('alluaudia-dumosa', notes, null)).toBe(false)
    expect(isPlaceholderSlug('the-big-one', notes, null)).toBe(false)
    expect(isPlaceholderSlug('rosa-canina', null, null)).toBe(false)
  })
})
