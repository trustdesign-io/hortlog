import { describe, it, expect } from 'vitest'
import { lookupEllenberg, buildEllenbergSentence, ellenbergCompact } from './index'

describe('lookupEllenberg', () => {
  it('returns values for a known British native by binomial', () => {
    const values = lookupEllenberg('Urtica dioica')
    expect(values).not.toBeNull()
    expect(values?.N).toBe(8)
    expect(values?.S).toBe(0)
  })

  it('returns values when authority is included', () => {
    const values = lookupEllenberg('Urtica dioica L.')
    expect(values).not.toBeNull()
  })

  it('returns null for unknown species', () => {
    expect(lookupEllenberg('Nesocodon mauritianus')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(lookupEllenberg('')).toBeNull()
  })
})

describe('buildEllenbergSentence', () => {
  it('builds a full sentence from all four indicators', () => {
    const result = buildEllenbergSentence({ L: 6, F: 5, R: 7, N: 8 })
    expect(result).toBe('Grows best in semi-shade on moist, neutral to alkaline, fertile soil.')
  })

  it('omits missing indicators gracefully', () => {
    const result = buildEllenbergSentence({ L: 8, F: 3 })
    expect(result).toBe('Grows best in full sun on dry soil.')
  })

  it('returns null when no indicators are present', () => {
    expect(buildEllenbergSentence(null)).toBeNull()
    expect(buildEllenbergSentence({})).toBeNull()
  })

  it('handles light-only', () => {
    const result = buildEllenbergSentence({ L: 3 })
    expect(result).toBe('Grows best in shade.')
  })

  it('handles soil-only (no light)', () => {
    const result = buildEllenbergSentence({ F: 7, N: 7 })
    expect(result).toBe('Grows best on wet, fertile soil.')
  })

  it('ends with a period', () => {
    const result = buildEllenbergSentence({ L: 9, F: 9, R: 9, N: 9 })
    expect(result).toMatch(/\.$/)
  })
})

describe('ellenbergCompact', () => {
  it('produces the compact row string', () => {
    expect(ellenbergCompact({ L: 7, F: 5, R: 6, N: 8, S: 0 })).toBe('L7 F5 R6 N8 S0')
  })

  it('omits absent indicators', () => {
    expect(ellenbergCompact({ L: 5, N: 4 })).toBe('L5 N4')
  })
})
