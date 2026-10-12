import { describe, expect, it } from 'vitest'
import { inCells, planTaskCare, sameTarget, toCareDate, type TaskCareState } from './task-care'

const done: TaskCareState = {
  status: 'DONE',
  completedAt: new Date('2027-05-17T15:30:00Z'),
  careAction: 'WATERED',
  title: 'Water the Cloud Garden',
  assigneeIds: ['simone', 'danny'],
  specimenIds: ['agave', 'aloe'],
}

describe('planTaskCare', () => {
  it('logs the care on every plant for each assignee', () => {
    const plan = planTaskCare(done, [])
    expect(plan.create).toEqual([
      { userId: 'simone', specimenId: 'agave' },
      { userId: 'simone', specimenId: 'aloe' },
      { userId: 'danny', specimenId: 'agave' },
      { userId: 'danny', specimenId: 'aloe' },
    ])
    expect(plan.entry).toEqual({ date: new Date('2027-05-17T00:00:00Z'), action: 'WATERED', actionNote: null })
  })

  it('logs nothing without assignees, plants or an action', () => {
    expect(planTaskCare({ ...done, assigneeIds: [] }, []).entry).toBeNull()
    expect(planTaskCare({ ...done, specimenIds: [] }, []).entry).toBeNull()
    expect(planTaskCare({ ...done, careAction: null }, []).entry).toBeNull()
  })

  it('removes its entries when reopened', () => {
    const plan = planTaskCare({ ...done, status: 'OPEN' }, [{ id: 'e1', userId: 'simone', specimenId: 'agave' }])
    expect(plan.remove).toEqual(['e1'])
    expect(plan.entry).toBeNull()
  })

  it('keeps matching entries, drops stale ones and adds the rest', () => {
    const plan = planTaskCare(done, [
      { id: 'e1', userId: 'simone', specimenId: 'agave' },
      { id: 'e2', userId: 'ex-assignee', specimenId: 'agave' },
      { id: 'e3', userId: 'danny', specimenId: 'moved-away' },
    ])
    expect(plan.update).toEqual(['e1'])
    expect(plan.remove).toEqual(['e2', 'e3'])
    expect(plan.create).toEqual([
      { userId: 'simone', specimenId: 'aloe' },
      { userId: 'danny', specimenId: 'agave' },
      { userId: 'danny', specimenId: 'aloe' },
    ])
  })

  it('uses the task title as the note for Other', () => {
    expect(planTaskCare({ ...done, careAction: 'OTHER' }, []).entry?.actionNote).toBe('Water the Cloud Garden')
  })
})

describe('inCells', () => {
  it('covers every cell when none are chosen', () => {
    expect(inCells([], '3,4')).toBe(true)
  })
  it('covers only chosen cells', () => {
    expect(inCells(['0,1', '2,2'], '2,2')).toBe(true)
    expect(inCells(['0,1'], '2,2')).toBe(false)
    expect(inCells(['0,1'], null)).toBe(false)
  })
})

describe('sameTarget', () => {
  it('ignores cell order', () => {
    expect(sameTarget({ specimenId: null, sceneId: 's', cells: ['0,1', '1,1'] }, { specimenId: null, sceneId: 's', cells: ['1,1', '0,1'] })).toBe(true)
  })
  it('spots a different scene or cells', () => {
    expect(sameTarget({ specimenId: null, sceneId: 's', cells: [] }, { specimenId: null, sceneId: 't', cells: [] })).toBe(false)
    expect(sameTarget({ specimenId: null, sceneId: 's', cells: [] }, { specimenId: null, sceneId: 's', cells: ['0,0'] })).toBe(false)
  })
})

describe('toCareDate', () => {
  it('drops the time', () => {
    expect(toCareDate(new Date('2027-05-17T23:59:00Z')).toISOString()).toBe('2027-05-17T00:00:00.000Z')
  })
})
