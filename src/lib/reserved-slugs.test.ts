import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RESERVED_ORG_SLUGS } from './reserved-slugs'

/** The first URL segment of every route: folders under src/app, looking through (groups) */
function topLevelRoutes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (/^\(.*\)$/.test(entry.name)) return topLevelRoutes(join(dir, entry.name))
      if (/^[[_@]/.test(entry.name)) return []
      return [entry.name]
    }
    // Route files at the top level, e.g. opengraph-image.tsx
    const m = entry.name.match(/^(opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest)\.(tsx?|jsx?)$/)
    return m ? [m[1]] : []
  })
}

describe('RESERVED_ORG_SLUGS', () => {
  it('lists every top-level route, so no garden slug can clash with one', () => {
    const missing = topLevelRoutes(join(process.cwd(), 'src/app')).filter((r) => !RESERVED_ORG_SLUGS.has(r))
    expect(missing).toEqual([])
  })
})
