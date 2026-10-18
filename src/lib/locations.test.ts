import { describe, expect, it } from 'vitest'
import { cleanLocationName, flattenTree, locationPath, withinIds, wouldNestInItself } from './locations'

const kew = [
  { id: 'arid', name: 'Arid', parentId: 'powc' },
  { id: 'mada', name: 'Madagascar', parentId: 'arid' },
  { id: 'powc', name: 'Princess of Wales Conservatory', parentId: null },
  { id: 'fern', name: 'Ferns', parentId: 'powc' },
  { id: 'palm', name: 'Palm House', parentId: null },
]

describe('locations', () => {
  it('walks from the outermost place down', () => {
    expect(locationPath(kew, 'mada').map((l) => l.name)).toEqual(['Princess of Wales Conservatory', 'Arid', 'Madagascar'])
    expect(locationPath(kew, null)).toEqual([])
  })

  it('finds every place inside one', () => {
    expect(withinIds(kew, 'powc').sort()).toEqual(['arid', 'fern', 'mada', 'powc'])
    expect(withinIds(kew, 'mada')).toEqual(['mada'])
  })

  it('refuses to put a place inside itself', () => {
    expect(wouldNestInItself(kew, 'powc', 'mada')).toBe(true)
    expect(wouldNestInItself(kew, 'arid', 'arid')).toBe(true)
    expect(wouldNestInItself(kew, 'mada', 'palm')).toBe(false)
    expect(wouldNestInItself(kew, 'mada', null)).toBe(false)
  })

  it('lists the tree in order with depths', () => {
    expect(flattenTree(kew).map((l) => `${l.depth}:${l.name}`)).toEqual([
      '0:Palm House',
      '0:Princess of Wales Conservatory',
      '1:Arid',
      '2:Madagascar',
      '1:Ferns',
    ])
  })

  it('survives a loop in the data', () => {
    const looped = [
      { id: 'a', name: 'A', parentId: 'b' },
      { id: 'b', name: 'B', parentId: 'a' },
    ]
    expect(locationPath(looped, 'a').length).toBe(2)
  })

  it('tidies names', () => {
    expect(cleanLocationName('  Arid   zone ')).toBe('Arid zone')
    expect(cleanLocationName('')).toBeNull()
    expect(cleanLocationName('x'.repeat(81))).toBeNull()
  })
})
