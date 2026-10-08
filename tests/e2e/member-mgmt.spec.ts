import { test, expect } from '@playwright/test'

/**
 * Smoke-level E2E tests for manager/member management (ticket #98).
 * These tests verify access control without authentication — full happy-path
 * flows require a seeded database and are integration tests.
 */

test.describe('Member management — unauthenticated redirects', () => {
  test('unauthenticated user visiting org members page is redirected', async ({ page }) => {
    await page.goto('/some-org/members')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })

  test('unauthenticated user visiting org views page is redirected', async ({ page }) => {
    await page.goto('/some-org/views')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })

  test('unauthenticated user visiting view edit page is redirected', async ({ page }) => {
    await page.goto('/some-org/views/view-id-123/edit')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })
})

test.describe('Views list — filter param', () => {
  test('views page with filter=mine redirects unauthenticated users', async ({ page }) => {
    await page.goto('/some-org/views?filter=mine')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })
})
