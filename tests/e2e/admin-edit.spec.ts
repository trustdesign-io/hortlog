import { test, expect } from '@playwright/test'

/**
 * Smoke E2E for admin edit flows (ticket #106).
 * Full authenticated flows require a seeded DB — these tests verify
 * unauthenticated users are redirected and check page structure.
 */

test.describe('Admin edit — unauthenticated redirects', () => {
  test('unauthenticated user visiting /admin/members is redirected', async ({ page }) => {
    await page.goto('/admin/members')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })

  test('unauthenticated user visiting /admin/organisations is redirected', async ({ page }) => {
    await page.goto('/admin/organisations')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })
})
