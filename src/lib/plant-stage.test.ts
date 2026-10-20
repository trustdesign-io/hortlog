import { describe, expect, it } from 'vitest'
import { currentStage, freshSince, isPlantStage, STAGE_FRESH_DAYS } from './plant-stage'

const now = new Date('2026-10-20T12:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)

describe('currentStage', () => {
  it('is the stage while it is fresh', () => {
    expect(currentStage('FLOWER', daysAgo(1), now)).toBe('FLOWER')
    expect(currentStage('FRUIT', daysAgo(STAGE_FRESH_DAYS), now)).toBe('FRUIT')
  })

  it('drops off once it has not been confirmed for the fresh period', () => {
    expect(currentStage('FLOWER', daysAgo(STAGE_FRESH_DAYS + 1), now)).toBeNull()
  })

  it('is nothing when over, unknown or never seen', () => {
    expect(currentStage('OVER', daysAgo(1), now)).toBeNull()
    expect(currentStage(null, daysAgo(1), now)).toBeNull()
    expect(currentStage('FLOWER', null, now)).toBeNull()
    expect(currentStage('FLOWER', 'not a date', now)).toBeNull()
  })

  it('accepts ISO strings from saved copies', () => {
    expect(currentStage('BUD', daysAgo(2).toISOString(), now)).toBe('BUD')
  })
})

describe('helpers', () => {
  it('freshSince is the fresh period before now', () => {
    expect(freshSince(now).toISOString()).toBe(daysAgo(STAGE_FRESH_DAYS).toISOString())
  })

  it('isPlantStage only accepts the four stages', () => {
    expect(isPlantStage('FLOWER')).toBe(true)
    expect(isPlantStage('flower')).toBe(false)
    expect(isPlantStage(undefined)).toBe(false)
  })
})
