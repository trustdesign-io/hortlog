// Storybook mock for the auth server actions. The real module imports Prisma
// (via the landing-page helper), which can't load in the browser.
import { fn } from 'storybook/test'
import type { ActionResult } from '@/lib/shared/types'

const ok: ActionResult = { success: true }

export const signInWithEmail = fn(async () => ok).mockName('signInWithEmail')
export const signUpWithEmail = fn(async () => ok).mockName('signUpWithEmail')
export const resendVerificationEmail = fn(async () => ok).mockName('resendVerificationEmail')
export const signOut = fn(async () => {}).mockName('signOut')
