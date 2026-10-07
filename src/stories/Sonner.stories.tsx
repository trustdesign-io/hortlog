'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'

const meta: Meta = {
  title: 'UI/Sonner',
  decorators: [
    (Story) => (
      <>
        <Toaster />
        <Story />
      </>
    ),
  ],
}

export default meta

type Story = StoryObj

export const Success: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.success('Changes saved', {
          description: 'Your project settings have been updated successfully.',
        })
      }
    >
      Show success toast
    </Button>
  ),
}

export const Error: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.error('Something went wrong', {
          description: 'We could not process your request. Please try again.',
        })
      }
    >
      Show error toast
    </Button>
  ),
}

export const Info: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.info('New features available', {
          description: 'Update to v2.4 to access the latest improvements.',
        })
      }
    >
      Show info toast
    </Button>
  ),
}

export const Warning: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.warning('Storage limit approaching', {
          description: 'You have used 90% of your available storage.',
        })
      }
    >
      Show warning toast
    </Button>
  ),
}

export const Loading: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        const id = toast.loading('Deploying to production…')
        setTimeout(() => {
          toast.success('Deployment complete', {
            id,
            description: 'Your app is live at acme.app.',
          })
        }, 2500)
      }}
    >
      Show loading → success toast
    </Button>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast('Project archived', {
          description: 'This project has been moved to your archive.',
          action: {
            label: 'Undo',
            onClick: () => toast.success('Archive undone'),
          },
        })
      }
    >
      Show toast with action
    </Button>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => toast.success('Profile updated')}
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error('Upload failed')}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.info('Sync in progress')}
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.warning('Session expiring soon')}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.loading('Processing…')}
      >
        Loading
      </Button>
    </div>
  ),
}
