import { describe, expect, it } from 'vitest'
import { cellsOutside, parseCell, planGridOps, planGridResize, withinLimits } from './scene-grid'
import { hexOffset } from './hex-grid'

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

describe('planGridResize', () => {
  const shape = { rows: 3, cols: 3, rowShift: 0 }

  it('adds at the bottom and right without moving anything', () => {
    const down = planGridResize(shape, 'bottom', 1, ['2,2'])
    expect(down.ok && down.shape).toEqual({ rows: 4, cols: 3, rowShift: 0 })
    expect(down.ok && down.moveCell('2,2')).toBe('2,2')
    const right = planGridResize(shape, 'right', 1, [])
    expect(right.ok && right.shape).toEqual({ rows: 3, cols: 4, rowShift: 0 })
  })

  it('adds on the left by moving every plant one column right', () => {
    const plan = planGridResize(shape, 'left', 1, ['1,0'])
    expect(plan.ok && plan.moveCell('1,0')).toBe('1,1')
    expect(plan.ok && plan.shape.rowShift).toBe(0)
  })

  it('adds at the top by moving plants down and flipping the row offset', () => {
    const plan = planGridResize(shape, 'top', 1, ['0,1'])
    expect(plan.ok && plan.shape).toEqual({ rows: 4, cols: 3, rowShift: 1 })
    expect(plan.ok && plan.moveCell('0,1')).toBe('1,1')
  })

  it('keeps every existing cell in the same place on screen when rows change at the top', () => {
    for (const delta of [1, -1] as const) {
      for (const rowShift of [0, 1]) {
        const start = { rows: 4, cols: 3, rowShift }
        const plan = planGridResize(start, 'top', delta, [])
        if (!plan.ok) throw new Error('expected a plan')
        for (let row = delta === -1 ? 1 : 0; row < start.rows; row++) {
          const [r, c] = plan.moveCell(`${row},1`).split(',').map(Number)
          expect(hexOffset(r, c, plan.shape.rowShift, plan.shape.rows).x).toBe(
            hexOffset(row, 1, rowShift, start.rows).x,
          )
        }
      }
    }
  })

  it('removes an empty side, moving plants back when it is the top or left', () => {
    const top = planGridResize(shape, 'top', -1, ['2,2'])
    expect(top.ok && top.shape).toEqual({ rows: 2, cols: 3, rowShift: 1 })
    expect(top.ok && top.moveCell('2,2')).toBe('1,2')
    const left = planGridResize(shape, 'left', -1, ['2,2'])
    expect(left.ok && left.moveCell('2,2')).toBe('2,1')
  })

  it('refuses to remove a side that has plants in it', () => {
    expect(planGridResize(shape, 'top', -1, ['0,1', '1,1'])).toEqual({ ok: false, reason: 'occupied', blocked: ['0,1'] })
    expect(planGridResize(shape, 'right', -1, ['1,2', null])).toEqual({ ok: false, reason: 'occupied', blocked: ['1,2'] })
  })

  it('stays within the grid size limits', () => {
    expect(planGridResize({ rows: 1, cols: 1, rowShift: 0 }, 'left', -1, [])).toEqual({ ok: false, reason: 'limits' })
    expect(planGridResize({ rows: 20, cols: 1, rowShift: 0 }, 'top', 1, [])).toEqual({ ok: false, reason: 'limits' })
  })
})

describe('planGridOps', () => {
  const shape = { rows: 3, cols: 3, rowShift: 0 }

  it('combines several clicks into one plan', () => {
    const plan = planGridOps(shape, [{ side: 'top', delta: 1 }, { side: 'top', delta: 1 }, { side: 'left', delta: 1 }], ['0,0'])
    expect(plan.ok && plan.shape).toEqual({ rows: 5, cols: 4, rowShift: 0 })
    expect(plan.ok && plan.moveCell('0,0')).toBe('2,1')
  })

  it('drops cells in a removed row, e.g. a task target', () => {
    const plan = planGridOps(shape, [{ side: 'bottom', delta: -1 }], ['0,0'])
    expect(plan.ok && plan.moveCell('2,1')).toBeNull()
    expect(plan.ok && plan.moveCell('1,1')).toBe('1,1')
  })

  it('checks each step against where plants have moved to', () => {
    const plan = planGridOps(shape, [{ side: 'top', delta: 1 }, { side: 'bottom', delta: -1 }], ['2,0'])
    expect(plan).toEqual({ ok: false, reason: 'occupied', side: 'bottom', blocked: ['3,0'] })
  })
})
