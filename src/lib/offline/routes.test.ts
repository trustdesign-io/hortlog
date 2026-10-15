import { describe, expect, it } from 'vitest'
import { offlineAppHref, resolveOfflineRoute } from './routes'

describe('resolveOfflineRoute', () => {
  it.each([
    ['/', { kind: 'home' }],
    ['/dashboard', { kind: 'home' }],
    ['/records', { kind: 'home' }],
    ['/records/r1', { kind: 'record', recordId: 'r1' }],
    ['/v/ABC123', { kind: 'shortCode', code: 'abc123' }],
    ['/acme', { kind: 'org', org: 'acme' }],
    ['/acme/specimens', { kind: 'specimens', org: 'acme' }],
    ['/acme/specimens/s1/edit', { kind: 'specimen', org: 'acme', key: 's1' }],
    ['/acme/specimens/new', { kind: 'unavailable', org: 'acme' }],
    ['/acme/scenes', { kind: 'scenes', org: 'acme' }],
    ['/acme/scenes/sc1/edit', { kind: 'scene', org: 'acme', sceneId: 'sc1' }],
    ['/acme/collections', { kind: 'collections', org: 'acme' }],
    ['/acme/todo?filter=mine', { kind: 'todo', org: 'acme' }],
    ['/acme/scene/bed-1', { kind: 'publicScene', org: 'acme', sceneSlug: 'bed-1', specimenSlug: null }],
    ['/acme/roses/bed-1/rosa', { kind: 'publicScene', org: 'acme', sceneSlug: 'bed-1', specimenSlug: 'rosa' }],
    ['/acme/members', { kind: 'unavailable', org: 'acme' }],
    ['/acme/roses', { kind: 'unavailable', org: 'acme' }],
    ['/admin/orgs', { kind: 'unavailable', org: null }],
    ['/settings', { kind: 'unavailable', org: null }],
  ])('%s', (path, expected) => {
    expect(resolveOfflineRoute(path)).toEqual(expected)
  })
})

describe('offlineAppHref', () => {
  it('carries the original address', () => {
    expect(offlineAppHref('/acme/todo?x=1')).toBe('/offline-app?path=%2Facme%2Ftodo%3Fx%3D1')
  })
})
