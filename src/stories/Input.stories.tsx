import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  args: {
    placeholder: 'Enter a value',
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="you@company.com" />
    </div>
  ),
}

export const Text: Story = {
  args: { type: 'text', placeholder: 'Full name' },
}

export const Email: Story = {
  args: { type: 'email', placeholder: 'you@company.com' },
}

export const Password: Story = {
  args: { type: 'password', placeholder: 'Enter your password' },
}

export const Search: Story = {
  args: { type: 'search', placeholder: 'Search projects…' },
}

export const File: Story = {
  args: { type: 'file' },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Not editable', value: 'Read-only value' },
}

export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    value: 'bad@',
    placeholder: 'you@company.com',
  },
}
