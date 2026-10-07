import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MailIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Save changes',
  },
}

export default meta

type Story = StoryObj<typeof Button>

// Variants
export const Default: Story = {}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Edit profile' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Learn more' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Dismiss' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete account' },
}

export const Link: Story = {
  args: { variant: 'link', children: 'View documentation' },
}

// Sizes
export const SizeXS: Story = {
  args: { size: 'xs', children: 'New tag' },
}

export const SizeSM: Story = {
  args: { size: 'sm', children: 'Add comment' },
}

export const SizeLG: Story = {
  args: { size: 'lg', children: 'Get started' },
}

// Icon sizes
export const IconDefault: Story = {
  args: { size: 'icon', children: <PlusIcon />, 'aria-label': 'Add item' },
}

export const IconXS: Story = {
  args: { size: 'icon-xs', children: <PlusIcon />, 'aria-label': 'Add item' },
}

export const IconSM: Story = {
  args: { size: 'icon-sm', children: <PlusIcon />, 'aria-label': 'Add item' },
}

export const IconLG: Story = {
  args: { size: 'icon-lg', children: <PlusIcon />, 'aria-label': 'Add item' },
}

// With icons
export const WithLeadingIcon: Story = {
  args: { children: <><MailIcon />Send email</> },
}

export const WithTrailingIcon: Story = {
  args: { variant: 'destructive', children: <>Remove member<TrashIcon /></> },
}

// States
export const Disabled: Story = {
  args: { disabled: true, children: 'Unavailable' },
}
