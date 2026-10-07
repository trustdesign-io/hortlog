import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const meta: Meta<typeof ScrollArea> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
}

export default meta

type Story = StoryObj<typeof ScrollArea>

const NOTIFICATIONS = [
  { title: 'New comment on your post', time: '2 min ago' },
  { title: 'Danny invited you to Acme Inc.', time: '10 min ago' },
  { title: 'Your export is ready to download', time: '25 min ago' },
  { title: 'Subscription renewed successfully', time: '1 hour ago' },
  { title: 'New member joined your workspace', time: '2 hours ago' },
  { title: 'API rate limit warning', time: '3 hours ago' },
  { title: 'Weekly digest is ready', time: '5 hours ago' },
  { title: 'Password changed successfully', time: 'Yesterday' },
  { title: 'Two-factor authentication enabled', time: 'Yesterday' },
  { title: 'New login from Chrome on macOS', time: '2 days ago' },
  { title: 'Project "Atlas" archived', time: '2 days ago' },
  { title: 'Billing invoice available', time: '3 days ago' },
  { title: 'Webhook delivery failed', time: '3 days ago' },
  { title: 'Storage limit reached 80%', time: '4 days ago' },
  { title: 'Team member removed', time: '5 days ago' },
  { title: 'Custom domain verified', time: '5 days ago' },
  { title: 'Deployment succeeded', time: '6 days ago' },
  { title: 'Snapshot taken automatically', time: '7 days ago' },
  { title: 'Support ticket #1042 closed', time: '8 days ago' },
  { title: 'New feature: dark mode released', time: '9 days ago' },
  { title: 'Trial ends in 3 days', time: '10 days ago' },
  { title: 'Plan upgraded to Pro', time: '12 days ago' },
]

export const VerticalList: Story = {
  render: () => (
    <ScrollArea className="h-72 w-80 rounded-lg border">
      <div className="p-4">
        <h4 className="mb-3 text-sm font-semibold">Notifications</h4>
        {NOTIFICATIONS.map((n, i) => (
          <div key={i}>
            <div className="py-2">
              <p className="text-sm font-medium leading-none">{n.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
            </div>
            {i < NOTIFICATIONS.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

const TAGS = [
  'React',
  'TypeScript',
  'Next.js',
  'Tailwind CSS',
  'shadcn/ui',
  'Prisma',
  'Supabase',
  'Vercel',
  'Zustand',
  'TanStack Query',
  'Playwright',
  'Vitest',
  'ESLint',
  'Prettier',
  'Zod',
  'base-ui',
  'pnpm',
  'Node.js',
  'PostgreSQL',
]

export const HorizontalTags: Story = {
  render: () => (
    <ScrollArea className="w-96 rounded-lg border p-3">
      <div className="flex gap-2 pb-1">
        {TAGS.map((tag) => (
          <div
            key={tag}
            className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
          >
            {tag}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
}

export const FixedHeightContent: Story = {
  render: () => (
    <ScrollArea className="h-48 w-72 rounded-lg border p-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Pellentesque habitant morbi tristique senectus et netus et malesuada
        fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae,
        ultricies eget, tempor sit amet, ante.
      </p>
    </ScrollArea>
  ),
}
