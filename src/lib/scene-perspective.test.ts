import { describe, expect, it } from 'vitest'
import { HEX_HEIGHT_RATIO, hexFrame, hexGridExtent, hexOffset } from './hex-grid'
import {
  bedTilt,
  MAX_BED_TILT,
  MIN_TARGET_PX,
  parsePerspective,
  sceneTilt,
} from './scene-perspective'

describe('parsePerspective', () => {
  it('accepts BED and WALL', () => {
    expect(parsePerspective('BED')).toBe('BED')
    expect(parsePerspective('WALL')).toBe('WALL')
  })

  it('rejects anything else', () => {
    expect(parsePerspective('ceiling')).toBeNull()
  })

  it('treats a missing value as null', () => {
    expect(parsePerspective(null)).toBeNull()
  })
})

describe('hexFrame', () => {
  it('matches the flat layout when untilted', () => {
    const frame = hexFrame(1, 2, 3, 4, 0)
    const { x, y } = hexOffset(1, 2)
    expect(frame.left).toBeCloseTo(x)
    expect(frame.top).toBeCloseTo(y)
    expect(frame.width).toBeCloseTo(1)
    expect(frame.height).toBeCloseTo(HEX_HEIGHT_RATIO)
  })

  it('keeps the front row at nearly full size when tilted', () => {
    expect(hexFrame(3, 0, 4, 4, 50).width).toBeGreaterThan(0.9)
  })

  it('shrinks cells as rows recede', () => {
    expect(hexFrame(0, 0, 4, 4, 50).width).toBeLessThan(hexFrame(3, 0, 4, 4, 50).width)
  })

  it('draws the back row above the front row', () => {
    expect(hexFrame(0, 0, 4, 4, 50).top).toBeLessThan(hexFrame(3, 0, 4, 4, 50).top)
  })

  it('keeps every cell inside the grid height', () => {
    const { height } = hexGridExtent(5, 3, 50)
    const front = hexFrame(4, 0, 5, 3, 50)
    expect(front.top + front.height).toBeLessThanOrEqual(height + 1e-9)
  })

  it('draws the grid shorter when tilted', () => {
    expect(hexGridExtent(5, 3, 50).height).toBeLessThan(hexGridExtent(5, 3, 0).height)
  })
})

describe('bedTilt', () => {
  it('uses the full tilt on a shallow bed', () => {
    expect(bedTilt(4, 120)).toBe(MAX_BED_TILT)
  })

  it('tilts a deep bed of small cells less', () => {
    expect(bedTilt(20, 80)).toBeLessThan(MAX_BED_TILT)
  })

  it('keeps the back row at least 44px tall', () => {
    const tilt = bedTilt(20, 80)
    const back = hexFrame(0, 0, 20, 4, tilt)
    expect(back.height * 80).toBeGreaterThanOrEqual(MIN_TARGET_PX)
  })

  it('falls back to flat when no tilt can keep cells tappable', () => {
    expect(bedTilt(20, 20)).toBe(0)
  })
})

describe('sceneTilt', () => {
  it('is flat for a wall', () => {
    expect(sceneTilt('WALL', 4, 120)).toBe(0)
  })

  it('tilts a bed', () => {
    expect(sceneTilt('BED', 4, 120)).toBe(MAX_BED_TILT)
  })

  it('is flat for a bed in flat view', () => {
    expect(sceneTilt('BED', 4, 120, true)).toBe(0)
  })
})
