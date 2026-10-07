import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth-store'
import type { UserWithMemberships } from '@/lib/auth/current-user'

const mockUser = { id: 'abc', email: 'test@example.com', memberships: [] } as unknown as UserWithMemberships

describe('useAuthStore', () => {
  beforeEach(() => { useAuthStore.setState({ user: null, isLoading: true }) })

  it('initialises with null user and isLoading true', () => {
    const { user, isLoading } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isLoading).toBe(true)
  })

  it('setUser updates user and sets isLoading false', () => {
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('setUser with null clears the user', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
