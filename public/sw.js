// hortlog service worker
// - Public check-in: saves a garden's public pages for visitors (CACHE_ORG).
// - Offline app: when a page can't load, signed-in members get /offline-app,
//   which draws it from the copy saved on the device (see src/lib/offline).

// Public check-in cache names; check-in-button.tsx reads these, keep in step.
const CACHE_PREFIX = 'hortlog-org-v1-'
const STATIC_CACHE = 'hortlog-static-v1'
// Hashed build files: never change, so safe to serve from the cache first
const ASSET_CACHE = 'hortlog-assets-v1'
// The offline app page and the plants' photos; removed on sign-out
const SHELL_CACHE = 'hortlog-private-shell-v1'
const IMAGE_CACHE = 'hortlog-private-images-v1'
const KEEP = [STATIC_CACHE, ASSET_CACHE, SHELL_CACHE, IMAGE_CACHE]

const OFFLINE_APP = '/offline-app'
const STATIC_ASSETS = ['/offline.html']
const MAX_ASSETS = 400
/**
 * A page that hasn't started arriving after this long goes to the offline app:
 * quickly when the device says it has no connection, more patiently when it
 * says it has one (a slow page shouldn't throw someone out of the live site).
 */
const NAV_TIMEOUT_MS = 8000
const NAV_TIMEOUT_ONLINE_MS = 15000

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
  // Clean up caches from older versions of this worker
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_PREFIX) && !KEEP.includes(k))
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

  if (type === 'CACHE_SHELL') {
    event.waitUntil(cacheShell().catch(() => {}))
  }

  if (type === 'CACHE_IMAGES' && Array.isArray(urls)) {
    event.waitUntil(cacheImages(urls).catch(() => {}))
  }

  if (type === 'CLEAR_PRIVATE') {
    event.waitUntil(Promise.all([caches.delete(SHELL_CACHE), caches.delete(IMAGE_CACHE)]))
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

/** Build files named in some HTML, JS or CSS text. */
function assetPaths(text) {
  return [...new Set(text.match(/\/_next\/static\/[^"'\s\\)]+/g) ?? [])]
}

async function cacheAsset(cache, path) {
  if (await cache.match(path)) return
  const res = await fetch(path)
  if (res.ok) await cache.put(path, res)
}

/**
 * Save the offline app page and every build file it needs. The page is only
 * replaced once its files are saved, so it never points at missing ones.
 */
async function cacheShell() {
  const res = await fetch(OFFLINE_APP, { cache: 'no-store' })
  if (!res.ok) return
  const html = await res.clone().text()
  const assets = await caches.open(ASSET_CACHE)
  const paths = assetPaths(html)
  await Promise.all(paths.map((p) => cacheAsset(assets, p)))
  // Fonts are named inside the stylesheets
  for (const css of paths.filter((p) => p.endsWith('.css'))) {
    const cached = await assets.match(css)
    if (cached) await Promise.all(assetPaths(await cached.text()).map((p) => cacheAsset(assets, p).catch(() => {})))
  }
  await (await caches.open(SHELL_CACHE)).put(OFFLINE_APP, res)
  await trimAssets(assets, new Set(paths))
}

/** Keep the build-file cache from growing forever across deploys: drop the oldest. */
async function trimAssets(cache, keep) {
  const keys = await cache.keys()
  let excess = keys.length - MAX_ASSETS
  for (const req of keys) {
    if (excess <= 0) break
    if (keep.has(new URL(req.url).pathname)) continue
    await cache.delete(req)
    excess--
  }
}

/** Save the plants' photos (resized, same-origin) and drop ones no longer shown. */
async function cacheImages(urls) {
  const cache = await caches.open(IMAGE_CACHE)
  const wanted = new Set(urls.map((u) => new URL(u, self.location.origin).href))
  for (const req of await cache.keys()) {
    if (!wanted.has(req.url)) await cache.delete(req)
  }
  const queue = [...wanted]
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()
      try {
        if (await cache.match(url, { ignoreVary: true })) continue
        const res = await fetch(url)
        if (res.ok) await cache.put(url, res)
      } catch {
        // Offline again or one photo failed; the rest still get saved
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()])
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const parsed = new URL(request.url)

  // Only same-origin GET requests
  if (request.method !== 'GET' || parsed.origin !== self.location.origin) return

  // Bed photos: saved for working on scenes without signal
  if (parsed.pathname.startsWith('/api/scene-photo/')) {
    event.respondWith(bedPhotoFetch(request))
    return
  }

  // API and auth routes should never be served from cache
  if (parsed.pathname.startsWith('/api/') || parsed.pathname.startsWith('/auth/')) return

  // In-app page data (React Server Components): straight to the network, no detour
  // through the caches. Offline, the app falls back to a full page load, handled below.
  if (request.headers.get('RSC') === '1' || parsed.searchParams.has('_rsc')) return

  if (parsed.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }
  if (parsed.pathname === '/_next/image') {
    event.respondWith(imageFetch(request))
    return
  }
  if (parsed.pathname === OFFLINE_APP) {
    event.respondWith(shellFetch(request))
    return
  }

  event.respondWith(handleFetch(request))
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone()).catch(() => {})
  return res
}

async function imageFetch(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request, { ignoreVary: true })
  if (cached) return cached
  try {
    return await fetch(request)
  } catch {
    return new Response('', { status: 503 })
  }
}

// A versioned bed photo never changes, so the saved one is used first; an
// unversioned one comes from the network, falling back to any saved version.
async function bedPhotoFetch(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const versioned = new URL(request.url).searchParams.has('v')
  if (versioned) {
    const saved = await cache.match(request)
    if (saved) return saved
  }
  try {
    return await fetch(request)
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) ?? new Response('', { status: 503 })
  }
}

async function shellFetch(request) {
  const cached = await caches.open(SHELL_CACHE).then((c) => c.match(OFFLINE_APP, { ignoreSearch: true }))
  if (cached) return cached
  try {
    return await fetch(request)
  } catch {
    return offlineFallback()
  }
}

async function hasShell() {
  return Boolean(await caches.open(SHELL_CACHE).then((c) => c.match(OFFLINE_APP, { ignoreSearch: true })))
}

function toOfflineApp(request) {
  const url = new URL(request.url)
  // auto=1: sent here by the worker, not by choice, so the app goes back once hortlog answers
  return Response.redirect(`${OFFLINE_APP}?path=${encodeURIComponent(url.pathname + url.search)}&auto=1`, 302)
}

async function offlineFallback() {
  const staticCache = await caches.open(STATIC_CACHE)
  return (await staticCache.match('/offline.html')) ?? new Response('Offline', { status: 503 })
}

async function handleFetch(request) {
  // Public check-in: pages a visitor saved are served from their cache
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

  if (request.mode !== 'navigate') {
    try {
      return await fetch(request)
    } catch {
      return new Response('', { status: 503 })
    }
  }

  // A page: from the network, unless there's no connection (or it's hanging),
  // in which case members with a saved copy get the offline app
  const network = fetch(request)
  network.catch(() => {}) // handled below; this stops an unhandled rejection after a timeout
  const wait = self.navigator.onLine ? NAV_TIMEOUT_ONLINE_MS : NAV_TIMEOUT_MS
  const timedOut = new Promise((resolve) => setTimeout(() => resolve('timeout'), wait))
  try {
    const first = await Promise.race([network, timedOut])
    if (first !== 'timeout') return first
    if (await hasShell()) return toOfflineApp(request)
    return await network
  } catch {
    if (await hasShell()) return toOfflineApp(request)
    return offlineFallback()
  }
}

function withOfflineHeader(response) {
  const headers = new Headers(response.headers)
  headers.set('X-Hortlog-Offline', '1')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
