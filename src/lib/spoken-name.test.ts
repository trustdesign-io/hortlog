import { describe, expect, it } from 'vitest'
import { phoneticKey, soundDistance, spokenCandidates } from './spoken-name'

describe('spokenCandidates', () => {
  it('rebuilds a genus split into words and a spoken -ii ending', () => {
    expect(spokenCandidates('Cleisto cactus Strauss eye')).toContain('cleistocactus straussii')
  })

  it('keeps names heard correctly as they are', () => {
    expect(spokenCandidates('Aloe vera')[0]).toBe('aloe vera')
  })

  it('offers the genus alone when only a genus was said', () => {
    expect(spokenCandidates('Pachy podium')).toContain('pachypodium')
  })

  it('ignores punctuation and empty input', () => {
    expect(spokenCandidates('  ')).toEqual([])
    expect(spokenCandidates('Euphorbia, milii.')[0]).toBe('euphorbia milii')
  })
})

describe('sound matching', () => {
  it('treats spellings that sound alike as the same', () => {
    expect(phoneticKey('Phylica')).toBe(phoneticKey('filica'))
    expect(phoneticKey('Kalanchoe')).toBe(phoneticKey('calanche'))
  })

  it('ranks the intended name closest to what was heard', () => {
    const heard = 'Cleisto cactus Strauss eye'
    expect(soundDistance(heard, 'Cleistocactus strausii')).toBeLessThan(soundDistance(heard, 'Cleistocactus samaipatanus'))
    expect(soundDistance(heard, 'Cleistocactus strausii')).toBeLessThan(0.15)
  })
})

describe('more spoken names', () => {
  it('handles a heard trailing r and -ey/-ie endings', () => {
    expect(spokenCandidates('Didier ear trolley')).toContain('didierea trollii')
    expect(spokenCandidates('euphorbia Millie eye')).toContain('euphorbia millii')
  })
})
