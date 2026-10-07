import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CheckIcon, StarIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  args: {
    children: 'Published',
  },
}

export default meta

type Story = StoryObj<typeof Badge>

// Variants
export const Default: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Draft' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Overdue' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Pending review' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Archived' },
}

export const Link: Story = {
  args: { variant: 'link', children: 'View changelog' },
}

// With icons
export const WithLeadingIcon: Story = {
  args: {
    children: (
      <>
        <CheckIcon data-icon="inline-start" />
        Verified
      </>
    ),
  },
}

export const WithTrailingIcon: Story = {
  args: {
    variant: 'secondary',
    children: (
      <>
        Featured
        <StarIcon data-icon="inline-end" />
      </>
    ),
  },
}

// All variants at once
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2 p-4">
      <Badge variant="default">Published</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="destructive">Overdue</Badge>
      <Badge variant="outline">Pending review</Badge>
      <Badge variant="ghost">Archived</Badge>
      <Badge variant="link">View changelog</Badge>
    </div>
  ),
}
