/**
 * Which offline view to show for a hortlog address. The offline app is handed
 * the address the member was trying to open and draws it from the saved copy.
 */
export type OfflineRoute =
  | { kind: 'home' }
  | { kind: 'record'; recordId: string }
  | { kind: 'shortCode'; code: string }
  | { kind: 'org'; org: string }
  | { kind: 'specimens'; org: string }
  | { kind: 'specimen'; org: string; key: string }
  | { kind: 'scenes'; org: string }
  | { kind: 'scene'; org: string; sceneId: string }
  | { kind: 'collections'; org: string }
  | { kind: 'todo'; org: string }
  | { kind: 'publicScene'; org: string; sceneSlug: string; specimenSlug: string | null }
  | { kind: 'unavailable'; org: string | null }

/** First path segments that are never an organisation */
const RESERVED = new Set([
  'admin',
  'settings',
  'orgs',
  'u',
  'share',
  'sign-in',
  'sign-up',
  'check-email',
  'privacy',
  'accept-invite',
  'no-access',
  'error',
  'auth',
  'api',
  'offline-app',
])

/** Organisation pages that need a connection */
const ONLINE_ONLY = new Set(['members', 'team', 'settings', 'species'])

export function resolveOfflineRoute(path: string): OfflineRoute {
  const clean = path.split(/[?#]/)[0]
  const parts = clean
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p)
      } catch {
        return p
      }
    })

  const [first, second, third, fourth] = parts
  if (!first || first === 'dashboard') return { kind: 'home' }
  if (first === 'records') return second ? { kind: 'record', recordId: second } : { kind: 'home' }
  if (first === 'v') return second ? { kind: 'shortCode', code: second.toLowerCase() } : { kind: 'unavailable', org: null }
  if (RESERVED.has(first)) return { kind: 'unavailable', org: null }

  const org = first
  if (!second) return { kind: 'org', org }
  if (ONLINE_ONLY.has(second)) return { kind: 'unavailable', org }

  switch (second) {
    case 'specimens':
      if (!third) return { kind: 'specimens', org }
      if (third === 'new') return { kind: 'unavailable', org }
      return { kind: 'specimen', org, key: third }
    case 'scenes':
      if (!third) return { kind: 'scenes', org }
      if (third === 'new') return { kind: 'unavailable', org }
      return { kind: 'scene', org, sceneId: third }
    case 'collections':
      return third ? { kind: 'unavailable', org } : { kind: 'collections', org }
    case 'todo':
      return { kind: 'todo', org }
    case 'scene':
      return third ? { kind: 'publicScene', org, sceneSlug: third, specimenSlug: fourth ?? null } : { kind: 'unavailable', org }
    default:
      // /[org]/[collection]/[scene](/[specimen])
      return third ? { kind: 'publicScene', org, sceneSlug: third, specimenSlug: fourth ?? null } : { kind: 'unavailable', org }
  }
}

/** The address to open in the offline app for a page of the live app. */
export function offlineAppHref(path: string): string {
  return `/offline-app?path=${encodeURIComponent(path)}`
}
