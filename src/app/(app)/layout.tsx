import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AuthProvider } from '@/components/auth-provider'
import { Sidebar } from '@/components/sidebar'
import type { User } from '@prisma/client'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/sign-in')
  }

  const meta = authUser.user_metadata
  const now = new Date()
  const fallback: User = {
    id: authUser.id,
    email: authUser.email!,
    name: meta?.full_name ?? null,
    avatarUrl: meta?.avatar_url ?? null,
    role: 'USER',
    onboardingCompletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  let user: User = fallback
  try {
    user = await prisma.user.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        email: authUser.email!,
        name: meta?.full_name ?? null,
        avatarUrl: meta?.avatar_url ?? null,
      },
      update: {
        email: authUser.email!,
        name: meta?.full_name ?? null,
        avatarUrl: meta?.avatar_url ?? null,
      },
    })
  } catch (err) {
    console.error('[AppLayout] Failed to upsert user:', err)
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </AuthProvider>
  )
}
