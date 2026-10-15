import { describe, expect, it } from 'vitest'
import { parseOp } from './ops'
import { applyPending } from './pending'
import type { OrgSnapshot } from './types'

const base = { id: '0b6f4c3e-1111-4c2a-9f00-123456789abc', org: 'acme', createdAt: '2026-10-15T10:00:00.000Z' }

describe('parseOp', () => {
  it('accepts recorded work and tidies the text', () => {
    expect(
      parseOp({ ...base, kind: 'recordWork', specimenId: 's1', entry: { action: 'PRUNED', date: '2026-10-15', actionNote: '  hard ', text: '' } }),
    ).toEqual({
      ...base,
      kind: 'recordWork',
      specimenId: 's1',
      entry: { action: 'PRUNED', date: '2026-10-15', actionNote: 'hard', location: null, text: null },
    })
  })

  it('accepts a task tick', () => {
    expect(parseOp({ ...base, kind: 'setTaskStatus', taskId: 't1', status: 'DONE' })).toMatchObject({ status: 'DONE' })
  })

  it.each([
    ['unknown kind', { ...base, kind: 'deleteEverything' }],
    ['bad action', { ...base, kind: 'recordWork', specimenId: 's1', entry: { action: 'NUKED', date: '2026-10-15' } }],
    ['bad date', { ...base, kind: 'recordWork', specimenId: 's1', entry: { action: 'PRUNED', date: '15/10/2026' } }],
    ['bad status', { ...base, kind: 'setTaskStatus', taskId: 't1', status: 'MAYBE' }],
    ['bad id', { ...base, id: 'x', kind: 'setTaskStatus', taskId: 't1', status: 'DONE' }],
    ['no org', { ...base, org: '', kind: 'setTaskStatus', taskId: 't1', status: 'DONE' }],
    ['not an object', 'hello'],
  ])('rejects %s', (_label, raw) => {
    expect(parseOp(raw)).toBeNull()
  })
})

const snap: OrgSnapshot = {
  version: 1,
  syncedAt: '2026-10-15T09:00:00.000Z',
  user: { id: 'u1', name: null, canManage: true },
  org: { id: 'o1', slug: 'acme', name: 'Acme' },
  specimens: [
    {
      id: 's1',
      slug: 'rosa',
      cultivar: null,
      accessionNumber: null,
      notes: null,
      imageUrl: null,
      sceneId: null,
      gridCell: null,
      collectionIds: [],
      species: { commonName: 'Rose', scientificName: 'Rosa', authority: null, family: null, origin: null, description: null, photoUrl: null, status: null },
    },
  ],
  scenes: [],
  collections: [],
  tasks: [
    { id: 't1', title: 'Prune', description: null, status: 'OPEN', dueDate: null, completedAt: null, careAction: null, specimenId: null, sceneId: null, cells: [], assignees: [] },
  ],
  myRecords: [],
}

describe('applyPending', () => {
  it('shows a ticked task as done and waiting', () => {
    const out = applyPending(snap, [{ ...base, kind: 'setTaskStatus', taskId: 't1', status: 'DONE' }])
    expect(out.tasks[0]).toMatchObject({ status: 'DONE', completedAt: base.createdAt, pending: true })
    expect(snap.tasks[0].status).toBe('OPEN')
  })

  it('starts a new record for a first piece of work', () => {
    const out = applyPending(snap, [
      { ...base, kind: 'recordWork', specimenId: 's1', entry: { action: 'PRUNED', date: '2026-10-15', actionNote: null, location: null, text: null } },
    ])
    expect(out.myRecords).toHaveLength(1)
    expect(out.myRecords[0]).toMatchObject({ pending: true, scientificName: 'Rosa' })
    expect(out.myRecords[0].entries[0]).toMatchObject({ action: 'PRUNED', pending: true })
  })

  it('ignores refused changes and other organisations', () => {
    const op = { ...base, kind: 'setTaskStatus' as const, taskId: 't1', status: 'DONE' as const }
    expect(applyPending(snap, [{ ...op, error: 'Gone' }])).toBe(snap)
    expect(applyPending(snap, [{ ...op, org: 'other' }])).toBe(snap)
  })
})
