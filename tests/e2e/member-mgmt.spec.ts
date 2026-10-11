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

  test('unauthenticated user visiting org scenes page is redirected', async ({ page }) => {
    await page.goto('/some-org/scenes')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })

  test('unauthenticated user visiting scene edit page is redirected', async ({ page }) => {
    await page.goto('/some-org/scenes/scene-id-123/edit')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })
})

test.describe('Scenes list — filter param', () => {
  test('scenes page with filter=mine redirects unauthenticated users', async ({ page }) => {
    await page.goto('/some-org/scenes?filter=mine')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })
})
