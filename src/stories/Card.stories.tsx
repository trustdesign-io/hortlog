import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
}

export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Project overview
        </CardTitle>
        <CardDescription>
          Track progress across all active workstreams.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          3 of 7 milestones completed. Next deadline: 28 March.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline">
          View details
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const Small: Story = {
  render: () => (
    <Card size="sm" className="w-80">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Team members
        </CardTitle>
        <CardDescription>Manage access and permissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">5 active members</p>
      </CardContent>
      <CardFooter>
        <Button size="xs" variant="secondary">
          Invite member
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          Billing summary
        </CardTitle>
        <CardDescription>Your current plan and usage.</CardDescription>
        <CardAction>
          <Button size="sm" variant="ghost">
            Manage
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">$49 / mo</p>
        <p className="text-muted-foreground text-sm">Pro plan · renews 1 April</p>
      </CardContent>
    </Card>
  ),
}

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <p className="text-sm text-muted-foreground">
          No projects found. Create your first project to get started.
        </p>
      </CardContent>
    </Card>
  ),
}
