import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getCurrentUser, findUnique, notFound, redirect } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

vi.mock('next/navigation', () => ({ notFound, redirect }))
vi.mock('./current-user', () => ({ getCurrentUser }))
vi.mock('@/lib/prisma', () => ({ prisma: { organisation: { findUnique } } }))

import { requireOrgAccess, checkOrgAccess } from './permissions'

const ORG = { id: 'org1', slug: 'world-garden', name: 'World Garden' }

function user({ isAdmin = false, member = false } = {}) {
  return {
    id: 'u1',
    email: 'u1@example.com',
    isAdmin,
    memberships: member ? [{ role: 'MANAGER', organisation: ORG }] : [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  findUnique.mockImplementation(({ where }: { where: { slug: string } }) =>
    Promise.resolve(where.slug === ORG.slug ? { id: ORG.id } : null),
  )
})

describe('requireOrgAccess', () => {
  it('lets a platform admin into an organisation they are not a member of', async () => {
    getCurrentUser.mockResolvedValue(user({ isAdmin: true }))
    await expect(requireOrgAccess('world-garden', 'can_edit_org_settings')).resolves.toMatchObject({
      orgSlug: 'world-garden',
    })
  })

  it('sends a platform admin to the no-access page for an organisation that does not exist', async () => {
    getCurrentUser.mockResolvedValue(user({ isAdmin: true }))
    await expect(requireOrgAccess('nope', 'can_edit_specimen')).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/no-access')
  })

  it('sends a non-member who is not an admin to the no-access page', async () => {
    getCurrentUser.mockResolvedValue(user())
    await expect(requireOrgAccess('world-garden', 'can_edit_specimen')).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/no-access')
  })

  it('sends a member whose role lacks the capability to the no-access page', async () => {
    getCurrentUser.mockResolvedValue({
      ...user(),
      memberships: [{ role: 'MEMBER', organisation: ORG }],
    })
    await expect(requireOrgAccess('world-garden', 'can_edit_org_settings')).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/no-access')
  })

  it('still lets a member in', async () => {
    getCurrentUser.mockResolvedValue(user({ member: true }))
    await expect(requireOrgAccess('world-garden', 'can_edit_specimen')).resolves.toMatchObject({
      orgSlug: 'world-garden',
    })
  })
})

describe('checkOrgAccess', () => {
  it('allows a platform admin without a membership', async () => {
    getCurrentUser.mockResolvedValue(user({ isAdmin: true }))
    await expect(checkOrgAccess('world-garden', 'can_manage_members')).resolves.toMatchObject({ allowed: true })
  })

  it('denies a non-member who is not an admin', async () => {
    getCurrentUser.mockResolvedValue(user())
    await expect(checkOrgAccess('world-garden', 'can_edit_specimen')).resolves.toEqual({ allowed: false, user: null })
  })
})
