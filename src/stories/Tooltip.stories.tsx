import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="flex items-center justify-center p-16">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>Save document</TooltipContent>
    </Tooltip>
  ),
}

export const WithKeyboardShortcut: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Save</Button>} />
      <TooltipContent>
        Save document
        <Kbd>⌘S</Kbd>
      </TooltipContent>
    </Tooltip>
  ),
}

export const WithMultiKeyShortcut: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Find</Button>} />
      <TooltipContent>
        Find in page
        <Kbd>⌘</Kbd>
        <Kbd>F</Kbd>
      </TooltipContent>
    </Tooltip>
  ),
}

export const SideTop: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Top</Button>} />
      <TooltipContent side="top">Tooltip on top</TooltipContent>
    </Tooltip>
  ),
}

export const SideBottom: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Bottom</Button>} />
      <TooltipContent side="bottom">Tooltip on bottom</TooltipContent>
    </Tooltip>
  ),
}

export const SideLeft: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Left</Button>} />
      <TooltipContent side="left">Tooltip on left</TooltipContent>
    </Tooltip>
  ),
}

export const SideRight: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Right</Button>} />
      <TooltipContent side="right">Tooltip on right</TooltipContent>
    </Tooltip>
  ),
}

export const AllSides: Story = {
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="flex items-center justify-center gap-4 p-16">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  render: () => (
    <>
      {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline" className="capitalize">{side}</Button>} />
          <TooltipContent side={side}>Tooltip on {side}</TooltipContent>
        </Tooltip>
      ))}
    </>
  ),
}
