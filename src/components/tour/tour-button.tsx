'use client'

import { useCallback, useRef } from 'react'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMobilePanels } from '@/components/layout/mobile-panels'
import { TOUR_STEPS, type TourPanel } from './tour-steps'
import type { UserWithMemberships } from '@/lib/auth/current-user'
import { isLeader } from '@/lib/roles'

// CSS for driver.js loaded here so it only applies when the component mounts
import 'driver.js/dist/driver.css'

// Matches the Sheet slide-in animation duration
const PANEL_OPEN_DELAY_MS = 300

interface TourButtonProps {
  user: UserWithMemberships
  showLabel?: boolean
}

/**
 * The same `data-tour` element can exist twice (desktop sidebar, hidden on
 * mobile, and a mobile panel), so highlight the one that's actually on screen.
 */
function visibleTourElement(tourId: string): Element {
  const matches = Array.from(document.querySelectorAll(`[data-tour="${tourId}"]`))
  return matches.find((el) => el.getClientRects().length > 0) ?? matches[0]
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function userRole(user: UserWithMemberships): 'admin' | 'manager' | 'member' {
  if (user.isAdmin) return 'admin'
  if (user.memberships.some((m) => isLeader(m.role))) return 'manager'
  return 'member'
}

const ROLE_ORDER = { member: 0, manager: 1, admin: 2 } as const

export function TourButton({ user, showLabel = false }: TourButtonProps) {
  // Mobile: open one slide-out panel (closing the other), or close both with null
  const { setPanel: showPanel } = useMobilePanels()
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
      let openPanel: TourPanel | null = null

      /** On mobile, slide out the panel a step's element lives in before it's highlighted. */
      async function preparePanel(index: number) {
        if (!isMobile) return
        const wanted = present[index]?.panel ?? null
        if (wanted === openPanel) return
        showPanel(wanted)
        openPanel = wanted
        if (wanted) await wait(PANEL_OPEN_DELAY_MS)
      }

      const driverObj = driver({
        showProgress: true,
        animate: !reducedMotion,
        overlayOpacity: 0.5,
        popoverClass: 'hortlog-tour-popover',
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done',
        steps: present.map((s) => ({
          element: () => visibleTourElement(s.tourId),
          popover: { title: s.title, description: s.description },
        })),
        onNextClick: (_el, _step, { driver: tour }) => {
          const next = (tour.getActiveIndex() ?? 0) + 1
          // Past the last step moveNext() ends the tour through onDestroyStarted
          if (next >= present.length) return tour.moveNext()
          void preparePanel(next).then(() => tour.moveNext())
        },
        onPrevClick: (_el, _step, { driver: tour }) => {
          const prev = (tour.getActiveIndex() ?? 0) - 1
          if (prev < 0) return
          void preparePanel(prev).then(() => tour.movePrevious())
        },
        // Providing this hook stops driver.js closing on its own: Done, ✕ and Esc
        // all land here, so we must call destroy() ourselves
        onDestroyStarted: (_el, _step, { driver: tour }) => {
          if (isMobile) showPanel(null)
          running.current = false
          tour.destroy()
        },
      })

      await preparePanel(0)
      driverObj.drive()
    } catch {
      running.current = false
    }
  }, [role, showPanel])

  return (
    <Button
      variant="ghost"
      size={showLabel ? 'sm' : 'icon'}
      className={showLabel ? 'min-h-9 justify-start gap-2 px-2 text-muted-foreground hover:text-foreground' : undefined}
      aria-label={showLabel ? undefined : 'Take the tour'}
      data-tour="tour-button"
      onClick={() => void startTour()}
    >
      <GraduationCap className="h-4 w-4" aria-hidden="true" />
      {showLabel && 'Take the tour'}
    </Button>
  )
}
