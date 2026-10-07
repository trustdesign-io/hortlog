import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Spinner } from '@/components/ui/spinner'

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
}

export default meta

type Story = StoryObj<typeof Spinner>

export const Default: Story = {}

export const Small: Story = {
  render: () => <Spinner className="size-3" />,
}

export const Medium: Story = {
  render: () => <Spinner className="size-5" />,
}

export const Large: Story = {
  render: () => <Spinner className="size-8" />,
}

export const ExtraLarge: Story = {
  render: () => <Spinner className="size-12" />,
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-5" />
      <Spinner className="size-8" />
      <Spinner className="size-12" />
    </div>
  ),
}

export const InlineWithText: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
      <Spinner />
      <span>Saving your changes…</span>
    </div>
  ),
}

export const ButtonLoading: Story = {
  render: () => (
    <button
      disabled
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-70"
    >
      <Spinner className="size-4" />
      Processing…
    </button>
  ),
}
