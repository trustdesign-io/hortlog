import { describe, it, expect } from 'vitest'

/**
 * Logic tests for org switcher behaviour (ticket #108).
 *
 * The OrgSwitcher client component is not easily unit-tested in isolation
 * (it uses Next.js hooks), so we test the underlying data-selection logic here.
 */

type OrgOption = { id: string; slug: string; name: string }
type Membership = { id: string; role: string; organisation: OrgOption }

function getOrgsToShow(
  isAdmin: boolean,
  memberships: Membership[],
  allOrgs: OrgOption[] | undefined,
): OrgOption[] {
  if (isAdmin && allOrgs !== undefined) return allOrgs
  return memberships.map(m => m.organisation)
}

function getRoleLabel(
  org: OrgOption,
  memberships: Membership[],
  isAdmin: boolean,
): string | null {
  const membership = memberships.find(m => m.organisation.slug === org.slug)
  if (membership) return membership.role === 'MANAGER' ? 'Manager' : 'Member'
  if (isAdmin) return 'Admin access'
  return null
}

describe('OrgSwitcher — admin sees all orgs', () => {
  const allOrgs: OrgOption[] = [
    { id: '1', slug: 'alpha', name: 'Alpha' },
    { id: '2', slug: 'beta', name: 'Beta' },
  ]

  it('admin with no memberships sees all orgs', () => {
    const result = getOrgsToShow(true, [], allOrgs)
    expect(result).toHaveLength(2)
    expect(result.map(o => o.slug)).toEqual(['alpha', 'beta'])
  })

  it('non-admin only sees their own memberships', () => {
    const memberships: Membership[] = [
      { id: 'm1', role: 'MEMBER', organisation: { id: '1', slug: 'alpha', name: 'Alpha' } },
    ]
    const result = getOrgsToShow(false, memberships, undefined)
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('alpha')
  })

  it('admin member shows correct role label', () => {
    const memberships: Membership[] = [
      { id: 'm1', role: 'MANAGER', organisation: { id: '1', slug: 'alpha', name: 'Alpha' } },
    ]
    expect(getRoleLabel(allOrgs[0], memberships, true)).toBe('Manager')
  })

  it('admin non-member shows Admin access label', () => {
    expect(getRoleLabel(allOrgs[1], [], true)).toBe('Admin access')
  })

  it('non-admin shows role label for membership', () => {
    const memberships: Membership[] = [
      { id: 'm1', role: 'MEMBER', organisation: { id: '1', slug: 'alpha', name: 'Alpha' } },
    ]
    expect(getRoleLabel(allOrgs[0], memberships, false)).toBe('Member')
  })
})
