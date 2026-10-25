import { describe, expect, it } from 'vitest'
import { fuzzyScore } from './fuzzy'

const worldGarden = ['The World Garden - North America', 'the-world-garden-north-america', null, 'Location']

describe('fuzzyScore', () => {
  it('matches everything for an empty query', () => expect(fuzzyScore('  ', worldGarden)).toBeGreaterThan(0))
  it('matches word prefixes in any order', () => expect(fuzzyScore('north world', worldGarden)).toBeGreaterThan(0))
  it('ignores case, punctuation and accents', () => expect(fuzzyScore('NÔRTH-america', worldGarden)).toBeGreaterThan(0))
  it('forgives a one-letter typo', () => expect(fuzzyScore('Amerca', worldGarden)).toBeGreaterThan(0))
  it('forgives two letters swapped', () => expect(fuzzyScore('Amercia', worldGarden)).toBeGreaterThan(0))
  it('doesn’t match a long word just because its letters appear in order', () =>
    expect(fuzzyScore('Malvaceae', ['Symphyotrichum ‘Vasterival’', 'Asteraceae', 'Lullingstone Castle, Eynsford, Kent'])).toBe(0))
  it('still finds the real family', () => expect(fuzzyScore('Malvaceae', ['Ceiba speciosa', 'Malvaceae'])).toBeGreaterThan(0))
  it('matches letters in order', () => expect(fuzzyScore('wgna', worldGarden)).toBeGreaterThan(0))
  it('searches the type too', () => expect(fuzzyScore('locat', worldGarden)).toBeGreaterThan(0))
  it('needs every word to match', () => expect(fuzzyScore('north cactus', worldGarden)).toBe(0))
  it('ranks a prefix above a loose match', () => {
    expect(fuzzyScore('hot', ['Hot and Spikey'])).toBeGreaterThan(fuzzyScore('hot', ['Southern thicket']))
  })
})
