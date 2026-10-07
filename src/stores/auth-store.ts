import { create } from 'zustand'
import type { UserWithMemberships } from '@/lib/auth/current-user'

interface AuthState {
  user: UserWithMemberships | null
  isLoading: boolean
  setUser: (user: UserWithMemberships | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
}))
