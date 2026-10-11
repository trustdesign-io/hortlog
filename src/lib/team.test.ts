import { describe, it, expect } from 'vitest'
import { sortTeam, type TeamMember } from './team'

const m = (id: string, role: TeamMember['role'], name: string | null, email = `${id}@example.com`): TeamMember => ({
  id,
  role,
  user: { name, email },
})

describe('sortTeam', () => {
  it('puts managers first, then members, each by name', () => {
    const sorted = sortTeam([
      m('1', 'MEMBER', 'Zoe'),
      m('2', 'MANAGER', 'Tom'),
      m('3', 'MEMBER', 'alice'),
      m('4', 'MANAGER', 'Beth'),
      m('5', 'MEMBER', null, 'carl@example.com'),
    ])
    expect(sorted.map((x) => x.id)).toEqual(['4', '2', '3', '5', '1'])
  })

  it('does not change the list it was given', () => {
    const list = [m('1', 'MEMBER', 'B'), m('2', 'MANAGER', 'A')]
    sortTeam(list)
    expect(list.map((x) => x.id)).toEqual(['1', '2'])
  })
})
