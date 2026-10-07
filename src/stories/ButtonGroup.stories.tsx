import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SearchIcon, SlidersHorizontalIcon, CopyIcon, ScissorsIcon, ClipboardIcon } from 'lucide-react'

import { ButtonGroup, ButtonGroupText, ButtonGroupSeparator } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const meta: Meta<typeof ButtonGroup> = {
  title: 'UI/ButtonGroup',
  component: ButtonGroup,
}

export default meta

type Story = StoryObj<typeof ButtonGroup>

export const SearchWithPrefix: Story = {
  render: () => (
    <ButtonGroup className="w-72">
      <ButtonGroupText>
        <SearchIcon />
      </ButtonGroupText>
      <Input placeholder="Search projects…" />
    </ButtonGroup>
  ),
}

export const UrlWithPrefix: Story = {
  render: () => (
    <ButtonGroup className="w-80">
      <ButtonGroupText>https://</ButtonGroupText>
      <Input placeholder="your-domain.com" defaultValue="acme.app" />
      <ButtonGroupText>.io</ButtonGroupText>
    </ButtonGroup>
  ),
}

export const InputWithActionButton: Story = {
  render: () => (
    <ButtonGroup className="w-72">
      <Input placeholder="Search or filter…" />
      <Button variant="outline">
        <SlidersHorizontalIcon />
        Filter
      </Button>
    </ButtonGroup>
  ),
}

export const ButtonTrio: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">
        <CopyIcon />
        Copy
      </Button>
      <ButtonGroupSeparator />
      <Button variant="outline">
        <ScissorsIcon />
        Cut
      </Button>
      <ButtonGroupSeparator />
      <Button variant="outline">
        <ClipboardIcon />
        Paste
      </Button>
    </ButtonGroup>
  ),
}

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical" className="w-40">
      <Button variant="outline">Dashboard</Button>
      <Button variant="outline">Projects</Button>
      <Button variant="outline">Settings</Button>
    </ButtonGroup>
  ),
}

export const VerticalWithSeparator: Story = {
  render: () => (
    <ButtonGroup orientation="vertical" className="w-48">
      <Button variant="outline">
        <CopyIcon />
        Copy
      </Button>
      <ButtonGroupSeparator orientation="horizontal" />
      <Button variant="outline">
        <ScissorsIcon />
        Cut
      </Button>
      <ButtonGroupSeparator orientation="horizontal" />
      <Button variant="outline">
        <ClipboardIcon />
        Paste
      </Button>
    </ButtonGroup>
  ),
}
