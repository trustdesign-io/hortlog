import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AlertCircleIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'

import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  decorators: [
    (Story) => (
      <div className="max-w-xl p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Alert>

export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Your session will expire soon</AlertTitle>
      <AlertDescription>
        You will be automatically signed out in 5 minutes due to inactivity.
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        We were unable to charge your card ending in 4242. Please update your payment method.
      </AlertDescription>
    </Alert>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <Alert>
      <InfoIcon />
      <AlertTitle>New feature available</AlertTitle>
      <AlertDescription>
        You can now export your data as CSV from the settings page.
      </AlertDescription>
    </Alert>
  ),
}

export const DestructiveWithIcon: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Unable to save changes</AlertTitle>
      <AlertDescription>
        An error occurred while saving. Your changes have not been applied. Please try again.
      </AlertDescription>
    </Alert>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Alert>
      <InfoIcon />
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>
        Version 3.2.0 is available with performance improvements and bug fixes.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Update now
        </Button>
      </AlertAction>
    </Alert>
  ),
}

export const DestructiveWithAction: Story = {
  render: () => (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Your account is at risk</AlertTitle>
      <AlertDescription>
        We detected unusual activity on your account. Review recent sign-ins and secure your account.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="destructive">
          Review activity
        </Button>
      </AlertAction>
    </Alert>
  ),
}

export const TitleOnly: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Changes saved successfully.</AlertTitle>
    </Alert>
  ),
}
