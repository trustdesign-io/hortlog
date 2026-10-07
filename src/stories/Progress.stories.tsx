import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress'

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  decorators: [
    (Story) => (
      <div className="w-80 p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Progress>

export const Empty: Story = {
  render: () => <Progress value={0} />,
}

export const Quarter: Story = {
  render: () => <Progress value={25} />,
}

export const Half: Story = {
  render: () => <Progress value={50} />,
}

export const ThreeQuarters: Story = {
  render: () => <Progress value={75} />,
}

export const Complete: Story = {
  render: () => <Progress value={100} />,
}

export const WithLabel: Story = {
  render: () => (
    <Progress value={60}>
      <ProgressLabel>Upload progress</ProgressLabel>
    </Progress>
  ),
}

export const WithLabelAndValue: Story = {
  render: () => (
    <Progress value={42}>
      <ProgressLabel>Processing records</ProgressLabel>
      <ProgressValue>{(_, v) => `${v}%`}</ProgressValue>
    </Progress>
  ),
}

export const AllSteps: Story = {
  decorators: [
    (Story) => (
      <div className="w-80 p-6 space-y-4">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      {[0, 25, 50, 75, 100].map((value) => (
        <Progress key={value} value={value}>
          <ProgressLabel>{value === 0 ? 'Not started' : value === 100 ? 'Complete' : 'In progress'}</ProgressLabel>
          <ProgressValue>{(_, v) => `${v}%`}</ProgressValue>
        </Progress>
      ))}
    </>
  ),
}
