import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Separator } from '@/components/ui/separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
}

export default meta

type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 p-6">
      <p className="text-sm font-medium">Account settings</p>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">
        Manage your profile, notifications, and security preferences.
      </p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-10 items-center gap-3 p-4">
      <span className="text-sm font-medium">Dashboard</span>
      <Separator orientation="vertical" />
      <span className="text-sm text-muted-foreground">Projects</span>
      <Separator orientation="vertical" />
      <span className="text-sm text-muted-foreground">Team</span>
    </div>
  ),
}

export const InList: Story = {
  render: () => (
    <div className="w-64 rounded-md border p-2">
      {['Edit', 'Duplicate', 'Archive'].map((item, i) => (
        <div key={item}>
          {i > 0 && <Separator className="my-1" />}
          <div className="rounded px-3 py-1.5 text-sm hover:bg-muted cursor-default">{item}</div>
        </div>
      ))}
    </div>
  ),
}
