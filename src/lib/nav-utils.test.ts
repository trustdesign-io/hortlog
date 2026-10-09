import { describe, it, expect } from 'vitest'
import { getActiveHref, getOrgSlugFromPath } from './nav-utils'

const orgNav = [
  { href: '/demo' },
  { href: '/demo/specimens' },
  { href: '/demo/views' },
  { href: '/demo/collections' },
  { href: '/demo/members' },
  { href: '/demo/todo' },
  { href: '/demo/settings' },
]

const appNav = [
  { href: '/records' },
  { href: '/settings' },
]

const adminNav = [
  { href: '/admin/organisations' },
  { href: '/admin/members' },
  { href: '/admin/species' },
]

describe('getActiveHref', () => {
  it('returns null for an empty items list', () => {
    expect(getActiveHref([], '/demo/todo')).toBeNull()
  })

  it('returns null when no item matches', () => {
    expect(getActiveHref(appNav, '/demo/todo')).toBeNull()
  })

  // ─── Org nav ─────────────────────────────────────────────────────────────────

  it('matches Overview exactly on /{org}', () => {
    expect(getActiveHref(orgNav, '/demo')).toBe('/demo')
  })

  it('matches To do exactly on /{org}/todo', () => {
    expect(getActiveHref(orgNav, '/demo/todo')).toBe('/demo/todo')
  })

  it('matches Specimens on /{org}/specimens', () => {
    expect(getActiveHref(orgNav, '/demo/specimens')).toBe('/demo/specimens')
  })

  it('matches Specimens on a nested specimen page (/{org}/specimens/new)', () => {
    expect(getActiveHref(orgNav, '/demo/specimens/new')).toBe('/demo/specimens')
  })

  it('matches Views on /{org}/views/{view}', () => {
    expect(getActiveHref(orgNav, '/demo/views/my-view')).toBe('/demo/views')
  })

  it('does NOT keep Overview active on /{org}/todo (longest match wins)', () => {
    const active = getActiveHref(orgNav, '/demo/todo')
    expect(active).toBe('/demo/todo')
    expect(active).not.toBe('/demo')
  })

  it('does NOT keep Overview active on /{org}/specimens/new (longest match wins)', () => {
    const active = getActiveHref(orgNav, '/demo/specimens/new')
    expect(active).toBe('/demo/specimens')
    expect(active).not.toBe('/demo')
  })

  // ─── App nav ──────────────────────────────────────────────────────────────────

  it('matches Account on /settings', () => {
    expect(getActiveHref(appNav, '/settings')).toBe('/settings')
  })

  it('matches My record on /records', () => {
    expect(getActiveHref(appNav, '/records')).toBe('/records')
  })

  it('matches My record on /records/{id}', () => {
    expect(getActiveHref(appNav, '/records/abc123')).toBe('/records')
  })

  // ─── Admin nav ────────────────────────────────────────────────────────────────

  it('matches Organisations admin on /admin/organisations', () => {
    expect(getActiveHref(adminNav, '/admin/organisations')).toBe('/admin/organisations')
  })

  it('matches Species admin on /admin/species/{id}', () => {
    expect(getActiveHref(adminNav, '/admin/species/rose')).toBe('/admin/species')
  })

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  it('does not match /demos when href is /demo (no false prefix match)', () => {
    expect(getActiveHref([{ href: '/demo' }], '/demos')).toBeNull()
  })

  it('handles trailing slash on pathname gracefully', () => {
    expect(getActiveHref(orgNav, '/demo/')).toBe('/demo')
  })

  it('org settings and global settings do not cross-contaminate (different nav lists)', () => {
    // When only orgNav is evaluated, /demo/settings wins (not /demo)
    expect(getActiveHref(orgNav, '/demo/settings')).toBe('/demo/settings')
    // When only appNav is evaluated, /settings wins (not /demo)
    expect(getActiveHref(appNav, '/settings')).toBe('/settings')
  })

  it('unknown nested path falls back to the longest matching prefix', () => {
    expect(getActiveHref(orgNav, '/demo/nonexistent/deep')).toBe('/demo')
  })
})

// ─── getOrgSlugFromPath ───────────────────────────────────────────────────────

describe('getOrgSlugFromPath', () => {
  const knownSlugs = ['demo', 'acme']

  it('returns null for null pathname', () => {
    expect(getOrgSlugFromPath(null, knownSlugs)).toBeNull()
  })

  it('returns null for an empty knownSlugs list', () => {
    expect(getOrgSlugFromPath('/demo', [])).toBeNull()
  })

  it('returns null when first segment is not a known org slug — /records', () => {
    expect(getOrgSlugFromPath('/records', knownSlugs)).toBeNull()
  })

  it('returns null when first segment is not a known org slug — /records/001', () => {
    expect(getOrgSlugFromPath('/records/001', knownSlugs)).toBeNull()
  })

  it('returns null when first segment is not a known org slug — /settings', () => {
    expect(getOrgSlugFromPath('/settings', knownSlugs)).toBeNull()
  })

  it('returns null when first segment is not a known org slug — /admin/members', () => {
    expect(getOrgSlugFromPath('/admin/members', knownSlugs)).toBeNull()
  })

  it('returns null when first segment is not a known org slug — /no-access', () => {
    expect(getOrgSlugFromPath('/no-access', knownSlugs)).toBeNull()
  })

  it('returns the slug on /{org}', () => {
    expect(getOrgSlugFromPath('/demo', knownSlugs)).toBe('demo')
  })

  it('returns the slug on /{org}/todo', () => {
    expect(getOrgSlugFromPath('/demo/todo', knownSlugs)).toBe('demo')
  })

  it('returns the slug on a deep path', () => {
    expect(getOrgSlugFromPath('/acme/specimens/new', knownSlugs)).toBe('acme')
  })

  it('returns null for a slug that is not in knownSlugs', () => {
    expect(getOrgSlugFromPath('/unknown', knownSlugs)).toBeNull()
  })
})
