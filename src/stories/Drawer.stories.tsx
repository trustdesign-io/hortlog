import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Drawer> = {
  title: 'UI/Drawer',
  component: Drawer,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Drawer>

export const BottomWithForm: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create new project</DrawerTitle>
          <DrawerDescription>
            Add a name and description to get started.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="drawer-project-name">Project name</Label>
            <Input id="drawer-project-name" placeholder="e.g. Design System v3" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="drawer-project-desc">Description</Label>
            <Input
              id="drawer-project-desc"
              placeholder="What is this project about?"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="drawer-project-url">Repository URL</Label>
            <Input
              id="drawer-project-url"
              type="url"
              placeholder="https://github.com/org/repo"
            />
          </div>
        </div>
        <DrawerFooter>
          <Button>Create project</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}

export const BottomWithList: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Share to…</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Share document</DrawerTitle>
          <DrawerDescription>
            Choose where to share <strong>Q4 Report.pdf</strong>.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col px-4">
          {[
            { label: 'Copy link', description: 'Anyone with the link can view' },
            { label: 'Email', description: 'Send to a specific address' },
            { label: 'Slack', description: 'Post to a channel or DM' },
            { label: 'Export as PDF', description: 'Download a formatted copy' },
          ].map(({ label, description }) => (
            <button
              key={label}
              className="flex flex-col items-start gap-0.5 rounded-md px-1 py-2.5 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}

export const RightSide: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Open right drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Notification settings</DrawerTitle>
          <DrawerDescription>
            Control how and when you receive notifications.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4">
          {[
            { label: 'Email notifications', detail: 'Daily digest' },
            { label: 'Push notifications', detail: 'Enabled' },
            { label: 'SMS alerts', detail: 'Disabled' },
          ].map(({ label, detail }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{detail}</span>
              </div>
              <input type="checkbox" defaultChecked={detail !== 'Disabled'} />
            </div>
          ))}
        </div>
        <DrawerFooter>
          <Button>Save preferences</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}
