import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react'

import { Toggle } from '@/components/ui/toggle'

const meta: Meta<typeof Toggle> = {
  title: 'UI/Toggle',
  component: Toggle,
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Toggle>

export const Default: Story = {
  args: { children: 'Toggle' },
}

export const Pressed: Story = {
  args: { pressed: true, children: 'Active' },
}

export const Unpressed: Story = {
  args: { pressed: false, children: 'Inactive' },
}

export const VariantDefault: Story = {
  args: { variant: 'default', children: 'Default' },
}

export const VariantOutline: Story = {
  args: { variant: 'outline', children: 'Outline' },
}

export const SizeSmall: Story = {
  args: { size: 'sm', children: 'Small' },
}

export const SizeDefault: Story = {
  args: { size: 'default', children: 'Default' },
}

export const SizeLarge: Story = {
  args: { size: 'lg', children: 'Large' },
}

export const WithBoldIcon: Story = {
  args: {
    children: <BoldIcon />,
    'aria-label': 'Bold',
  },
}

export const WithItalicIcon: Story = {
  args: {
    children: <ItalicIcon />,
    'aria-label': 'Italic',
    pressed: true,
  },
}

export const WithUnderlineIcon: Story = {
  args: {
    children: <UnderlineIcon />,
    'aria-label': 'Underline',
  },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Toggle variant="default" size="sm">
          <BoldIcon />
        </Toggle>
        <Toggle variant="default" size="default">
          <ItalicIcon />
        </Toggle>
        <Toggle variant="default" size="lg">
          <UnderlineIcon />
        </Toggle>
      </div>
      <div className="flex items-center gap-2">
        <Toggle variant="outline" size="sm">
          <BoldIcon />
        </Toggle>
        <Toggle variant="outline" size="default" pressed>
          <ItalicIcon />
        </Toggle>
        <Toggle variant="outline" size="lg">
          <UnderlineIcon />
        </Toggle>
      </div>
    </div>
  ),
}
