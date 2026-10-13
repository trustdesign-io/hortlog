import { describe, expect, it } from 'vitest'
import { geocodePostcode, normalisePostcode } from './postcode'

describe('normalisePostcode', () => {
  it('tidies spacing and case', () => {
    expect(normalisePostcode(' da4 0jb')).toBe('DA4 0JB')
    expect(normalisePostcode('SW1A1AA')).toBe('SW1A 1AA')
    expect(normalisePostcode('m1 1ae')).toBe('M1 1AE')
  })
  it('rejects things that are not postcodes', () => {
    expect(normalisePostcode('Kent')).toBeNull()
    expect(normalisePostcode('')).toBeNull()
  })
})

describe('geocodePostcode', () => {
  it('returns the coordinates', async () => {
    const coords = await geocodePostcode('DA4 0JB', async () => ({ result: { latitude: 51.36, longitude: 0.19 } }))
    expect(coords).toEqual({ latitude: 51.36, longitude: 0.19 })
  })
  it('returns null for an unknown postcode', async () => {
    expect(await geocodePostcode('ZZ1 1ZZ', async () => null)).toBeNull()
  })
  it('returns undefined when the service fails', async () => {
    expect(
      await geocodePostcode('DA4 0JB', async () => {
        throw new Error('down')
      }),
    ).toBeUndefined()
  })
})
