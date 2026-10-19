import { describe, expect, it } from 'vitest'
import { distinctCommonName } from './species-name'

describe('distinctCommonName', () => {
  it('keeps a real common name', () => {
    expect(distinctCommonName({ commonName: 'Silk floss tree', scientificName: 'Ceiba speciosa' })).toBe('Silk floss tree')
  })
  it('drops one that just repeats the scientific name', () => {
    expect(distinctCommonName({ commonName: 'Pachypodium lamerei', scientificName: 'Pachypodium lamerei' })).toBeNull()
    expect(distinctCommonName({ commonName: ' pachypodium Lamerei ', scientificName: 'Pachypodium lamerei' })).toBeNull()
  })
})
