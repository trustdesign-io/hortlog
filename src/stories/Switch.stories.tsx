import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Switch>

export const Off: Story = {}

export const On: Story = {
  args: { defaultChecked: true },
}

export const DefaultSize: Story = {
  args: { size: 'default' },
}

export const SmallSize: Story = {
  args: { size: 'sm' },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const DisabledOn: Story = {
  args: { disabled: true, defaultChecked: true },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="notifications" />
      <Label htmlFor="notifications">Enable notifications</Label>
    </div>
  ),
}

export const WithLabelOn: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="dark-mode" defaultChecked />
      <Label htmlFor="dark-mode">Dark mode</Label>
    </div>
  ),
}

export const WithLabelSmall: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="compact" size="sm" defaultChecked />
      <Label htmlFor="compact">Compact view</Label>
    </div>
  ),
}

export const SwitchList: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <div className="flex items-center justify-between">
        <Label htmlFor="sw-email">Email notifications</Label>
        <Switch id="sw-email" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="sw-sms">SMS alerts</Label>
        <Switch id="sw-sms" />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="sw-push" className="opacity-50 cursor-not-allowed">
          Push notifications
        </Label>
        <Switch id="sw-push" disabled />
      </div>
    </div>
  ),
}
