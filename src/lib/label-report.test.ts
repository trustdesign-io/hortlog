import { describe, expect, it } from 'vitest'
import { cleanLabelNote, isLabelProblem, labelTaskDescription, labelTaskTitle, MAX_LABEL_NOTE } from './label-report'

describe('labelTaskTitle', () => {
  it('names the problem and the plant', () => {
    expect(labelTaskTitle(['MISSING'], 'Didierea trollii')).toBe('Label: Missing — Didierea trollii')
  })

  it('lists each different problem once', () => {
    expect(labelTaskTitle(['MISSING', 'WRONG_NAME', 'MISSING'], 'Aloe vera')).toBe('Label: Missing / Wrong name — Aloe vera')
  })
})

describe('labelTaskDescription', () => {
  it('lists every report, oldest first, without naming visitors', () => {
    const text = labelTaskDescription([
      { problem: 'WRONG_NAME', note: 'says Aloe', fromVisitor: false, createdAt: new Date('2026-10-21T10:00:00Z'), by: 'Danny' },
      { problem: 'MISSING', note: null, fromVisitor: true, createdAt: new Date('2026-10-20T10:00:00Z'), by: null },
    ])
    expect(text).toBe('Reported 2 times.\n• 20 Oct, a visitor: Missing\n• 21 Oct, Danny: Wrong name — “says Aloe”')
  })
})

describe('input', () => {
  it('only accepts the four problems', () => {
    expect(isLabelProblem('HIDDEN')).toBe(true)
    expect(isLabelProblem('STOLEN')).toBe(false)
  })

  it('tidies and caps notes', () => {
    expect(cleanLabelNote('  behind   the rock ')).toBe('behind the rock')
    expect(cleanLabelNote('   ')).toBeNull()
    expect(cleanLabelNote('x'.repeat(MAX_LABEL_NOTE + 50))?.length).toBe(MAX_LABEL_NOTE)
  })
})
