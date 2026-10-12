'use client'

import { useState, useEffect, useCallback } from 'react'
import { WifiOff, Download, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react'

interface OfflineMeta {
  cachedAt: number
  count: number
}

interface OfflineManifest {
  orgSlug: string
  orgName: string
  urls: string[]
  specimenCount: number
  sceneCount: number
  estimatedBytes: number
}

type CheckInState =
  | { status: 'idle' }
  | { status: 'loading_manifest' }
  | { status: 'confirming'; manifest: OfflineManifest }
  | { status: 'caching'; done: number; total: number }
  | { status: 'cached'; cachedAt: number; count: number }
  | { status: 'refreshing'; done: number; total: number }
  | { status: 'error'; message: string }

const SIZE_WARNING_BYTES = 20 * 1024 * 1024 // 20 MB
const EXPIRY_DAYS = 30

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isExpired(cachedAt: number) {
  return Date.now() - cachedAt > EXPIRY_DAYS * 24 * 60 * 60 * 1000
}

function getCacheName(orgSlug: string) {
  return `hortlog-org-v1-${orgSlug}`
}

async function readMeta(orgSlug: string): Promise<OfflineMeta | null> {
  if (!('caches' in window)) return null
  try {
    const cache = await window.caches.open(getCacheName(orgSlug))
    const res = await cache.match(`/_meta/${orgSlug}`)
    if (!res) return null
    const meta = await res.json() as OfflineMeta
    if (isExpired(meta.cachedAt)) {
      await window.caches.delete(getCacheName(orgSlug))
      return null
    }
    return meta
  } catch {
    return null
  }
}

interface CheckInButtonProps {
  orgSlug: string
}

export function CheckInButton({ orgSlug }: CheckInButtonProps) {
  const [state, setState] = useState<CheckInState>({ status: 'idle' })
  const [swReady, setSwReady] = useState(false)

  // Check for existing cached copy and register SW
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!('serviceWorker' in navigator)) return

      // Register SW
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        setSwReady(true)
      } catch {
        return
      }

      // Check for existing cached copy
      const meta = await readMeta(orgSlug)
      if (!cancelled && meta) {
        setState({ status: 'cached', cachedAt: meta.cachedAt, count: meta.count })
      }
    }

    void init()
    return () => { cancelled = true }
  }, [orgSlug])

  // Listen for SW messages
  useEffect(() => {
    if (!swReady) return

    function handleMessage(event: MessageEvent) {
      const { type, done, total, count, cachedAt } = event.data ?? {}

      if (type === 'CACHE_PROGRESS') {
        setState((s) =>
          s.status === 'caching' || s.status === 'refreshing'
            ? { ...s, done: done as number, total: total as number }
            : s
        )
      }

      if (type === 'CACHE_DONE') {
        setState({ status: 'cached', cachedAt: cachedAt ?? Date.now(), count: count as number })
      }

      if (type === 'CLEAR_DONE') {
        setState({ status: 'idle' })
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [swReady])

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    navigator.serviceWorker.controller?.postMessage(msg)
  }, [])

  async function startCheckIn() {
    setState({ status: 'loading_manifest' })
    try {
      const res = await fetch(`/api/offline/${orgSlug}`)
      if (!res.ok) throw new Error('Failed to load venue data')
      const manifest = await res.json() as OfflineManifest
      setState({ status: 'confirming', manifest })
    } catch {
      setState({ status: 'error', message: 'Could not prepare offline copy. Check your connection.' })
    }
  }

  function confirmCheckIn(manifest: OfflineManifest) {
    setState({ status: 'caching', done: 0, total: manifest.urls.length })
    sendMessage({ type: 'CACHE_ORG', orgSlug, urls: manifest.urls })
  }

  function refreshCopy() {
    setState((s) =>
      s.status === 'cached'
        ? { status: 'refreshing', done: 0, total: s.count }
        : s
    )
    sendMessage({ type: 'REFRESH_ORG', orgSlug })
  }

  function removeCopy() {
    sendMessage({ type: 'CLEAR_ORG', orgSlug })
  }

  if (!swReady) return null

  if (state.status === 'cached') {
    const expired = isExpired(state.cachedAt)
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
          {expired
            ? 'Offline copy expired'
            : `Ready offline · ${state.count} pages · saved ${formatDate(state.cachedAt)}`}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={refreshCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Refresh offline copy"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
          <button
            onClick={removeCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Remove offline copy"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    )
  }

  if (state.status === 'caching' || state.status === 'refreshing') {
    const pct = state.total > 0 ? Math.round((state.done / state.total) * 100) : 0
    return (
      <div className="rounded-lg border bg-card px-4 py-3" role="status" aria-live="polite">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {state.status === 'refreshing' ? 'Refreshing…' : 'Downloading…'} {pct}%
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{state.done}/{state.total}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    )
  }

  if (state.status === 'confirming') {
    const { manifest } = state
    const big = manifest.estimatedBytes > SIZE_WARNING_BYTES
    return (
      <div className="rounded-lg border bg-card px-4 py-3 text-sm space-y-3">
        <div>
          <p className="font-medium">Download for offline use?</p>
          <p className="text-muted-foreground mt-0.5">
            {manifest.specimenCount} plants · {manifest.sceneCount} scenes · ~{formatBytes(manifest.estimatedBytes)}
          </p>
          {big && (
            <p className="mt-1 text-amber-600 text-xs">
              This venue has a lot of content (over 20 MB). Make sure you&apos;re on Wi-Fi before downloading.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => confirmCheckIn(manifest)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </button>
          <button
            onClick={() => setState({ status: 'idle' })}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <span className="text-destructive">{state.message}</span>
        <button
          onClick={() => setState({ status: 'idle' })}
          className="ml-4 text-xs text-muted-foreground hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => void startCheckIn()}
      disabled={state.status === 'loading_manifest'}
      className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      aria-label="Check in: save this venue for offline use"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      {state.status === 'loading_manifest' ? 'Preparing…' : 'Check in'}
    </button>
  )
}
