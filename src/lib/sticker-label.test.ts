import { describe, expect, it } from 'vitest'
import { labelUrl, qrMatrix, qrPath, QR_BLOCK_MM, QUIET_MODULES, STICKER_MM, stickerSvg } from './sticker-label'

describe('labelUrl', () => {
  it('capitalises the host but keeps the /v/ path and code as they are', () => {
    expect(labelUrl('https://hortlog.com', 'abc123')).toBe('HTTPS://HORTLOG.COM/v/abc123')
    expect(labelUrl('https://hortlog.com/', 'abc123')).toBe('HTTPS://HORTLOG.COM/v/abc123')
  })

  it('fits a 25 × 25 module code at error correction M for any code', () => {
    for (const code of ['z9y8x7', 'abcdef', '123456', 'a1b2c3', 'zzzzzz']) {
      expect(qrMatrix(labelUrl('https://hortlog.com', code)).size).toBe(25)
    }
  })
})

describe('qrPath', () => {
  it('keeps every module inside the quiet zone of the 17 mm block', () => {
    const matrix = qrMatrix(labelUrl('https://hortlog.com', 'abc123'))
    const { d, moduleMm } = qrPath(matrix)
    const blockLeft = (STICKER_MM - QR_BLOCK_MM) / 2
    const coords = [...d.matchAll(/M([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
    const xs = coords.map(([x]) => x)
    expect(Math.min(...xs)).toBeCloseTo(blockLeft + QUIET_MODULES * moduleMm, 3)
    expect(Math.max(...xs) + moduleMm).toBeCloseTo(blockLeft + QR_BLOCK_MM - QUIET_MODULES * moduleMm, 3)
    expect(moduleMm).toBeGreaterThan(0.55)
  })
})

describe('stickerSvg', () => {
  const svg = stickerSvg({ url: labelUrl('https://hortlog.com', 'abc123'), name: 'Scene 001', cutLine: true })

  it('is exactly 25 mm square', () => {
    expect(svg).toContain('width="25mm" height="25mm" viewBox="0 0 25 25"')
  })

  it('has the site name above and the scene name below', () => {
    expect(svg.indexOf('>hortlog.com</text>')).toBeLessThan(svg.indexOf('<path'))
    expect(svg.indexOf('<path')).toBeLessThan(svg.indexOf('>Scene 001</text>'))
  })

  it('draws the cut line on the 25 mm edge only when asked', () => {
    expect(svg).toContain('stroke="#bbbbbb"')
    expect(stickerSvg({ url: 'HTTPS://HORTLOG.COM/v/abc123', name: 'Scene 001' })).not.toContain('stroke="#bbbbbb"')
  })

  it('squeezes a long name to fit the label', () => {
    expect(stickerSvg({ url: 'HTTPS://HORTLOG.COM/v/abc123', name: 'The World Garden North America' })).toContain(
      'textLength="22"',
    )
    expect(svg).not.toContain('textLength')
  })
})
