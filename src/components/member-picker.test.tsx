import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { getMemberInitials, MemberPicker, type PickerMember } from './member-picker'

const UUID = '93f7310f-abc1-1234-5678-000000000001'
const UUID2 = '00000000-0000-0000-0000-000000000002'

const MEMBERS: PickerMember[] = [
  { id: UUID, name: 'Alice Smith', email: 'alice@example.com', avatarUrl: null },
  { id: UUID2, name: null, email: 'bob@example.com', avatarUrl: null },
]

describe('getMemberInitials', () => {
  it('returns two uppercase initials from a full name', () => {
    expect(getMemberInitials({ name: 'Alice Smith', email: 'alice@example.com' })).toBe('AS')
  })

  it('returns one initial for a single-word name', () => {
    expect(getMemberInitials({ name: 'Alice', email: 'alice@example.com' })).toBe('A')
  })

  it('falls back to first two email characters when name is null', () => {
    expect(getMemberInitials({ name: null, email: 'bob@example.com' })).toBe('BO')
  })

  it('returns uppercase', () => {
    expect(getMemberInitials({ name: 'alice smith', email: 'alice@example.com' })).toBe('AS')
  })

  it('ignores extra whitespace in names', () => {
    expect(getMemberInitials({ name: '  Alice   Smith  ', email: 'a@b.com' })).toBe('AS')
  })

  it('strips @ from email-derived initials so avatar shows letters only', () => {
    const result = getMemberInitials({ name: null, email: 'a@b.com' })
    expect(result).not.toContain('@')
  })

  it('returns ? for an email with no letters at all', () => {
    expect(getMemberInitials({ name: null, email: '123@456.789' })).toBe('?')
  })

  it('never returns a UUID-like string', () => {
    const result = getMemberInitials({ name: null, email: 'user@example.com' })
    expect(result).not.toMatch(/[0-9a-f]{8}-/)
    expect(result.length).toBeLessThanOrEqual(2)
  })
})

describe('MemberPicker', () => {
  it('renders without throwing', () => {
    render(<MemberPicker members={MEMBERS} value="" onValueChange={() => {}} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('does not render raw UUIDs in visible text', () => {
    render(<MemberPicker members={MEMBERS} value="" onValueChange={() => {}} />)
    expect(screen.queryByText(UUID)).toBeNull()
    expect(screen.queryByText(UUID2)).toBeNull()
  })

  it('does not expose UUID in the visible combobox input when a member is pre-selected', () => {
    render(
      <MemberPicker members={MEMBERS} value={UUID} onValueChange={() => {}} />
    )
    const input = screen.getByRole('combobox')
    // The visible input must show the member's name, not the raw UUID
    expect(input).not.toHaveValue(UUID)
  })

  it('shows the member name in the input when pre-selected', () => {
    render(
      <MemberPicker members={MEMBERS} value={UUID} onValueChange={() => {}} />
    )
    const input = screen.getByRole('combobox')
    expect(input).toHaveValue('Alice Smith')
  })

  it('shows email as fallback when member has no name', () => {
    render(
      <MemberPicker members={MEMBERS} value={UUID2} onValueChange={() => {}} />
    )
    const input = screen.getByRole('combobox')
    expect(input).toHaveValue('bob@example.com')
  })
})
