'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineNotice() {
  const [cachedAt, setCachedAt] = useState<number | null>(null)

  useEffect(() => {
    // The SW injects X-Hortlog-Offline on cached responses.
    // We detect it by checking a small fetch to this page.
    async function check() {
      try {
        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' })
        const offlineHeader = res.headers.get('X-Hortlog-Offline')
        if (offlineHeader === '1') {
          // Read the cached-at timestamp from the org's meta entry
          const orgSlug = window.location.pathname.split('/')[1]
          const cacheKeys = await window.caches?.keys()
          const orgCache = cacheKeys?.find((k) => k === `hortlog-org-v1-${orgSlug}`)
          if (orgCache) {
            const cache = await window.caches.open(orgCache)
            const metaRes = await cache.match(`/_meta/${orgSlug}`)
            if (metaRes) {
              const { cachedAt: ts } = await metaRes.json()
              setCachedAt(ts as number)
            }
          }
        }
      } catch {
        // Offline — can't check, but page loaded from SW
        if (!navigator.onLine) setCachedAt(null)
      }
    }

    void check()
  }, [])

  if (cachedAt === null && (typeof navigator === 'undefined' || navigator.onLine)) return null

  const label = cachedAt
    ? new Date(cachedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground"
    >
      <WifiOff className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>
        {label ? `Offline copy from ${label}` : 'Offline copy'}
      </span>
    </div>
  )
}
