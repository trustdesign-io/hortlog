import { describe, it, expect } from 'vitest'
import { buildHabitatLine, wgsrpdName } from './powo'

describe('buildHabitatLine', () => {
  it('builds a full sentence with life form, climate and regions', () => {
    const result = buildHabitatLine({
      lifeForm: 'Shrub',
      climate: 'Tropical',
      nativeRegions: ['Mauritius'],
      introducedRegions: [],
    })
    expect(result).toBe('A shrub of tropical regions, native to Mauritius.')
  })

  it('uses "An" for vowel-starting life forms', () => {
    const result = buildHabitatLine({
      lifeForm: 'Epiphyte',
      climate: null,
      nativeRegions: ['Great Britain'],
      introducedRegions: [],
    })
    expect(result).toMatch(/^An epiphyte/)
  })

  it('omits climate when null', () => {
    const result = buildHabitatLine({
      lifeForm: 'Tree',
      climate: null,
      nativeRegions: ['Japan'],
      introducedRegions: [],
    })
    expect(result).toBe('A tree, native to Japan.')
  })

  it('omits life form when null', () => {
    const result = buildHabitatLine({
      lifeForm: null,
      climate: 'Temperate',
      nativeRegions: ['Great Britain'],
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
      nativeRegions: ['Mauritius', 'Great Britain', 'France', 'Spain', 'Italy', 'Germany'],
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
      nativeRegions: ['Brazil'],
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

describe('readWcvpInfo', () => {
  it('reads native and introduced ranges, life form and climate', async () => {
    const { readWcvpInfo } = await import('./powo')
    const out = readWcvpInfo({
      distributions: [
        { area: { name: 'China Southeast' }, establishmentMeans: null },
        { area: { name: 'Austria' }, establishmentMeans: 'introduced' },
        { area: { name: 'China North-Central' }, establishmentMeans: 'native' },
        { area: { name: 'China Southeast' }, establishmentMeans: null },
      ],
      verbatim: { terms: { 'dwc:dynamicProperties': '{"lifeform":"tree","climate":"temperate"}' } },
    })
    expect(out).toEqual({
      nativeRegions: ['China North-Central', 'China Southeast'],
      introducedRegions: ['Austria'],
      lifeForm: 'Tree',
      climate: 'Temperate',
    })
  })

  it('is null when there is nothing to show', async () => {
    const { readWcvpInfo } = await import('./powo')
    expect(readWcvpInfo({ distributions: [], verbatim: { terms: { 'dwc:dynamicProperties': 'not json' } } })).toBeNull()
    expect(readWcvpInfo(null)).toBeNull()
  })
})
