import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Header } from '@/components/layout/header'

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
  args: {
    siteName: 'YourBrand',
    navLinks: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
}

export default meta

type Story = StoryObj<typeof Header>

export const Default: Story = {}

export const ActiveAbout: Story = {
  parameters: {
    nextjs: { navigation: { pathname: '/about' } },
  },
}

export const NoAuth: Story = {
  args: { hideAuth: true },
}

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    nextjs: { navigation: { pathname: '/' } },
  },
}

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    nextjs: { navigation: { pathname: '/' } },
  },
}
