import { describe, it, expect } from 'vitest'
import { WorkAction, WORK_ACTION_LABELS } from '../work-record-constants'

// Server actions require Prisma + Supabase — integration tested via E2E.
// This file covers the exported constants and enum shape.

describe('WorkAction', () => {
  it('exports the WorkAction enum', () => {
    expect(WorkAction.PLANTED).toBe('PLANTED')
    expect(WorkAction.PRUNED).toBe('PRUNED')
    expect(WorkAction.OTHER).toBe('OTHER')
  })
})

describe('WORK_ACTION_LABELS', () => {
  it('has a label for every WorkAction value', () => {
    const actions = Object.values(WorkAction)
    for (const action of actions) {
      expect(WORK_ACTION_LABELS[action]).toBeDefined()
      expect(typeof WORK_ACTION_LABELS[action]).toBe('string')
    }
  })

  it('has human-readable labels (no underscores)', () => {
    for (const label of Object.values(WORK_ACTION_LABELS)) {
      expect(label).not.toContain('_')
    }
  })

  it('has the right label for PEST_DISEASE_TREATMENT', () => {
    expect(WORK_ACTION_LABELS.PEST_DISEASE_TREATMENT).toBe('Pest/disease treatment')
  })

  it('has the right count of actions', () => {
    expect(Object.keys(WORK_ACTION_LABELS).length).toBe(Object.values(WorkAction).length)
  })
})
