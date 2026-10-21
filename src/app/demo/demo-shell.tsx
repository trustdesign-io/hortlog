'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'
import { AppFooter } from '@/components/layout/app-footer'
import { MobilePanelsProvider } from '@/components/layout/mobile-panels'
import { OfflineNavProvider } from '@/components/layout/offline-nav'
import type { UserWithMemberships } from '@/lib/auth/current-user'

const REASON = 'Not part of the demo. Sign up to use it with your own garden.'

/**
 * The signed-in app's own sidebar, top bar and footer around the demo scene.
 * Everything but Scenes is shown greyed out, as it is in hortlog, with why.
 */
export function DemoShell({ user, orgSlug, children }: { user: UserWithMemberships; orgSlug: string; children: ReactNode }) {
  const scenes = `/${orgSlug}/scenes`
  return (
    <MobilePanelsProvider>
      <OfflineNavProvider
        path={scenes}
        disabled={(href) => href !== scenes}
        reason={REASON}
        linkTo={(href) => (href === scenes ? '/demo' : href)}
      >
        {/* Sits where the weather bar does, so the app moves down beneath it */}
        <div
          id="utility-bar"
          className="fixed inset-x-0 top-0 z-50 flex h-8 items-center justify-center gap-2 bg-primary px-4 text-xs text-primary-foreground"
        >
          <span>You&rsquo;re trying hortlog. Nothing here is saved.</span>
          <Link href="/sign-up" className="font-medium underline underline-offset-2">
            Sign up
          </Link>
        </div>
        <div className="flex h-dvh overflow-hidden pt-[var(--utility-h)]">
          <Sidebar user={user} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-[4.75rem] sm:px-6 md:p-6">
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <AppFooter className="-mx-4 -mb-6 mt-12 h-14 px-4 sm:-mx-6 sm:px-6 md:hidden" />
            </div>
            <AppFooter className="hidden h-16 shrink-0 px-6 md:flex" />
          </div>
        </div>
      </OfflineNavProvider>
    </MobilePanelsProvider>
  )
}
