import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Logo } from '@/components/layout/logo'

const meta: Meta<typeof Logo> = {
  title: 'Layout/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  args: {
    href: '/',
  },
}

export default meta

type Story = StoryObj<typeof Logo>

export const Default: Story = {}

export const MarkOnly: Story = {
  args: { name: false },
}

export const Large: Story = {
  args: { className: 'scale-150 origin-left' },
}

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
}
