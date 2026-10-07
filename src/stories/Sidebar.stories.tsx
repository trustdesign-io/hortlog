import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Sidebar } from '@/components/sidebar'
import type { UserWithMemberships } from '@/lib/auth/current-user'

const mockUser: UserWithMemberships = {
  id: 'user-1',
  email: 'sarah.chen@company.com',
  name: 'Sarah Chen',
  avatarUrl: 'https://github.com/shadcn.png',
  isAdmin: false,
  onboardingCompletedAt: new Date('2025-01-15'),
  createdAt: new Date('2025-01-10'),
  updatedAt: new Date('2025-03-01'),
  memberships: [
    {
      id: 'mem-1',
      userId: 'user-1',
      organisationId: 'org-1',
      role: 'MANAGER',
      createdAt: new Date('2025-01-15'),
      organisation: { id: 'org-1', slug: 'royal-botanical', name: 'Royal Botanical Gardens' },
    },
    {
      id: 'mem-2',
      userId: 'user-1',
      organisationId: 'org-2',
      role: 'MEMBER',
      createdAt: new Date('2025-02-01'),
      organisation: { id: 'org-2', slug: 'kew-woodland', name: 'Kew Woodland Trust' },
    },
  ],
}

const adminUser: UserWithMemberships = {
  ...mockUser,
  isAdmin: true,
}

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
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

export const Dashboard: Story = {
  args: { user: mockUser },
  parameters: { nextjs: { navigation: { pathname: '/dashboard' } } },
}

export const OrgContext: Story = {
  args: { user: mockUser },
  parameters: { nextjs: { navigation: { pathname: '/royal-botanical' } } },
}

export const OrgSpecimens: Story = {
  args: { user: mockUser },
  parameters: { nextjs: { navigation: { pathname: '/royal-botanical/specimens' } } },
}

export const AdminUser: Story = {
  args: { user: adminUser },
  parameters: { nextjs: { navigation: { pathname: '/dashboard' } } },
}

export const NoOrgs: Story = {
  args: { user: { ...mockUser, memberships: [] } },
  parameters: { nextjs: { navigation: { pathname: '/dashboard' } } },
}

export const FallbackUser: Story = {
  args: { user: { ...mockUser, name: null, avatarUrl: null, email: 'ops@company.com' } },
  parameters: { nextjs: { navigation: { pathname: '/dashboard' } } },
}
