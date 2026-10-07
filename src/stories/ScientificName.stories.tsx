import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ScientificName } from '@/components/ui/scientific-name'

const meta: Meta<typeof ScientificName> = {
  title: 'UI/ScientificName',
  component: ScientificName,
  args: {
    children: 'Quercus robur',
  },
}

export default meta

type Story = StoryObj<typeof ScientificName>

export const Default: Story = {}

export const InContext: Story = {
  render: () => (
    <p className="text-base">
      The common oak (<ScientificName>Quercus robur</ScientificName>) is native to most of Europe.
    </p>
  ),
}

export const Genus: Story = {
  args: { children: 'Acer' },
}

export const FullName: Story = {
  args: { children: 'Rosa canina L.' },
}

export const LargeHeading: Story = {
  render: () => (
    <h2 className="text-2xl font-heading">
      <ScientificName>Magnolia grandiflora</ScientificName>
    </h2>
  ),
}
