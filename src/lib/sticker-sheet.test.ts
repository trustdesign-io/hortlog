import { describe, expect, it } from 'vitest'
import { A4, DEFAULT_SHEET_LAYOUT, fitsPage, intoSheets, labelOrigin, labelsPerSheet, sheetLayoutFrom } from './sticker-sheet'

describe('sticker sheet layout', () => {
  it('matches Label Planet LP70/25SQ by default', () => {
    const L = DEFAULT_SHEET_LAYOUT
    expect(labelsPerSheet(L)).toBe(70)
    expect(labelOrigin(0, L)).toEqual({ x: 11.5, y: 14.5 })
    const last = labelOrigin(69, L)
    expect(A4.width - (last.x + L.label)).toBeCloseTo(11.5)
    expect(A4.height - (last.y + L.label)).toBeCloseTo(14.5)
    expect(fitsPage(L)).toBe(true)
  })

  it('goes across, then down', () => {
    expect(labelOrigin(6, DEFAULT_SHEET_LAYOUT)).toEqual({ x: 11.5 + 6 * 27, y: 14.5 })
    expect(labelOrigin(7, DEFAULT_SHEET_LAYOUT)).toEqual({ x: 11.5, y: 14.5 + 27 })
  })

  it('takes adjustments from the address and ignores bad ones', () => {
    expect(sheetLayoutFrom({ left: '9.5', top: '13', gapX: 'abc', gapY: '99' })).toMatchObject({
      left: 9.5,
      top: 13,
      gapX: 2,
      gapY: 2,
    })
  })

  it('notices when labels would run off the page', () => {
    expect(fitsPage(sheetLayoutFrom({ gapY: '6' }))).toBe(false)
  })

  it('splits labels into sheets of 70', () => {
    expect(intoSheets(Array.from({ length: 141 }, (_, i) => i), DEFAULT_SHEET_LAYOUT).map((s) => s.length)).toEqual([70, 70, 1])
  })
})
