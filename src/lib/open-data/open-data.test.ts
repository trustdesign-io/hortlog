import { describe, it, expect } from 'vitest'
import { buildHabitatLine, wgsrpdName } from './powo'

describe('buildHabitatLine', () => {
  it('builds a full sentence with life form, climate and regions', () => {
    const result = buildHabitatLine({
      lifeForm: 'Shrub',
      climate: 'Tropical',
      nativeRegions: ['MAU'],
      introducedRegions: [],
    })
    expect(result).toBe('A shrub of tropical regions, native to Mauritius.')
  })

  it('uses "An" for vowel-starting life forms', () => {
    const result = buildHabitatLine({
      lifeForm: 'Epiphyte',
      climate: null,
      nativeRegions: ['GBR'],
      introducedRegions: [],
    })
    expect(result).toMatch(/^An epiphyte/)
  })

  it('omits climate when null', () => {
    const result = buildHabitatLine({
      lifeForm: 'Tree',
      climate: null,
      nativeRegions: ['JPN'],
      introducedRegions: [],
    })
    expect(result).toBe('A tree, native to Japan.')
  })

  it('omits life form when null', () => {
    const result = buildHabitatLine({
      lifeForm: null,
      climate: 'Temperate',
      nativeRegions: ['GBR'],
      introducedRegions: [],
    })
    expect(result).toMatch(/temperate regions/)
  })

  it('returns null when no data is present', () => {
    const result = buildHabitatLine({
      lifeForm: null,
      climate: null,
      nativeRegions: [],
      introducedRegions: [],
    })
    expect(result).toBeNull()
  })

  it('lists up to 5 native regions', () => {
    const result = buildHabitatLine({
      lifeForm: null,
      climate: null,
      nativeRegions: ['MAU', 'GBR', 'FRA', 'SPA', 'ITA', 'GER'],
      introducedRegions: [],
    })
    // Only first 5 should appear
    expect(result).toContain('Mauritius')
    expect(result).toContain('Great Britain')
    expect(result).not.toContain('Germany')
  })

  it('ends with a period', () => {
    const result = buildHabitatLine({
      lifeForm: 'Tree',
      climate: 'Tropical',
      nativeRegions: ['BRA'],
      introducedRegions: [],
    })
    expect(result).toMatch(/\.$/)
  })
})

describe('wgsrpdName', () => {
  it('resolves known codes', () => {
    expect(wgsrpdName('MAU')).toBe('Mauritius')
    expect(wgsrpdName('GBR')).toBe('Great Britain')
  })

  it('returns the code itself for unknown codes', () => {
    expect(wgsrpdName('XYZ')).toBe('XYZ')
  })
})
