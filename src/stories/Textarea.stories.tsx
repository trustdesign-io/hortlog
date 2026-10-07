import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  decorators: [
    (Story) => (
      <div className="w-80 p-4">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Textarea>

export const Default: Story = {}

export const WithPlaceholder: Story = {
  args: { placeholder: 'Tell us about yourself…' },
}

export const WithValue: Story = {
  args: {
    defaultValue:
      'This is some existing content in the textarea that spans across a couple of lines to demonstrate how it looks.',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'This field is read-only.',
  },
}

export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    defaultValue: 'x',
    placeholder: 'Minimum 10 characters required',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea id="bio" placeholder="Write a short bio…" />
    </div>
  ),
}

export const WithLabelAndValue: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="message">Message</Label>
      <Textarea
        id="message"
        defaultValue="Hi team, just checking in on the project status. Could you provide an update when you get a chance?"
      />
    </div>
  ),
}

export const WithLabelDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        disabled
        defaultValue="These notes are locked and cannot be edited."
      />
    </div>
  ),
}

export const WithLabelInvalid: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        aria-invalid
        defaultValue="Too short."
        placeholder="Minimum 20 characters"
      />
      <p className="text-sm text-destructive">
        Description must be at least 20 characters.
      </p>
    </div>
  ),
}
