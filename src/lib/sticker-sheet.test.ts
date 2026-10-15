import { describe, expect, it } from 'vitest'
import { A4, DEFAULT_SHEET_LAYOUT, fitsPage, intoSheets, labelOrigin, labelsPerSheet, sheetLayoutFrom } from './sticker-sheet'

describe('sticker sheet layout', () => {
  it('centres 7 × 10 labels on A4 by default', () => {
    const L = DEFAULT_SHEET_LAYOUT
    expect(labelsPerSheet(L)).toBe(70)
    expect(labelOrigin(0, L)).toEqual({ x: 10, y: 12.25 })
    const last = labelOrigin(69, L)
    expect(A4.width - (last.x + L.label)).toBeCloseTo(10)
    expect(A4.height - (last.y + L.label)).toBeCloseTo(12.25)
    expect(fitsPage(L)).toBe(true)
  })

  it('goes across, then down', () => {
    expect(labelOrigin(6, DEFAULT_SHEET_LAYOUT)).toEqual({ x: 10 + 6 * 27.5, y: 12.25 })
    expect(labelOrigin(7, DEFAULT_SHEET_LAYOUT)).toEqual({ x: 10, y: 12.25 + 27.5 })
  })

  it('takes adjustments from the address and ignores bad ones', () => {
    expect(sheetLayoutFrom({ left: '9.5', top: '13', gapX: 'abc', gapY: '99' })).toMatchObject({
      left: 9.5,
      top: 13,
      gapX: 2.5,
      gapY: 2.5,
    })
  })

  it('notices when labels would run off the page', () => {
    expect(fitsPage(sheetLayoutFrom({ gapY: '6' }))).toBe(false)
  })

  it('splits labels into sheets of 70', () => {
    expect(intoSheets(Array.from({ length: 141 }, (_, i) => i), DEFAULT_SHEET_LAYOUT).map((s) => s.length)).toEqual([70, 70, 1])
  })
})
