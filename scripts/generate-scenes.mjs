#!/usr/bin/env node
/**
 * Creates "Scene 001" … "Scene NNN" for an organisation, each with an empty
 * grid and a unique short code, ready to print QR labels for. They start
 * inactive and are switched on as they come into use. Safe to run
 * again: scenes that already exist (by slug) are skipped.
 *
 *   node --env-file=.env.local scripts/generate-scenes.mjs <org-slug> [count=70]          # dry run
 *   node --env-file=.env.local scripts/generate-scenes.mjs <org-slug> [count=70] --apply  # write
 *
 * Uses DIRECT_URL, else DATABASE_URL. PG_MODULE can point at another copy of `pg`.
 */
import { createRequire } from 'node:module'
import { newId, planSceneBatch } from '../src/lib/scene-batch.mjs'

const require = createRequire(import.meta.url)
const { Client } = require(process.env.PG_MODULE ?? 'pg')

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const [orgSlug, countArg = '70'] = args.filter((a) => !a.startsWith('--'))
const count = Number(countArg)
if (!orgSlug || !Number.isInteger(count) || count < 1 || count > 999) {
  console.error('Usage: generate-scenes.mjs <org-slug> [count=70] [--apply]')
  process.exit(1)
}

const client = new Client({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
try {
  const org = (await client.query('SELECT id, name FROM "Organisation" WHERE slug = $1', [orgSlug])).rows[0]
  if (!org) throw new Error(`No organisation with slug "${orgSlug}"`)

  const existingSlugs = (await client.query('SELECT slug FROM "Scene" WHERE "organisationId" = $1', [org.id])).rows.map((r) => r.slug)
  const existingCodes = (await client.query('SELECT "shortCode" FROM "Scene"')).rows.map((r) => r.shortCode)
  const plan = planSceneBatch({ count, existingSlugs, existingCodes })

  console.log(`${org.name}: ${count - plan.length} of ${count} already exist, ${plan.length} to create.`)
  if (plan.length > 0) console.log(`  ${plan[0].name} (${plan[0].shortCode}) … ${plan.at(-1).name} (${plan.at(-1).shortCode})`)
  if (!apply) {
    console.log('Dry run: nothing written. Add --apply to create them.')
  } else if (plan.length > 0) {
    await client.query('BEGIN')
    let created = 0
    for (const s of plan) {
      const r = await client.query(
        `INSERT INTO "Scene" (id, name, slug, "shortCode", "organisationId", active, "updatedAt")
         VALUES ($1, $2, $3, $4, $5, false, now())
         ON CONFLICT (slug, "organisationId") DO NOTHING`,
        [newId(), s.name, s.slug, s.shortCode, org.id],
      )
      created += r.rowCount
    }
    await client.query('COMMIT')
    console.log(`Created ${created} scene${created === 1 ? '' : 's'}.`)
  }
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Failed:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
