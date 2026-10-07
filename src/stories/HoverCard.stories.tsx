import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'

const meta: Meta<typeof HoverCard> = {
  title: 'UI/HoverCard',
  component: HoverCard,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof HoverCard>

export const UserProfile: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger
        render={<a href="#" onClick={(e) => e.preventDefault()} />}
        className="text-sm font-medium underline underline-offset-4 hover:text-foreground/80"
      >
        @sarah_chen
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
            SC
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Sarah Chen</p>
            <p className="text-xs text-muted-foreground">@sarah_chen</p>
            <p className="text-xs text-muted-foreground">
              Product designer at Acme Corp. Passionate about design systems and accessibility.
            </p>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span><strong className="text-foreground">142</strong> following</span>
              <span><strong className="text-foreground">3.8k</strong> followers</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

export const LinkPreview: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger
        render={<a href="#" onClick={(e) => e.preventDefault()} />}
        className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Getting started with Tailwind CSS
      </HoverCardTrigger>
      <HoverCardContent side="top">
        <div className="flex flex-col gap-2">
          <div className="h-24 w-full rounded-md bg-muted" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">tailwindcss.com</p>
            <p className="text-sm font-medium">Getting started with Tailwind CSS</p>
            <p className="text-xs text-muted-foreground">
              A utility-first CSS framework for rapidly building custom user interfaces directly in your markup.
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

export const ProjectCard: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger
        render={<span />}
        className="cursor-pointer text-sm font-medium underline underline-offset-4"
      >
        Design System v2
      </HoverCardTrigger>
      <HoverCardContent side="right">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-green-500" />
            <p className="text-sm font-medium">Design System v2</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Unified component library and token system across all products.
          </p>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Last updated</span>
              <span className="font-medium text-foreground">2 days ago</span>
            </div>
            <div className="flex justify-between">
              <span>Contributors</span>
              <span className="font-medium text-foreground">8</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}
