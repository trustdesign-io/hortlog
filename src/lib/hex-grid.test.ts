import { describe, expect, it } from 'vitest'
import {
  HEX_HEIGHT_RATIO,
  hexCellStyle,
  hexGridExtent,
  hexOffset,
  moveHexCell,
} from './hex-grid'

describe('hexOffset', () => {
  it('places even rows on whole cell widths', () => {
    expect(hexOffset(0, 0)).toEqual({ x: 0, y: 0 })
    expect(hexOffset(0, 3).x).toBe(3)
    expect(hexOffset(2, 1).x).toBe(1)
  })

  it('shifts odd rows right by half a cell', () => {
    expect(hexOffset(1, 0).x).toBe(0.5)
    expect(hexOffset(3, 2).x).toBe(2.5)
  })

  it('overlaps each row by a quarter of the cell height', () => {
    expect(hexOffset(1, 0).y).toBeCloseTo(0.75 * HEX_HEIGHT_RATIO)
    expect(hexOffset(4, 0).y).toBeCloseTo(3 * HEX_HEIGHT_RATIO)
  })
})

describe('hexGridExtent', () => {
  it('is one cell for a 1x1 grid', () => {
    expect(hexGridExtent(1, 1)).toEqual({ width: 1, height: HEX_HEIGHT_RATIO })
  })

  it('adds half a cell of width once there is an odd row', () => {
    expect(hexGridExtent(1, 4).width).toBe(4)
    expect(hexGridExtent(2, 4).width).toBe(4.5)
  })

  it('stacks rows at three quarters of a cell height', () => {
    expect(hexGridExtent(3, 2).height).toBeCloseTo(2.5 * HEX_HEIGHT_RATIO)
  })
})

describe('hexCellStyle', () => {
  it('scales every length from the --hex-w variable', () => {
    const style = hexCellStyle(1, 2, 3, 4)
    expect(style.left).toBe('calc(var(--hex-w) * 2.5)')
    expect(style.width).toBe('calc(var(--hex-w) * 1)')
    expect(String(style.height)).toContain('var(--hex-w)')
  })
})

describe('moveHexCell', () => {
  const rows = 4
  const cols = 3

  it('moves left and right along a row', () => {
    expect(moveHexCell({ row: 1, col: 1 }, 'left', rows, cols)).toEqual({ row: 1, col: 0 })
    expect(moveHexCell({ row: 1, col: 1 }, 'right', rows, cols)).toEqual({ row: 1, col: 2 })
  })

  it('stays put at row ends', () => {
    expect(moveHexCell({ row: 2, col: 0 }, 'left', rows, cols)).toEqual({ row: 2, col: 0 })
    expect(moveHexCell({ row: 2, col: 2 }, 'right', rows, cols)).toEqual({ row: 2, col: 2 })
  })

  it('goes up and down from an even row to the nearest hex of the odd row', () => {
    expect(moveHexCell({ row: 2, col: 1 }, 'down', rows, cols)).toEqual({ row: 3, col: 1 })
    expect(moveHexCell({ row: 2, col: 1 }, 'up', rows, cols)).toEqual({ row: 1, col: 1 })
  })

  it('goes up and down from an odd row to the nearest hex of the even row', () => {
    expect(moveHexCell({ row: 1, col: 2 }, 'up', rows, cols)).toEqual({ row: 0, col: 2 })
    expect(moveHexCell({ row: 1, col: 2 }, 'down', rows, cols)).toEqual({ row: 2, col: 2 })
  })

  it('never drifts sideways over repeated vertical moves', () => {
    const down1 = moveHexCell({ row: 0, col: 1 }, 'down', rows, cols)
    const down2 = moveHexCell(down1, 'down', rows, cols)
    const back = moveHexCell(moveHexCell(down2, 'up', rows, cols), 'up', rows, cols)
    expect(back).toEqual({ row: 0, col: 1 })
  })

  it('stays put at the top and bottom edges', () => {
    expect(moveHexCell({ row: 0, col: 1 }, 'up', rows, cols)).toEqual({ row: 0, col: 1 })
    expect(moveHexCell({ row: 3, col: 1 }, 'down', rows, cols)).toEqual({ row: 3, col: 1 })
  })

  it('keeps a single-row grid in place vertically', () => {
    expect(moveHexCell({ row: 0, col: 0 }, 'down', 1, 1)).toEqual({ row: 0, col: 0 })
  })
})
