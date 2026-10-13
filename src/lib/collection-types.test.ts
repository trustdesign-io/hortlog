import { describe, expect, it } from 'vitest'
import { groupByType, normaliseTypeName, typeNameError } from './collection-types'

describe('normaliseTypeName', () => {
  it('trims and collapses spaces', () => expect(normaliseTypeName('  Glass   house ')).toBe('Glass house'))
  it('treats missing as empty', () => expect(normaliseTypeName(null)).toBe(''))
})

describe('typeNameError', () => {
  it('requires a name', () => expect(typeNameError('')).toMatch(/required/))
  it('limits length', () => expect(typeNameError('x'.repeat(41))).toMatch(/40/))
  it('accepts a normal name', () => expect(typeNameError('Location')).toBeNull())
})

describe('groupByType', () => {
  const types = [
    { id: 'loc', name: 'Location' },
    { id: 'tax', name: 'Taxonomy' },
    { id: 'empty', name: 'Theme' },
  ]
  const items = [
    { id: 'a', typeId: 'tax' },
    { id: 'b', typeId: null },
    { id: 'c', typeId: 'loc' },
    { id: 'd', typeId: 'loc' },
  ]

  it('groups in type order, skips empty types and puts untyped last', () => {
    const groups = groupByType(items, types)
    expect(groups.map((g) => g.type?.name ?? null)).toEqual(['Location', 'Taxonomy', null])
    expect(groups[0].items.map((i) => i.id)).toEqual(['c', 'd'])
  })
})
