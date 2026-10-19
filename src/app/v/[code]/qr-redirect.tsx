'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface QrRedirectProps {
  destination: string
  shortCode: string
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function QrRedirect({ destination, shortCode }: QrRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    let done = false
    function navigate() {
      if (done) return
      done = true
      router.replace(destination)
    }

    // Never wait on analytics: blockers (Brave, Safari content blockers) stop
    // gtag.js loading, so its callback and its own timeout never fire. Go
    // after half a second whatever happens.
    const fallback = window.setTimeout(navigate, 500)
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'qr_scan', { short_code: shortCode, event_callback: navigate, event_timeout: 500 })
      } catch {
        navigate()
      }
    } else {
      navigate()
    }
    return () => window.clearTimeout(fallback)
  // Intentional empty deps: fire-once on mount; props are stable server-rendered values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Opening… <a href={destination} className="underline underline-offset-2">Tap here</a> if nothing happens.
      </p>
    </div>
  )
}
