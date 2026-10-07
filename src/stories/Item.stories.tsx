import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MoreHorizontalIcon,
  StarIcon,
  BellIcon,
  MessageSquareIcon,
  CheckCircleIcon,
} from 'lucide-react'

import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemHeader,
  ItemFooter,
  ItemSeparator,
} from '@/components/ui/item'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const meta: Meta<typeof Item> = {
  title: 'UI/Item',
  component: Item,
}

export default meta

type Story = StoryObj<typeof Item>

// --- File list ---

export const FileList: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ItemGroup>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <FileTextIcon className="text-blue-500" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Q4 Financial Report.pdf</ItemTitle>
            <ItemDescription>Uploaded by Alice · 2.4 MB · 3 hours ago</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="icon-sm" variant="ghost" aria-label="More options">
              <MoreHorizontalIcon />
            </Button>
          </ItemActions>
        </Item>

        <Item variant="outline">
          <ItemMedia variant="icon">
            <ImageIcon className="text-green-500" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Brand assets.zip</ItemTitle>
            <ItemDescription>Uploaded by Ben · 18.7 MB · Yesterday</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="icon-sm" variant="ghost" aria-label="More options">
              <MoreHorizontalIcon />
            </Button>
          </ItemActions>
        </Item>

        <Item variant="outline">
          <ItemMedia variant="icon">
            <VideoIcon className="text-violet-500" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Product demo.mp4</ItemTitle>
            <ItemDescription>Uploaded by Clara · 204 MB · 4 days ago</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="icon-sm" variant="ghost" aria-label="More options">
              <MoreHorizontalIcon />
            </Button>
          </ItemActions>
        </Item>
      </ItemGroup>
    </div>
  ),
}

// --- User list ---

const users = [
  { name: 'Alice Nguyen', handle: 'alice', role: 'Admin', initials: 'AN' },
  { name: 'Ben Carter', handle: 'ben', role: 'Editor', initials: 'BC' },
  { name: 'Clara Smith', handle: 'clara', role: 'Viewer', initials: 'CS' },
]

export const UserList: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ItemGroup>
        {users.map((user) => (
          <Item key={user.handle} variant="muted">
            <ItemMedia variant="image">
              <Avatar className="size-10 rounded-sm">
                <AvatarFallback className="rounded-sm text-xs">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{user.name}</ItemTitle>
              <ItemDescription>@{user.handle}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant="secondary">{user.role}</Badge>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </div>
  ),
}

// --- Notification list ---

const notifications = [
  {
    id: 1,
    icon: StarIcon,
    color: 'text-amber-500',
    title: 'Project starred',
    description: 'Alice starred your project "Design system".',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 2,
    icon: MessageSquareIcon,
    color: 'text-blue-500',
    title: 'New comment',
    description: 'Ben left a comment on the Q4 roadmap document.',
    time: '14 min ago',
    unread: true,
  },
  {
    id: 3,
    icon: CheckCircleIcon,
    color: 'text-green-500',
    title: 'Deployment succeeded',
    description: 'Production deploy #247 completed without errors.',
    time: '1 hour ago',
    unread: false,
  },
  {
    id: 4,
    icon: BellIcon,
    color: 'text-muted-foreground',
    title: 'Reminder',
    description: 'Sprint review starts in 30 minutes.',
    time: '3 hours ago',
    unread: false,
  },
]

export const NotificationList: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ItemGroup>
        {notifications.map((n) => (
          <Item key={n.id} variant={n.unread ? 'outline' : 'default'}>
            <ItemMedia variant="icon">
              <n.icon className={n.color} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {n.title}
                {n.unread && (
                  <span className="ml-1 size-1.5 rounded-full bg-primary inline-block" aria-label="Unread" />
                )}
              </ItemTitle>
              <ItemDescription>{n.description}</ItemDescription>
            </ItemContent>
            <ItemContent>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</span>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </div>
  ),
}

// --- Size variants ---

export const SizeDefault: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ItemGroup>
        <Item size="default" variant="outline">
          <ItemMedia variant="icon">
            <FileTextIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Default size item</ItemTitle>
            <ItemDescription>This is the default item size with comfortable spacing.</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  ),
}

export const SizeSm: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ItemGroup>
        <Item size="sm" variant="outline">
          <ItemMedia variant="icon">
            <FileTextIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Small size item</ItemTitle>
            <ItemDescription>A more compact item for dense lists.</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  ),
}

export const SizeXs: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ItemGroup>
        <Item size="xs" variant="outline">
          <ItemMedia variant="icon">
            <FileTextIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Extra small item</ItemTitle>
            <ItemDescription>Minimal padding for tight layouts.</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  ),
}

// --- With header/footer and separator ---

export const WithHeaderAndFooter: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ItemGroup>
        <Item variant="outline">
          <ItemHeader>
            <ItemTitle>Monthly active users</ItemTitle>
            <Badge>+12%</Badge>
          </ItemHeader>
          <ItemContent>
            <ItemDescription>
              24,300 users were active in the last 30 days across all regions.
            </ItemDescription>
          </ItemContent>
          <ItemFooter>
            <span className="text-xs text-muted-foreground">Updated 5 min ago</span>
            <Button size="xs" variant="ghost">
              View report
            </Button>
          </ItemFooter>
        </Item>

        <ItemSeparator />

        <Item variant="outline">
          <ItemHeader>
            <ItemTitle>Churn rate</ItemTitle>
            <Badge variant="destructive">-3%</Badge>
          </ItemHeader>
          <ItemContent>
            <ItemDescription>
              2.1% of subscribers cancelled in the last 30 days.
            </ItemDescription>
          </ItemContent>
          <ItemFooter>
            <span className="text-xs text-muted-foreground">Updated 5 min ago</span>
            <Button size="xs" variant="ghost">
              View report
            </Button>
          </ItemFooter>
        </Item>
      </ItemGroup>
    </div>
  ),
}
