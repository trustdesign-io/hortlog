'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { loadSavedStatus, setOnline, syncOrgs } from '@/lib/offline/sync'

/** Refresh the saved copies at most this often while the app is open. */
const REFRESH_MS = 5 * 60_000

interface OfflineSyncProps {
  /** Organisations the member belongs to */
  memberOrgSlugs: string[]
  /** Every organisation the member may open (all of them for platform admins) */
  viewableOrgSlugs: string[]
}

/**
 * Keeps a copy of the member's organisations on the device so the app opens
 * without a connection. Renders nothing; the footer shows the status.
 */
export function OfflineSync({ memberOrgSlugs, viewableOrgSlugs }: OfflineSyncProps) {
  const pathname = usePathname()
  // Admins also keep the organisation they're looking at
  const current = pathname.split('/')[1] ?? ''
  const slugs = [...new Set([...memberOrgSlugs, ...(viewableOrgSlugs.includes(current) ? [current] : [])])].sort()
  const key = slugs.join('|')

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  useEffect(() => {
    const orgs = key ? key.split('|') : []
    let cancelled = false

    async function refreshIfStale() {
      if (!navigator.onLine || cancelled) return
      const saved = await loadSavedStatus()
      const savedSlugs = new Set(saved.map((s) => s.org.slug))
      const oldest = Math.min(...saved.map((s) => Date.parse(s.syncedAt)))
      const missing = orgs.some((o) => !savedSlugs.has(o))
      if (missing || !(Date.now() - oldest < REFRESH_MS)) await syncOrgs(orgs)
    }

    function onOnline() {
      setOnline(true)
      void refreshIfStale()
    }
    function onOffline() {
      setOnline(false)
    }

    setOnline(navigator.onLine)
    void refreshIfStale()
    const timer = window.setInterval(() => void refreshIfStale(), REFRESH_MS)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [key])

  return null
}
