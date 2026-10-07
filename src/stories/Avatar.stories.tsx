import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar'

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
}

export default meta

type Story = StoryObj<typeof Avatar>

// Sizes with image
export const Small: Story = {
  render: () => (
    <Avatar size="sm">
      <AvatarImage src="https://github.com/shadcn.png" alt="Sarah Chen" />
      <AvatarFallback>SC</AvatarFallback>
    </Avatar>
  ),
}

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="Sarah Chen" />
      <AvatarFallback>SC</AvatarFallback>
    </Avatar>
  ),
}

export const Large: Story = {
  render: () => (
    <Avatar size="lg">
      <AvatarImage src="https://github.com/shadcn.png" alt="Sarah Chen" />
      <AvatarFallback>SC</AvatarFallback>
    </Avatar>
  ),
}

// Fallback (image fails to load)
export const FallbackInitials: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/nonexistent.png" alt="Marcus Webb" />
      <AvatarFallback>MW</AvatarFallback>
    </Avatar>
  ),
}

// With badge
export const WithBadge: Story = {
  render: () => (
    <Avatar size="lg">
      <AvatarImage src="https://github.com/shadcn.png" alt="Priya Nair" />
      <AvatarFallback>PN</AvatarFallback>
      <AvatarBadge />
    </Avatar>
  ),
}

// Group
export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Sarah Chen" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="/nonexistent.png" alt="Marcus Webb" />
        <AvatarFallback>MW</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="/nonexistent.png" alt="Priya Nair" />
        <AvatarFallback>PN</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  ),
}

export const GroupLarge: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="Sarah Chen" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="/nonexistent.png" alt="Marcus Webb" />
        <AvatarFallback>MW</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="/nonexistent.png" alt="Priya Nair" />
        <AvatarFallback>PN</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  ),
}
