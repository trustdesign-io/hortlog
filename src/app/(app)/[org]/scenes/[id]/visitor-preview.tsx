'use client'

import type { MouseEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { PREVIEW_RETURN_KEY } from '@/components/layout/preview-return-bar'
import { cn } from '@/lib/utils'

/** Opened from the home screen: links can't open a new tab, they replace the app */
function inStandaloneApp(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

/**
 * Shows the scene's public page. In a browser it opens a new tab; in the
 * home-screen app it opens in place, with a "Back to editing" bar on the
 * visitor pages that returns here.
 */
export function VisitorPreview({ publicPath }: { publicPath: string }) {
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!inStandaloneApp()) return
    e.preventDefault()
    try {
      sessionStorage.setItem(PREVIEW_RETURN_KEY, window.location.pathname + window.location.search)
    } catch {
      // Without session storage there's no bar; the browser's own back still works
    }
    window.location.assign(publicPath)
  }

  return (
    <a
      href={publicPath}
      target="_blank"
      rel="noopener"
      onClick={onClick}
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}
    >
      <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
      See what visitors see
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
