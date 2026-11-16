import { describe, it, expect, vi, beforeEach } from 'vitest'

const { requireAuth, revalidatePath, species, tx } = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  revalidatePath: vi.fn(),
  species: { findUnique: vi.fn() },
  tx: {
    workRecord: { findFirst: vi.fn(), aggregate: vi.fn(), create: vi.fn(), update: vi.fn() },
    workLogEntry: { create: vi.fn() },
  },
}))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/lib/auth/permissions', () => ({ requireAuth }))
vi.mock('@/lib/prisma', () => ({
  prisma: { species, $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) },
}))

import { addWorkElsewhere } from './record-elsewhere'

const BLACKTHORN = {
  id: 'sp1',
  scientificName: 'Prunus spinosa',
  authority: 'L.',
  family: 'Rosaceae',
  commonName: 'Blackthorn',
  origin: null,
  powoUrl: null,
}
const input = { speciesId: 'sp1', site: ' Riverview  Academy ', date: '2026-11-16', action: 'PRUNED', text: 'Cut down the hedge' }

describe('addWorkElsewhere', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAuth.mockResolvedValue({ id: 'u1' })
    species.findUnique.mockResolvedValue(BLACKTHORN)
    tx.workRecord.aggregate.mockResolvedValue({ _max: { recordNumber: 33 } })
    tx.workRecord.create.mockResolvedValue({ id: 'r34' })
  })

  it('makes the next numbered record, with no garden, and its first entry', async () => {
    tx.workRecord.findFirst.mockResolvedValue(null)
    const res = await addWorkElsewhere(input)
    expect(res).toEqual({ success: true, recordId: 'r34' })
    expect(tx.workRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recordNumber: 34,
          site: 'Riverview Academy',
          speciesId: 'sp1',
          nameHtml: '<i>Prunus spinosa</i> L.',
        }),
      }),
    )
    expect(tx.workRecord.create.mock.calls[0][0].data).not.toHaveProperty('organisationId')
    expect(tx.workLogEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'PRUNED', text: 'Cut down the hedge', workRecordId: 'r34' }),
    })
  })

  it('adds to the existing record for the same plant at the same site', async () => {
    tx.workRecord.findFirst.mockResolvedValue({ id: 'r30', firstWorkedDate: new Date('2026-11-11') })
    const res = await addWorkElsewhere(input)
    expect(res).toEqual({ success: true, recordId: 'r30' })
    expect(tx.workRecord.create).not.toHaveBeenCalled()
    expect(tx.workLogEntry.create).toHaveBeenCalledWith({ data: expect.objectContaining({ workRecordId: 'r30' }) })
  })

  it('needs a site and a real action', async () => {
    expect((await addWorkElsewhere({ ...input, site: '  ' })).success).toBe(false)
    expect((await addWorkElsewhere({ ...input, action: 'NAPPED' })).success).toBe(false)
    expect((await addWorkElsewhere({ ...input, action: 'OTHER' })).success).toBe(false)
  })
})
