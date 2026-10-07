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

  test('unauthenticated user visiting /dashboard is redirected to /sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('unauthenticated user visiting /settings is redirected to /sign-in', async ({
    page,
  }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
