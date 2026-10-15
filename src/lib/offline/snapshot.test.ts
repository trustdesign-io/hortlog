import { describe, it, expect, vi, beforeEach } from 'vitest'

const { organisation, specimen, scene, collection, task, workRecord } = vi.hoisted(() => ({
  organisation: { findUnique: vi.fn() },
  specimen: { findMany: vi.fn() },
  scene: { findMany: vi.fn() },
  collection: { findMany: vi.fn() },
  task: { findMany: vi.fn() },
  workRecord: { findMany: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: { organisation, specimen, scene, collection, task, workRecord } }))

import { buildOrgSnapshot } from './snapshot'
import { offlineImageUrl, snapshotImageUrls, SNAPSHOT_VERSION } from './types'

const day = new Date('2026-10-01T00:00:00Z')

beforeEach(() => {
  vi.clearAllMocks()
  organisation.findUnique.mockResolvedValue({ id: 'o1', slug: 'acme', name: 'Acme' })
  specimen.findMany.mockResolvedValue([
    {
      id: 's1',
      slug: 'rosa',
      cultivar: null,
      accessionNumber: 'A1',
      notes: null,
      imageUrl: null,
      sceneId: 'sc1',
      gridCell: '0,0',
      collections: [{ collectionId: 'c1' }],
      species: {
        commonName: 'Rose',
        scientificName: 'Rosa',
        authority: 'L.',
        family: 'Rosaceae',
        origin: null,
        description: null,
        photoUrl: 'https://example.com/rosa.jpg',
        statusCategory: null,
        conservationStatus: 'LC',
      },
    },
  ])
  scene.findMany.mockResolvedValue([])
  collection.findMany.mockResolvedValue([{ id: 'c1', name: 'Hot', slug: 'hot', description: null, type: { name: 'Location' } }])
  task.findMany.mockResolvedValue([
    {
      id: 't1',
      title: 'Water',
      description: null,
      status: 'OPEN',
      dueDate: day,
      completedAt: null,
      careAction: 'WATERED',
      specimenId: 's1',
      sceneId: null,
      cells: [],
      assignees: [{ user: { name: null, email: 'a@b.c' } }],
    },
  ])
  workRecord.findMany.mockResolvedValue([
    {
      id: 'r1',
      recordNumber: 1,
      specimenId: 's1',
      scientificName: 'Rosa',
      firstWorkedDate: day,
      logEntries: [{ id: 'e1', date: day, action: 'PRUNED', actionNote: null, location: null, text: null }],
    },
  ])
})

describe('buildOrgSnapshot', () => {
  it('returns null for an unknown organisation', async () => {
    organisation.findUnique.mockResolvedValue(null)
    expect(await buildOrgSnapshot('nope', { id: 'u1', name: null }, false)).toBeNull()
  })

  it('flattens the data into plain, serialisable values', async () => {
    const s = await buildOrgSnapshot('acme', { id: 'u1', name: 'Ann' }, true)
    expect(s).not.toBeNull()
    expect(s!.version).toBe(SNAPSHOT_VERSION)
    expect(s!.user).toEqual({ id: 'u1', name: 'Ann', canManage: true })
    expect(s!.specimens[0].collectionIds).toEqual(['c1'])
    expect(s!.specimens[0].species.status).toBe('LC')
    expect(s!.collections[0].typeName).toBe('Location')
    expect(s!.tasks[0]).toMatchObject({ dueDate: day.toISOString(), assignees: ['a@b.c'] })
    expect(s!.myRecords[0].entries[0].date).toBe(day.toISOString())
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })

  it("only includes the member's own records", async () => {
    await buildOrgSnapshot('acme', { id: 'u1', name: null }, false)
    expect(workRecord.findMany.mock.calls[0][0].where).toEqual({ userId: 'u1', specimen: { organisationId: 'o1' } })
  })

  it('lists each plant photo once, resized', async () => {
    const s = await buildOrgSnapshot('acme', { id: 'u1', name: null }, false)
    expect(snapshotImageUrls(s!)).toEqual([offlineImageUrl('https://example.com/rosa.jpg')])
    expect(offlineImageUrl('https://example.com/rosa.jpg')).toBe(
      '/_next/image?url=https%3A%2F%2Fexample.com%2Frosa.jpg&w=384&q=75',
    )
  })
})
