import { vi } from 'vitest'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AuthProvider } from '@/components/auth-provider'
import type { User } from '@/types'

// Mock the Supabase client so these stories work in CI without real credentials.
// AuthProvider only uses onAuthStateChange — we return a no-op subscription.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}))

/**
 * `AuthProvider` is a non-visual context provider.
 *
 * On mount it seeds the Zustand auth store from `initialUser` and subscribes to
 * Supabase auth state changes so the store stays in sync across the session.
 * It renders its children unchanged.
 *
 * There is nothing to see here — the stories below simply confirm the
 * provider mounts without errors and renders its children correctly.
 */
const meta: Meta<typeof AuthProvider> = {
  title: 'Components/AuthProvider',
  component: AuthProvider,
  parameters: {
    docs: {
      description: {
        component:
          'Non-visual context provider. Syncs Supabase auth state to the Zustand `useAuthStore`. Wrap your app (or test tree) with this to have `useAuthStore` reflect the current session.',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof AuthProvider>

const mockUser: User = {
  id: 'user-1',
  email: 'sarah.chen@company.com',
  name: 'Sarah Chen',
  avatarUrl: null,
  role: 'USER',
  onboardingCompletedAt: null,
  createdAt: new Date('2025-01-10'),
  updatedAt: new Date('2025-03-01'),
}

export const WithAuthenticatedUser: Story = {
  args: {
    initialUser: mockUser,
    children: (
      <div className="rounded-lg border p-4 text-sm">
        <p className="font-medium">Children rendered by AuthProvider</p>
        <p className="text-muted-foreground">
          Auth state is seeded with: {mockUser.email}
        </p>
      </div>
    ),
  },
}

export const WithUnauthenticatedUser: Story = {
  args: {
    initialUser: null,
    children: (
      <div className="rounded-lg border p-4 text-sm">
        <p className="font-medium">Children rendered by AuthProvider</p>
        <p className="text-muted-foreground">
          Auth state is seeded with: null (unauthenticated)
        </p>
      </div>
    ),
  },
}
