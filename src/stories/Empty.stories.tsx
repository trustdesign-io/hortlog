import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FileSearchIcon, FolderOpenIcon, InboxIcon, UsersIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

const meta: Meta<typeof Empty> = {
  title: 'UI/Empty',
  component: Empty,
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Empty>

export const NoResults: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileSearchIcon />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          We couldn&apos;t find anything matching your search. Try adjusting your filters or search
          terms.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}

export const NoDataWithAction: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>No team members yet</EmptyTitle>
        <EmptyDescription>
          Invite colleagues to collaborate on projects. They&apos;ll appear here once they accept.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Invite team member</Button>
      </EmptyContent>
    </Empty>
  ),
}

export const EmptyInbox: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <InboxIcon className="size-10 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>All caught up</EmptyTitle>
        <EmptyDescription>
          You have no new notifications. Check back later or adjust your notification preferences.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}

export const EmptyFolder: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpenIcon />
        </EmptyMedia>
        <EmptyTitle>This folder is empty</EmptyTitle>
        <EmptyDescription>
          Upload files or create a new document to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button size="sm">Upload files</Button>
          <Button size="sm" variant="outline">
            New document
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  ),
}

export const Minimal: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Nothing here yet</EmptyTitle>
      </EmptyHeader>
    </Empty>
  ),
}
