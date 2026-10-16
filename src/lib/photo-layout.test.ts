import { describe, expect, it } from 'vitest'
import { planPhotoLayout } from './photo-layout'

const empty = { splitCells: [] as string[] }

describe('planPhotoLayout', () => {
  it('plans a new bed: size, outline, plants, small cells split their hex', () => {
    const r = planPhotoLayout(empty, [], {
      rows: 3,
      cols: 5,
      blockedCells: ['0,0', '0,4'],
      plants: [
        { cell: '1,1', name: 'Agave americana', note: 'back left' },
        { cell: '2,3:1', name: 'Small grey rosette' },
        { cell: '2,3:4', name: 'Plant 3' },
      ],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.plan).toMatchObject({ rows: 3, cols: 5, rowShift: 0, blockedCells: ['0,0', '0,4'], splitCells: ['2,3'] })
    expect(r.plan.plants).toEqual([
      { row: 1, col: 1, sub: null, name: 'Agave americana', note: 'back left' },
      { row: 2, col: 3, sub: 1, name: 'Small grey rosette', note: null },
      { row: 2, col: 3, sub: 4, name: 'Plant 3', note: null },
    ])
  })

  it('refuses the whole layout with every problem listed', () => {
    const r = planPhotoLayout(empty, [], {
      rows: 2,
      cols: 2,
      blockedCells: ['5,5'],
      plants: [{ cell: '0,0', name: '' }, { cell: '3,0', name: 'Off the grid' }, { cell: '1,1', name: 'A' }, { cell: '1,1', name: 'B' }],
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors).toHaveLength(4)
  })

  it('keeps plants already placed inside the bed', () => {
    const existing = [{ id: 'p', cell: '3,2', name: 'Aloe vera' }]
    const tooSmall = planPhotoLayout(empty, existing, { rows: 3, cols: 3 })
    expect(tooSmall.ok).toBe(false)
    const blocked = planPhotoLayout(empty, existing, { rows: 4, cols: 4, blockedCells: ['3,2'] })
    expect(blocked.ok).toBe(false)
    const taken = planPhotoLayout(empty, existing, { rows: 4, cols: 4, plants: [{ cell: '3,2', name: 'New' }] })
    expect(taken.ok).toBe(false)
    const fine = planPhotoLayout(empty, existing, { rows: 4, cols: 4, plants: [{ cell: '0,0', name: 'New' }] })
    expect(fine.ok).toBe(true)
  })

  it('never mixes a whole-hex plant with small-cell plants', () => {
    expect(planPhotoLayout(empty, [], { rows: 2, cols: 2, plants: [{ cell: '0,0', name: 'A' }, { cell: '0,0:2', name: 'B' }] }).ok).toBe(false)
    expect(planPhotoLayout(empty, [{ id: 'x', cell: '0,0:1', name: 'X' }], { rows: 2, cols: 2, plants: [{ cell: '0,0', name: 'A' }] }).ok).toBe(false)
  })

  it('rejects grid sizes out of range', () => {
    expect(planPhotoLayout(empty, [], { rows: 0, cols: 3 }).ok).toBe(false)
    expect(planPhotoLayout(empty, [], { rows: 21, cols: 3 }).ok).toBe(false)
  })
})
