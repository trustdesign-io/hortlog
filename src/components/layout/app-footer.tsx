'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { TourButton } from '@/components/tour/tour-button'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { COPYRIGHT_HOLDER } from './logo'

/** Foot of every signed-in page: the tour and theme switch, on every device. */
export function AppFooter({ user }: { user: UserWithMemberships }) {
  return (
    <footer className="mt-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
      <p>
        &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <TourButton user={user} showLabel />
        <ThemeToggle showLabel />
      </div>
    </footer>
  )
}
