import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Popover>

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Edit dimensions</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the width and height of the element.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="popover-width">Width</Label>
            <Input id="popover-width" type="number" defaultValue="320" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="popover-height">Height</Label>
            <Input id="popover-height" type="number" defaultValue="240" />
          </div>
          <Button size="sm">Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const InfoPanel: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">What is this?</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>API rate limits</PopoverTitle>
          <PopoverDescription>
            Free plans are limited to 100 requests per minute. Upgrade to Pro for unlimited access.
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Free</span>
            <span className="font-medium text-foreground">100 req/min</span>
          </div>
          <div className="flex justify-between">
            <span>Pro</span>
            <span className="font-medium text-foreground">Unlimited</span>
          </div>
          <div className="flex justify-between">
            <span>Enterprise</span>
            <span className="font-medium text-foreground">Custom</span>
          </div>
        </div>
        <Button size="sm" className="w-full">Upgrade to Pro</Button>
      </PopoverContent>
    </Popover>
  ),
}

export const FilterPanel: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Filter results</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Filter by status</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-1.5">
          {['Active', 'Pending', 'Archived', 'Draft'].map((status) => (
            <label key={status} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" defaultChecked={status === 'Active'} />
              {status}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">Reset</Button>
          <Button size="sm" className="flex-1">Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
