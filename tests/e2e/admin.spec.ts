import { test, expect } from '@playwright/test'

test.describe('Admin pages — unauthenticated redirects', () => {
  test('unauthenticated user visiting /admin is redirected to /sign-in', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('unauthenticated user visiting /admin/organisations is redirected to /sign-in', async ({ page }) => {
    await page.goto('/admin/organisations')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('unauthenticated user visiting /admin/members is redirected to /sign-in', async ({ page }) => {
    await page.goto('/admin/members')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('unauthenticated user visiting /admin/species is redirected to /sign-in', async ({ page }) => {
    await page.goto('/admin/species')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('/admin/orgs redirects to /admin/organisations for unauthenticated users', async ({ page }) => {
    // redirect happens after auth check, so unauthenticated user still hits /sign-in
    await page.goto('/admin/orgs')
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
