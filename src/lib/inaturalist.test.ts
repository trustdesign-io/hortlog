import { describe, it, expect, vi } from 'vitest'
import { findReferencePhoto, inatQuery } from './inaturalist'

const photo = (id: number, license_code: string | null) => ({
  id,
  url: `https://inaturalist-open-data.s3.amazonaws.com/photos/${id}/square.jpg`,
  attribution: `(c) Person ${id}`,
  license_code,
})

function fakeFetcher(routes: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const key = Object.keys(routes).find((k) => url.includes(k))
    if (!key) throw new Error(`unexpected ${url}`)
    return routes[key]
  })
}

describe('inatQuery', () => {
  it('drops cultivars and authorities', () => {
    expect(inatQuery("Acer negundo 'Flamingo'")).toBe('Acer negundo')
    expect(inatQuery('Acer negundo ‘Flamingo’')).toBe('Acer negundo')
    expect(inatQuery('Taxus baccata')).toBe('Taxus baccata')
    expect(inatQuery('Symphyotrichum ‘Vasterival’')).toBe('Symphyotrichum')
  })
})

describe('findReferencePhoto', () => {
  it('takes the first openly licensed taxon photo', async () => {
    const fetcher = fakeFetcher({
      '/taxa?': { results: [{ id: 7, name: 'Taxus baccata' }] },
      '/taxa/7': { results: [{ id: 7, name: 'Taxus baccata', taxon_photos: [{ photo: photo(1, 'cc-by-nc') }, { photo: photo(2, 'cc-by') }] }] },
    })
    const result = await findReferencePhoto('Taxus baccata', fetcher)
    expect(result).toEqual({
      inatTaxonId: 7,
      photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/2/medium.jpg',
      photoAttribution: '(c) Person 2',
      photoLicence: 'CC BY',
      photoSourceUrl: 'https://www.inaturalist.org/photos/2',
    })
  })

  it('falls back to observation photos when the taxon has no open photo', async () => {
    const fetcher = fakeFetcher({
      '/taxa?': { results: [{ id: 7, name: 'Taxus baccata' }] },
      '/taxa/7': { results: [{ id: 7, name: 'Taxus baccata', taxon_photos: [{ photo: photo(1, 'cc-by-nc') }] }] },
      '/observations?': { results: [{ photos: [photo(3, null), photo(4, 'cc0')] }] },
    })
    expect((await findReferencePhoto('Taxus baccata', fetcher))?.photoLicence).toBe('CC0')
  })

  it('needs an exact name match', async () => {
    const fetcher = fakeFetcher({ '/taxa?': { results: [{ id: 8, name: 'Taxus baccata fastigiata' }] } })
    expect(await findReferencePhoto('Taxus baccata', fetcher)).toBeNull()
  })

  it('returns null rather than throwing when iNaturalist fails', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('down')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await findReferencePhoto('Taxus baccata', fetcher)).toBeNull()
  })
})
