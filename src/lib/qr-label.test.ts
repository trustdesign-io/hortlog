import { describe, expect, it } from 'vitest'
import { labelHeight, labelSvg, wrapLabel } from './qr-label'

describe('wrapLabel', () => {
  it('keeps a short name on one line', () => {
    expect(wrapLabel('Cloud Garden')).toEqual(['Cloud Garden'])
  })
  it('wraps at word boundaries', () => {
    expect(wrapLabel('Cloud Garden Australia and New Zealand')).toEqual(['Cloud Garden Australia', 'and New Zealand'])
  })
  it('stops at two lines with an ellipsis', () => {
    const lines = wrapLabel('The very long name of a scene that keeps on going and going')
    expect(lines).toHaveLength(2)
    expect(lines[1].endsWith('…')).toBe(true)
  })
  it('cuts a single overlong word', () => {
    expect(wrapLabel('Supercalifragilisticexpialidocious')[0]).toHaveLength(22)
  })
})

describe('labelSvg', () => {
  const qr = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 37 37"><path d="M0 0h1"/></svg>'

  it('puts the name under the code', () => {
    const svg = labelSvg(qr, 'Cloud Garden')
    expect(svg).toContain('>Cloud Garden</text>')
    expect(svg).toContain(`height="${labelHeight(1)}"`)
    expect(svg).toContain('<svg x="60" y="60" width="1000" height="1000" xmlns')
    expect(svg).toContain('viewBox="0 0 37 37"')
    expect(svg).toContain('stroke-dasharray')
  })
  it('escapes the name', () => {
    expect(labelSvg(qr, 'Ferns & <mosses>')).toContain('Ferns &amp; &lt;mosses&gt;')
  })
})
