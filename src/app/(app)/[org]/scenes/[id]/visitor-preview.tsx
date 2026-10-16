'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'

/** Opened from the home screen: links can't open a new tab, they replace the app */
function inStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

/**
 * Shows the scene's public page. In a browser it opens a new tab; in the
 * home-screen app (where a new tab would replace the editor with no way back)
 * it opens over the editor, with a Close button.
 */
export function VisitorPreview({ publicPath }: { publicPath: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open])

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!inStandaloneApp()) return
    e.preventDefault()
    setOpen(true)
  }

  return (
    <>
      <a
        href={publicPath}
        target="_blank"
        rel="noopener"
        onClick={onClick}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start')}
      >
        <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
        See what visitors see
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="What visitors see"
          className="fixed inset-0 z-[60] flex flex-col bg-background pt-[env(safe-area-inset-top)]"
        >
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
            <p className="text-sm font-medium">What visitors see</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              autoFocus
            >
              <X className="mr-1 h-4 w-4" aria-hidden="true" />
              Close
            </button>
          </div>
          <iframe src={publicPath} title="The scene as visitors see it" className="w-full flex-1 border-0 bg-white" />
        </div>
      )}
    </>
  )
}
