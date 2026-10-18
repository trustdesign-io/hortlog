import Link from 'next/link'
import type { ReactNode } from 'react'
import { UnavailableAction } from '@/components/ui/unavailable-action'

interface ActionLinkProps {
  href: string
  /** Set when the user can't take this action right now: why, shown when tapped */
  unavailable?: string | null
  className?: string
  label?: string
  children: ReactNode
}

/** A link that starts an action (add, create, print…), greyed out with its reason when it's unavailable */
export function ActionLink({ href, unavailable, className, label, children }: ActionLinkProps) {
  if (unavailable) {
    return (
      <UnavailableAction reason={unavailable} className={className} label={label}>
        {children}
      </UnavailableAction>
    )
  }
  return (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  )
}
