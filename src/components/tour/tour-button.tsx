'use client'

import { useCallback, useRef } from 'react'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOUR_STEPS } from './tour-steps'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { isLeader } from '@/lib/roles'

// CSS for driver.js loaded here so it only applies when the component mounts
import 'driver.js/dist/driver.css'

// Matches the Sheet slide-in animation duration
const DRAWER_OPEN_DELAY_MS = 300

interface TourButtonProps {
  user: UserWithMemberships
  openDrawer?: () => void
  closeDrawer?: () => void
}

function userRole(user: UserWithMemberships): 'admin' | 'manager' | 'member' {
  if (user.isAdmin) return 'admin'
  if (user.memberships.some((m) => isLeader(m.role))) return 'manager'
  return 'member'
}

const ROLE_ORDER = { member: 0, manager: 1, admin: 2 } as const

export function TourButton({ user, openDrawer, closeDrawer }: TourButtonProps) {
  const role = userRole(user)
  const running = useRef(false)

  const startTour = useCallback(async () => {
    if (running.current) return
    running.current = true

    try {
      const { driver } = await import('driver.js')

      const roleLevel = ROLE_ORDER[role]
      const eligible = TOUR_STEPS.filter(
        (s) => !s.role || ROLE_ORDER[s.role] <= roleLevel
      )
      const present = eligible.filter(
        (s) => document.querySelector(`[data-tour="${s.tourId}"]`) !== null
      )

      if (present.length === 0) return

      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const driverObj = driver({
        showProgress: true,
        animate: !reducedMotion,
        overlayOpacity: 0.5,
        popoverClass: 'hortlog-tour-popover',
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done',
        steps: present.map((s) => ({
          element: `[data-tour="${s.tourId}"]`,
          popover: { title: s.title, description: s.description },
        })),
        onHighlightStarted: (_el, _step, { state }) => {
          if (!isMobile) return
          const stepDef = present[state.activeIndex ?? 0]
          if (stepDef?.requiresDrawer) {
            openDrawer?.()
          } else {
            closeDrawer?.()
          }
        },
        // Providing this hook stops driver.js closing on its own: Done, ✕ and Esc
        // all land here, so we must call destroy() ourselves
        onDestroyStarted: (_el, _step, { driver: tour }) => {
          if (isMobile) closeDrawer?.()
          running.current = false
          tour.destroy()
        },
      })

      // Open the drawer before starting if the first step needs it
      if (isMobile && present[0]?.requiresDrawer) {
        openDrawer?.()
        await new Promise<void>((r) => setTimeout(r, DRAWER_OPEN_DELAY_MS))
      }

      driverObj.drive()
    } catch {
      running.current = false
    }
  }, [role, openDrawer, closeDrawer])

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Take the tour"
      data-tour="tour-button"
      onClick={() => void startTour()}
    >
      <Compass className="h-4 w-4" aria-hidden="true" />
    </Button>
  )
}
