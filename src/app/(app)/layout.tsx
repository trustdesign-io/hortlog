import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AuthProvider } from '@/components/auth-provider'
import { Sidebar } from '@/components/sidebar'
import type { User } from '@prisma/client'
import type { UserWithMemberships } from '@/lib/auth/current-user'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

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

  if (!authUser.email_confirmed_at) {
    redirect(`/check-email?email=${encodeURIComponent(authUser.email ?? '')}`)
  }

  const meta = authUser.user_metadata
  const now = new Date()
  const fallbackUser: User = {
    id: authUser.id,
    email: authUser.email!,
    name: meta?.full_name ?? null,
    avatarUrl: meta?.avatar_url ?? null,
    isAdmin: false,
    onboardingCompletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  let user: UserWithMemberships = { ...fallbackUser, memberships: [] }
  try {
    const dbUser = await prisma.user.upsert({
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
      include: {
        memberships: {
          include: {
            organisation: { select: { id: true, slug: true, name: true } },
          },
        },
      },
    })
    user = dbUser
  } catch (err) {
    console.error('[AppLayout] Failed to upsert user:', err)
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="flex h-screen overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring focus:outline-none"
        >
          Skip to main content
        </a>
        <Sidebar user={user} />
        <main id="main-content" className="flex-1 overflow-y-auto pt-14 p-6 pb-16 md:pb-6">{children}</main>
      </div>
    </AuthProvider>
  )
}
