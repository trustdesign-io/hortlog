'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/types'

interface AuthProviderProps {
  initialUser: User | null
  children: React.ReactNode
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    setUser(initialUser)
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null)
    })
    return () => subscription.unsubscribe()
  }, [initialUser, setUser])

  return <>{children}</>
}
