import { describe, expect, it } from 'vitest'
import { planTaskCare, toCareDate, type TaskCareState } from './task-care'

const done: TaskCareState = {
  status: 'DONE',
  completedAt: new Date('2027-05-17T15:30:00Z'),
  specimenId: 'agave',
  careAction: 'PRUNED',
  title: 'Prune the Agave',
  assigneeIds: ['simone', 'danny'],
}

describe('planTaskCare', () => {
  it('logs the care for each assignee when ticked off', () => {
    const plan = planTaskCare(done, [])
    expect(plan.create).toEqual(['simone', 'danny'])
    expect(plan.entry).toEqual({ date: new Date('2027-05-17T00:00:00Z'), action: 'PRUNED', actionNote: null })
  })

  it('logs nothing without assignees', () => {
    const plan = planTaskCare({ ...done, assigneeIds: [] }, [])
    expect(plan.entry).toBeNull()
    expect(plan.create).toEqual([])
  })

  it('logs nothing without a plant or an action', () => {
    expect(planTaskCare({ ...done, specimenId: null }, []).entry).toBeNull()
    expect(planTaskCare({ ...done, careAction: null }, []).entry).toBeNull()
  })

  it('removes its entries when reopened', () => {
    const plan = planTaskCare({ ...done, status: 'OPEN' }, [{ id: 'e1', userId: 'simone', specimenId: 'agave' }])
    expect(plan.remove).toEqual(['e1'])
    expect(plan.entry).toBeNull()
  })

  it('keeps entries for assignees still on the task and adds new ones', () => {
    const plan = planTaskCare(done, [
      { id: 'e1', userId: 'simone', specimenId: 'agave' },
      { id: 'e2', userId: 'ex-assignee', specimenId: 'agave' },
    ])
    expect(plan.update).toEqual(['e1'])
    expect(plan.remove).toEqual(['e2'])
    expect(plan.create).toEqual(['danny'])
  })

  it('moves entries when the plant changes', () => {
    const plan = planTaskCare(done, [{ id: 'e1', userId: 'simone', specimenId: 'other-plant' }])
    expect(plan.remove).toEqual(['e1'])
    expect(plan.create).toEqual(['simone', 'danny'])
  })

  it('uses the task title as the note for Other', () => {
    expect(planTaskCare({ ...done, careAction: 'OTHER' }, []).entry?.actionNote).toBe('Prune the Agave')
  })
})

describe('toCareDate', () => {
  it('drops the time', () => {
    expect(toCareDate(new Date('2027-05-17T23:59:00Z')).toISOString()).toBe('2027-05-17T00:00:00.000Z')
  })
})
