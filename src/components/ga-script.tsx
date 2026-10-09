'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getConsentChoice } from '@/lib/cookies/consent'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
// Only load on production (Vercel sets NEXT_PUBLIC_VERCEL_ENV; local dev is undefined)
const IS_PRODUCTION = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

// URL patterns that must never be tracked (share tokens and accept-invite)
const EXCLUDED_PATHS = [/^\/share\//, /^\/accept-invite/]

function isExcluded(pathname: string): boolean {
  return EXCLUDED_PATHS.some((re) => re.test(pathname))
}

export function GAScript() {
  const pathname = usePathname()

  // Fire page_view on client-side route changes, respecting consent and exclusions
  useEffect(() => {
    if (!GA_ID || !IS_PRODUCTION) return
    if (isExcluded(pathname)) return
    if (getConsentChoice() !== 'accepted') return
    if (typeof window === 'undefined' || !('gtag' in window)) return
    ;(window as Window & { gtag: (...args: unknown[]) => void }).gtag('event', 'page_view', {
      page_path: pathname,
    })
  }, [pathname])

  if (!GA_ID || !IS_PRODUCTION) return null

  return (
    <>
      {/* Consent Mode v2 defaults — must run before the GA snippet */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <Script id="ga-consent-defaults" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          // Restore prior consent on page load
          var stored = localStorage.getItem('hortlog_cookie_consent');
          if (stored === 'accepted') {
            gtag('consent', 'update', { analytics_storage: 'granted' });
          }
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            send_page_view: false,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  )
}
