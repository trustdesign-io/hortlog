/**
 * Verifies that every exported server action in admin.ts is referenced
 * by at least one admin UI component. If a new action is added to admin.ts
 * without a UI caller, this test will fail.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

function readFile(rel: string) {
  return readFileSync(join(process.cwd(), rel), 'utf8')
}

function readDir(rel: string): string[] {
  return readdirSync(join(process.cwd(), rel), { recursive: true })
    .filter((f): f is string => typeof f === 'string' && f.endsWith('.tsx'))
}

const ADMIN_ACTIONS_FILE = 'src/lib/actions/admin.ts'
const ADMIN_UI_DIRS = [
  'src/app/(app)/admin',
]

function getExportedFunctions(src: string): string[] {
  const matches = src.matchAll(/^export async function (\w+)/gm)
  return [...matches].map((m) => m[1])
}

function getUiSources(dirs: string[]): string {
  return dirs.flatMap((dir) => {
    try {
      return readDir(dir).map((f) => readFile(`${dir}/${f}`))
    } catch {
      return []
    }
  }).join('\n')
}

describe('Admin action coverage', () => {
  const adminSrc = readFile(ADMIN_ACTIONS_FILE)
  const exportedActions = getExportedFunctions(adminSrc)
  const uiSrc = getUiSources(ADMIN_UI_DIRS)

  it('has at least one exported action to check', () => {
    expect(exportedActions.length).toBeGreaterThan(0)
  })

  for (const action of exportedActions) {
    it(`${action} is referenced in admin UI`, () => {
      expect(uiSrc).toContain(action)
    })
  }
})
