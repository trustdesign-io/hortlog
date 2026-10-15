import { describe, it, expect, vi, beforeEach } from 'vitest'

const { requireOrgAccess, revalidatePath, scene, collection } = vi.hoisted(() => ({
  requireOrgAccess: vi.fn(),
  revalidatePath: vi.fn(),
  scene: { findFirst: vi.fn(), update: vi.fn() },
  collection: { findFirst: vi.fn() },
}))

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/auth/permissions', () => ({ requireOrgAccess }))
vi.mock('@/lib/prisma', () => ({ prisma: { scene, collection } }))

import { updateScene } from './scene'

function form(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  requireOrgAccess.mockResolvedValue({ user: { id: 'u1' } })
  scene.findFirst.mockResolvedValue({ id: 'scene-1', organisationId: 'org-1' })
  collection.findFirst.mockResolvedValue({ id: 'col-1' })
})

describe('updateScene', () => {
  it('refuses a new name', async () => {
    const result = await updateScene('org', 'scene-1', null, form({ name: 'Renamed' }))
    expect(result.success).toBe(false)
    expect(scene.update).not.toHaveBeenCalled()
  })

  it('refuses a new slug', async () => {
    const result = await updateScene('org', 'scene-1', null, form({ slug: 'renamed' }))
    expect(result.success).toBe(false)
    expect(scene.update).not.toHaveBeenCalled()
  })

  it('changes the primary collection and perspective without touching the name', async () => {
    const result = await updateScene('org', 'scene-1', null, form({ primaryCollectionId: 'col-1', perspective: 'WALL' }))
    expect(result.success).toBe(true)
    const data = scene.update.mock.calls[0][0].data
    expect(data).toEqual({ primaryCollectionId: 'col-1', perspective: 'WALL' })
    expect(data).not.toHaveProperty('name')
    expect(data).not.toHaveProperty('slug')
  })
})
