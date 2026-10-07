import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { UserMenu } from '@/components/user-menu'
import type { User } from '@/types'

const baseUser: User = {
  id: 'user-1',
  email: 'sarah.chen@company.com',
  name: 'Sarah Chen',
  avatarUrl: 'https://github.com/shadcn.png',
  role: 'USER',
  onboardingCompletedAt: new Date('2025-01-15'),
  createdAt: new Date('2025-01-10'),
  updatedAt: new Date('2025-03-01'),
}

const meta: Meta<typeof UserMenu> = {
  title: 'Components/UserMenu',
  component: UserMenu,
  decorators: [
    (Story) => (
      <div className="w-64 border rounded-xl overflow-hidden">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof UserMenu>

export const WithAvatarAndName: Story = {
  args: { user: baseUser },
}

export const FallbackInitials: Story = {
  args: {
    user: {
      ...baseUser,
      name: 'Marcus Webb',
      avatarUrl: null,
    },
  },
}

export const EmailOnly: Story = {
  args: {
    user: {
      ...baseUser,
      name: null,
      avatarUrl: null,
      email: 'ops@company.com',
    },
  },
}

export const LongName: Story = {
  args: {
    user: {
      ...baseUser,
      name: 'Bartholomew Kingsborough-Clarke',
      email: 'bartholomew.kingsborough@enterprise-solutions.com',
      avatarUrl: null,
    },
  },
}

export const AdminRole: Story = {
  args: {
    user: {
      ...baseUser,
      name: 'Priya Nair',
      role: 'ADMIN',
      avatarUrl: null,
    },
  },
}
