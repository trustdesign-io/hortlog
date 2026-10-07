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
    function navigate() {
      router.replace(destination)
    }

    if (typeof window.gtag === 'function') {
      // Use event_callback to ensure the hit is sent before navigation.
      // event_timeout is a 2s fallback in case the beacon stalls.
      window.gtag('event', 'qr_scan', {
        short_code: shortCode,
        event_callback: navigate,
        event_timeout: 2000,
      })
    } else {
      navigate()
    }
  // Intentional empty deps: fire-once on mount; props are stable server-rendered values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  )
}
