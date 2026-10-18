#!/usr/bin/env node
/**
 * Runs pending database migrations as part of the production build, before
 * the new code is built — so the live site never runs code whose tables
 * don't exist yet. If a migration fails, the build fails and the current
 * version stays live.
 *
 * Production only: preview deployments share the database and must never
 * change it.
 */
import { execSync } from 'node:child_process'

if (process.env.VERCEL_ENV !== 'production') {
  console.log(`[migrate-on-deploy] ${process.env.VERCEL_ENV ?? 'local'} build: not touching the database.`)
  process.exit(0)
}
if (!process.env.DIRECT_URL) {
  // Don't block every deploy over this: CI's migrate job still applies them, just later
  console.warn('[migrate-on-deploy] DIRECT_URL is not set in Vercel; skipping. Add it so migrations run before the build.')
  process.exit(0)
}

execSync('npx prisma migrate deploy', { stdio: 'inherit' })
