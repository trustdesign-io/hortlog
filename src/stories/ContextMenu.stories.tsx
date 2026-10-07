import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'

const meta: Meta<typeof ContextMenu> = {
  title: 'UI/ContextMenu',
  component: ContextMenu,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof ContextMenu>

export const OnCard: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex h-32 w-64 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-sm text-muted-foreground select-none">
          Right-click here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          Open
          <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Open in new tab
          <ContextMenuShortcut>⌘↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          Copy link
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>Share…</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
}

export const WithSubMenu: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex h-32 w-64 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-sm text-muted-foreground select-none">
          Right-click for full menu
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>More tools</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Format as…</ContextMenuItem>
            <ContextMenuItem>Transform</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Developer tools</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Export as</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>PDF</ContextMenuItem>
            <ContextMenuItem>PNG</ContextMenuItem>
            <ContextMenuItem>SVG</ContextMenuItem>
            <ContextMenuItem>CSV</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
}

export const WithCheckboxAndRadio: Story = {
  render: function WithCheckboxAndRadioRender() {
    const [showGrid, setShowGrid] = useState(true)
    const [showRulers, setShowRulers] = useState(false)
    const [theme, setTheme] = useState('system')

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex h-32 w-64 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-sm text-muted-foreground select-none">
            Right-click for view options
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>View</ContextMenuLabel>
            <ContextMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={setShowGrid}
            >
              Show grid
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={showRulers}
              onCheckedChange={setShowRulers}
            >
              Show rulers
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Theme</ContextMenuLabel>
            <ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
              <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
              <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
              <ContextMenuRadioItem value="system">System</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    )
  },
}
