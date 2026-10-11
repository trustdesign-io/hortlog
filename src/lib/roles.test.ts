import { describe, it, expect } from 'vitest'
import { isLeader, parseRole, roleLabel, ROLES } from './roles'

describe('roles', () => {
  it('orders roles most senior first', () => {
    expect(ROLES).toEqual(['DIRECTOR', 'MANAGER', 'MEMBER'])
  })

  it('treats directors and managers as leaders', () => {
    expect(isLeader('DIRECTOR')).toBe(true)
    expect(isLeader('MANAGER')).toBe(true)
    expect(isLeader('MEMBER')).toBe(false)
  })

  it('parses unknown values as MEMBER', () => {
    expect(parseRole('DIRECTOR')).toBe('DIRECTOR')
    expect(parseRole('ADMIN')).toBe('MEMBER')
    expect(parseRole(null)).toBe('MEMBER')
  })

  it("uses the organisation's titles", () => {
    const labels = { directorLabel: 'Head Gardener', managerLabel: 'Supervisor', memberLabel: 'Volunteer' }
    expect(roleLabel('DIRECTOR', labels)).toBe('Head Gardener')
    expect(roleLabel('MANAGER', labels)).toBe('Supervisor')
    expect(roleLabel('MEMBER', labels)).toBe('Volunteer')
  })
})
