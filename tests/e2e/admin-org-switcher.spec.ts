import { test, expect } from '@playwright/test'

/**
 * Smoke E2E for admin org switcher (ticket #108).
 * Full authenticated flows require a seeded DB — these tests verify
 * unauthenticated redirects and page-level access control.
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
