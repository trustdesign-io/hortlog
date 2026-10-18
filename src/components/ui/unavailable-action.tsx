'use client'

import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface UnavailableActionProps {
  /** Why it can't be used right now, shown when tapped, e.g. "Your role can't add specimens." */
  reason: string
  /** The same classes the working control would have, so it sits in the same place */
  className?: string
  /** Its accessible name, for icon-only controls */
  label?: string
  children: ReactNode
}

/**
 * An action the user can't take right now, shown greyed out rather than
 * hidden, so the layout stays put and it's clear the action exists. Tapping
 * it explains why — on a phone there's no hover to show a tooltip.
 */
export function UnavailableAction({ reason, className, label, children }: UnavailableActionProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-disabled="true"
            aria-label={label ? `${label} (unavailable)` : undefined}
            className={cn(className, 'cursor-not-allowed opacity-45 hover:bg-transparent')}
          />
        }
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-64 px-3 py-2 text-sm">{reason}</PopoverContent>
    </Popover>
  )
}
