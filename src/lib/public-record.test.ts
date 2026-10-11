import { describe, it, expect } from 'vitest'
import { hiddenSummaryText, suggestUsername, validateUsername } from './public-record'

describe('validateUsername', () => {
  it('accepts lowercase words joined by single hyphens', () => {
    expect(validateUsername('danny-chambers')).toBeNull()
    expect(validateUsername('dc2')).toBeNull()
  })

  it('rejects bad shapes', () => {
    expect(validateUsername('ab')).toMatch(/3–30/)
    expect(validateUsername('Danny')).toMatch(/lowercase/)
    expect(validateUsername('-danny')).toMatch(/lowercase/)
    expect(validateUsername('danny--c')).toMatch(/lowercase/)
    expect(validateUsername('danny_c')).toMatch(/lowercase/)
  })

  it('rejects reserved words', () => {
    expect(validateUsername('admin')).toMatch(/reserved/)
  })
})

describe('suggestUsername', () => {
  it('builds one from the name, else the email', () => {
    expect(suggestUsername('Danny Clayden Chambers', 'x@y.z')).toBe('danny-clayden-chambers')
    expect(suggestUsername('Zoë O’Brien', 'x@y.z')).toBe('zoe-o-brien')
    expect(suggestUsername(null, 'danny+twg@example.com')).toBe('danny-twg')
    expect(suggestUsername('A', 'x@y.z')).toBe('')
  })
})

describe('hiddenSummaryText', () => {
  it('names the organisation only when allowed', () => {
    expect(hiddenSummaryText({ name: 'Lullingstone', count: 14 })).toBe('14 plants at Lullingstone (private collection)')
    expect(hiddenSummaryText({ name: null, count: 1 })).toBe('1 plant at a private collection')
  })
})
