import { describe, expect, it } from 'vitest'
import { cellsOutside, parseCell, withinLimits } from './scene-grid'

describe('parseCell', () => {
  it('reads row and column', () => expect(parseCell('2,3')).toEqual([2, 3]))
  it('rejects junk', () => {
    expect(parseCell(null)).toBeNull()
    expect(parseCell('a,b')).toBeNull()
  })
})

describe('cellsOutside', () => {
  const cells = ['0,0', '3,1', '1,3', null]
  it('finds plants in a removed row', () => expect(cellsOutside(cells, 3, 4)).toEqual(['3,1']))
  it('finds plants in a removed column', () => expect(cellsOutside(cells, 4, 3)).toEqual(['1,3']))
  it('is empty when nothing is affected', () => expect(cellsOutside(cells, 4, 4)).toEqual([]))
})

describe('withinLimits', () => {
  it('accepts 1 to 20', () => {
    expect(withinLimits(1)).toBe(true)
    expect(withinLimits(20)).toBe(true)
  })
  it('rejects 0, 21 and fractions', () => {
    expect(withinLimits(0)).toBe(false)
    expect(withinLimits(21)).toBe(false)
    expect(withinLimits(2.5)).toBe(false)
  })
})
