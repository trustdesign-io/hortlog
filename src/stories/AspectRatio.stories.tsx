import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AspectRatio } from '@/components/ui/aspect-ratio'

const meta: Meta<typeof AspectRatio> = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  decorators: [
    (Story) => (
      <div className="w-80 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof AspectRatio>

export const Widescreen: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80"
        alt="Mountain landscape"
        className="size-full object-cover"
      />
    </AspectRatio>
  ),
}

export const Traditional: Story = {
  render: () => (
    <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-lg bg-muted">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80"
        alt="Mountain landscape"
        className="size-full object-cover"
      />
    </AspectRatio>
  ),
}

export const Square: Story = {
  render: () => (
    <AspectRatio ratio={1} className="overflow-hidden rounded-lg bg-muted">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80"
        alt="Mountain landscape"
        className="size-full object-cover"
      />
    </AspectRatio>
  ),
}

export const Portrait: Story = {
  render: () => (
    <AspectRatio ratio={3 / 4} className="overflow-hidden rounded-lg bg-muted">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80"
        alt="Mountain landscape"
        className="size-full object-cover"
      />
    </AspectRatio>
  ),
}

export const PlaceholderContent: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
      <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
        16 / 9
      </div>
    </AspectRatio>
  ),
}

export const AllRatios: Story = {
  decorators: [
    (Story) => (
      <div className="grid grid-cols-3 gap-4 p-6 w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      {([
        { ratio: 16 / 9, label: '16:9' },
        { ratio: 4 / 3, label: '4:3' },
        { ratio: 1, label: '1:1' },
      ] as const).map(({ ratio, label }) => (
        <div key={label} className="space-y-1.5">
          <AspectRatio ratio={ratio} className="overflow-hidden rounded-lg bg-muted">
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              {label}
            </div>
          </AspectRatio>
          <p className="text-center text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </>
  ),
}
