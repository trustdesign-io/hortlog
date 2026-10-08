import { test, expect } from '@playwright/test'

/**
 * Smoke-level E2E tests for the To do page (ticket #100).
 * Full happy-path flows require a seeded database — these tests verify
 * access control for unauthenticated users.
 */

test.describe('To do page — unauthenticated redirects', () => {
  test('unauthenticated user visiting /org/todo is redirected', async ({ page }) => {
    await page.goto('/some-org/todo')
    await expect(page).toHaveURL(/\/(sign-in|no-access)/)
  })
})
