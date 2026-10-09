import { test, expect } from '@playwright/test'

test.describe('Auth smoke tests', () => {
  test('sign-in page renders correctly', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
  })

  test('sign-up page renders correctly', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('sign-in and sign-up pages are linked to each other', async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/sign-up')

    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/sign-in')
  })

  test('unauthenticated user visiting /records is redirected to /sign-in', async ({
    page,
  }) => {
    await page.goto('/records')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('unauthenticated user visiting /settings is redirected to /sign-in', async ({
    page,
  }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('unauthenticated user visiting /admin is redirected to /sign-in', async ({
    page,
  }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('/sign-in renders without redirect loop when a stale PKCE verifier cookie is present', async ({
    page,
    context,
  }) => {
    // Simulate the sb-*-auth-token-code-verifier cookie that was incorrectly
    // treated as a valid session by the old cookie-name-matching middleware
    await context.addCookies([
      {
        name: 'sb-xyzprojectref-auth-token-code-verifier',
        value: 'stale-verifier-value',
        domain: 'localhost',
        path: '/',
      },
    ])
    await page.goto('/sign-in')
    // Page must load without ERR_TOO_MANY_REDIRECTS
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page).toHaveURL('/sign-in')
  })

  test('/auth/callback with no params shows the auth error page', async ({ page }) => {
    await page.goto('/auth/callback')
    await expect(page).toHaveURL(/\/auth\/error/)
    await expect(page.getByRole('heading', { name: /link expired|invalid/i })).toBeVisible()
  })

  test('/auth/callback?reason=link_expired shows the error page', async ({ page }) => {
    await page.goto('/auth/error?reason=link_expired')
    await expect(page.getByRole('heading', { name: /link expired|invalid/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to sign in' })).toBeVisible()
  })
})
