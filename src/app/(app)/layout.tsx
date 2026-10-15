import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { AuthProvider } from '@/components/auth-provider'
import { Sidebar } from '@/components/sidebar'
import { AppFooter } from '@/components/layout/app-footer'
import { MobilePanelsProvider } from '@/components/layout/mobile-panels'
import { OfflineSync } from '@/components/offline/offline-sync'
import { getNameFromMetadata } from '@/lib/auth/name-utils'
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
  const nameFromMeta = getNameFromMetadata(meta)
  const now = new Date()
  const fallbackUser: User = {
    id: authUser.id,
    email: authUser.email!,
    name: nameFromMeta,
    avatarUrl: meta?.avatar_url ?? null,
    isAdmin: false,
    onboardingCompletedAt: null,
    username: null,
    recordPublic: false,
    recordShowNotes: false,
    creditOnPlants: false,
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
        name: nameFromMeta,
        avatarUrl: meta?.avatar_url ?? null,
      },
      update: {
        email: authUser.email!,
        // Never overwrite an existing name with null — only fill when DB name is missing
        ...(nameFromMeta ? { name: nameFromMeta } : {}),
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

  // Admins see all orgs in the sidebar switcher. Unbounded at current scale;
  // add pagination or unstable_cache if org count grows large.
  let allOrgs: { id: string; slug: string; name: string }[] | undefined
  if (user.isAdmin) {
    try {
      allOrgs = await prisma.organisation.findMany({
        select: { id: true, slug: true, name: true },
        orderBy: { name: 'asc' },
      })
    } catch (err) {
      console.error('[AppLayout] Failed to fetch allOrgs:', err)
    }
  }

  return (
    <AuthProvider initialUser={user}>
      <MobilePanelsProvider>
        <OfflineSync
          memberOrgSlugs={user.memberships.map((m) => m.organisation.slug)}
          viewableOrgSlugs={allOrgs?.map((o) => o.slug) ?? []}
        />
        {/* --utility-h is the weather bar's height when it's shown (see globals.css) */}
        <div className="flex h-dvh overflow-hidden pt-[var(--utility-h)]">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring focus:outline-none"
          >
            Skip to main content
          </a>
          <Sidebar user={user} allOrgs={allOrgs} />
          {/* On phones the fixed top bar is 3.5rem tall: clear it, then the usual gutter */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-[4.75rem] sm:px-6 md:p-6">
              <main id="main-content" className="flex-1">
                {children}
              </main>
              {/* Phones: the footer ends the page */}
              <AppFooter user={user} className="mt-12 pt-3 md:hidden" />
            </div>
            {/* Desktop: pinned, level with the sidebar's sign-out row so they form one bar */}
            <AppFooter user={user} className="hidden h-16 shrink-0 px-6 md:flex" />
          </div>
        </div>
      </MobilePanelsProvider>
    </AuthProvider>
  )
}
