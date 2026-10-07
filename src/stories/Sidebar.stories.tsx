import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Sidebar } from '@/components/sidebar'
import type { User } from '@/types'

const mockUser: User = {
  id: 'user-1',
  email: 'sarah.chen@company.com',
  name: 'Sarah Chen',
  avatarUrl: 'https://github.com/shadcn.png',
  role: 'USER',
  onboardingCompletedAt: new Date('2025-01-15'),
  createdAt: new Date('2025-01-10'),
  updatedAt: new Date('2025-03-01'),
}

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    // Disable the fixed mobile trigger button overlapping the canvas
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      // Render inside a min-h-screen container so the sidebar fills height.
      // Force md breakpoint so the desktop sidebar is visible (not just the mobile trigger).
      <div className="flex min-h-screen">
        <Story />
        <main className="flex-1 p-8 bg-muted/20">
          <p className="text-sm text-muted-foreground">Page content area</p>
        </main>
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Sidebar>

export const DashboardActive: Story = {
  args: { user: mockUser },
  parameters: {
    nextjs: {
      navigation: { pathname: '/dashboard' },
    },
  },
}

export const SettingsActive: Story = {
  args: { user: mockUser },
  parameters: {
    nextjs: {
      navigation: { pathname: '/settings' },
    },
  },
}

export const NoActiveItem: Story = {
  args: { user: mockUser },
  parameters: {
    nextjs: {
      navigation: { pathname: '/' },
    },
  },
}

export const FallbackUser: Story = {
  args: {
    user: {
      ...mockUser,
      name: null,
      avatarUrl: null,
      email: 'ops@company.com',
    },
  },
  parameters: {
    nextjs: {
      navigation: { pathname: '/dashboard' },
    },
  },
}
