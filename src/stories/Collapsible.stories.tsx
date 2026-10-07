import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ChevronsUpDown, FileIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof Collapsible> = {
  title: 'UI/Collapsible',
  component: Collapsible,
}

export default meta

type Story = StoryObj<typeof Collapsible>

export const ShowMoreFiles: Story = {
  render: () => (
    <Collapsible className="w-80 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold">Modified files</h4>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
          <ChevronsUpDown className="size-4" />
          <span className="sr-only">Toggle</span>
        </CollapsibleTrigger>
      </div>
      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-mono">
        <FileIcon className="size-4 text-muted-foreground" />
        src/components/ui/button.tsx
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-mono">
          <FileIcon className="size-4 text-muted-foreground" />
          src/components/ui/card.tsx
        </div>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-mono">
          <FileIcon className="size-4 text-muted-foreground" />
          src/lib/utils.ts
        </div>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-mono">
          <FileIcon className="size-4 text-muted-foreground" />
          tailwind.config.ts
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-80 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold">Advanced settings</h4>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
          <ChevronsUpDown className="size-4" />
          <span className="sr-only">Toggle</span>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-3">
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">Cache strategy</p>
          <p className="text-muted-foreground">
            Serve stale content while revalidating in the background.
          </p>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">Rate limiting</p>
          <p className="text-muted-foreground">
            Limit each IP to 100 requests per minute.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Collapsible disabled className="w-80 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Audit log (Pro plan only)
        </h4>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" disabled />}>
          <ChevronsUpDown className="size-4" />
          <span className="sr-only">Toggle</span>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
        Upgrade to Pro to access the audit log.
      </div>
    </Collapsible>
  ),
}
