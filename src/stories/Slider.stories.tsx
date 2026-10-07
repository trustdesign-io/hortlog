import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Slider } from '@/components/ui/slider'

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
  decorators: [
    (Story) => (
      <div className="p-4 w-80">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Slider>

export const Default: Story = {
  args: { defaultValue: [50] },
}

export const At25: Story = {
  args: { defaultValue: [25] },
}

export const At50: Story = {
  args: { defaultValue: [50] },
}

export const At75: Story = {
  args: { defaultValue: [75] },
}

export const Range: Story = {
  args: { defaultValue: [20, 80] },
}

export const RangeNarrow: Story = {
  args: { defaultValue: [40, 60] },
}

export const Disabled: Story = {
  args: { defaultValue: [40], disabled: true },
}

export const DisabledRange: Story = {
  args: { defaultValue: [25, 75], disabled: true },
}

export const WithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span>Volume</span>
          <span className="text-muted-foreground">70%</span>
        </div>
        <Slider defaultValue={[70]} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span>Price range</span>
          <span className="text-muted-foreground">$20 – $80</span>
        </div>
        <Slider defaultValue={[20, 80]} />
      </div>
    </div>
  ),
}
