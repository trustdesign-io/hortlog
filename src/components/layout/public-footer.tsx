'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/** Public pages that aren't a garden's scene or plant pages */
const SITE_PAGES = new Set(['privacy', 'share', 'u', 'check-in'])

/**
 * Visitors looking at a garden's scenes and plants get just the slim site
 * footer; other public pages get the full page footer with its links.
 */
export function PublicFooter({ full, slim }: { full: ReactNode; slim: ReactNode }) {
  const first = usePathname().split('/')[1] ?? ''
  return <>{SITE_PAGES.has(first) ? full : slim}</>
}
