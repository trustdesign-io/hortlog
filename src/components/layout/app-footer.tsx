'use client'

import { OfflineStatusChip } from '@/components/offline/offline-status'
import { ThemeToggle } from '@/components/theme-toggle'
import { TourButton } from '@/components/tour/tour-button'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { cn } from '@/lib/utils'
import { COPYRIGHT_HOLDER } from './logo'

/** Foot of every signed-in page: the tour and theme switch, and the offline copy's status, on every device. */
export function AppFooter({ user, className }: { user: UserWithMemberships; className?: string }) {
  return (
    <footer className={cn('flex items-center justify-center gap-1 border-t text-xs text-muted-foreground', className)}>
      <p className="mr-1">
        &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}
      </p>
      <TourButton user={user} />
      <ThemeToggle />
      <OfflineStatusChip className="ml-1" />
    </footer>
  )
}
