import { describe, expect, it } from 'vitest'
import { publicScenePath } from './scene-urls'

describe('publicScenePath', () => {
  it('nests a scene under its collection', () => {
    expect(publicScenePath('kew', 'palm-house', 'tropics')).toBe('/kew/tropics/palm-house')
  })
  it('gives a scene without a collection its own address', () => {
    expect(publicScenePath('kew', 'palm-house', null)).toBe('/kew/scene/palm-house')
  })
})
