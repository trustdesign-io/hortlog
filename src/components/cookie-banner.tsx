'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getConsentChoice, saveConsentChoice } from '@/lib/cookies/consent'
import { Button } from '@/components/ui/button'

// GA4 Consent Mode v2 — update gtag consent state
function updateGtagConsent(granted: boolean) {
  if (typeof window === 'undefined' || !('gtag' in window)) return
  const state = granted ? 'granted' : 'denied'
  ;(window as Window & { gtag: (...args: unknown[]) => void }).gtag(
    'consent',
    'update',
    {
      analytics_storage: state,
      // Ad signals remain denied regardless of analytics choice
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    },
  )
}

interface CookieBannerProps {
  /** If true, shows the banner regardless of stored preference (for "Cookie settings" link). */
  forceOpen?: boolean
  onClose?: () => void
}

export function CookieBanner({ forceOpen = false, onClose }: CookieBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const shouldShow = forceOpen || getConsentChoice() === null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(shouldShow)
  }, [forceOpen])

  function handleAccept() {
    saveConsentChoice('accepted')
    updateGtagConsent(true)
    setVisible(false)
    onClose?.()
  }

  function handleReject() {
    saveConsentChoice('rejected')
    updateGtagConsent(false)
    setVisible(false)
    onClose?.()
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-4 py-4 shadow-lg sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use Google Analytics to understand how visitors use hortlog.
          No personal data is shared.{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Privacy notice
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleReject}>
            Reject
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Trigger to reopen the cookie settings banner, for use in the footer. */
export function CookieSettingsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:text-foreground transition-colors"
      >
        Cookie settings
      </button>
      {open && <CookieBanner forceOpen onClose={() => setOpen(false)} />}
    </>
  )
}
