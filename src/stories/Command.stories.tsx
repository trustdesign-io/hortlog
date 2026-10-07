'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as React from 'react'
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  SettingsIcon,
  KeyIcon,
  BellIcon,
  HelpCircleIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react'

import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'

const meta: Meta = {
  title: 'UI/Command',
}

export default meta

type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="w-80 rounded-xl border shadow-md overflow-hidden">
      <Command>
        <CommandInput placeholder="Search anything…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <LayoutDashboardIcon />
              Dashboard
            </CommandItem>
            <CommandItem>
              <UsersIcon />
              Team members
            </CommandItem>
            <CommandItem>
              <FileTextIcon />
              Documents
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              <SettingsIcon />
              General settings
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <KeyIcon />
              API keys
            </CommandItem>
            <CommandItem>
              <BellIcon />
              Notifications
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
}

export const WithShortcuts: Story = {
  render: () => (
    <div className="w-80 rounded-xl border shadow-md overflow-hidden">
      <Command>
        <CommandInput placeholder="Type a command…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            <CommandItem>
              <PlusIcon />
              Create new project
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <SearchIcon />
              Search documents
              <CommandShortcut>⌘F</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <UsersIcon />
              Invite team member
              <CommandShortcut>⌘I</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Help">
            <CommandItem>
              <HelpCircleIcon />
              Documentation
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
}

export const InDialog: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault()
          setOpen((prev) => !prev)
        }
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, [])

    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <SearchIcon className="mr-2 size-4" />
          Open command palette
          <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          title="Command palette"
          description="Search for pages, actions, and settings."
        >
          <Command>
            <CommandInput placeholder="Type a command or search…" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigate">
                <CommandItem onSelect={() => setOpen(false)}>
                  <LayoutDashboardIcon />
                  Go to dashboard
                  <CommandShortcut>G D</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => setOpen(false)}>
                  <UsersIcon />
                  Go to team
                  <CommandShortcut>G T</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => setOpen(false)}>
                  <FileTextIcon />
                  Go to documents
                  <CommandShortcut>G D</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem onSelect={() => setOpen(false)}>
                  <SettingsIcon />
                  Open settings
                  <CommandShortcut>⌘,</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => setOpen(false)}>
                  <BellIcon />
                  Notification preferences
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </>
    )
  },
}
