import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
}

export default meta

type Story = StoryObj<typeof Sheet>

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open right panel</Button>} />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Update your display name and contact details. Changes are saved immediately.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-name">Display name</Label>
            <Input id="sheet-name" defaultValue="Sarah Chen" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-email">Email</Label>
            <Input id="sheet-email" type="email" defaultValue="sarah@company.com" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose render={<Button variant="outline">Cancel</Button>} />
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open left panel</Button>} />
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Browse sections of the application.
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-2 px-4">
          {['Dashboard', 'Projects', 'Team', 'Settings'].map((item) => (
            <Button key={item} variant="ghost" className="justify-start">
              {item}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
}

export const Top: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open top panel</Button>} />
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>System announcement</SheetTitle>
          <SheetDescription>
            Scheduled maintenance on Saturday 15 March from 02:00–04:00 UTC.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button size="sm">Acknowledge</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open bottom panel</Button>} />
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Confirm deletion</SheetTitle>
          <SheetDescription>
            Deleting this project is permanent and cannot be undone.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive">Delete project</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const WithoutCloseButton: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open (no close button)</Button>} />
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Focused task</SheetTitle>
          <SheetDescription>
            Complete this form before continuing. Use the footer button to close.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button>Done</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}
