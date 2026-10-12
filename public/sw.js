// hortlog service worker — offline check-in
// Cache version: bump when the cache format changes.
const CACHE_VERSION = 'v1'
const CACHE_PREFIX = `hortlog-org-${CACHE_VERSION}-`
const STATIC_CACHE = `hortlog-static-${CACHE_VERSION}`

// Static assets to cache on install (app shell)
const STATIC_ASSETS = ['/offline.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Best-effort: ignore if offline.html doesn't exist yet
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Clean up old versioned caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_PREFIX) && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Message handlers
self.addEventListener('message', (event) => {
  const { type, orgSlug, urls } = event.data ?? {}

  if (type === 'CACHE_ORG') {
    event.waitUntil(cacheOrg(orgSlug, urls, event))
  }

  if (type === 'CLEAR_ORG') {
    event.waitUntil(clearOrg(orgSlug, event))
  }

  if (type === 'REFRESH_ORG') {
    event.waitUntil(refreshOrg(orgSlug, event))
  }

  if (type === 'PING') {
    event.source?.postMessage({ type: 'PONG' })
  }
})

async function cacheOrg(orgSlug, urls, event) {
  const cacheName = CACHE_PREFIX + orgSlug
  const cache = await caches.open(cacheName)
  let done = 0

  for (const url of urls) {
    try {
      const req = new Request(url, { credentials: 'omit', mode: 'no-cors' })
      const res = await fetch(req)
      if (res.ok || res.type === 'opaque') {
        await cache.put(url, res)
      }
    } catch {
      // Network failure for one URL — continue with the rest
    }
    done++
    event.source?.postMessage({ type: 'CACHE_PROGRESS', orgSlug, done, total: urls.length })
  }

  // Store metadata: timestamp and URL count
  const cachedAt = Date.now()
  const meta = { cachedAt, count: done, urls }
  await cache.put(
    `/_meta/${orgSlug}`,
    new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } })
  )

  event.source?.postMessage({ type: 'CACHE_DONE', orgSlug, count: done, cachedAt })
}

async function clearOrg(orgSlug, event) {
  await caches.delete(CACHE_PREFIX + orgSlug)
  event.source?.postMessage({ type: 'CLEAR_DONE', orgSlug })
}

async function refreshOrg(orgSlug, event) {
  const cacheName = CACHE_PREFIX + orgSlug
  const cache = await caches.open(cacheName)
  const metaRes = await cache.match(`/_meta/${orgSlug}`)
  if (!metaRes) return

  const meta = await metaRes.json()
  await cacheOrg(orgSlug, meta.urls, event)
}

// Fetch handler: serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const parsed = new URL(request.url)

  // Only intercept same-origin GET requests for navigations and images
  if (
    request.method !== 'GET' ||
    parsed.origin !== self.location.origin
  ) return

  // API and auth routes should never be served from cache
  if (parsed.pathname.startsWith('/api/') || parsed.pathname.startsWith('/auth/')) return

  // Try to match against any cached org
  event.respondWith(handleFetch(request))
})

async function handleFetch(request) {
  // Check all org caches for a match
  const keys = await caches.keys()
  const orgCaches = keys.filter((k) => k.startsWith(CACHE_PREFIX))

  for (const cacheName of orgCaches) {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    if (cached) {
      // Serve from cache; revalidate in background if online
      if (navigator.onLine) {
        fetch(request).then((res) => {
          if (res.ok) cache.put(request, res)
        }).catch(() => {})
      }
      return withOfflineHeader(cached)
    }
  }

  // Not cached — try the network
  try {
    return await fetch(request)
  } catch {
    // Network failed and not cached — return offline page for navigation
    if (request.mode === 'navigate') {
      const staticCache = await caches.open(STATIC_CACHE)
      return (await staticCache.match('/offline.html')) ?? new Response('Offline', { status: 503 })
    }
    return new Response('', { status: 503 })
  }
}

function withOfflineHeader(response) {
  const headers = new Headers(response.headers)
  headers.set('X-Hortlog-Offline', '1')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
