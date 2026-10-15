'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { TourButton } from '@/components/tour/tour-button'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { cn } from '@/lib/utils'
import { COPYRIGHT_HOLDER } from './logo'

/** The site footer: copyright, the tour (when signed in) and the theme switch, on every device. */
export function AppFooter({ user, className }: { user?: UserWithMemberships | null; className?: string }) {
  return (
    <footer className={cn('flex items-center justify-center gap-1 border-t text-xs text-muted-foreground', className)}>
      <p className="mr-1">
        &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}
      </p>
      {/* The tour is of the signed-in app */}
      {user && <TourButton user={user} />}
      <ThemeToggle />
    </footer>
  )
}
