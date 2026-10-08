import { test, expect } from '@playwright/test'

/**
 * Smoke E2E for admin org switcher (ticket #108).
 *
 * Scope: unauthenticated redirect behaviour only.
 * The core feature (admin sees all orgs in the switcher, non-admin sees only
 * memberships, role labels, org-name link) requires an authenticated session
 * with a seeded database and is not covered here. Manual verification is
 * needed until a seeded E2E environment is available.
 */

test.describe('Admin org switcher — unauthenticated redirects', () => {
  test('unauthenticated user visiting /admin/organisations is redirected', async ({ page }) => {
    await page.goto('/admin/organisations')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })

  test('unauthenticated user visiting an org is redirected', async ({ page }) => {
    await page.goto('/test-org')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })
})
