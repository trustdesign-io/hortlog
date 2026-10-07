import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Logo } from '@/components/layout/logo'

const meta: Meta<typeof Logo> = {
  title: 'Layout/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  args: {
    name: 'YourBrand',
    href: '/',
  },
}

export default meta

type Story = StoryObj<typeof Logo>

export const Default: Story = {}

export const CustomName: Story = {
  args: { name: 'Acme Corp' },
}

export const Large: Story = {
  args: { className: 'text-xl' },
}

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
}
