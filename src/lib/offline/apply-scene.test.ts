import { describe, it, expect, vi, beforeEach } from 'vitest'

const { syncOp, specimen, species, scene, organisation, searchCatalogue, addFromCatalogue } = vi.hoisted(() => ({
  syncOp: { findUnique: vi.fn(), create: vi.fn() },
  specimen: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  species: { findUnique: vi.fn(), findFirst: vi.fn(), upsert: vi.fn() },
  scene: { findFirst: vi.fn(), update: vi.fn() },
  organisation: { findUnique: vi.fn() },
  searchCatalogue: vi.fn(),
  addFromCatalogue: vi.fn(),
}))

const tx = { syncOp, specimen, scene, task: { update: vi.fn() } }
vi.mock('@/lib/prisma', () => ({
  prisma: { syncOp, specimen, species, scene, organisation, $transaction: (fn: (t: typeof tx) => Promise<unknown>) => fn(tx) },
}))
vi.mock('@/lib/work-record-db', () => ({ ensureWorkRecord: vi.fn(), WORK_RECORD_SPECIMEN_SELECT: {} }))
vi.mock('@/lib/task-care', () => ({ syncTaskCare: vi.fn() }))
vi.mock('@/lib/plant-span', () => ({ releaseHex: vi.fn() }))
vi.mock('@/lib/species-catalogue', async () => {
  const real = await vi.importActual<typeof import('@/lib/species-catalogue')>('@/lib/species-catalogue')
  return { labelName: real.labelName, searchCatalogue, addFromCatalogue }
})

import { applyOps } from './apply'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import type { SyncOpInput } from './ops'

const manager = { id: 'u1', isAdmin: false, memberships: [{ role: 'MANAGER', organisation: { slug: 'acme' } }] } as unknown as UserWithMemberships
const member = { id: 'u2', isAdmin: false, memberships: [{ role: 'MEMBER', organisation: { slug: 'acme' } }] } as unknown as UserWithMemberships
const newId = 'c' + 'b'.repeat(24)
const base = (n: number) => ({ id: `op-0000000${n}`, org: 'acme', createdAt: '2026-10-16T10:00:00.000Z' })
const create = (fieldName: string): SyncOpInput => ({
  ...base(1),
  kind: 'createSpecimen',
  specimenId: newId,
  speciesId: null,
  fieldName,
  accessionNumber: null,
  notes: 'by the gate',
})

beforeEach(() => {
  vi.clearAllMocks()
  syncOp.findUnique.mockResolvedValue(null)
  organisation.findUnique.mockResolvedValue({ id: 'o1' })
  specimen.findUnique.mockResolvedValue(null)
  specimen.findFirst.mockResolvedValue(null)
  species.findFirst.mockResolvedValue(null)
  species.upsert.mockResolvedValue({ id: 'unknown', scientificName: 'Unidentified' })
  searchCatalogue.mockResolvedValue({ existing: [], catalogue: [] })
})

describe('adding a plant offline', () => {
  it('looks the typed name up and adds the species when it matches exactly', async () => {
    searchCatalogue.mockResolvedValue({
      existing: [],
      catalogue: [{ usageId: 'X1', label: 'Agave americana L.', status: 'accepted', acceptedLabel: null, family: null, rank: 'species', existingId: null }],
    })
    addFromCatalogue.mockResolvedValue({ ok: true, species: { id: 'sp9', scientificName: 'Agave americana' }, existed: false })
    expect(await applyOps(manager, [create('agave americana')])).toEqual([{ id: 'op-00000001', status: 'applied' }])
    expect(addFromCatalogue).toHaveBeenCalledWith('X1', 'agave americana')
    expect(specimen.create.mock.calls[0][0].data).toMatchObject({ id: newId, speciesId: 'sp9', notes: 'by the gate', organisationId: 'o1' })
  })

  it('keeps a name it can’t be sure of as Unidentified, with the name in the notes', async () => {
    searchCatalogue.mockResolvedValue({
      existing: [],
      catalogue: [
        { usageId: 'G', label: 'Agave L.', status: 'accepted', acceptedLabel: null, family: null, rank: 'genus', existingId: null },
      ],
    })
    await applyOps(manager, [create('Agave')])
    expect(addFromCatalogue).not.toHaveBeenCalled()
    expect(specimen.create.mock.calls[0][0].data).toMatchObject({ speciesId: 'unknown', notes: 'Field name: Agave\n\nby the gate' })
  })

  it('still adds the plant if the catalogue is down', async () => {
    searchCatalogue.mockRejectedValue(new Error('timeout'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await applyOps(manager, [create('Agave americana')]))[0].status).toBe('applied')
    expect(specimen.create.mock.calls[0][0].data.speciesId).toBe('unknown')
  })

  it('uses a species already in hortlog by that name without searching', async () => {
    species.findFirst.mockResolvedValue({ id: 'sp1', scientificName: 'Rosa' })
    await applyOps(manager, [create('rose')])
    expect(searchCatalogue).not.toHaveBeenCalled()
    expect(specimen.create.mock.calls[0][0].data.speciesId).toBe('sp1')
  })

  it('refuses members, who can’t add plants', async () => {
    expect((await applyOps(member, [create('Agave')]))[0].status).toBe('rejected')
  })
})

describe('placing and laying out offline', () => {
  const sceneRow = { id: 'sc1', organisationId: 'o1', gridRows: 3, gridCols: 3, rowShift: 0, splitCells: ['1,1'] }

  it('places a plant in a small cell, taking off whatever was there', async () => {
    scene.findFirst.mockResolvedValue(sceneRow)
    specimen.findFirst.mockResolvedValue({ id: newId })
    await applyOps(manager, [{ ...base(2), kind: 'placeSpecimen', sceneId: 'sc1', specimenId: newId, row: 1, col: 1, sub: 3 }])
    expect(specimen.updateMany).toHaveBeenCalledWith({
      where: { sceneId: 'sc1', gridCell: '1,1:3', id: { not: newId } },
      data: { sceneId: null, gridCell: null, extraCells: [], photoX: null, photoY: null },
    })
    expect(specimen.update).toHaveBeenCalledWith({ where: { id: newId }, data: { sceneId: 'sc1', gridCell: '1,1:3', extraCells: [] } })
  })

  it('puts a whole-cell placement into a free small cell if the hex was split meanwhile', async () => {
    scene.findFirst.mockResolvedValue(sceneRow)
    specimen.findFirst.mockResolvedValue({ id: newId })
    specimen.findMany.mockResolvedValue([{ gridCell: '1,1:0' }])
    await applyOps(manager, [{ ...base(2), kind: 'placeSpecimen', sceneId: 'sc1', specimenId: newId, row: 1, col: 1, sub: null }])
    expect(specimen.update.mock.calls[0][0].data.gridCell).toBe('1,1:1')
  })

  it('switches a scene on and titles it', async () => {
    scene.findFirst.mockResolvedValue(sceneRow)
    await applyOps(manager, [{ ...base(3), kind: 'updateScene', sceneId: 'sc1', active: true, title: 'Cactus bed' }])
    expect(scene.update).toHaveBeenCalledWith({ where: { id: 'sc1' }, data: { active: true, title: 'Cactus bed' } })
  })
})
