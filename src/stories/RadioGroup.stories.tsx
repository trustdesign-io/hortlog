import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  decorators: [
    (Story) => (
      <div className="p-4 w-72">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-1" id="r1" />
        <Label htmlFor="r1">Option one</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-2" id="r2" />
        <Label htmlFor="r2">Option two</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-3" id="r3" />
        <Label htmlFor="r3">Option three</Label>
      </div>
    </RadioGroup>
  ),
}

export const NoSelection: Story = {
  render: () => (
    <RadioGroup>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="starter" id="plan-starter" />
        <Label htmlFor="plan-starter">Starter</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="pro" id="plan-pro" />
        <Label htmlFor="plan-pro">Pro</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="enterprise" id="plan-enterprise" />
        <Label htmlFor="plan-enterprise">Enterprise</Label>
      </div>
    </RadioGroup>
  ),
}

export const WithDisabledOption: Story = {
  render: () => (
    <RadioGroup defaultValue="email">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="email" id="notify-email" />
        <Label htmlFor="notify-email">Email</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="sms" id="notify-sms" />
        <Label htmlFor="notify-sms">SMS</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="push" id="notify-push" disabled />
        <Label htmlFor="notify-push" className="opacity-50 cursor-not-allowed">
          Push notifications (unavailable)
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="none" id="notify-none" />
        <Label htmlFor="notify-none">None</Label>
      </div>
    </RadioGroup>
  ),
}

export const AllDisabled: Story = {
  render: () => (
    <RadioGroup defaultValue="monthly" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="monthly" id="billing-monthly" />
        <Label htmlFor="billing-monthly">Monthly billing</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="annually" id="billing-annually" />
        <Label htmlFor="billing-annually">Annual billing</Label>
      </div>
    </RadioGroup>
  ),
}
