import { describe, expect, it } from 'vitest'
import { hexGridExtent } from '@/lib/hex-grid'
import { fitGrid } from './public-scene-grid'

describe('fitGrid', () => {
  it('shrinks cells so a wide grid fits a portrait phone', () => {
    const { cellPx, tilt } = fitGrid(6, 6, 'BED', 343, 450)
    const extent = hexGridExtent(6, 6, tilt)
    expect(cellPx * extent.width).toBeLessThanOrEqual(343)
    expect(cellPx * extent.height).toBeLessThanOrEqual(450)
  })

  it('never draws cells larger than usual', () => {
    expect(fitGrid(2, 2, 'WALL', 2000, 2000).cellPx).toBe(96)
  })
})
