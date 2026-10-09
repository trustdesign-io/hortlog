import { describe, it, expect } from 'vitest'
import { getNameFromMetadata } from './name-utils'

describe('getNameFromMetadata', () => {
  it('returns full_name when present', () => {
    expect(getNameFromMetadata({ full_name: 'Alice Smith' })).toBe('Alice Smith')
  })

  it('falls back to legacy name key when full_name absent', () => {
    expect(getNameFromMetadata({ name: 'Bob Jones' })).toBe('Bob Jones')
  })

  it('prefers full_name over legacy name', () => {
    expect(getNameFromMetadata({ full_name: 'Alice Smith', name: 'Old Name' })).toBe('Alice Smith')
  })

  it('returns null for null metadata', () => {
    expect(getNameFromMetadata(null)).toBeNull()
  })

  it('returns null for undefined metadata', () => {
    expect(getNameFromMetadata(undefined)).toBeNull()
  })

  it('returns null for empty object', () => {
    expect(getNameFromMetadata({})).toBeNull()
  })

  it('returns null when full_name is an empty string', () => {
    expect(getNameFromMetadata({ full_name: '' })).toBeNull()
  })

  it('returns null when full_name is whitespace only', () => {
    expect(getNameFromMetadata({ full_name: '   ' })).toBeNull()
  })

  it('trims whitespace from the returned name', () => {
    expect(getNameFromMetadata({ full_name: '  Alice  ' })).toBe('Alice')
  })

  it('returns null when full_name is a non-string value', () => {
    expect(getNameFromMetadata({ full_name: 42 })).toBeNull()
  })

  it('returns null when legacy name is a non-string value', () => {
    expect(getNameFromMetadata({ name: true })).toBeNull()
  })

  it('survives repeated calls with the same metadata (idempotent)', () => {
    const meta = { full_name: 'Alice Smith' }
    expect(getNameFromMetadata(meta)).toBe('Alice Smith')
    expect(getNameFromMetadata(meta)).toBe('Alice Smith')
  })
})
