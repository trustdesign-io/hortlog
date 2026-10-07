import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
}

export default meta

type Story = StoryObj<typeof Label>

export const Default: Story = {
  args: { children: 'Company name', htmlFor: 'company' },
}

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <Label htmlFor="company">Company name</Label>
      <Input id="company" placeholder="Acme Inc." />
    </div>
  ),
}

export const RequiredField: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <Label htmlFor="username">
        Username <span className="text-destructive">*</span>
      </Label>
      <Input id="username" placeholder="johndoe" />
    </div>
  ),
}

export const DisabledContext: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72" data-disabled="true">
      <Label htmlFor="disabled-field">Locked field</Label>
      <Input id="disabled-field" disabled placeholder="Cannot edit" />
    </div>
  ),
}
