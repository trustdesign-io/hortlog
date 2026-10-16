'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { TourButton } from '@/components/tour/tour-button'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { cn } from '@/lib/utils'
import { COPYRIGHT_HOLDER } from './logo'

/** The site footer: copyright, the tour (when signed in) and the theme switch, on every device. */
export function AppFooter({
  user,
  className,
  madeWith = false,
}: {
  user?: UserWithMemberships | null
  className?: string
  /** On a garden's visitor pages: a quiet credit, since the garden leads */
  madeWith?: boolean
}) {
  return (
    <footer className={cn('flex items-center justify-center gap-1 border-t text-xs text-muted-foreground', className)}>
      {madeWith && (
        <p className="mr-1">
          Made with{' '}
          <Link href="/" className="font-medium underline-offset-2 hover:underline">
            hortlog
          </Link>
          <span aria-hidden="true"> ·</span>
        </p>
      )}
      <p className="mr-1">
        &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}
      </p>
      {/* The tour is of the signed-in app */}
      {user && <TourButton user={user} />}
      <ThemeToggle />
    </footer>
  )
}
