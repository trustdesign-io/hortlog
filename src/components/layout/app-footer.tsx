'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { TourButton } from '@/components/tour/tour-button'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { COPYRIGHT_HOLDER } from './logo'

/** Foot of every signed-in page: the tour and theme switch, on every device. */
export function AppFooter({ user }: { user: UserWithMemberships }) {
  return (
    <footer className="mt-12 flex items-center gap-1 border-t pt-3 text-xs text-muted-foreground">
      <p className="mr-1">
        &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}
      </p>
      <TourButton user={user} />
      <ThemeToggle />
    </footer>
  )
}
