import { describe, expect, it } from 'vitest'
import { planSceneBatch, sceneName, sceneSlug } from './scene-batch.mjs'

describe('planSceneBatch', () => {
  it('numbers names and slugs with three digits', () => {
    expect(sceneName(7)).toBe('Scene 007')
    expect(sceneSlug(70)).toBe('scene-070')
  })

  it('creates 70 scenes with unique codes', () => {
    const plan = planSceneBatch({ count: 70, existingSlugs: [], existingCodes: [] })
    expect(plan).toHaveLength(70)
    expect(new Set(plan.map((s: { shortCode: string }) => s.shortCode)).size).toBe(70)
    expect(plan[0]).toMatchObject({ name: 'Scene 001', slug: 'scene-001' })
  })

  it('skips scenes that exist and avoids codes used anywhere', () => {
    const codes = ['aaaaaa', 'bbbbbb', 'cccccc']
    let i = 0
    const plan = planSceneBatch({
      count: 3,
      existingSlugs: ['scene-002'],
      existingCodes: ['aaaaaa'],
      makeCode: () => codes[i++],
    })
    expect(plan.map((s: { slug: string; shortCode: string }) => [s.slug, s.shortCode])).toEqual([
      ['scene-001', 'bbbbbb'],
      ['scene-003', 'cccccc'],
    ])
  })
})
