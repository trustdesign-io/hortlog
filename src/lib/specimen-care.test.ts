import { describe, expect, it } from 'vitest'
import { careLabel, toCareEntry, type CareEntrySource } from './specimen-care'

function entry(user: Partial<CareEntrySource['workRecord']['user']> = {}): CareEntrySource {
  return {
    id: 'e1',
    date: new Date('2027-05-17T00:00:00Z'),
    action: 'PRUNED',
    actionNote: null,
    text: 'Took out the crossing stems',
    workRecord: {
      user: { name: 'Simone Lawler', username: 'simone', recordPublic: false, creditOnPlants: false, ...user },
    },
  }
}

describe('careLabel', () => {
  it('uses the action label', () => {
    expect(careLabel('PRUNED', null)).toBe('Pruned')
  })
  it('adds the note to a named action', () => {
    expect(careLabel('FED', 'tomato feed')).toBe('Fed: tomato feed')
  })
  it('uses the note alone for Other', () => {
    expect(careLabel('OTHER', 'Tied in to the frame')).toBe('Tied in to the frame')
  })
})

describe('toCareEntry', () => {
  it('does not name someone on a public page unless they opted in', () => {
    expect(toCareEntry(entry(), 'public').by).toBeNull()
  })
  it('names someone who opted in, without a link if their record is private', () => {
    expect(toCareEntry(entry({ creditOnPlants: true }), 'public').by).toEqual({ name: 'Simone Lawler', href: null })
  })
  it('links to their public record when they have one', () => {
    const by = toCareEntry(entry({ creditOnPlants: true, recordPublic: true }), 'public').by
    expect(by?.href).toBe('/u/simone')
  })
  it('never shows notes publicly', () => {
    expect(toCareEntry(entry({ creditOnPlants: true }), 'public').note).toBeNull()
  })
  it('shows members everyone, with notes, whatever the opt-in', () => {
    const e = toCareEntry(entry(), 'members')
    expect(e.by?.name).toBe('Simone Lawler')
    expect(e.note).toBe('Took out the crossing stems')
  })
  it('leaves out a person with no name', () => {
    expect(toCareEntry(entry({ name: null }), 'members').by).toBeNull()
  })
})
