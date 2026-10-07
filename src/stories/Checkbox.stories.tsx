import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Checkbox>

export const Unchecked: Story = {}

export const Checked: Story = {
  args: { defaultChecked: true },
}

export const Indeterminate: Story = {
  args: { indeterminate: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}

export const WithLabelChecked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="newsletter" defaultChecked />
      <Label htmlFor="newsletter">Subscribe to newsletter</Label>
    </div>
  ),
}

export const WithLabelDisabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="disabled-opt" disabled />
      <Label htmlFor="disabled-opt" className="opacity-50 cursor-not-allowed">
        This option is unavailable
      </Label>
    </div>
  ),
}

export const CheckboxList: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="opt-design" defaultChecked />
        <Label htmlFor="opt-design">Design</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="opt-engineering" defaultChecked />
        <Label htmlFor="opt-engineering">Engineering</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="opt-marketing" />
        <Label htmlFor="opt-marketing">Marketing</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="opt-sales" disabled />
        <Label htmlFor="opt-sales" className="opacity-50 cursor-not-allowed">
          Sales (coming soon)
        </Label>
      </div>
    </div>
  ),
}
