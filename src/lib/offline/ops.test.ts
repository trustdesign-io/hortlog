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
      entry: { action: 'PRUNED', date: '2026-10-15', actionNote: 'hard', location: null, text: null, coworkerIds: [] },
    })
  })

  it('keeps who it was worked with', () => {
    const op = parseOp({ ...base, kind: 'recordWork', specimenId: 's1', entry: { action: 'PRUNED', date: '2026-10-15', coworkerIds: ['u2', 3, 'u3'] } })
    expect(op && op.kind === 'recordWork' && op.entry.coworkerIds).toEqual(['u2', 'u3'])
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

describe('building a scene offline', () => {
  const scene = {
    id: 'sc1',
    name: 'Scene 001',
    slug: 'scene-001',
    shortCode: 'abc123',
    gridRows: 2,
    gridCols: 2,
    rowShift: 0,
    perspective: 'BED' as const,
    primaryCollectionId: null,
    splitCells: [],
    active: false,
  }
  const s0 = { ...snap, scenes: [scene], speciesList: [{ id: 'sp1', scientificName: 'Rosa', commonName: 'Rose' }] }
  const at = (n: number) => ({ id: `0b6f4c3e-1111-4c2a-9f00-12345678900${n}`, org: 'acme', createdAt: `2026-10-16T10:0${n}:00.000Z` })
  const newId = 'c' + 'a'.repeat(24)

  it('parses the new kinds of change', () => {
    expect(parseOp({ ...at(1), kind: 'createSpecimen', specimenId: newId, speciesId: null, fieldName: 'Agave sp.' })).toMatchObject({ fieldName: 'Agave sp.' })
    expect(parseOp({ ...at(1), kind: 'createSpecimen', specimenId: 'nope', speciesId: null, fieldName: 'Agave' })).toBeNull()
    expect(parseOp({ ...at(2), kind: 'placeSpecimen', sceneId: 'sc1', specimenId: newId, row: 0, col: 1, sub: 7 })).toBeNull()
    expect(parseOp({ ...at(3), kind: 'resizeGrid', sceneId: 'sc1', steps: [{ side: 'top', delta: 1 }] })).toMatchObject({ kind: 'resizeGrid' })
    expect(parseOp({ ...at(4), kind: 'updateScene', sceneId: 'sc1', active: true, title: '  Cactus  bed ' })).toMatchObject({ active: true, title: 'Cactus bed' })
  })

  it('shows a scene set up offline straight away', () => {
    const out = applyPending(s0, [
      { ...at(1), kind: 'updateScene', sceneId: 'sc1', active: true, title: 'Cactus bed' },
      { ...at(2), kind: 'createSpecimen', specimenId: newId, speciesId: null, fieldName: 'Agave sp.', accessionNumber: null, notes: null },
      { ...at(3), kind: 'placeSpecimen', sceneId: 'sc1', specimenId: newId, row: 1, col: 1, sub: null },
      { ...at(4), kind: 'resizeGrid', sceneId: 'sc1', steps: [{ side: 'top', delta: 1 }] },
      { ...at(5), kind: 'splitHex', sceneId: 'sc1', row: 2, col: 1, split: true },
    ])
    const sc = out.scenes[0]
    expect(sc).toMatchObject({ active: true, title: 'Cactus bed', gridRows: 3, splitCells: ['2,1'] })
    const plant = out.specimens.find((s) => s.id === newId)!
    expect(plant).toMatchObject({ sceneId: 'sc1', gridCell: '2,1:0', pending: true })
    expect(plant.species.scientificName).toBe('Agave sp.')
  })

  it('names a new plant from a species already in hortlog', () => {
    const out = applyPending(s0, [
      { ...at(1), kind: 'createSpecimen', specimenId: newId, speciesId: 'sp1', fieldName: null, accessionNumber: null, notes: null },
    ])
    expect(out.specimens.find((s) => s.id === newId)!.species.commonName).toBe('Rose')
  })

  it('takes a plant off the cell another is placed in', () => {
    const out = applyPending(s0, [
      { ...at(1), kind: 'placeSpecimen', sceneId: 'sc1', specimenId: 's1', row: 0, col: 0, sub: null },
      { ...at(2), kind: 'createSpecimen', specimenId: newId, speciesId: 'sp1', fieldName: null, accessionNumber: null, notes: null },
      { ...at(3), kind: 'placeSpecimen', sceneId: 'sc1', specimenId: newId, row: 0, col: 0, sub: null },
    ])
    expect(out.specimens.find((s) => s.id === 's1')!.sceneId).toBeNull()
  })
})

describe('setStage', () => {
  it('accepts a known stage and refuses anything else', () => {
    expect(parseOp({ ...base, kind: 'setStage', specimenId: 's1', stage: 'FLOWER' })).toEqual({
      ...base,
      kind: 'setStage',
      specimenId: 's1',
      stage: 'FLOWER',
    })
    expect(parseOp({ ...base, kind: 'setStage', specimenId: 's1', stage: 'BLOOMING' })).toBeNull()
    expect(parseOp({ ...base, kind: 'setStage', stage: 'FLOWER' })).toBeNull()
  })

  it('shows on the saved copy straight away', () => {
    const snap = {
      org: { id: 'o1', slug: 'acme', name: 'Acme' },
      specimens: [{ id: 's1', species: { scientificName: 'Didierea trollii' } }],
      scenes: [],
      tasks: [],
      myRecords: [],
    } as unknown as OrgSnapshot
    const out = applyPending(snap, [{ ...base, kind: 'setStage', specimenId: 's1', stage: 'FLOWER' }])
    expect(out.specimens[0]).toMatchObject({ stage: 'FLOWER', stageSeenAt: base.createdAt })
  })
})
