import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Dialog>

export const Basic: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project created</DialogTitle>
          <DialogDescription>
            Your new project <strong>Design System v2</strong> has been created successfully. You can
            invite team members and configure settings from the project dashboard.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button>Go to project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const EditProfile: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Edit profile</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your personal information. Changes are visible to other team members.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dialog-name">Display name</Label>
            <Input id="dialog-name" defaultValue="Sarah Chen" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dialog-email">Email address</Label>
            <Input id="dialog-email" type="email" defaultValue="sarah@company.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dialog-bio">Bio</Label>
            <Input id="dialog-bio" defaultValue="Product designer at Acme Corp." />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const Confirmation: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Archive project</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive project</DialogTitle>
          <DialogDescription>
            Archiving this project will hide it from your active projects list. You can restore it at
            any time from the archived projects view.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button>Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open (no close button)</Button>} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Complete your setup</DialogTitle>
          <DialogDescription>
            You must complete these steps before continuing. This dialog cannot be dismissed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>• Connect your repository</p>
          <p>• Set up your deployment environment</p>
          <p>• Invite at least one team member</p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button>Continue setup</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
